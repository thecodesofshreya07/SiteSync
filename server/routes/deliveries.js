import { Router } from 'express'
import { getCollection, findById } from '../db.js'

const router = Router()

// GET /api/deliveries - List all deliveries
router.get('/', (req, res) => {
  try {
    const deliveries = getCollection('deliveries')
    res.json(deliveries)
  } catch (err) {
    console.error('Error fetching deliveries:', err)
    res.status(500).json({ error: 'Failed to retrieve deliveries' })
  }
})

// GET /api/deliveries/:id - Single delivery by ID
router.get('/:id', (req, res) => {
  try {
    const delivery = findById('deliveries', req.params.id)
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' })
    }
    res.json(delivery)
  } catch (err) {
    console.error(`Error fetching delivery ${req.params.id}:`, err)
    res.status(500).json({ error: 'Failed to retrieve delivery' })
  }
})

export default router
