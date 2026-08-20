import fs from 'fs'
import path from 'path'
import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

// Optional PostgreSQL pool for live cloud database syncing
let pgPool = null

if (config.databaseUrl) {
  try {
    pgPool = new Pool({
      connectionString: config.databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    })
    pgPool.on('error', (err) => {
      console.warn('PostgreSQL Pool background warning:', err.message)
    })
  } catch (err) {
    console.warn('Failed to initialize PostgreSQL pool, using local cache:', err.message)
  }
}

export function getPool() {
  return pgPool
}

function ensureDbFileExists() {
  const dir = path.dirname(config.dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(config.dbPath)) {
    fs.writeFileSync(config.dbPath, JSON.stringify({}, null, 2), 'utf-8')
  }
}

export function readDb() {
  ensureDbFileExists()
  try {
    const raw = fs.readFileSync(config.dbPath, 'utf-8')
    return JSON.parse(raw || '{}')
  } catch (err) {
    console.error('Error reading DB:', err)
    return {}
  }
}

export function writeDb(data) {
  ensureDbFileExists()
  try {
    fs.writeFileSync(config.dbPath, JSON.stringify(data, null, 2), 'utf-8')

    // Asynchronously push collection snapshot to Supabase PostgreSQL
    if (pgPool) {
      syncToPostgres(data).catch((err) => {
        console.warn('Background Supabase sync warning:', err.message)
      })
    }
    return true
  } catch (err) {
    console.error('Error writing DB:', err)
    return false
  }
}

async function syncToPostgres(allData) {
  if (!pgPool) return
  for (const [key, value] of Object.entries(allData)) {
    await pgPool.query(
      `INSERT INTO collections (name, data, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (name) DO UPDATE SET data = $2, updated_at = NOW()`,
      [key, JSON.stringify(value)]
    )
  }
}

export function getCollection(collectionName) {
  const db = readDb()
  return db[collectionName] || []
}

export function setCollection(collectionName, data) {
  const db = readDb()
  db[collectionName] = data
  return writeDb(db)
}

export function findById(collectionName, id) {
  const collection = getCollection(collectionName)
  if (Array.isArray(collection)) {
    return collection.find((item) => item.id === id)
  }
  return null
}

export function updateById(collectionName, id, updateFields) {
  const collection = getCollection(collectionName)
  if (!Array.isArray(collection)) return null

  const index = collection.findIndex((item) => item.id === id)
  if (index === -1) return null

  collection[index] = { ...collection[index], ...updateFields }
  setCollection(collectionName, collection)

  // Sync row-level update directly to relational table if available
  if (pgPool && collectionName === 'procurementOrders') {
    const item = collection[index]
    pgPool
      .query(
        `UPDATE procurement_orders 
         SET stage = $1, status = $2, data = $3 
         WHERE id = $4`,
        [item.stage, item.status, JSON.stringify(item), id]
      )
      .catch((err) => console.warn('Supabase row sync warning:', err.message))
  }

  return collection[index]
}
