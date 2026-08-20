import { Router } from 'express'
import { getCollection, findById } from '../db.js'

const router = Router()

// GET /api/vendors - List all vendors
router.get('/', (req, res) => {
  try {
    const vendors = getCollection('vendors')
    res.json(vendors)
  } catch (err) {
    console.error('Error fetching vendors:', err)
    res.status(500).json({ error: 'Failed to retrieve vendors' })
  }
})

// GET /api/vendors/:id - Single vendor by ID
router.get('/:id', (req, res) => {
  try {
    const vendor = findById('vendors', req.params.id)
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' })
    }
    res.json(vendor)
  } catch (err) {
    console.error(`Error fetching vendor ${req.params.id}:`, err)
    res.status(500).json({ error: 'Failed to retrieve vendor' })
  }
})

export default router
