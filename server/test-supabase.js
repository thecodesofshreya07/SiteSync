import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

async function testSupabase() {
  console.log('Testing live Supabase PostgreSQL queries...')
  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false },
  })

  try {
    const resPo = await pool.query('SELECT id, item, stage, status, amount FROM procurement_orders ORDER BY id')
    console.log(`\n✓ Procurement Orders in Supabase (${resPo.rows.length} rows):`)
    console.table(resPo.rows)

    const resVendors = await pool.query('SELECT id, name, category, reliability FROM vendors ORDER BY id')
    console.log(`\n✓ Vendors in Supabase (${resVendors.rows.length} rows):`)
    console.table(resVendors.rows)

    const resDeliveries = await pool.query('SELECT id, po_id, expected_date, status FROM deliveries ORDER BY id')
    console.log(`\n✓ Deliveries in Supabase (${resDeliveries.rows.length} rows):`)
    console.table(resDeliveries.rows)

    const resCollections = await pool.query('SELECT name, updated_at FROM collections ORDER BY name')
    console.log(`\n✓ Collections in Supabase (${resCollections.rows.length} collections):`)
    console.table(resCollections.rows)

    console.log('\n✅ All Supabase PostgreSQL tables verified successfully!')
  } catch (err) {
    console.error('Supabase query error:', err)
  } finally {
    await pool.end()
  }
}

testSupabase()
