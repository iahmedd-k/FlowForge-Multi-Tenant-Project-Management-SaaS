const stripe    = require('../config/stripe');
const Workspace = require('../models/Workspace');

const TIER_MAP = {
  [process.env.STRIPE_PRO_PRICE_ID]:      'pro',
  [process.env.STRIPE_BUSINESS_PRICE_ID]: 'business',
};

// called on user register — creates a Stripe customer for the workspace
exports.createCustomer = async ({ name, email, workspaceId }) => {
  const customer = await stripe.customers.create({
    name,
    email,
    metadata: { workspaceId: workspaceId.toString() },
  });

  await Workspace.findByIdAndUpdate(workspaceId, {
    stripeCustomerId: customer.id,
  });

  return customer;
};

// creates a Stripe checkout session for plan upgrade
exports.createCheckoutSession = async ({ workspaceId, priceId, customerId, tierId }) => {
  const session = await stripe.checkout.sessions.create({
    customer:   customerId,
    mode:       'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.CLIENT_URL}/billing?success=true&tier=${encodeURIComponent(tierId || 'pro')}`,
    cancel_url:  `${process.env.CLIENT_URL}/billing?cancelled=true`,
    metadata:    { workspaceId: workspaceId.toString() },
  });

  return session;
};

// creates a Stripe billing portal session — lets user manage/cancel subscription
exports.createPortalSession = async ({ customerId }) => {
  const session = await stripe.billingPortal.sessions.create({
    customer:   customerId,
    return_url: `${process.env.CLIENT_URL}/billing`,
  });
  return session;
};

// handles all incoming Stripe webhook events
exports.handleWebhook = async (rawBody, signature) => {
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    throw new Error(`Webhook signature failed: ${err.message}`);
  }

  const data = event.data.object;

  switch (event.type) {

    case 'checkout.session.completed': {
      // payment successful — upgrade workspace tier
      const workspaceId  = data.metadata?.workspaceId;
      const subscription = await stripe.subscriptions.retrieve(data.subscription);
      const priceId      = subscription.items.data[0].price.id;
      const tier         = TIER_MAP[priceId] || 'free';

      await Workspace.findByIdAndUpdate(workspaceId, {
        subscriptionTier:     tier,
        stripeSubscriptionId: subscription.id,
      });
      console.log(`[stripe] workspace ${workspaceId} upgraded to ${tier}`);
      break;
    }

    case 'customer.subscription.updated': {
      // plan changed (upgrade or downgrade)
      const priceId = data.items.data[0].price.id;
      const tier    = TIER_MAP[priceId] || 'free';

      await Workspace.findOneAndUpdate(
        { stripeSubscriptionId: data.id },
        { subscriptionTier: tier }
      );
      console.log(`[stripe] subscription updated → ${tier}`);
      break;
    }

    case 'customer.subscription.deleted': {
      // subscription cancelled — downgrade to free
      await Workspace.findOneAndUpdate(
        { stripeSubscriptionId: data.id },
        {
          subscriptionTier:     'free',
          stripeSubscriptionId: null,
        }
      );
      console.log(`[stripe] subscription cancelled → downgraded to free`);
      break;
    }

    case 'invoice.payment_failed': {
      // payment failed — log it, frontend can handle warning UI
      const customer = await stripe.customers.retrieve(data.customer);
      const workspaceId = customer.metadata?.workspaceId;
      console.warn(`[stripe] payment failed for workspace ${workspaceId}`);
      // optionally create a notification here for the workspace owner
      break;
    }

    default:
      console.log(`[stripe] unhandled event: ${event.type}`);
  }
};
