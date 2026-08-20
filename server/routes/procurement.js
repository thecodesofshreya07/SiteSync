import { Router } from 'express'
import { getCollection, findById, updateById, setCollection, getPool } from '../db.js'

const router = Router()

export const VALID_STAGES = [
  'Material Request',
  'Vendor Quote',
  'Approval',
  'Purchase Order',
  'Delivery',
  'Expense',
]

const ALLOWED_UPDATE_FIELDS = [
  'stage',
  'status',
  'quantity',
  'unit',
  'amount',
  'dateRaised',
  'expectedDelivery',
  'deliveryId',
  'delayDays',
  'vendorId',
  'vendorName',
  'item',
  'siteId',
  'history',
]

function calculateBackendAmount(item, quantity, unit) {
  const qty = Number(quantity) || 1
  if (!item) return qty * 500
  const norm = String(item).toLowerCase()
  if (norm.includes('sand')) return qty * 2400
  if (norm.includes('cement')) return qty * 380
  if (norm.includes('aggregate')) return qty * 2100
  if (norm.includes('steel')) return qty * 65000
  if (norm.includes('brick')) return Math.round(qty * 8.4)
  if (norm.includes('pvc')) return qty * 420
  if (norm.includes('cable')) return qty * 290
  const cleanUnit = String(unit || '').toLowerCase()
  if (cleanUnit === 'bags') return qty * 390
  if (cleanUnit === 'cu.m') return qty * 2300
  if (cleanUnit === 'tonnes') return qty * 68000
  return Math.round(qty * 500)
}

function formatOrderRow(row) {
  if (!row) return null
  const baseData = row.data && typeof row.data === 'object' ? row.data : {}
  const rawItem = row.item || baseData.item
  const rawQty = Number(row.quantity ?? baseData.quantity ?? 1)
  const rawUnit = row.unit || baseData.unit || 'units'
  const rawAmount = Number(row.amount ?? baseData.amount ?? 0)
  const finalAmount = rawAmount > 0 && rawAmount !== 250000 ? rawAmount : calculateBackendAmount(rawItem, rawQty, rawUnit)

  const vendorMap = {
    'VEN-017': 'BuildPro Materials',
    'VEN-022': 'Metro Steel Ltd',
    'VEN-009': 'Konkan Aggregates Co.',
    'VEN-031': 'Shakti Electricals',
    'VEN-014': 'Vishal Brick Works',
  }
  const resolvedVendorName =
    baseData.vendorName ||
    baseData.vendor ||
    row.vendor_name ||
    row.vendor ||
    vendorMap[row.vendor_id || baseData.vendorId] ||
    'BuildPro Materials'

  return {
    ...baseData,
    id: row.id || baseData.id,
    siteId: row.site_id || baseData.siteId,
    item: rawItem,
    vendorId: row.vendor_id || baseData.vendorId || 'VEN-017',
    vendor: resolvedVendorName,
    vendorName: resolvedVendorName,
    quantity: rawQty,
    unit: rawUnit,
    amount: finalAmount,
    dateRaised: row.date_raised || baseData.dateRaised,
    expectedDelivery: row.expected_delivery || baseData.expectedDelivery,
    stage: row.stage || baseData.stage,
    status: row.status || baseData.status,
    deliveryId: row.delivery_id || baseData.deliveryId || null,
    delayDays: Number(row.delay_days ?? baseData.delayDays ?? 0),
    history: Array.isArray(baseData.history) ? baseData.history : [],
  }
}

async function autoUpdateSiteInventory(order) {
  if (!order || !order.siteId || !order.item) return
  const qtyToAdd = Number(order.quantity) || 0
  if (qtyToAdd <= 0) return

  const pool = getPool()
  const inventoryList = getCollection('inventory') || []
  let existingItem = inventoryList.find(
    (inv) => inv.siteId === order.siteId && String(inv.item).trim().toLowerCase() === String(order.item).trim().toLowerCase()
  )

  if (existingItem) {
    const updatedQty = Math.round((Number(existingItem.quantity) + qtyToAdd) * 100) / 100
    const threshold = Number(existingItem.reorderThreshold) || 0
    let status = 'OK'
    if (updatedQty <= threshold * 0.5) {
      status = 'CRITICAL'
    } else if (updatedQty <= threshold) {
      status = 'LOW'
    } else {
      status = 'OK'
    }

    const lastTransaction = {
      type: 'Stock In',
      quantity: qtyToAdd,
      date: new Date().toISOString().slice(0, 10),
      note: `Procurement delivery added to inventory (PO: ${order.id})`,
    }

    const updatedItem = {
      ...existingItem,
      quantity: updatedQty,
      status,
      lastUpdated: new Date().toISOString(),
      lastTransaction,
    }

    updateById('inventory', existingItem.id, updatedItem)

    if (pool) {
      try {
        await pool.query(
          `UPDATE inventory SET quantity = $1, status = $2, last_updated = $3, last_transaction = $4, data = $5 WHERE id = $6`,
          [updatedQty, status, updatedItem.lastUpdated, JSON.stringify(lastTransaction), JSON.stringify(updatedItem), existingItem.id]
        )
      } catch (err) {
        console.warn('PostgreSQL inventory update error:', err.message)
      }
    }
  } else {
    // Material item does not exist yet in site inventory -> auto create
    const id = `INV-${Math.floor(100 + Math.random() * 900)}`
    const threshold = Math.round(qtyToAdd * 0.4)
    const lastTransaction = {
      type: 'Stock In',
      quantity: qtyToAdd,
      date: new Date().toISOString().slice(0, 10),
      note: `Procurement delivery added to inventory (PO: ${order.id})`,
    }

    const newItem = {
      id,
      siteId: order.siteId,
      item: order.item,
      unit: order.unit || 'units',
      quantity: qtyToAdd,
      reorderThreshold: threshold,
      consumptionPerDay: 10,
      status: 'OK',
      lastUpdated: new Date().toISOString(),
      lastTransaction,
    }

    inventoryList.push(newItem)
    setCollection('inventory', inventoryList)

    if (pool) {
      try {
        await pool.query(
          `INSERT INTO inventory (
            id, site_id, item, unit, quantity, reorder_threshold, consumption_per_day, status, last_updated, last_transaction, data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            id,
            order.siteId,
            order.item,
            order.unit || 'units',
            qtyToAdd,
            threshold,
            10,
            'OK',
            newItem.lastUpdated,
            JSON.stringify(lastTransaction),
            JSON.stringify(newItem),
          ]
        )
      } catch (err) {
        console.warn('PostgreSQL insert inventory item warning:', err.message)
      }
    }
  }
}

// GET /api/procurement - List procurement orders (optional ?siteId=...)
router.get('/', async (req, res) => {
  try {
    const siteId = req.query.siteId || req.query.site_id
    const pool = getPool()

    if (pool) {
      try {
        let query = 'SELECT * FROM procurement_orders'
        const params = []
        if (siteId) {
          query += ' WHERE site_id ILIKE $1'
          params.push(String(siteId).trim())
        }
        query += ' ORDER BY id ASC'
        const result = await pool.query(query, params)
        if (result.rows) {
          return res.json(result.rows.map(formatOrderRow))
        }
      } catch (err) {
        console.warn('PostgreSQL procurement query failed, using local collection:', err.message)
      }
    }

    let orders = getCollection('procurementOrders') || []
    if (!orders || !orders.length) {
      orders = getCollection('procurement') || []
    }
    if (siteId) {
      const filtered = orders.filter((o) => String(o.siteId).trim().toLowerCase() === String(siteId).trim().toLowerCase())
      return res.json(filtered.map((o) => {
        const amt = Number(o.amount) > 0 && Number(o.amount) !== 250000 ? Number(o.amount) : calculateBackendAmount(o.item, o.quantity, o.unit)
        return { ...o, amount: amt }
      }))
    }
    return res.json(orders.map((o) => {
      const amt = Number(o.amount) > 0 && Number(o.amount) !== 250000 ? Number(o.amount) : calculateBackendAmount(o.item, o.quantity, o.unit)
      return { ...o, amount: amt }
    }))
  } catch (err) {
    console.error('Error in GET /api/procurement:', err)
    return res.status(500).json({ error: 'Failed to retrieve procurement orders' })
  }
})

// GET /api/procurement/:id - Single procurement order or list by Site ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const pool = getPool()

    if (pool) {
      try {
        const result = await pool.query('SELECT * FROM procurement_orders WHERE id = $1', [id])
        if (result.rows.length > 0) {
          return res.json(formatOrderRow(result.rows[0]))
        }
      } catch (err) {
        console.warn(`PostgreSQL procurement lookup failed for ${id}:`, err.message)
      }
    }

    const order = findById('procurementOrders', id) || findById('procurement', id)
    if (order) {
      const amt = Number(order.amount) > 0 && Number(order.amount) !== 250000 ? Number(order.amount) : calculateBackendAmount(order.item, order.quantity, order.unit)
      return res.json({ ...order, amount: amt })
    }

    const orders = getCollection('procurementOrders') || getCollection('procurement') || []
    const siteOrders = orders.filter((o) => o.siteId === id)
    if (siteOrders.length > 0) {
      return res.json(siteOrders.map((o) => {
        const amt = Number(o.amount) > 0 && Number(o.amount) !== 250000 ? Number(o.amount) : calculateBackendAmount(o.item, o.quantity, o.unit)
        return { ...o, amount: amt }
      }))
    }

    return res.status(404).json({ error: `Purchase order or site '${id}' not found` })
  } catch (err) {
    console.error(`Error in GET /api/procurement/${req.params.id}:`, err)
    return res.status(500).json({ error: 'Failed to retrieve procurement orders' })
  }
})

// POST /api/procurement - Create a new procurement order / Material Request
router.post('/', async (req, res) => {
  try {
    const {
      siteId,
      vendorId = 'VEN-001',
      vendorName = '—',
      item,
      quantity = 1,
      unit = 'units',
      amount = 0,
      expectedDelivery,
      stage = 'Material Request',
      status = 'Pending PM Validation',
    } = req.body

    if (!siteId || !item) {
      return res.status(400).json({ error: 'siteId and item are required fields' })
    }

    const now = new Date()
    const id = `PO-${Math.floor(2050 + Math.random() * 500)}`
    const dateRaised = now.toISOString().slice(0, 10)
    const targetDelivery = expectedDelivery || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    const calculatedAmount = Number(amount) > 0 ? Number(amount) : calculateBackendAmount(item, quantity, unit)

    const initialHistory = [
      {
        action: 'Material Request Created',
        actor: req.user?.email || 'Contractor',
        role: req.user?.role || 'Contractor',
        timestamp: now.toISOString(),
        status,
      },
    ]

    const newOrder = {
      id,
      siteId,
      item,
      vendorId,
      vendorName,
      quantity: Number(quantity) || 1,
      unit,
      amount: calculatedAmount,
      dateRaised,
      expectedDelivery: targetDelivery,
      stage,
      status,
      deliveryId: null,
      delayDays: 0,
      history: initialHistory,
    }

    const pool = getPool()
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO procurement_orders (
            id, site_id, item, vendor_id, quantity, unit, amount, date_raised, expected_delivery, stage, status, delivery_id, delay_days, data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            id,
            siteId,
            item,
            newOrder.vendorId,
            newOrder.quantity,
            unit,
            newOrder.amount,
            dateRaised,
            targetDelivery,
            stage,
            status,
            null,
            0,
            JSON.stringify(newOrder),
          ]
        )
      } catch (err) {
        console.warn('PostgreSQL insert procurement order warning:', err.message)
      }
    }

    const list = getCollection('procurementOrders') || []
    list.push(newOrder)
    setCollection('procurementOrders', list)

    res.status(201).json(newOrder)
  } catch (err) {
    console.error('Error creating procurement order:', err)
    res.status(500).json({ error: 'Failed to create procurement order' })
  }
})

// PATCH /api/procurement/:id - Advance procurement stage or update status
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const payload = req.body

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return res.status(400).json({ error: 'Invalid update payload' })
    }

    // Filter to only allowed fields
    const updateFields = {}
    for (const key of Object.keys(payload)) {
      if (ALLOWED_UPDATE_FIELDS.includes(key)) {
        updateFields[key] = payload[key]
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' })
    }

    const pool = getPool()
    let currentOrder = null

    if (pool) {
      try {
        const existingRes = await pool.query('SELECT * FROM procurement_orders WHERE id = $1', [id])
        if (existingRes.rows.length > 0) {
          currentOrder = formatOrderRow(existingRes.rows[0])
        }
      } catch (err) {
        console.warn(`PostgreSQL lookup failed for PO ${id}:`, err.message)
      }
    }

    if (!currentOrder) {
      currentOrder = findById('procurementOrders', id) || findById('procurement', id)
    }

    if (!currentOrder) {
      return res.status(404).json({ error: 'Procurement order not found' })
    }

    const mergedHistory = Array.isArray(currentOrder.history) ? [...currentOrder.history] : []
    mergedHistory.push({
      action: `Status changed to ${payload.status || currentOrder.status}`,
      actor: req.user?.email || 'System User',
      role: req.user?.role || 'User',
      timestamp: new Date().toISOString(),
      previousStatus: currentOrder.status,
      newStatus: payload.status || currentOrder.status,
    })

    const merged = {
      ...currentOrder,
      ...updateFields,
      history: mergedHistory,
    }

    if (!merged.amount || merged.amount === 250000) {
      merged.amount = calculateBackendAmount(merged.item, merged.quantity, merged.unit)
    }

    if (pool) {
      try {
        await pool.query(
          `UPDATE procurement_orders
           SET stage = $1, status = $2, quantity = $3, unit = $4, amount = $5, delay_days = $6, data = $7
           WHERE id = $8`,
          [
            merged.stage,
            merged.status,
            merged.quantity,
            merged.unit,
            merged.amount,
            merged.delayDays || 0,
            JSON.stringify(merged),
            id,
          ]
        )
      } catch (err) {
        console.warn(`PostgreSQL update failed for PO ${id}:`, err.message)
      }
    }

    updateById('procurementOrders', id, merged)
    updateById('procurement', id, merged)

    // Auto-update site inventory if delivered
    if (merged.status === 'Delivered' || merged.status === 'Inventory Updated' || merged.stage === 'Delivery') {
      await autoUpdateSiteInventory(merged)
    }

    res.json(merged)
  } catch (err) {
    console.error(`Error in PATCH /api/procurement/${req.params.id}:`, err)
    return res.status(500).json({ error: 'Failed to update procurement order' })
  }
})

// DELETE /api/procurement/:id - Delete / Cancel a procurement order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const pool = getPool()
    let found = false

    if (pool) {
      try {
        const result = await pool.query('DELETE FROM procurement_orders WHERE id = $1 RETURNING id', [id])
        if (result.rows.length > 0) {
          found = true
        }
      } catch (err) {
        console.warn(`PostgreSQL DELETE error for PO ${id}:`, err.message)
      }
    }

    const list = getCollection('procurementOrders') || []
    const idx = list.findIndex((p) => p.id === id)
    if (idx !== -1) {
      found = true
      list.splice(idx, 1)
      setCollection('procurementOrders', list)
    }

    if (!found) {
      return res.status(404).json({ error: 'Procurement order not found' })
    }

    res.json({ message: 'Procurement order deleted successfully', id })
  } catch (err) {
    console.error('Error deleting procurement order:', err)
    res.status(500).json({ error: 'Failed to delete procurement order' })
  }
})

export default router
