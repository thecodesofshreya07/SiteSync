import { Router } from 'express'
import { getCollection, findById, getPool } from '../db.js'

const router = Router()

// GET /api/deliveries - List all deliveries (optionally filter by ?siteId=...)
router.get('/', (req, res) => {
  try {
    const { siteId } = req.query
    const deliveries = getCollection('deliveries')
    const procurementOrders = getCollection('procurementOrders')

    if (siteId) {
      // Find PO IDs for this site
      const sitePoIds = new Set(
        procurementOrders.filter((po) => po.siteId === siteId).map((po) => po.id)
      )
      const filtered = deliveries.filter((d) => sitePoIds.has(d.poId))
      return res.json(filtered)
    }

    return res.json(deliveries)
  } catch (err) {
    console.error('Error fetching deliveries:', err)
    return res.status(500).json({ error: 'Failed to retrieve deliveries' })
  }
})

// GET /api/deliveries/:idOrSiteId - Single delivery by ID OR deliveries for a siteId
router.get('/:idOrSiteId', (req, res) => {
  try {
    const { idOrSiteId } = req.params
    const deliveries = getCollection('deliveries')

    // 1. Check if ID matches a delivery (e.g. DEL-882)
    const delivery = deliveries.find((d) => d.id === idOrSiteId)
    if (delivery) {
      return res.json(delivery)
    }

    // 2. Check if ID matches a site (e.g. SITE-002)
    const procurementOrders = getCollection('procurementOrders')
    const sitePoIds = new Set(
      procurementOrders.filter((po) => po.siteId === idOrSiteId).map((po) => po.id)
    )
    const siteDeliveries = deliveries.filter((d) => sitePoIds.has(d.poId))
    if (siteDeliveries.length > 0) {
      return res.json(siteDeliveries)
    }

    return res.status(404).json({ error: `Delivery or site '${idOrSiteId}' not found` })
  } catch (err) {
    console.error(`Error fetching delivery ${req.params.idOrSiteId}:`, err)
    return res.status(500).json({ error: 'Failed to retrieve delivery' })
  }
})

export default router
