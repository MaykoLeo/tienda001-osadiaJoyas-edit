const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' }); // Or .env

async function main() {
  try {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      console.log('No DB connection string.');
      // Try from just .env
      require('dotenv').config({ path: '.env' });
      const connectionString2 = process.env.POSTGRES_URL || process.env.DATABASE_URL;
      if (!connectionString2) {
          console.error("FAIL: missing env");
          return;
      }
    }
    const sql = neon(process.env.POSTGRES_URL || process.env.DATABASE_URL);
    console.log('Adding column cross_sell_ids to products...');
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS cross_sell_ids INTEGER[] DEFAULT '{}';`;
    console.log('Column added successfully.');
  } catch (err) {
    console.error('Error adding column:', err);
  }
}

main();
