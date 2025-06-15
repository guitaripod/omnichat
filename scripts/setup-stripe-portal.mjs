#!/usr/bin/env node

// This script creates a Stripe Customer Portal configuration
// Run with: node scripts/setup-stripe-portal.js

import https from 'https';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY environment variable is required');
  console.error('Run: export STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE');
  process.exit(1);
}

const data = new URLSearchParams({
  'features[customer_update][enabled]': 'true',
  'features[customer_update][allowed_updates][0]': 'email',
  'features[customer_update][allowed_updates][1]': 'tax_id',
  'features[invoice_history][enabled]': 'true',
  'features[payment_method_update][enabled]': 'true',
  'features[subscription_cancel][enabled]': 'true',
  'features[subscription_pause][enabled]': 'false',
  'features[subscription_update][enabled]': 'true',
  'features[subscription_update][default_allowed_updates][0]': 'price',
  'features[subscription_update][default_allowed_updates][1]': 'quantity',
  'features[subscription_update][proration_behavior]': 'create_prorations',
  'business_profile[headline]': 'Manage your OmniChat subscription',
  'business_profile[privacy_policy_url]': 'https://omnichat-7pu.pages.dev/privacy',
  'business_profile[terms_of_service_url]': 'https://omnichat-7pu.pages.dev/terms',
  'default_return_url': 'https://omnichat-7pu.pages.dev/billing'
});

const options = {
  hostname: 'api.stripe.com',
  port: 443,
  path: '/v1/billing_portal/configurations',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': data.toString().length
  }
};

console.log('Creating Stripe Customer Portal configuration...');

const req = https.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    const response = JSON.parse(body);
    
    if (res.statusCode === 200) {
      console.log('\n✅ Success! Portal configuration created.');
      console.log('\nConfiguration ID:', response.id);
      console.log('Is Default:', response.is_default);
      console.log('\nNow you need to make this configuration the default:');
      console.log('1. Go to https://dashboard.stripe.com/test/settings/billing/portal');
      console.log('2. Find this configuration and click "Set as default"');
      console.log('\nOr run this command to set it as default:');
      console.log(`\ncurl -X POST https://api.stripe.com/v1/billing_portal/configurations/${response.id} \\`);
      console.log(`  -u ${STRIPE_SECRET_KEY}: \\`);
      console.log('  -d "is_default=true"');
    } else {
      console.error('\n❌ Error creating configuration:');
      console.error(response.error?.message || JSON.stringify(response, null, 2));
      
      if (response.error?.message?.includes('already exists')) {
        console.log('\n💡 A configuration already exists. You need to:');
        console.log('1. Go to https://dashboard.stripe.com/test/settings/billing/portal');
        console.log('2. Make sure your configuration is set as the default');
        console.log('3. Or delete the existing configuration and run this script again');
      }
    }
  });
});

req.on('error', (e) => {
  console.error('Request failed:', e);
});

req.write(data.toString());
req.end();