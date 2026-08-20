import { Router } from 'express'
import { getCollection, findById, updateById, getPool } from '../db.js'

const router = Router()

function formatInventoryRow(row) {
  if (!row) return null
  const baseData = row.data && typeof row.data === 'object' ? row.data : {}
  return {
    ...baseData,
    id: row.id || baseData.id,
    siteId: row.site_id || baseData.siteId,
    item: row.item || baseData.item,
    unit: row.unit || baseData.unit,
    quantity: Number(row.quantity ?? baseData.quantity ?? 0),
    reorderThreshold: Number(row.reorder_threshold ?? baseData.reorderThreshold ?? 0),
    consumptionPerDay: Number(row.consumption_per_day ?? baseData.consumptionPerDay ?? 0),
    status: row.status || baseData.status || 'OK',
    lastUpdated: row.last_updated || baseData.lastUpdated || new Date().toISOString(),
    lastTransaction: row.last_transaction || baseData.lastTransaction || null,
  }
}

// GET /api/inventory - List inventory items (optionally filter by siteId)
router.get('/', async (req, res) => {
  const { siteId } = req.query
  const pool = getPool()

  if (pool) {
    try {
      let query = 'SELECT * FROM inventory'
      const params = []
      if (siteId) {
        query += ' WHERE site_id = $1'
        params.push(siteId)
      }
      query += ' ORDER BY id ASC'
      const result = await pool.query(query, params)
      if (result.rows && result.rows.length > 0) {
        return res.json(result.rows.map(formatInventoryRow))
      }
    } catch (err) {
      console.warn('PostgreSQL inventory query failed, using local collection:', err.message)
    }
  }

  // Fallback to local collection cache
  const inventory = getCollection('inventory')
  if (siteId) {
    return res.json(inventory.filter((item) => item.siteId === siteId))
  }
  res.json(inventory)
})

// GET /api/inventory/:id - Single inventory item
router.get('/:id', async (req, res) => {
  const { id } = req.params
  const pool = getPool()

  if (pool) {
    try {
      const result = await pool.query('SELECT * FROM inventory WHERE id = $1', [id])
      if (result.rows.length > 0) {
        return res.json(formatInventoryRow(result.rows[0]))
      }
    } catch (err) {
      console.warn(`PostgreSQL inventory lookup failed for ${id}, using local collection:`, err.message)
    }
  }

  const item = findById('inventory', id)
  if (!item) {
    return res.status(404).json({ error: 'Inventory item not found' })
  }
  res.json(item)
})

// POST /api/inventory/:id/transaction - Log a stock transaction (Stock In, Stock Out, Transfer)
router.post('/:id/transaction', async (req, res) => {
  const { id } = req.params
  const { type = 'Stock In', quantity, note } = req.body

  const qty = Number(quantity)
  if (!qty || qty <= 0 || isNaN(qty)) {
    return res.status(400).json({ error: 'Invalid transaction quantity' })
  }

  const pool = getPool()
  let currentItem = null

  if (pool) {
    try {
      const result = await pool.query('SELECT * FROM inventory WHERE id = $1', [id])
      if (result.rows.length > 0) {
        currentItem = formatInventoryRow(result.rows[0])
      }
    } catch (err) {
      console.warn(`PostgreSQL query error for item ${id}:`, err.message)
    }
  }

  if (!currentItem) {
    currentItem = findById('inventory', id)
  }

  if (!currentItem) {
    return res.status(404).json({ error: 'Inventory item not found' })
  }

  let newQuantity = currentItem.quantity
  if (type === 'Stock In') {
    newQuantity += qty
  } else if (type === 'Stock Out' || type === 'Transfer') {
    newQuantity -= qty
  }
  newQuantity = Math.max(0, Math.round(newQuantity * 100) / 100)

  // Status calculation based on reorder threshold
  const threshold = currentItem.reorderThreshold || 0
  let status = 'OK'
  if (newQuantity <= threshold * 0.5) {
    status = 'CRITICAL'
  } else if (newQuantity <= threshold) {
    status = 'LOW'
  } else {
    status = 'OK'
  }

  const now = new Date()
  const lastUpdated = now.toISOString()
  const lastTransaction = {
    type,
    quantity: qty,
    date: now.toISOString().slice(0, 10),
    relatedPO: currentItem.lastTransaction?.relatedPO || null,
    ...(note ? { note } : {}),
  }

  const updatedPayload = {
    ...currentItem,
    quantity: newQuantity,
    status,
    lastUpdated,
    lastTransaction,
  }

  // Update in PostgreSQL
  if (pool) {
    try {
      await pool.query(
        `UPDATE inventory 
         SET quantity = $1, status = $2, last_updated = $3, last_transaction = $4, data = $5 
         WHERE id = $6`,
        [
          newQuantity,
          status,
          lastUpdated,
          JSON.stringify(lastTransaction),
          JSON.stringify(updatedPayload),
          id,
        ]
      )
    } catch (err) {
      console.warn(`PostgreSQL update error for item ${id}:`, err.message)
    }
  }

  // Always update local cache
  updateById('inventory', id, {
    quantity: newQuantity,
    status,
    lastUpdated,
    lastTransaction,
  })

  res.json(updatedPayload)
})

export default router
