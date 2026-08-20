import { Router } from 'express'
<<<<<<< HEAD
import { getCollection, findById, getPool } from '../db.js'
=======
import { getCollectionDirect } from '../db.js'
>>>>>>> 9ec1c5ff38cf68cffa967dfdbd6299686e4c6419

const router = Router()

function formatVendorRow(row) {
  if (!row) return null
  const baseData = row.data && typeof row.data === 'object' ? row.data : {}
  return {
    ...baseData,
    id: row.id || baseData.id,
    name: row.name || baseData.name,
    category: row.category || baseData.category,
    reliability: row.reliability || baseData.reliability,
    avgDelayDays: Number(row.avg_delay_days ?? baseData.avgDelayDays ?? 0),
  }
}

// GET /api/vendors - List all vendors
router.get('/', async (req, res) => {
  try {
<<<<<<< HEAD
    const pool = getPool()
    if (pool) {
      try {
        const result = await pool.query('SELECT * FROM vendors ORDER BY id ASC')
        if (result.rows && result.rows.length > 0) {
          return res.json(result.rows.map(formatVendorRow))
        }
      } catch (err) {
        console.warn('PostgreSQL vendors query failed, using local collection:', err.message)
      }
    }

    const vendors = getCollection('vendors')
=======
    const vendors = await getCollectionDirect('vendors')
>>>>>>> 9ec1c5ff38cf68cffa967dfdbd6299686e4c6419
    res.json(vendors)
  } catch (err) {
    console.error('Error in GET /api/vendors:', err)
    res.status(500).json({ error: 'Failed to retrieve vendors' })
  }
})

<<<<<<< HEAD
// GET /api/vendors/:id - Single vendor by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const pool = getPool()
    if (pool) {
      try {
        const result = await pool.query('SELECT * FROM vendors WHERE id = $1', [id])
        if (result.rows.length > 0) {
          return res.json(formatVendorRow(result.rows[0]))
        }
      } catch (err) {
        console.warn(`PostgreSQL lookup failed for vendor ${id}:`, err.message)
      }
    }

    const vendor = findById('vendors', id)
=======
// GET /api/vendors/:id - Single vendor
router.get('/:id', async (req, res) => {
  try {
    const vendors = await getCollectionDirect('vendors')
    const vendor = vendors.find((v) => v.id === req.params.id)
>>>>>>> 9ec1c5ff38cf68cffa967dfdbd6299686e4c6419
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
