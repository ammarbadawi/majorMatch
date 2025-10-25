// Simple test script to verify Stripe integration
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key_here');

async function testStripeConnection() {
    try {
        console.log('Testing Stripe connection...');
        
        // Test API key by listing customers
        const customers = await stripe.customers.list({ limit: 1 });
        console.log('✅ Stripe connection successful!');
        
        // Test creating a test customer
        const testCustomer = await stripe.customers.create({
            email: 'test@example.com',
            name: 'Test User',
            metadata: { test: 'true' }
        });
        console.log('✅ Test customer created:', testCustomer.id);
        
        // Clean up test customer
        await stripe.customers.del(testCustomer.id);
        console.log('✅ Test customer deleted');
        
        console.log('\n🎉 Stripe integration is working correctly!');
        console.log('\nNext steps:');
        console.log('1. Create a product and price in your Stripe dashboard');
        console.log('2. Update the price ID in your frontend components');
        console.log('3. Test the payment flow in your application');
        
    } catch (error) {
        console.error('❌ Stripe test failed:', error.message);
        console.log('\nTroubleshooting:');
        console.log('1. Check your STRIPE_SECRET_KEY in .env file');
        console.log('2. Ensure you have a valid Stripe account');
        console.log('3. Verify your API key has the correct permissions');
    }
}

testStripeConnection();
