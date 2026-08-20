import { getPool } from './db.js'
import fs from 'fs'

async function sync() {
  const pool = getPool()
  if (!pool) return

  const db = JSON.parse(fs.readFileSync('./data/db.json', 'utf8'))

  for (const v of db.vendors || []) {
    await pool.query(
      `INSERT INTO vendors (id, name, category, reliability, data) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name, 
         category = EXCLUDED.category, 
         reliability = EXCLUDED.reliability, 
         data = EXCLUDED.data`,
      [v.id, v.name, v.category, v.reliability, JSON.stringify(v)]
    )
  }

  for (const po of db.procurementOrders || []) {
    await pool.query(
      `INSERT INTO procurement_orders (id, site_id, item, amount, stage, status, delay_days, data) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       ON CONFLICT (id) DO UPDATE SET 
         site_id = EXCLUDED.site_id, 
         item = EXCLUDED.item, 
         amount = EXCLUDED.amount, 
         stage = EXCLUDED.stage, 
         status = EXCLUDED.status, 
         delay_days = EXCLUDED.delay_days, 
         data = EXCLUDED.data`,
      [po.id, po.siteId, po.item, po.amount, po.stage, po.status, po.delayDays, JSON.stringify(po)]
    )
  }

  console.log('✓ Successfully synced', db.vendors.length, 'vendors and', db.procurementOrders.length, 'POs to PostgreSQL!')
  process.exit(0)
}

sync().catch(e => { console.error('Sync error:', e); process.exit(1); })
