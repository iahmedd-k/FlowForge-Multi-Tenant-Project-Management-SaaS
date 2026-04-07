const stripeService = require('../services/stripe.service');
const Workspace     = require('../models/Workspace');
const Project       = require('../models/Project');
const { success, error } = require('../utils/response.util');

const PLANS = [
  {
    id:       'free',
    name:     'Free',
    price:    0,
    interval: 'forever',
    features: ['1 workspace', '5 team members', '3 projects', '1 report'],
    description: 'Perfect for getting started',
    limits: {
      teamMembers: 5,
      projects: 3,
      reports: 1,
      workspaces: 1,
    }
  },
  {
    id:       'pro',
    name:     'Pro',
    price:    15,
    interval: 'month',
    priceId:  process.env.STRIPE_PRO_PRICE_ID,
    features: ['3 workspaces', '20 team members', 'Unlimited projects', 'Unlimited reports'],
    description: 'For growing teams',
    limits: {
      teamMembers: 20,
      projects: 999,
      reports: 999,
      workspaces: 3,
    }
  },
  {
    id:       'business',
    name:     'Business',
    price:    39,
    interval: 'month',
    priceId:  process.env.STRIPE_BUSINESS_PRICE_ID,
    features: ['Unlimited workspaces', 'Unlimited team members', 'Unlimited projects', 'Unlimited reports'],
    description: 'For large enterprises',
    limits: {
      teamMembers: 999,
      projects: 999,
      reports: 999,
      workspaces: 999,
    }
  },
];

const findPlanByPriceId = (priceId) => PLANS.find((plan) => plan.priceId === priceId);

// GET /api/billing/plans
exports.getPlans = (req, res) => {
  return success(res, { plans: PLANS });
};

// GET /api/billing/status
exports.getBillingStatus = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.workspaceId)
      .select('subscriptionTier stripeCustomerId stripeSubscriptionId name');
    if (!workspace) return error(res, 'Workspace not found', 404);

    const currentPlan = PLANS.find((p) => p.id === workspace.subscriptionTier);

    return success(res, {
      tier:        workspace.subscriptionTier,
      plan:        currentPlan,
      hasStripe:   !!workspace.stripeCustomerId,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// GET /api/billing/usage   — calculate current workspace usage
exports.getWorkspaceUsage = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.workspaceId)
      .populate({
        path: 'members',
        select: '_id',
      });
    if (!workspace) return error(res, 'Workspace not found', 404);

    const currentPlan = PLANS.find((p) => p.id === workspace.subscriptionTier);
    const limits = currentPlan?.limits || PLANS[0].limits;

    // Count team members
    const teamMembersUsed = workspace.members?.length || 0;

    // Count projects
    const projectsUsed = await Project.countDocuments({
      workspaceId: req.workspaceId,
    });

    // Count workspaces
    const workspacesUsed = await Workspace.countDocuments({ ownerId: req.user.userId });

    return success(res, {
      teamMembersUsed,
      teamMembersLimit: limits?.teamMembers || 5,
      teamMembersPercentage: Math.round(((teamMembersUsed / (limits?.teamMembers || 5)) * 100)),
      projectsUsed,
      projectsLimit: limits?.projects || 3,
      projectsPercentage: Math.round(((projectsUsed / (limits?.projects || 3)) * 100)),
      workspacesUsed,
      workspacesLimit: limits?.workspaces || 1,
      workspacesPercentage: Math.round(((workspacesUsed / (limits?.workspaces || 1)) * 100)),
      reportsUsed: 0,
      reportsLimit: limits?.reports || 1,
      reportsPercentage: 0,
      tier: workspace.subscriptionTier,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// POST /api/billing/checkout   — owner only
exports.createCheckout = async (req, res) => {
  try {
    const { priceId } = req.body;
    if (!priceId) return error(res, 'priceId is required');
    const selectedPlan = findPlanByPriceId(priceId);
    if (!selectedPlan) return error(res, 'Invalid plan selected', 400);

    const workspace = await Workspace.findById(req.workspaceId);
    if (!workspace) return error(res, 'Workspace not found', 404);
    if (workspace.subscriptionTier === selectedPlan.id) {
      return error(res, 'Workspace is already on this plan', 400);
    }

    // In DEVELOPMENT mode, allow direct upgrade without Stripe
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_STRIPE === 'true') {
      // Direct update for testing
      await Workspace.findByIdAndUpdate(req.workspaceId, {
        subscriptionTier: selectedPlan.id,
      });
      
      return success(res, { 
        url: `${process.env.CLIENT_URL}/billing?success=true&tier=${selectedPlan.id}`,
        isDevelopment: true,
        message: 'Development mode: Plan upgraded directly without Stripe' 
      });
    }

    // PRODUCTION: Use Stripe
    if (!process.env.STRIPE_PRO_PRICE_ID || !process.env.STRIPE_BUSINESS_PRICE_ID) {
      return error(res, 'Stripe prices not configured. Please add STRIPE_PRO_PRICE_ID and STRIPE_BUSINESS_PRICE_ID to .env', 500);
    }

    // create Stripe customer if doesn't exist yet
    let customerId = workspace.stripeCustomerId;
    if (!customerId) {
      const user     = await require('../models/User').findById(req.user.userId);
      const customer = await stripeService.createCustomer({
        name:        workspace.name,
        email:       user.email,
        workspaceId: workspace._id,
      });
      customerId = customer.id;
    }

    const session = await stripeService.createCheckoutSession({
      workspaceId: req.workspaceId,
      priceId,
      customerId,
      tierId: selectedPlan.id,
    });

    return success(res, { url: session.url });
  } catch (err) {
    console.error('[billing.checkout]', err.message);
    return error(res, `Checkout error: ${err.message}`, 500);
  }
};

// POST /api/billing/portal   — owner only
// opens Stripe billing portal to manage/cancel subscription
exports.openPortal = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.workspaceId);
    if (!workspace?.stripeCustomerId)
      return error(res, 'No active subscription found');

    const session = await stripeService.createPortalSession({
      customerId: workspace.stripeCustomerId,
    });

    return success(res, { url: session.url });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
