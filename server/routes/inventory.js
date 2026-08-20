import { Router } from 'express'
import { getCollection, findById, updateById, setCollection, getPool } from '../db.js'

const router = Router()

// GET /api/inventory - List inventory items (optionally filter by ?siteId=...)
router.get('/', (req, res) => {
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
  return res.json(inventory)
})

// GET /api/inventory/:idOrSiteId - Single item by ID OR list of items for a siteId
router.get('/:idOrSiteId', (req, res) => {
  const { idOrSiteId } = req.params
  const inventory = getCollection('inventory')

  // First check if it matches a single item ID (e.g. INV-018)
  const item = inventory.find((i) => i.id === idOrSiteId)
  if (item) {
    return res.json(item)
  }

  // Next check if it matches a site ID (e.g. SITE-001)
  const siteItems = inventory.filter((i) => i.siteId === idOrSiteId)
  if (siteItems.length > 0) {
    return res.json(siteItems)
  }

  return res.status(404).json({ error: `Inventory item or site '${idOrSiteId}' not found` })
})

// POST /api/inventory - Create a new inventory item
router.post('/', async (req, res) => {
  try {
    const { siteId, item, unit = 'units', quantity = 0, reorderThreshold = 0, consumptionPerDay = 0 } = req.body

    if (!siteId || !item || !item.trim()) {
      return res.status(400).json({ error: 'siteId and item name are required' })
    }

    const pool = getPool()
    const numQty = Math.max(0, Number(quantity) || 0)
    const numThreshold = Math.max(0, Number(reorderThreshold) || 0)
    const numConsumption = Math.max(0, Number(consumptionPerDay) || 0)

    let status = 'OK'
    if (numQty <= numThreshold * 0.5) {
      status = 'CRITICAL'
    } else if (numQty <= numThreshold) {
      status = 'LOW'
    }

    const id = await generateUniqueInventoryId(pool)
    const now = new Date()
    const lastUpdated = now.toISOString()
    const lastTransaction = {
      type: 'Stock In',
      quantity: numQty,
      date: now.toISOString().slice(0, 10),
      note: 'Initial inventory creation',
    }

    const newItem = {
      id,
      siteId,
      item: item.trim(),
      unit: unit.trim() || 'units',
      quantity: numQty,
      reorderThreshold: numThreshold,
      consumptionPerDay: numConsumption,
      status,
      lastUpdated,
      lastTransaction,
    }

    let createdRecord = newItem

    if (pool) {
      try {
        const insertRes = await pool.query(
          `INSERT INTO inventory (
            id, site_id, item, unit, quantity, reorder_threshold, consumption_per_day, status, last_updated, last_transaction, data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *`,
          [
            id,
            siteId,
            newItem.item,
            newItem.unit,
            numQty,
            numThreshold,
            numConsumption,
            status,
            lastUpdated,
            JSON.stringify(lastTransaction),
            JSON.stringify(newItem),
          ]
        )
        if (insertRes.rows && insertRes.rows.length > 0) {
          createdRecord = formatInventoryRow(insertRes.rows[0])
        }
      } catch (err) {
        console.error('❌ PostgreSQL INSERT failed for inventory item:', err.message)
        return res.status(500).json({ error: `Database insert failed: ${err.message}` })
      }
    }

    // Update local cache
    const list = getCollection('inventory') || []
    list.push(createdRecord)
    setCollection('inventory', list)

    console.log(`✓ Created inventory item ${createdRecord.id} ("${createdRecord.item}") for site ${siteId}`)
    res.status(201).json(createdRecord)
  } catch (err) {
    console.error('Error creating inventory item:', err)
    res.status(500).json({ error: 'Failed to create inventory item: ' + err.message })
  }
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

  return res.json(updatedItem)
})

export default router
