import { Router } from 'express'
<<<<<<< HEAD
import { getCollection, findById, updateById, setCollection, getPool } from '../db.js'

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
  const siteId = req.query.siteId || req.query.site_id
  const pool = getPool()

  if (pool) {
    try {
      let query = 'SELECT * FROM inventory'
      const params = []
      if (siteId) {
        query += ' WHERE site_id ILIKE $1'
        params.push(String(siteId).trim())
      }
      query += ' ORDER BY id ASC'
      const result = await pool.query(query, params)
      if (result.rows) {
        const mapped = result.rows.map(formatInventoryRow)
        return res.json(mapped)
      }
    } catch (err) {
      console.warn('PostgreSQL inventory query failed, using local collection:', err.message)
    }
  }

  // Fallback to local collection cache
  const inventory = getCollection('inventory') || []
  if (siteId) {
    return res.json(inventory.filter((item) => String(item.siteId).trim().toLowerCase() === String(siteId).trim().toLowerCase()))
=======
import { getCollectionDirect, updateByIdDirect } from '../db.js'

const router = Router()

// GET /api/inventory - List inventory items (optionally filter by ?siteId=...)
router.get('/', async (req, res) => {
  try {
    const { siteId } = req.query
    const inventory = await getCollectionDirect('inventory')
    if (siteId) {
      return res.json(inventory.filter((item) => item.siteId === siteId))
    }
    return res.json(inventory)
  } catch (err) {
    console.error('Error in GET /api/inventory:', err)
    return res.status(500).json({ error: 'Failed to retrieve inventory' })
>>>>>>> 9ec1c5ff38cf68cffa967dfdbd6299686e4c6419
  }
})

<<<<<<< HEAD
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
=======
// GET /api/inventory/:idOrSiteId - Single item by ID OR list of items for a siteId
router.get('/:idOrSiteId', async (req, res) => {
  try {
    const { idOrSiteId } = req.params
    const inventory = await getCollectionDirect('inventory')

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
  } catch (err) {
    console.error(`Error in GET /api/inventory/${req.params.idOrSiteId}:`, err)
    return res.status(500).json({ error: 'Failed to retrieve inventory data' })
>>>>>>> 9ec1c5ff38cf68cffa967dfdbd6299686e4c6419
  }
})

// POST /api/inventory - Create a new inventory item
router.post('/', async (req, res) => {
  try {
    const { siteId, item, unit = 'units', quantity = 0, reorderThreshold = 0, consumptionPerDay = 0 } = req.body

    if (!siteId || !item) {
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

    const now = new Date()
    const id = `INV-${Math.floor(100 + Math.random() * 900)}`
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
      item,
      unit,
      quantity: numQty,
      reorderThreshold: numThreshold,
      consumptionPerDay: numConsumption,
      status,
      lastUpdated,
      lastTransaction,
    }

    if (pool) {
      try {
        await pool.query(
          `INSERT INTO inventory (
            id, site_id, item, unit, quantity, reorder_threshold, consumption_per_day, status, last_updated, last_transaction, data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            id,
            siteId,
            item,
            unit,
            numQty,
            numThreshold,
            numConsumption,
            status,
            lastUpdated,
            JSON.stringify(lastTransaction),
            JSON.stringify(newItem),
          ]
        )
      } catch (err) {
        console.warn('PostgreSQL insert inventory item warning:', err.message)
      }
    }

    const list = getCollection('inventory') || []
    list.push(newItem)
    setCollection('inventory', list)

    res.status(201).json(newItem)
  } catch (err) {
    console.error('Error creating inventory item:', err)
    res.status(500).json({ error: 'Failed to create inventory item' })
  }
})

// POST /api/inventory/:id/transaction - Log a stock transaction (Stock In, Stock Out, Transfer)
router.post('/:id/transaction', async (req, res) => {
<<<<<<< HEAD
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

// PATCH /api/inventory/:id - Direct field edits (e.g. reorderThreshold, consumptionPerDay, unit, item)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const pool = getPool()
    let currentItem = null

    if (pool) {
      try {
        const result = await pool.query('SELECT * FROM inventory WHERE id = $1', [id])
        if (result.rows.length > 0) {
          currentItem = formatInventoryRow(result.rows[0])
        }
      } catch (err) {
        console.warn(`PostgreSQL lookup failed for item ${id}:`, err.message)
      }
    }

    if (!currentItem) {
      currentItem = findById('inventory', id)
    }

    if (!currentItem) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    const payload = req.body
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Invalid update body' })
    }

    const updatedQty = payload.quantity !== undefined ? Number(payload.quantity) : currentItem.quantity
    const updatedThreshold =
      payload.reorderThreshold !== undefined ? Number(payload.reorderThreshold) : currentItem.reorderThreshold

    let updatedStatus = payload.status || currentItem.status
    if (payload.quantity !== undefined || payload.reorderThreshold !== undefined) {
      if (!payload.status) {
        if (updatedQty <= updatedThreshold * 0.5) {
          updatedStatus = 'CRITICAL'
        } else if (updatedQty <= updatedThreshold) {
          updatedStatus = 'LOW'
        } else {
          updatedStatus = 'OK'
        }
      }
    }

    const now = new Date()
    const lastUpdated = now.toISOString()

    const merged = {
      ...currentItem,
      ...payload,
      quantity: updatedQty,
      reorderThreshold: updatedThreshold,
      consumptionPerDay:
        payload.consumptionPerDay !== undefined ? Number(payload.consumptionPerDay) : currentItem.consumptionPerDay,
      status: updatedStatus,
      lastUpdated,
    }

    if (pool) {
      try {
        await pool.query(
          `UPDATE inventory 
           SET item = $1, unit = $2, quantity = $3, reorder_threshold = $4, consumption_per_day = $5, status = $6, last_updated = $7, data = $8
           WHERE id = $9`,
          [
            merged.item,
            merged.unit,
            merged.quantity,
            merged.reorderThreshold,
            merged.consumptionPerDay,
            merged.status,
            merged.lastUpdated,
            JSON.stringify(merged),
            id,
          ]
        )
      } catch (err) {
        console.warn(`PostgreSQL PATCH error for item ${id}:`, err.message)
      }
    }

    updateById('inventory', id, merged)
    res.json(merged)
  } catch (err) {
    console.error('Error updating inventory item:', err)
    res.status(500).json({ error: 'Failed to update inventory item' })
  }
})

// DELETE /api/inventory/:id - Delete an inventory item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const pool = getPool()
    let found = false

    if (pool) {
      try {
        const result = await pool.query('DELETE FROM inventory WHERE id = $1 RETURNING id', [id])
        if (result.rows.length > 0) {
          found = true
        }
      } catch (err) {
        console.warn(`PostgreSQL DELETE error for item ${id}:`, err.message)
      }
    }

    const list = getCollection('inventory') || []
    const idx = list.findIndex((i) => i.id === id)
    if (idx !== -1) {
      found = true
      list.splice(idx, 1)
      setCollection('inventory', list)
    }

    if (!found) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    res.json({ message: 'Inventory item deleted successfully', id })
  } catch (err) {
    console.error('Error deleting inventory item:', err)
    res.status(500).json({ error: 'Failed to delete inventory item' })
=======
  try {
    const { id } = req.params
    const { type = 'Stock In', quantity, note } = req.body

    const inventory = await getCollectionDirect('inventory')
    const item = inventory.find((i) => i.id === id)
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    const qty = Number(quantity)
    if (!qty || qty <= 0 || isNaN(qty)) {
      return res.status(400).json({ error: 'Invalid transaction quantity' })
    }

    let newQuantity = Number(item.quantity)
    if (type === 'Stock In') {
      newQuantity += qty
    } else if (type === 'Stock Out' || type === 'Transfer') {
      newQuantity -= qty
    }
    newQuantity = Math.max(0, Math.round(newQuantity * 100) / 100)

    // Status calculation based on reorder threshold
    const threshold = Number(item.reorderThreshold) || 0
    let newStatus = 'OK'
    if (newQuantity <= threshold * 0.5) {
      newStatus = 'CRITICAL'
    } else if (newQuantity <= threshold) {
      newStatus = 'LOW'
    }

    const transactionRecord = {
      type,
      quantity: qty,
      date: new Date().toISOString().split('T')[0],
      note: note || `${type} of ${qty} ${item.unit}`,
    }

    const updated = await updateByIdDirect('inventory', id, {
      quantity: newQuantity,
      status: newStatus,
      lastTransaction: transactionRecord,
    })

    return res.json(updated)
  } catch (err) {
    console.error(`Error in POST /api/inventory/${req.params.id}/transaction:`, err)
    return res.status(500).json({ error: 'Failed to process transaction' })
>>>>>>> 9ec1c5ff38cf68cffa967dfdbd6299686e4c6419
  }
})

export default router
