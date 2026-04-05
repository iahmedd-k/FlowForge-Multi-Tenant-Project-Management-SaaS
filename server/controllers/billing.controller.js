const stripeService = require('../services/stripe.service');
const Workspace     = require('../models/Workspace');
const { success, error } = require('../utils/response.util');

const PLANS = [
  {
    id:       'free',
    name:     'Free',
    price:    0,
    interval: 'forever',
    features: ['1 workspace', '5 users', '3 projects'],
  },
  {
    id:       'pro',
    name:     'Pro',
    price:    15,
    interval: 'month',
    priceId:  process.env.STRIPE_PRO_PRICE_ID,
    features: ['20 users', 'Unlimited projects', 'Reports dashboard'],
  },
  {
    id:       'business',
    name:     'Business',
    price:    39,
    interval: 'month',
    priceId:  process.env.STRIPE_BUSINESS_PRICE_ID,
    features: ['Unlimited users', 'Priority support', 'Custom branding'],
  },
];

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

// POST /api/billing/checkout   — owner only
exports.createCheckout = async (req, res) => {
  try {
    const { priceId } = req.body;
    if (!priceId) return error(res, 'priceId is required');

    const workspace = await Workspace.findById(req.workspaceId);
    if (!workspace) return error(res, 'Workspace not found', 404);

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
    });

    return success(res, { url: session.url });
  } catch (err) {
    return error(res, err.message, 500);
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