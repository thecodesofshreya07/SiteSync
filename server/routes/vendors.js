import { Router } from 'express'
import { getCollectionDirect } from '../db.js'

const router = Router()

// GET /api/vendors - List all vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await getCollectionDirect('vendors')
    res.json(vendors)
  } catch (err) {
    console.error('Error in GET /api/vendors:', err)
    res.status(500).json({ error: 'Failed to retrieve vendors' })
  }
})

// GET /api/vendors/:id - Single vendor
router.get('/:id', async (req, res) => {
  try {
    const vendors = await getCollectionDirect('vendors')
    const vendor = vendors.find((v) => v.id === req.params.id)
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' })
    }
    res.json(vendor)
  } catch (err) {
    console.error(`Error in GET /api/vendors/${req.params.id}:`, err)
    res.status(500).json({ error: 'Failed to retrieve vendor' })
  }
})

export default router
