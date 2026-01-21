import { stripeClient } from './packages/domain/src/stripe/client';
import dotenv from 'dotenv';
dotenv.config();

async function listPrices() {
  try {
    const prices = await stripeClient.prices.list({ limit: 5 });
    if (prices.data.length === 0) {
      console.log('No prices found in your Stripe account. Please create one in the dashboard.');
    } else {
      console.log('Found the following prices in your account:');
      prices.data.forEach(p => {
        console.log(`- ID: ${p.id} (Amount: ${(p.unit_amount || 0) / 100} ${p.currency}, Type: ${p.type})`);
      });
    }
  } catch (error: any) {
    console.error('Error fetching prices:', error.message);
  }
}

listPrices();
