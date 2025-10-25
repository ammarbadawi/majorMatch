# Stripe Payment Integration Setup

This document explains how to set up Stripe payments for the Major Match application.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Node.js and npm installed
3. MongoDB running locally or remotely

## Setup Steps

### 1. Create Stripe Products and Prices

1. Log into your Stripe Dashboard
2. Go to Products → Create Product
3. Create a product named "Major Test Access"
4. Set the price to $14.99 (one-time payment)
5. Note down the Price ID (starts with `price_`) - though this is now optional since we use direct payment intents

### 2. Configure Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/major_match

# JWT Secret (change this in production!)
JWT_SECRET=dev_secret_change_me

# Email Configuration (optional)
EMAIL_FROM=Major Match <no-reply@majormatch.local>
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_DEBUG=false

# OpenAI API Key (optional)
OPENAI_API_KEY=

# Stripe Configuration (required for payments)
# Get these from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Server Configuration
PORT=3001
```

**Important**: Replace the placeholder values with your actual Stripe keys:
- `STRIPE_SECRET_KEY`: Your Stripe secret key (starts with `sk_test_` for test mode)
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key (starts with `pk_test_` for test mode)
- `STRIPE_WEBHOOK_SECRET`: Your webhook secret (starts with `whsec_`)

### 3. Update Frontend Configuration

Update the following files with your actual Stripe keys:

1. **src/config/stripe.ts** - Update `STRIPE_PUBLISHABLE_KEY`
2. **src/components/PaymentModal.tsx** - Update the Stripe publishable key

**Note**: No price ID is needed for one-time payments as we use direct payment intents.

### 4. Set Up Webhooks (Optional but Recommended)

1. In Stripe Dashboard, go to Webhooks → Add endpoint
2. Set endpoint URL to: `https://yourdomain.com/api/stripe-webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `customer.subscription.updated` (if you plan to add subscriptions later)
   - `customer.subscription.deleted` (if you plan to add subscriptions later)
4. Copy the webhook secret and add it to your `.env` file

### 5. Test the Integration

1. Start the server: `npm run server`
2. Start the React app: `npm start`
3. Navigate to the Major Test page
4. Click "Start Premium Test" to test the payment flow
5. Use Stripe's test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

## API Endpoints

The following endpoints have been added for Stripe integration:

- `POST /api/create-payment-intent` - Creates a Stripe payment intent for one-time payment
- `POST /api/confirm-payment` - Confirms payment after successful transaction
- `GET /api/subscription-status` - Checks user's access status
- `POST /api/cancel-subscription` - Revokes user's access
- `POST /api/stripe-webhook` - Handles Stripe webhooks

## Database Schema

A new `Subscription` collection has been added to track user access:

```javascript
{
  user_id: ObjectId,
  stripe_customer_id: String,
  stripe_subscription_id: String, // Payment intent ID for one-time payments
  stripe_price_id: String, // 'one_time_major_test' for one-time payments
  status: String, // active, canceled, expired
  current_period_start: Date,
  current_period_end: Date, // 1 year from purchase for one-time payments
  created_at: Date,
  updated_at: Date
}
```

## Security Notes

1. Never expose your Stripe secret key in frontend code
2. Always validate webhook signatures
3. Use HTTPS in production
4. Implement proper error handling for failed payments

## Production Deployment

1. Replace test keys with live keys
2. Update webhook URLs to production domain
3. Test thoroughly with real payment methods
4. Set up monitoring and logging

## Troubleshooting

### Common Issues

1. **"Neither apiKey nor config.authenticator provided"** 
   - This means your `.env` file is missing or the Stripe keys are not set
   - Make sure you have a `.env` file in the project root
   - Replace the placeholder values with your actual Stripe keys

2. **"Invalid API key"** 
   - Check that your Stripe keys are correct
   - Ensure you're using test keys (starting with `sk_test_` and `pk_test_`)

3. **"Price not found"** 
   - Ensure the price ID exists in your Stripe account
   - Update the `priceId` in your frontend components

4. **"Webhook signature verification failed"** 
   - Check webhook secret
   - Ensure webhook URL is correct

5. **Payment fails** 
   - Verify card details and Stripe account status
   - Check that your Stripe account is in test mode

### Quick Start (Development Mode)

If you want to test the application without setting up Stripe:

1. The server will start without Stripe configured
2. You'll see a warning: "⚠️ Stripe not initialized - STRIPE_SECRET_KEY not configured"
3. The payment modal will show "Payment System Not Configured"
4. The major test will still work for users with existing subscriptions

### Debug Mode

Enable Stripe debug mode by adding to your `.env`:
```env
STRIPE_DEBUG=true
```

This will provide more detailed error messages in the console.
