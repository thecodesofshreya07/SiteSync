import { Router } from 'express'
import { getCollection, findById, updateById } from '../db.js'

const router = Router()

// GET /api/equipment - List equipment (optional filter by ?siteId=...)
router.get('/', (req, res) => {
  const { siteId } = req.query
  const equipment = getCollection('equipment')
  if (siteId) {
    return res.json(equipment.filter((e) => e.siteId === siteId))
  }
  return res.json(equipment)
})

// GET /api/equipment/:idOrSiteId - Single equipment OR list of equipment for a siteId
router.get('/:idOrSiteId', (req, res) => {
  const { idOrSiteId } = req.params
  const equipment = getCollection('equipment')

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
})

// PATCH /api/equipment/:id - Update equipment
router.patch('/:id', (req, res) => {
  const updated = updateById('equipment', req.params.id, req.body)
  if (!updated) {
    return res.status(404).json({ error: 'Equipment not found' })
  }
  return res.json(updated)
})

export default router
