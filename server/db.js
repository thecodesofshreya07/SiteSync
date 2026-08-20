import fs from 'fs'
import path from 'path'
import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

let pgPool = null

if (config.databaseUrl) {
  try {
    pgPool = new Pool({
      connectionString: config.databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
    })
    pgPool.on('error', (err) => {
      console.warn('[PostgreSQL Pool Note]:', err.message)
    })
  } catch (err) {
    console.error('[PostgreSQL] Failed to initialize pool:', err.message)
  }
}

export function getPool() {
  return pgPool
}

// In-memory synced state reflecting PostgreSQL
let memoryDb = {
  sites: [],
  inventory: [],
  procurementOrders: [],
  deliveries: [],
  equipment: [],
  tasks: [],
  vendors: [],
  alerts: [],
  users: [],
}

// Table mapping to relational tables
const TABLE_MAP = {
  sites: 'sites',
  inventory: 'inventory',
  procurementOrders: 'procurement_orders',
  deliveries: 'deliveries',
  equipment: 'equipment',
  tasks: 'tasks',
  vendors: 'vendors',
  alerts: 'alerts',
  users: 'users',
}

/**
 * Initialize DB state by querying PostgreSQL directly on startup
 */
export async function initDbFromPostgres() {
  if (!pgPool) {
    console.warn('[DB] No PostgreSQL pool available. Using local file.')
    readDbFromFile()
    return
  }

  try {
    const client = await pgPool.connect()
    try {
      console.log('[DB] Synchronizing state directly from PostgreSQL tables...')
      const newDb = {}

      // 1. Fetch from relational tables
      for (const [colName, tableName] of Object.entries(TABLE_MAP)) {
        try {
          const res = await client.query(`SELECT data FROM ${tableName} ORDER BY id ASC`)
          newDb[colName] = res.rows.map((r) => r.data)
        } catch (tableErr) {
          console.warn(`[DB] Table ${tableName} query error:`, tableErr.message)
          newDb[colName] = []
        }
      }

      // 2. Fetch other non-relational collections from collections table
      try {
        const collectionsRes = await client.query(
          `SELECT name, data FROM collections WHERE name NOT IN ('sites', 'inventory', 'procurement_orders', 'procurementOrders', 'deliveries', 'equipment', 'tasks', 'vendors', 'alerts', 'users')`
        )
        for (const row of collectionsRes.rows) {
          newDb[row.name] = row.data
        }
      } catch (colErr) {
        console.warn('[DB] Collections table query error:', colErr.message)
      }

      memoryDb = newDb
      console.log(`[DB] State synced from PostgreSQL. Alerts in DB: ${memoryDb.alerts?.length || 0}`)
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('[DB] Failed to sync from PostgreSQL:', err.message)
  }
}

// Perform initial sync immediately
initDbFromPostgres()

function ensureDbFileExists() {
  const dir = path.dirname(config.dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(config.dbPath)) {
    fs.writeFileSync(config.dbPath, JSON.stringify({}, null, 2), 'utf-8')
  }
}

function readDbFromFile() {
  ensureDbFileExists()
  try {
    const raw = fs.readFileSync(config.dbPath, 'utf-8')
    memoryDb = JSON.parse(raw || '{}')
    return memoryDb
  } catch (err) {
    console.error('Error reading DB file:', err)
    return {}
  }
}

export function readDb() {
  return memoryDb
}

export function getCollection(collectionName) {
  return memoryDb[collectionName] || []
}

/**
 * Direct async fetch of collection from PostgreSQL for guaranteed real-time freshness
 */
export async function getCollectionDirect(collectionName) {
  if (!pgPool) return getCollection(collectionName)

  const tableName = TABLE_MAP[collectionName]
  if (tableName) {
    try {
      const res = await pgPool.query(`SELECT data FROM ${tableName} ORDER BY id ASC`)
      const rows = res.rows.map((r) => r.data)
      memoryDb[collectionName] = rows
      return rows
    } catch (err) {
      console.warn(`[DB] getCollectionDirect failed for ${tableName}:`, err.message)
      return memoryDb[collectionName] || []
    }
  }

  try {
    const res = await pgPool.query(`SELECT data FROM collections WHERE name = $1`, [collectionName])
    if (res.rows.length > 0) {
      memoryDb[collectionName] = res.rows[0].data
      return res.rows[0].data
    }
  } catch (err) {
    console.warn(`[DB] getCollectionDirect failed for collection ${collectionName}:`, err.message)
  }

  return memoryDb[collectionName] || []
}

export function setCollection(collectionName, data) {
  memoryDb[collectionName] = data

  if (pgPool) {
    const tableName = TABLE_MAP[collectionName]
    if (tableName) {
      syncTableToPostgres(tableName, data).catch((err) => {
        console.warn(`[DB] Error syncing ${tableName} to PostgreSQL:`, err.message)
      })
    }
    // Also update collections table
    pgPool
      .query(
        `INSERT INTO collections (name, data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (name) DO UPDATE SET data = $2, updated_at = NOW()`,
        [collectionName, JSON.stringify(data)]
      )
      .catch((err) => console.warn(`[DB] Error syncing collection ${collectionName}:`, err.message))
  }

  return true
}

async function syncTableToPostgres(tableName, items) {
  if (!pgPool || !Array.isArray(items)) return

  const client = await pgPool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`DELETE FROM ${tableName}`)
    for (const item of items) {
      if (!item || !item.id) continue
      if (tableName === 'alerts') {
        await client.query(
          `INSERT INTO alerts (id, site_id, severity, title, status, data)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [item.id, item.siteId, item.severity, item.title, item.status || 'pending', JSON.stringify(item)]
        )
      } else if (tableName === 'inventory') {
        await client.query(
          `INSERT INTO inventory (id, site_id, item, quantity, unit, reorder_threshold, consumption_per_day, status, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            item.id,
            item.siteId,
            item.item,
            item.quantity,
            item.unit,
            item.reorderThreshold || 0,
            item.consumptionPerDay || 0,
            item.status || 'OK',
            JSON.stringify(item),
          ]
        )
      } else if (tableName === 'sites') {
        await client.query(
          `INSERT INTO sites (id, name, location, status, budget_planned, budget_actual, progress, last_scan, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            item.id,
            item.name,
            item.location,
            item.status,
            item.budgetPlanned,
            item.budgetActual,
            item.progress,
            item.lastScan,
            JSON.stringify(item),
          ]
        )
      } else {
        await client.query(
          `INSERT INTO ${tableName} (id, data) VALUES ($1, $2)
           ON CONFLICT (id) DO UPDATE SET data = $2`,
          [item.id, JSON.stringify(item)]
        )
      }
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export function findById(collectionName, id) {
  const collection = getCollection(collectionName)
  if (Array.isArray(collection)) {
    return collection.find((item) => item.id === id)
  }
  return null
}

export function updateById(collectionName, id, updateFields) {
  const collection = memoryDb[collectionName] || []
  const index = collection.findIndex((item) => item.id === id)
  if (index === -1) return null

  collection[index] = { ...collection[index], ...updateFields }
  const updatedItem = collection[index]
  setCollection(collectionName, collection)
  return updatedItem
}

export async function insertAlertDirect(alert) {
  const alerts = memoryDb.alerts || []
  const idx = alerts.findIndex((a) => a.id === alert.id)
  if (idx >= 0) {
    alerts[idx] = { ...alerts[idx], ...alert }
  } else {
    alerts.unshift(alert)
  }
  memoryDb.alerts = alerts

  if (pgPool) {
    await pgPool.query(
      `INSERT INTO alerts (id, site_id, severity, title, status, data)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         severity = $3,
         title = $4,
         status = $5,
         data = $6`,
      [alert.id, alert.siteId, alert.severity, alert.title, alert.status || 'pending', JSON.stringify(alert)]
    )
  }
  return alert
}

export async function updateAlertStatusDirect(id, status) {
  const alerts = memoryDb.alerts || []
  const item = alerts.find((a) => a.id === id)
  if (item) {
    item.status = status
  }

  if (pgPool) {
    await pgPool.query(
      `UPDATE alerts 
       SET status = $1, 
           data = jsonb_set(data, '{status}', to_jsonb($1::text))
       WHERE id = $2`,
      [status, id]
    )
  }
  return item
}

export async function updateByIdDirect(collectionName, id, updateFields) {
  const collection = memoryDb[collectionName] || []
  const index = collection.findIndex((item) => item.id === id)
  if (index === -1) return null

  collection[index] = { ...collection[index], ...updateFields }
  const updatedItem = collection[index]

  if (pgPool) {
    const tableName = TABLE_MAP[collectionName]
    if (tableName) {
      try {
        await pgPool.query(
          `UPDATE ${tableName} 
           SET data = $1 
           WHERE id = $2`,
          [JSON.stringify(updatedItem), id]
        )
      } catch (err) {
        console.warn(`[DB] Error updating ${tableName} row ${id}:`, err.message)
      }
    }
  }

  return updatedItem
}

