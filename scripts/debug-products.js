// Debug script to check products in the database
// Run with: node scripts/debug-products.js

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - replace with your actual values if not using .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProducts() {
  try {
    console.log('Fetching all products...');
    
    const { data, error } = await supabase
      .from('products_simplified')
      .select('*')
      .limit(10);

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    console.log(`Found ${data.length} products:`);
    
    if (data && data.length > 0) {
      data.forEach((product, index) => {
        console.log(`\nProduct ${index + 1}:`);
        console.log('  ID:', JSON.stringify(product.id));
        console.log('  QR Code:', JSON.stringify(product.qr_code));
        console.log('  Weight:', product.weight_kg);
        console.log('  Status:', product.status);
        console.log('  ID length:', product.id.length);
        console.log('  QR Code length:', product.qr_code.length);
        console.log('  ID char codes:', product.id.split('').map(c => c.charCodeAt(0)));
        console.log('  QR Code char codes:', product.qr_code.split('').map(c => c.charCodeAt(0)));
      });
    } else {
      console.log('No products found in the database');
    }
    
    // Also check if there are any stock movements
    console.log('\nChecking stock movements...');
    const { data: movements, error: movementsError } = await supabase
      .from('stock_movements_simplified')
      .select('*')
      .limit(5);

    if (movementsError) {
      console.error('Error fetching movements:', movementsError);
    } else {
      console.log(`Found ${movements.length} movements`);
      if (movements.length > 0) {
        console.log('First movement:', movements[0]);
      }
    }
  } catch (error) {
    console.error('Script error:', error);
  }
}

debugProducts();