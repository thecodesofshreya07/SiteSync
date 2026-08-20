import pg from 'pg'
import { config } from '../config.js'
import { readDb } from '../db.js'

const { Pool } = pg

export async function initPostgres() {
  if (!config.databaseUrl) {
    console.log('No DATABASE_URL configured. Skipping Postgres initialization.')
    return false
  }

  console.log('Connecting to Supabase PostgreSQL database...')

  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    const client = await pool.connect()
    console.log('✓ Successfully connected to Supabase PostgreSQL!')

    // 1. Create collections table for fast, shape-preserving JSONB document storage
    await client.query(`
      CREATE TABLE IF NOT EXISTS collections (
        name TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 2. Create dedicated relational tables for direct SQL queries
    await client.query(`
      CREATE TABLE IF NOT EXISTS sites (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT,
        type TEXT,
        status TEXT,
        manager TEXT,
        budget_planned BIGINT,
        budget_actual BIGINT,
        progress INT,
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
        delay_days INT,
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
        delay_days INT,
        status TEXT,
        reason TEXT,
        data JSONB
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        name TEXT NOT NULL,
        assignee TEXT,
        progress INT,
        due_date TEXT,
        priority TEXT,
        column_name TEXT,
        data JSONB
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        item TEXT NOT NULL,
        quantity NUMERIC,
        unit TEXT,
        status TEXT,
        data JSONB
      );

      CREATE TABLE IF NOT EXISTS equipment (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        status TEXT,
        utilization INT,
        idle_days INT,
        data JSONB
      );

      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        severity TEXT,
        title TEXT,
        status TEXT,
        data JSONB
      );
    `)

    console.log('✓ SQL tables created successfully in Supabase!')

    // 3. Seed initial data from local db.json into Supabase
    const dbData = readDb()
    const collectionKeys = Object.keys(dbData)

    for (const key of collectionKeys) {
      const items = dbData[key]
      await client.query(
        `INSERT INTO collections (name, data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (name) DO UPDATE SET data = $2, updated_at = NOW()`,
        [key, JSON.stringify(items)]
      )
    }

    // Seed procurement_orders table
    if (Array.isArray(dbData.procurementOrders)) {
      for (const po of dbData.procurementOrders) {
        await client.query(
          `INSERT INTO procurement_orders (id, site_id, item, vendor_id, quantity, unit, amount, date_raised, expected_delivery, stage, status, delivery_id, delay_days, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO UPDATE SET stage = $10, status = $11, data = $14`,
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
    }

    // Seed vendors table
    if (Array.isArray(dbData.vendors)) {
      for (const v of dbData.vendors) {
        await client.query(
          `INSERT INTO vendors (id, name, category, reliability, avg_delay_days, data)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET name = $2, data = $6`,
          [v.id, v.name, v.category, v.reliability, v.avgDelayDays, JSON.stringify(v)]
        )
      }
    }

    // Seed deliveries table
    if (Array.isArray(dbData.deliveries)) {
      for (const d of dbData.deliveries) {
        await client.query(
          `INSERT INTO deliveries (id, po_id, expected_date, revised_date, delay_days, status, reason, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET status = $6, reason = $7, data = $8`,
          [d.id, d.poId, d.expectedDate, d.revisedDate, d.delayDays, d.status, d.reason, JSON.stringify(d)]
        )
      }
    }

    console.log('✓ Supabase PostgreSQL database seeded with all SiteSync data!')
    client.release()
    await pool.end()
    return true
  } catch (err) {
    console.error('Error initializing PostgreSQL:', err)
    await pool.end()
    return false
  }
}

// Run when executed directly
if (process.argv[1]?.includes('postgres-init.js')) {
  initPostgres().then(() => process.exit(0))
}
