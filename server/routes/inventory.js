import { Router } from 'express'
import { getCollection, findById, updateById, setCollection, getPool, getCollectionDirect, insertAlertDirect } from '../db.js'

const router = Router()

async function triggerShortageAlertIfNeeded(item) {
  try {
    const isCritical =
      item.status === 'CRITICAL' ||
      item.status === 'Critical' ||
      (item.consumptionPerDay > 0 && item.quantity / item.consumptionPerDay <= 4) ||
      (item.reorderThreshold > 0 && item.quantity <= item.reorderThreshold * 0.5)

    if (!isCritical) return

    const existingAlerts = await getCollectionDirect('alerts')
    const activeAlert = existingAlerts.find(
      (a) =>
        a.siteId === item.siteId &&
        (a.status === 'pending' || a.status === 'transfer_requested') &&
        a.title.toLowerCase().includes(item.item.toLowerCase())
    )

    if (activeAlert) return // Alert already pending or in flight

    const allInventory = await getCollectionDirect('inventory')
    const sites = await getCollectionDirect('sites')
    const currentSite = sites.find((s) => s.id === item.siteId) || { id: item.siteId, name: item.siteId }

    // Search for surplus stock at sibling sites
    const siblingStock = allInventory.filter(
      (i) =>
        i.siteId !== item.siteId &&
        i.item.toLowerCase() === item.item.toLowerCase() &&
        i.quantity > (i.reorderThreshold || 0)
    )
    const transferSource = siblingStock[0]
    const transferSite = transferSource
      ? sites.find((s) => s.id === transferSource.siteId)?.name || transferSource.siteId
      : 'Riverside Tower'

    const daysLeft = item.consumptionPerDay
      ? Math.round((item.quantity / item.consumptionPerDay) * 10) / 10
      : 3.2

    const recQty = 150
    const recMessage = transferSource
      ? `Transfer ${recQty} ${item.unit || 'bags'} of ${item.item} from ${transferSite}`
      : `Expedite emergency PO for ${item.item}`

    const alertId = `ALT-${Date.now().toString().slice(-4)}`
    const alert = {
      id: alertId,
      siteId: item.siteId,
      severity: 'critical',
      title: `${item.item} stock at ${currentSite.name} is projected to reach stockout in ${daysLeft} days.`,
      timestamp: new Date().toISOString(),
      explanation: `Current stock level is ${item.quantity} ${item.unit || ''} against daily consumption of ${item.consumptionPerDay || 55} ${item.unit || ''}/day. Critical safety threshold is ${item.reorderThreshold || 250} ${item.unit || ''}.`,
      reasonPoints: [
        `Current stock has dropped to ${item.quantity} ${item.unit || ''}.`,
        `Daily consumption rate is ${item.consumptionPerDay || 55} ${item.unit || ''}/day.`,
        `Estimated runway is ${daysLeft} days before critical stockout occurs.`,
      ],
      recommendation: recMessage,
      sources: [
        { type: 'inventory', id: item.id, label: `Inventory Record ${item.id}` },
      ],
      status: 'pending',
      transferDetails: transferSource
        ? {
          sourceSiteId: transferSource.siteId,
          sourceSiteName: transferSite,
          targetSiteId: item.siteId,
          targetSiteName: currentSite.name,
          item: item.item,
          quantity: recQty,
          unit: item.unit || 'bags',
        }
        : null,
    }

    await insertAlertDirect(alert)
    console.log(`[DYNAMIC ALERT] Created dynamic shortage alert for ${item.item} at ${item.siteId} (ID: ${alertId})`)
  } catch (err) {
    console.warn('[DYNAMIC ALERT] Warning creating shortage alert:', err.message)
  }
}

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
  }
  return res.json(inventory)
})

// GET /api/inventory/:id - Single inventory item
router.get('/:id', async (req, res) => {
  const { id } = req.params
  const pool = getPool()

  if (pool) {
    try {
      // 1. Try single item by id
      const itemRes = await pool.query('SELECT * FROM inventory WHERE id = $1', [idOrSiteId])
      if (itemRes.rows && itemRes.rows.length > 0) {
        return res.json(formatInventoryRow(itemRes.rows[0]))
      }

      // 2. Try site items by site_id
      const siteRes = await pool.query('SELECT * FROM inventory WHERE site_id = $1 ORDER BY id ASC', [idOrSiteId])
      if (siteRes.rows && siteRes.rows.length > 0) {
        return res.json(siteRes.rows.map(formatInventoryRow))
      }
    } catch (err) {
      console.warn(`PostgreSQL lookup failed for '${idOrSiteId}', using local collection:`, err.message)
    }
  }

  const item = findById('inventory', id)
  if (!item) {
    return res.status(404).json({ error: 'Inventory item not found' })
  }
  return res.json(item)
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

    const list = getCollection('inventory') || []
    list.push(newItem)
    setCollection('inventory', list)

    console.log(`✓ Created inventory item ${createdRecord.id} ("${createdRecord.item}") for site ${siteId}`)
    return res.status(201).json(createdRecord)
  } catch (err) {
    console.error('Error creating inventory item:', err)
    return res.status(500).json({ error: 'Failed to create inventory item: ' + err.message })
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

  let updatedItem = updatedPayload

  if (pool) {
    try {
      const updateRes = await pool.query(
        `UPDATE inventory
         SET quantity = $1, status = $2, last_updated = $3, last_transaction = $4, data = $5
         WHERE id = $6
         RETURNING *`,
        [
          newQuantity,
          status,
          lastUpdated,
          JSON.stringify(lastTransaction),
          JSON.stringify(updatedPayload),
          id,
        ]
      )
      if (updateRes.rows && updateRes.rows.length > 0) {
        updatedItem = formatInventoryRow(updateRes.rows[0])
      }
    } catch (err) {
      console.error('❌ PostgreSQL UPDATE failed for inventory transaction:', err.message)
      return res.status(500).json({ error: `Database update failed: ${err.message}` })
    }
  }

  updateById('inventory', id, updatedItem)

  // Dynamically trigger AI shortage alert if critical
  triggerShortageAlertIfNeeded(updatedPayload).catch((e) =>
    console.warn('[INVENTORY] Shortage trigger warning:', e.message)
  )

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
        const patchRes = await pool.query(
          `UPDATE inventory 
           SET item = $1, unit = $2, quantity = $3, reorder_threshold = $4, consumption_per_day = $5, status = $6, last_updated = $7, data = $8
           WHERE id = $9
           RETURNING *`,
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
        if (patchRes.rows && patchRes.rows.length > 0) {
          const confirmed = formatInventoryRow(patchRes.rows[0])
          updateById('inventory', id, confirmed)
          return res.json(confirmed)
        }
      } catch (err) {
        console.error(`❌ PostgreSQL PATCH error for item ${id}:`, err.message)
        return res.status(500).json({ error: `Database patch failed: ${err.message}` })
      }
    }

    updateById('inventory', id, merged)

    // Dynamically trigger AI shortage alert if critical
    triggerShortageAlertIfNeeded(merged).catch((e) =>
      console.warn('[INVENTORY] Shortage trigger warning:', e.message)
    )

    res.json(merged)
  } catch (err) {
    console.error('Error updating inventory item:', err)
    return res.status(500).json({ error: 'Failed to update inventory item: ' + err.message })
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
        console.error(`❌ PostgreSQL DELETE error for item ${id}:`, err.message)
        return res.status(500).json({ error: `Database delete failed: ${err.message}` })
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

    return res.json({ message: 'Inventory item deleted successfully', id })
  } catch (err) {
    console.error('Error deleting inventory item:', err)
    return res.status(500).json({ error: 'Failed to delete inventory item: ' + err.message })
  }
})

export default router
