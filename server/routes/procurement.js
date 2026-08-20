import { Router } from 'express'
<<<<<<< HEAD
import { getCollection, findById, updateById, setCollection, getPool } from '../db.js'
=======
import { getCollection, findById, updateById, setCollection, getPool, getCollectionDirect, updateByIdDirect } from '../db.js'
>>>>>>> c93e7056994b12a97d317b7b571b8d42a2ca0eb5

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
  'item',
  'siteId',
]

function formatOrderRow(row) {
  if (!row) return null
  const baseData = row.data && typeof row.data === 'object' ? row.data : {}
  return {
    ...baseData,
    id: row.id || baseData.id,
    siteId: row.site_id || baseData.siteId,
    item: row.item || baseData.item,
    vendorId: row.vendor_id || baseData.vendorId,
    quantity: Number(row.quantity ?? baseData.quantity ?? 0),
    unit: row.unit || baseData.unit,
    amount: Number(row.amount ?? baseData.amount ?? 0),
    dateRaised: row.date_raised || baseData.dateRaised,
    expectedDelivery: row.expected_delivery || baseData.expectedDelivery,
    stage: row.stage || baseData.stage,
    status: row.status || baseData.status,
    deliveryId: row.delivery_id || baseData.deliveryId || null,
    delayDays: Number(row.delay_days ?? baseData.delayDays ?? 0),
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
        if (result.rows && result.rows.length > 0) {
          return res.json(result.rows.map(formatOrderRow))
        }
      } catch (err) {
        console.warn('PostgreSQL procurement query failed, using local collection:', err.message)
      }
    }

<<<<<<< HEAD
    let orders = getCollection('procurementOrders') || []
    if (!orders || !orders.length) {
      orders = getCollection('procurement') || []
    }
    if (siteId) {
      const filtered = orders.filter((o) => String(o.siteId).trim().toLowerCase() === String(siteId).trim().toLowerCase())
      return res.json(filtered)
=======
    const orders = await getCollectionDirect('procurementOrders')
    if (siteId) {
      return res.json(orders.filter((o) => o.siteId === siteId))
>>>>>>> c93e7056994b12a97d317b7b571b8d42a2ca0eb5
    }
    return res.json(orders)
  } catch (err) {
    console.error('Error in GET /api/procurement:', err)
    return res.status(500).json({ error: 'Failed to retrieve procurement orders' })
  }
})

<<<<<<< HEAD
// GET /api/procurement/:id - Single procurement order or list by Site ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
=======
// GET /api/procurement/:idOrSiteId - Single order OR list of orders for a siteId
router.get('/:idOrSiteId', async (req, res) => {
  try {
    const { idOrSiteId } = req.params
>>>>>>> c93e7056994b12a97d317b7b571b8d42a2ca0eb5
    const pool = getPool()

    if (pool) {
      try {
<<<<<<< HEAD
        const result = await pool.query('SELECT * FROM procurement_orders WHERE id = $1', [id])
        if (result.rows.length > 0) {
          return res.json(formatOrderRow(result.rows[0]))
        }
      } catch (err) {
        console.warn(`PostgreSQL procurement lookup failed for ${id}:`, err.message)
      }
    }

    const order = findById('procurementOrders', id) || findById('procurement', id)
=======
        const result = await pool.query(
          'SELECT * FROM procurement_orders WHERE id = $1 OR site_id = $1 ORDER BY id ASC',
          [idOrSiteId]
        )
        if (result.rows.length === 1 && result.rows[0].id === idOrSiteId) {
          return res.json(formatOrderRow(result.rows[0]))
        } else if (result.rows.length > 0) {
          return res.json(result.rows.map(formatOrderRow))
        }
      } catch (err) {
        console.warn(`PostgreSQL procurement lookup failed for ${idOrSiteId}:`, err.message)
      }
    }

    const orders = await getCollectionDirect('procurementOrders')

    // 1. Check if ID matches a purchase order (e.g. PO-2041)
    const order = orders.find((o) => o.id === idOrSiteId)
>>>>>>> c93e7056994b12a97d317b7b571b8d42a2ca0eb5
    if (order) {
      return res.json(order)
    }

    const orders = getCollection('procurementOrders') || getCollection('procurement') || []
    const siteOrders = orders.filter((o) => o.siteId === id)
    if (siteOrders.length > 0) {
      return res.json(siteOrders)
    }

    return res.status(404).json({ error: `Purchase order or site '${id}' not found` })
  } catch (err) {
    console.error(`Error in GET /api/procurement/${req.params.id}:`, err)
    return res.status(500).json({ error: 'Failed to retrieve procurement orders' })
  }
})

// POST /api/procurement - Create a new procurement order
router.post('/', async (req, res) => {
  try {
    const {
      siteId,
      vendorId,
      item,
      quantity = 1,
      unit = 'units',
      amount = 0,
      expectedDelivery,
      stage = 'Material Request',
      status = 'Draft',
    } = req.body

    if (!siteId || !item) {
      return res.status(400).json({ error: 'siteId and item are required fields' })
    }

    if (stage && !VALID_STAGES.includes(stage)) {
      return res.status(400).json({
        error: `Invalid stage '${stage}'. Must be one of: ${VALID_STAGES.join(', ')}`,
      })
    }

    const now = new Date()
    const id = `PO-${Math.floor(2050 + Math.random() * 500)}`
    const dateRaised = now.toISOString().slice(0, 10)
    const targetDelivery = expectedDelivery || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

    const newOrder = {
      id,
      siteId,
      item,
      vendorId: vendorId || 'VEN-001',
      quantity: Number(quantity) || 1,
      unit,
      amount: Number(amount) || 0,
      dateRaised,
      expectedDelivery: targetDelivery,
      stage,
      status,
      deliveryId: null,
      delayDays: 0,
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

// PATCH /api/procurement/:id - Advance procurement stage or update fields
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const payload = req.body

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return res.status(400).json({ error: 'Invalid update payload' })
    }

    if (payload.stage !== undefined && !VALID_STAGES.includes(payload.stage)) {
      return res.status(400).json({
        error: `Invalid stage '${payload.stage}'. Must be one of: ${VALID_STAGES.join(', ')}`,
      })
    }

    const updateFields = {}
    for (const key of Object.keys(payload)) {
      if (ALLOWED_UPDATE_FIELDS.includes(key)) {
        updateFields[key] = payload[key]
      }
    }

    const pool = getPool()
    let updated = null

    if (pool) {
      try {
        const existingRes = await pool.query('SELECT * FROM procurement_orders WHERE id = $1', [id])
        if (existingRes.rows.length > 0) {
          const current = formatOrderRow(existingRes.rows[0])
          const merged = { ...current, ...updateFields }
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
          updated = merged
        }
      } catch (err) {
        console.warn(`PostgreSQL update failed for procurement order ${id}:`, err.message)
      }
    }

    const localUpdated = await updateByIdDirect('procurementOrders', id, updateFields)
    const finalResult = updated || localUpdated

    if (!finalResult) {
      return res.status(404).json({ error: 'Procurement order not found' })
    }

    res.json(finalResult)
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
