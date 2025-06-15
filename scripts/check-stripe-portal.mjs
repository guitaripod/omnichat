#!/usr/bin/env node

// This script checks your Stripe Customer Portal configuration
// Run with: node scripts/check-stripe-portal.mjs

import https from 'https';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY environment variable is required');
  console.error('Run: export STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE');
  process.exit(1);
}

// Function to make API request
function apiRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.stripe.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function checkPortalConfiguration() {
  console.log('🔍 Checking Stripe Customer Portal configuration...\n');

  try {
    // List all configurations
    const configs = await apiRequest('/v1/billing_portal/configurations');
    
    if (configs.data && configs.data.length > 0) {
      console.log(`✅ Found ${configs.data.length} portal configuration(s):\n`);
      
      configs.data.forEach((config, index) => {
        console.log(`Configuration ${index + 1}:`);
        console.log(`  ID: ${config.id}`);
        console.log(`  Is Default: ${config.is_default ? '✅ YES' : '❌ NO'}`);
        console.log(`  Active: ${config.active ? '✅' : '❌'}`);
        console.log(`  Created: ${new Date(config.created * 1000).toLocaleString()}`);
        
        if (config.business_profile) {
          console.log(`  Business Name: ${config.business_profile.headline || 'Not set'}`);
        }
        
        if (config.features) {
          console.log('  Features:');
          console.log(`    - Customer updates: ${config.features.customer_update?.enabled ? '✅' : '❌'}`);
          console.log(`    - Payment method updates: ${config.features.payment_method_update?.enabled ? '✅' : '❌'}`);
          console.log(`    - Invoice history: ${config.features.invoice_history?.enabled ? '✅' : '❌'}`);
          console.log(`    - Subscription cancel: ${config.features.subscription_cancel?.enabled ? '✅' : '❌'}`);
          console.log(`    - Subscription updates: ${config.features.subscription_update?.enabled ? '✅' : '❌'}`);
        }
        console.log('');
      });

      const defaultConfig = configs.data.find(c => c.is_default);
      if (!defaultConfig) {
        console.log('⚠️  WARNING: No default configuration set!');
        console.log('You need to set one configuration as default.\n');
        
        if (configs.data.length === 1) {
          console.log('To set the configuration as default, run:');
          console.log(`\ncurl -X POST https://api.stripe.com/v1/billing_portal/configurations/${configs.data[0].id} \\`);
          console.log(`  -u ${STRIPE_SECRET_KEY}: \\`);
          console.log('  -d "is_default=true"\n');
        }
      } else {
        console.log('✅ Default configuration is set and active!');
        console.log('Your Customer Portal should be working.\n');
      }
    } else {
      console.log('❌ No portal configurations found!');
      console.log('\nTo fix this:');
      console.log('1. Go to https://dashboard.stripe.com/test/settings/billing/portal');
      console.log('2. Configure the portal settings');
      console.log('3. Click "Save changes" to create the configuration\n');
    }

    // Test creating a portal session (will fail if no customer, but shows if config works)
    console.log('🧪 Testing portal session creation...');
    const testSession = await apiRequest('/v1/billing_portal/sessions', 'POST');
    
    if (testSession.error) {
      if (testSession.error.message.includes('configuration')) {
        console.log('❌ Configuration error:', testSession.error.message);
      } else if (testSession.error.message.includes('customer')) {
        console.log('✅ Configuration is working! (Test failed because no customer ID provided)');
      } else {
        console.log('❓ Unexpected error:', testSession.error.message);
      }
    }

  } catch (error) {
    console.error('Error checking configuration:', error.message);
  }
}

checkPortalConfiguration();