import { Router } from 'express'
import { getCollection, findById, updateById } from '../db.js'

const router = Router()

// GET /api/equipment - List equipment (optional filter by siteId)
router.get('/', (req, res) => {
  const { siteId } = req.query
  const equipment = getCollection('equipment')
  if (siteId) {
    return res.json(equipment.filter((e) => e.siteId === siteId))
  }
  res.json(equipment)
})

// GET /api/equipment/:id - Single equipment
router.get('/:id', (req, res) => {
  const item = findById('equipment', req.params.id)
  if (!item) {
    return res.status(404).json({ error: 'Equipment not found' })
  }
  res.json(item)
})

// PATCH /api/equipment/:id - Update equipment
router.patch('/:id', (req, res) => {
  const updated = updateById('equipment', req.params.id, req.body)
  if (!updated) {
    return res.status(404).json({ error: 'Equipment not found' })
  }
  res.json(updated)
})

export default router
