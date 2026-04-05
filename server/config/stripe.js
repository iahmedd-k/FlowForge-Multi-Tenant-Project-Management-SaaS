require('dotenv').config();
const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is missing from .env');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',   // pin the API version — never breaks on Stripe updates
  maxNetworkRetries: 2,        // auto retry on network failures
  timeout: 10000,              // 10s timeout per request
});

module.exports = stripe;