import { Router } from 'express'
import { getCollectionDirect } from '../db.js'

const router = Router()

// GET /api/deliveries - List deliveries (optional filter by ?siteId=...)
router.get('/', async (req, res) => {
  try {
    const { siteId } = req.query
    const deliveries = await getCollectionDirect('deliveries')
    if (siteId) {
      return res.json(deliveries.filter((d) => d.siteId === siteId))
    }
    return res.json(deliveries)
  } catch (err) {
    console.error('Error in GET /api/deliveries:', err)
    return res.status(500).json({ error: 'Failed to retrieve deliveries' })
  }
})

// GET /api/deliveries/:idOrSiteId - Single delivery OR list of deliveries for a siteId
router.get('/:idOrSiteId', async (req, res) => {
  try {
    const { idOrSiteId } = req.params
    const deliveries = await getCollectionDirect('deliveries')

    // 1. Match delivery ID (e.g. DEL-882)
    const item = deliveries.find((d) => d.id === idOrSiteId)
    if (item) {
      return res.json(item)
    }

    // 2. Match site ID (e.g. SITE-002)
    const siteDeliveries = deliveries.filter((d) => d.siteId === idOrSiteId)
    if (siteDeliveries.length > 0) {
      return res.json(siteDeliveries)
    }

    return res.status(404).json({ error: `Delivery or site '${idOrSiteId}' not found` })
  } catch (err) {
    console.error(`Error in GET /api/deliveries/${req.params.idOrSiteId}:`, err)
    return res.status(500).json({ error: 'Failed to retrieve deliveries' })
  }
})

export default router
