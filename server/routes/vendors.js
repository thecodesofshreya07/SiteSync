import { Router } from 'express'
import { getCollection, findById, getPool, getCollectionDirect } from '../db.js'

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

    const vendors = await getCollectionDirect('vendors')
    res.json(vendors)
  } catch (err) {
    console.error('Error in GET /api/vendors:', err)
    return res.status(500).json({ error: 'Failed to retrieve vendors' })
  }
})

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

    const vendors = await getCollectionDirect('vendors')
    const vendor = vendors.find((v) => v.id === id)
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
