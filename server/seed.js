import pg from 'pg'
import { config } from './config.js'
import { writeDb } from './db.js'

// Import mock data directly from client data files
import { inventory } from '../client/src/data/inventory.js'
import { vendors, procurementOrders, deliveries } from '../client/src/data/procurement.js'
import { sites, budgetByCategory } from '../client/src/data/sites.js'
import { tasks, timelines } from '../client/src/data/tasks.js'
import { equipment } from '../client/src/data/equipment.js'
import { initialAlerts } from '../client/src/data/alerts.js'
import { activityScripts } from '../client/src/data/agentActivity.js'
import { suggestedQuestions, assistantResponses } from '../client/src/data/assistantResponses.js'
import { initialUsers } from '../client/src/data/users.js'

const { Pool } = pg

export async function runSeed() {
  console.log('--- Starting SiteSync Database Seed ---')

  // 1. Update local JSON database cache first
  const fullData = {
    sites,
    budgetByCategory,
    tasks,
    timelines,
    equipment,
    inventory,
    vendors,
    procurementOrders,
    deliveries,
    alerts: initialAlerts,
    agentActivity: activityScripts,
    suggestedQuestions,
    assistantResponses,
    users: initialUsers,
  }

  writeDb(fullData)
  console.log('✓ Updated local db.json cache')

  // 2. Connect to PostgreSQL if database URL is configured
  if (!config.databaseUrl) {
    console.log('ℹ No DATABASE_URL configured. Seeded local file database only.')
    return
  }

  console.log('Connecting to PostgreSQL database...')
  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    const client = await pool.connect()
    console.log('✓ Connected to PostgreSQL')

    // Ensure all required tables exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS collections (
        name TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        item TEXT NOT NULL,
        unit TEXT,
        quantity NUMERIC NOT NULL DEFAULT 0,
        reorder_threshold NUMERIC DEFAULT 0,
        consumption_per_day NUMERIC DEFAULT 0,
        status TEXT DEFAULT 'OK',
        last_updated TEXT,
        last_transaction JSONB,
        data JSONB
      );

      CREATE TABLE IF NOT EXISTS procurement_orders (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        item TEXT NOT NULL,
        vendor_id TEXT,
        quantity NUMERIC,
        unit TEXT,
        amount BIGINT,
        date_raised TEXT,
        expected_delivery TEXT,
        stage TEXT,
        status TEXT,
        delivery_id TEXT,
        delay_days INT DEFAULT 0,
        data JSONB
      );

      CREATE TABLE IF NOT EXISTS vendors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        reliability TEXT,
        avg_delay_days NUMERIC,
        data JSONB
      );

      CREATE TABLE IF NOT EXISTS deliveries (
        id TEXT PRIMARY KEY,
        po_id TEXT,
        expected_date TEXT,
        revised_date TEXT,
        delay_days INT DEFAULT 0,
        status TEXT,
        reason TEXT,
        data JSONB
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        role TEXT,
        site_id TEXT,
        status TEXT DEFAULT 'Active',
        created_at TEXT,
        data JSONB
      );
    `)

    // Clear existing rows before inserting
    await client.query('DELETE FROM inventory')
    await client.query('DELETE FROM procurement_orders')
    await client.query('DELETE FROM vendors')
    await client.query('DELETE FROM deliveries')
    await client.query('DELETE FROM users')
    console.log('✓ Cleared existing rows in tables')

    // Seed Inventory Table
    for (const item of inventory) {
      await client.query(
        `INSERT INTO inventory (
          id, site_id, item, unit, quantity, reorder_threshold, consumption_per_day, status, last_updated, last_transaction, data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          site_id = $2,
          item = $3,
          unit = $4,
          quantity = $5,
          reorder_threshold = $6,
          consumption_per_day = $7,
          status = $8,
          last_updated = $9,
          last_transaction = $10,
          data = $11`,
        [
          item.id,
          item.siteId,
          item.item,
          item.unit,
          item.quantity,
          item.reorderThreshold,
          item.consumptionPerDay,
          item.status,
          item.lastUpdated,
          JSON.stringify(item.lastTransaction || null),
          JSON.stringify(item),
        ]
      )
    }

    // Seed Procurement Orders Table
    for (const po of procurementOrders) {
      await client.query(
        `INSERT INTO procurement_orders (
          id, site_id, item, vendor_id, quantity, unit, amount, date_raised, expected_delivery, stage, status, delivery_id, delay_days, data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          site_id = $2,
          item = $3,
          vendor_id = $4,
          quantity = $5,
          unit = $6,
          amount = $7,
          date_raised = $8,
          expected_delivery = $9,
          stage = $10,
          status = $11,
          delivery_id = $12,
          delay_days = $13,
          data = $14`,
        [
          po.id,
          po.siteId,
          po.item,
          po.vendorId,
          po.quantity,
          po.unit,
          po.amount,
          po.dateRaised,
          po.expectedDelivery,
          po.stage,
          po.status,
          po.deliveryId,
          po.delayDays || 0,
          JSON.stringify(po),
        ]
      )
    }

    // Seed Vendors Table
    for (const v of vendors) {
      await client.query(
        `INSERT INTO vendors (
          id, name, category, reliability, avg_delay_days, data
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          name = $2,
          category = $3,
          reliability = $4,
          avg_delay_days = $5,
          data = $6`,
        [v.id, v.name, v.category, v.reliability, v.avgDelayDays, JSON.stringify(v)]
      )
    }

    // Seed Deliveries Table
    for (const d of deliveries) {
      await client.query(
        `INSERT INTO deliveries (
          id, po_id, expected_date, revised_date, delay_days, status, reason, data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          po_id = $2,
          expected_date = $3,
          revised_date = $4,
          delay_days = $5,
          status = $6,
          reason = $7,
          data = $8`,
        [
          d.id,
          d.poId,
          d.expectedDate,
          d.revisedDate,
          d.delayDays || 0,
          d.status,
          d.reason,
          JSON.stringify(d),
        ]
      )
    }

    // Seed Users Table
    for (const u of initialUsers) {
      await client.query(
        `INSERT INTO users (
          id, name, email, phone, role, site_id, status, created_at, data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = $2,
          email = $3,
          phone = $4,
          role = $5,
          site_id = $6,
          status = $7,
          created_at = $8,
          data = $9`,
        [u.id, u.name, u.email, u.phone, u.role, u.siteId, u.status, u.createdAt, JSON.stringify(u)]
      )
    }

    // Seed Collections snapshot table
    for (const [name, data] of Object.entries(fullData)) {
      await client.query(
        `INSERT INTO collections (name, data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (name) DO UPDATE SET data = $2, updated_at = NOW()`,
        [name, JSON.stringify(data)]
      )
    }

    console.log('--------------------------------------------------')
    console.log(
      `✓ Seeded ${inventory.length} inventory items, ${procurementOrders.length} procurement orders, ${vendors.length} vendors, ${deliveries.length} deliveries, ${initialUsers.length} users`
    )
    console.log('✓ Seeded all document collections into PostgreSQL')
    console.log('--------------------------------------------------')

    client.release()
  } catch (err) {
    console.error('Error during PostgreSQL seeding:', err)
    throw err
  } finally {
    await pool.end()
  }
}

// Execute directly if run via CLI
if (process.argv[1]?.includes('seed.js')) {
  runSeed()
    .then(() => {
      console.log('Seed completed successfully!')
      process.exit(0)
    })
    .catch((err) => {
      console.error('Seed failed:', err)
      process.exit(1)
    })
}
