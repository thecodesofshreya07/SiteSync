import { Router } from 'express'
import { getCollectionDirect, updateByIdDirect } from '../db.js'

const router = Router()

// GET /api/procurement - List procurement orders (optional ?siteId=...)
router.get('/', async (req, res) => {
  try {
    const { siteId } = req.query
    const orders = await getCollectionDirect('procurementOrders')
    if (siteId) {
      return res.json(orders.filter((o) => o.siteId === siteId))
    }
    return res.json(orders)
  } catch (err) {
    console.error('Error in GET /api/procurement:', err)
    return res.status(500).json({ error: 'Failed to retrieve procurement orders' })
  }
})

// GET /api/procurement/:idOrSiteId - Single order OR list of orders for a siteId
router.get('/:idOrSiteId', async (req, res) => {
  try {
    const { idOrSiteId } = req.params
    const orders = await getCollectionDirect('procurementOrders')

    // 1. Check if ID matches a purchase order (e.g. PO-2041)
    const order = orders.find((o) => o.id === idOrSiteId)
    if (order) {
      return res.json(order)
    }

    // 2. Check if ID matches a site ID (e.g. SITE-002)
    const siteOrders = orders.filter((o) => o.siteId === idOrSiteId)
    if (siteOrders.length > 0) {
      return res.json(siteOrders)
    }

    return res.status(404).json({ error: `Purchase order or site '${idOrSiteId}' not found` })
  } catch (err) {
    console.error(`Error in GET /api/procurement/${req.params.idOrSiteId}:`, err)
    return res.status(500).json({ error: 'Failed to retrieve procurement orders' })
  }
})

// PATCH /api/procurement/:id - Advance procurement stage or update status
router.patch('/:id', async (req, res) => {
  try {
    const updated = await updateByIdDirect('procurementOrders', req.params.id, req.body)
    if (!updated) {
      return res.status(404).json({ error: 'Procurement order not found' })
    }
    return res.json(updated)
  } catch (err) {
    console.error(`Error in PATCH /api/procurement/${req.params.id}:`, err)
    return res.status(500).json({ error: 'Failed to update procurement order' })
  }
})

export default router
