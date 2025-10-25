import { loadStripe } from '@stripe/stripe-js';

// Replace with your actual Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key_here';

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Stripe Price ID for the $14.99 subscription
export const SUBSCRIPTION_PRICE_ID = 'price_your_stripe_price_id_here';
