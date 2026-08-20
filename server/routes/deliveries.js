import { Router } from 'express'
<<<<<<< HEAD
import { getCollection, findById, getPool } from '../db.js'

const router = Router()

function formatDeliveryRow(row) {
  if (!row) return null
  const baseData = row.data && typeof row.data === 'object' ? row.data : {}
  return {
    ...baseData,
    id: row.id || baseData.id,
    poId: row.po_id || baseData.poId,
    expectedDate: row.expected_date || baseData.expectedDate,
    revisedDate: row.revised_date || baseData.revisedDate,
    delayDays: Number(row.delay_days ?? baseData.delayDays ?? 0),
    status: row.status || baseData.status,
    reason: row.reason || baseData.reason,
  }
}

// GET /api/deliveries - List all deliveries
router.get('/', async (req, res) => {
  try {
    const pool = getPool()
    if (pool) {
      try {
        const result = await pool.query('SELECT * FROM deliveries ORDER BY id ASC')
        if (result.rows && result.rows.length > 0) {
          return res.json(result.rows.map(formatDeliveryRow))
        }
      } catch (err) {
        console.warn('PostgreSQL deliveries query failed, using local collection:', err.message)
      }
    }

    const deliveries = getCollection('deliveries')
    res.json(deliveries)
=======
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
>>>>>>> 9ec1c5ff38cf68cffa967dfdbd6299686e4c6419
  } catch (err) {
    console.error('Error in GET /api/deliveries:', err)
    return res.status(500).json({ error: 'Failed to retrieve deliveries' })
  }
})

<<<<<<< HEAD
// GET /api/deliveries/:id - Single delivery by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const pool = getPool()
    if (pool) {
      try {
        const result = await pool.query('SELECT * FROM deliveries WHERE id = $1', [id])
        if (result.rows.length > 0) {
          return res.json(formatDeliveryRow(result.rows[0]))
        }
      } catch (err) {
        console.warn(`PostgreSQL lookup failed for delivery ${id}:`, err.message)
      }
    }

    const delivery = findById('deliveries', id)
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' })
=======
// GET /api/deliveries/:idOrSiteId - Single delivery OR list of deliveries for a siteId
router.get('/:idOrSiteId', async (req, res) => {
  try {
    const { idOrSiteId } = req.params
    const deliveries = await getCollectionDirect('deliveries')

    // 1. Match delivery ID (e.g. DEL-882)
    const item = deliveries.find((d) => d.id === idOrSiteId)
    if (item) {
      return res.json(item)
>>>>>>> 9ec1c5ff38cf68cffa967dfdbd6299686e4c6419
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
