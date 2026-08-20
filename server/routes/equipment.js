import { Router } from 'express'
import { getCollectionDirect, updateByIdDirect } from '../db.js'

const router = Router()

// GET /api/equipment - List equipment (optional filter by ?siteId=...)
router.get('/', async (req, res) => {
  try {
    const { siteId } = req.query
    const equipment = await getCollectionDirect('equipment')
    if (siteId) {
      return res.json(equipment.filter((e) => e.siteId === siteId))
    }
    return res.json(equipment)
  } catch (err) {
    console.error('Error in GET /api/equipment:', err)
    return res.status(500).json({ error: 'Failed to retrieve equipment' })
  }
})

// GET /api/equipment/:idOrSiteId - Single equipment OR list of equipment for a siteId
router.get('/:idOrSiteId', async (req, res) => {
  try {
    const { idOrSiteId } = req.params
    const equipment = await getCollectionDirect('equipment')

    // 1. Check if ID matches an equipment (e.g. EQ-018)
    const item = equipment.find((e) => e.id === idOrSiteId)
    if (item) {
      return res.json(item)
    }

    // 2. Check if ID matches a site (e.g. SITE-001)
    const siteEquipment = equipment.filter((e) => e.siteId === idOrSiteId)
    if (siteEquipment.length > 0) {
      return res.json(siteEquipment)
    }

    return res.status(404).json({ error: `Equipment or site '${idOrSiteId}' not found` })
  } catch (err) {
    console.error(`Error in GET /api/equipment/${req.params.idOrSiteId}:`, err)
    return res.status(500).json({ error: 'Failed to retrieve equipment' })
  }
})

// PATCH /api/equipment/:id - Update equipment
router.patch('/:id', async (req, res) => {
  try {
    const updated = await updateByIdDirect('equipment', req.params.id, req.body)
    if (!updated) {
      return res.status(404).json({ error: 'Equipment not found' })
    }
    return res.json(updated)
  } catch (err) {
    console.error(`Error in PATCH /api/equipment/${req.params.id}:`, err)
    return res.status(500).json({ error: 'Failed to update equipment' })
  }
})

export default router
