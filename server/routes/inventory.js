import { Router } from 'express'
import { getCollection, findById, updateById, setCollection, getPool, getCollectionDirect, insertAlertDirect, insertSubtaskDirect } from '../db.js'

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
    const activeAlert = existingAlerts.find((a) => {
      if (a.siteId !== item.siteId) return false
      if (a.inventoryItemId === item.id) return true
      if (a.sources?.some((s) => s.id === item.id)) return true
      const itemLower = item.item.toLowerCase()
      return (
        (a.title || '').toLowerCase().includes(itemLower) ||
        (a.explanation || '').toLowerCase().includes(itemLower) ||
        (a.transferDetails && a.transferDetails.item?.toLowerCase() === itemLower)
      )
    })

    if (activeAlert) return // Alert already exists for this item

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
  res.json(inventory)
})

// GET /api/inventory/forecast/all - Forecast for all items
router.get('/forecast/all', async (req, res) => {
  try {
    const siteId = req.query.siteId || req.query.site_id
    let items = await getCollectionDirect('inventory')
    if (siteId) {
      items = items.filter((i) => (i.siteId || i.site_id) === siteId)
    }

    const forecasts = items.map((item) => {
      const consumptionRate = Number(item.consumptionPerDay || item.consumption_per_day) || 15
      const currentStock = Number(item.quantity || 0)
      const threshold = Number(item.reorderThreshold || item.reorder_threshold) || 50
      const daysUntilStockout = consumptionRate > 0 ? Math.round((currentStock / consumptionRate) * 10) / 10 : 99
      const reorderQty = Math.max(threshold * 2, Math.round(consumptionRate * 14))

      return {
        id: item.id,
        item: item.item,
        siteId: item.siteId || item.site_id,
        unit: item.unit || 'units',
        currentStock,
        consumptionRate,
        daysUntilStockout,
        predictedStockoutDate: new Date(Date.now() + daysUntilStockout * 86400000).toISOString().slice(0, 10),
        recommendedReorderQty: reorderQty,
        status: daysUntilStockout <= 4 ? 'CRITICAL' : daysUntilStockout <= 7 ? 'WARNING' : 'HEALTHY',
      }
    })

    res.json(forecasts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/inventory/:id/forecast - Material predictive consumption forecast
router.get('/:id/forecast', async (req, res) => {
  try {
    const items = await getCollectionDirect('inventory')
    const item = items.find((i) => i.id === req.params.id)
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    const consumptionRate = Number(item.consumptionPerDay || item.consumption_per_day) || 15
    const currentStock = Number(item.quantity || 0)
    const threshold = Number(item.reorderThreshold || item.reorder_threshold) || 50
    const daysUntilStockout = consumptionRate > 0 ? Math.round((currentStock / consumptionRate) * 10) / 10 : 99
    const predictedStockoutDate = new Date(Date.now() + daysUntilStockout * 86400000).toISOString().slice(0, 10)
    const recommendedReorderQty = Math.max(threshold * 2, Math.round(consumptionRate * 14))

    // If critical runway, record an agent subtask
    if (daysUntilStockout <= 4) {
      const subtaskId = `TSK-FC-${Date.now().toString().slice(-4)}`
      const subtask = {
        id: subtaskId,
        site_id: item.siteId,
        siteId: item.siteId,
        type: 'predicted_stockout',
        status: 'resolved',
        reasoning_summary: `Predictive model calculated ${daysUntilStockout} days until stockout for ${item.item} (${item.id}) at current burn rate of ${consumptionRate} ${item.unit}/day. Recommended reorder qty: ${recommendedReorderQty} ${item.unit}.`,
        related_record_type: 'inventory',
        related_record_id: item.id,
        relatedRecordType: 'inventory',
        relatedRecordId: item.id,
        parent_alert_id: null,
        created_at: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
      }
      insertSubtaskDirect(subtask).catch(() => {})
    }

    res.json({
      id: item.id,
      item: item.item,
      siteId: item.siteId,
      unit: item.unit || 'units',
      currentStock,
      consumptionRate,
      daysUntilStockout,
      predictedStockoutDate,
      recommendedReorderQty,
      vendorLeadTimeDays: 4,
      status: daysUntilStockout <= 4 ? 'CRITICAL' : daysUntilStockout <= 7 ? 'WARNING' : 'HEALTHY',
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/inventory/:id - Single inventory item by ID or Site ID
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
  if (item) {
    return res.json(item)
  }

  const inventory = getCollection('inventory') || []
  const siteItems = inventory.filter((i) => i.siteId === id)
  if (siteItems.length > 0) {
    return res.json(siteItems)
  }

  return res.status(404).json({ error: `Inventory item or site '${id}' not found` })
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
  try {
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
  } catch (err) {
    console.error(`Error in POST /api/inventory/${req.params.id}/transaction:`, err)
    res.status(500).json({ error: 'Failed to process transaction' })
  }
})

// PATCH /api/inventory/:id - Direct field edits
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

    // Dynamically trigger AI shortage alert if critical
    triggerShortageAlertIfNeeded(merged).catch((e) =>
      console.warn('[INVENTORY] Shortage trigger warning:', e.message)
    )

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
  }
})

export default router
