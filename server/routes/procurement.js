import { Router } from 'express'
import { getCollection, findById, updateById } from '../db.js'

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

// GET /api/procurement - List procurement orders (optional ?siteId=...)
router.get('/', (req, res) => {
  try {
    const { siteId } = req.query
    const orders = getCollection('procurementOrders')
    if (siteId) {
      const filtered = orders.filter((o) => o.siteId === siteId)
      return res.json(filtered)
    }
    return res.json(orders)
  } catch (err) {
    console.error('Error fetching procurement orders:', err)
    return res.status(500).json({ error: 'Failed to retrieve procurement orders' })
  }
})

// GET /api/procurement/:idOrSiteId - Single PO by ID OR list of POs for a siteId
router.get('/:idOrSiteId', (req, res) => {
  try {
    const { idOrSiteId } = req.params
    const orders = getCollection('procurementOrders')

    // 1. Check if ID matches a PO (e.g. PO-2041)
    const order = orders.find((o) => o.id === idOrSiteId)
    if (order) {
      return res.json(order)
    }

    // 2. Check if ID matches a site (e.g. SITE-002)
    const siteOrders = orders.filter((o) => o.siteId === idOrSiteId)
    if (siteOrders.length > 0) {
      return res.json(siteOrders)
    }

    return res.status(404).json({ error: `Procurement order or site '${idOrSiteId}' not found` })
  } catch (err) {
    console.error(`Error fetching procurement order ${req.params.idOrSiteId}:`, err)
    return res.status(500).json({ error: 'Failed to retrieve procurement order' })
  }
})

// PATCH /api/procurement/:id - Update procurement order
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params
    const existing = findById('procurementOrders', id)
    if (!existing) {
      return res.status(404).json({ error: 'Procurement order not found' })
    }

    const payload = req.body
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return res.status(400).json({ error: 'Invalid update payload' })
    }

    // Validate stage if provided
    if (payload.stage !== undefined && !VALID_STAGES.includes(payload.stage)) {
      return res.status(400).json({
        error: `Invalid stage '${payload.stage}'. Must be one of: ${VALID_STAGES.join(', ')}`,
      })
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

    const updated = updateById('procurementOrders', id, updateFields)
    if (!updated) {
      return res.status(500).json({ error: 'Failed to update procurement order' })
    }

    return res.json(updated)
  } catch (err) {
    console.error(`Error updating procurement order ${req.params.id}:`, err)
    return res.status(500).json({ error: 'Failed to update procurement order' })
  }
})

export default router
