import { getPool } from './db.js'
import fs from 'fs'

async function syncAll() {
  const pool = getPool()
  if (!pool) return

  const db = JSON.parse(fs.readFileSync('./data/db.json', 'utf8'))

  // 1. Sync users
  for (const u of db.users || []) {
    await pool.query(
      `INSERT INTO users (id, name, email, role, site_id, status, data) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name, 
         email = EXCLUDED.email, 
         role = EXCLUDED.role, 
         site_id = EXCLUDED.site_id, 
         status = EXCLUDED.status, 
         data = EXCLUDED.data`,
      [u.id, u.name, u.email, u.role, u.siteId || 'NA', u.status || 'Active', JSON.stringify(u)]
    )
  }

  // 2. Sync sites
  for (const s of db.sites || []) {
    await pool.query(
      `INSERT INTO sites (id, name, location, type, budget_planned, budget_actual, progress, data) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name, 
         location = EXCLUDED.location, 
         type = EXCLUDED.type, 
         budget_planned = EXCLUDED.budget_planned, 
         budget_actual = EXCLUDED.budget_actual, 
         progress = EXCLUDED.progress, 
         data = EXCLUDED.data`,
      [s.id, s.name, s.location, s.type, s.budgetPlanned, s.budgetActual, s.progress, JSON.stringify(s)]
    )
  }

  // 3. Sync inventory
  for (const inv of db.inventory || []) {
    await pool.query(
      `INSERT INTO inventory (id, site_id, item, quantity, status, data) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (id) DO UPDATE SET 
         site_id = EXCLUDED.site_id, 
         item = EXCLUDED.item, 
         quantity = EXCLUDED.quantity, 
         status = EXCLUDED.status, 
         data = EXCLUDED.data`,
      [inv.id, inv.siteId, inv.item, inv.quantity, inv.status || 'OK', JSON.stringify(inv)]
    )
  }

  // 4. Sync vendors
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

  // 5. Sync procurement orders
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

  console.log('✓ Successfully synced all collections to PostgreSQL!')
  process.exit(0)
}

syncAll().catch((e) => {
  console.error('Sync error:', e)
  process.exit(1)
})
