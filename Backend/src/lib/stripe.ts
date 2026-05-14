import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error('STRIPE_SECRET_KEY muss in .env gesetzt sein.');
}

export const stripe = new Stripe(secretKey, {
  apiVersion: '2025-02-24.acacia',
  typescript:  true,
});
