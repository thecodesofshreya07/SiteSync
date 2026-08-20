import { Router } from 'express'
<<<<<<< HEAD
import { getCollection, findById, getPool } from '../db.js'
=======
import { getCollection, findById, getPool, getCollectionDirect } from '../db.js'
>>>>>>> c93e7056994b12a97d317b7b571b8d42a2ca0eb5

const router = Router()

function formatDeliveryRow(row) {
  if (!row) return null
  const baseData = row.data && typeof row.data === 'object' ? row.data : {}
  return {
    ...baseData,
    id: row.id || baseData.id,
    siteId: row.site_id || baseData.siteId,
    poId: row.po_id || baseData.poId,
    expectedDate: row.expected_date || baseData.expectedDate,
    revisedDate: row.revised_date || baseData.revisedDate,
    delayDays: Number(row.delay_days ?? baseData.delayDays ?? 0),
    status: row.status || baseData.status,
    reason: row.reason || baseData.reason,
  }
}

// GET /api/deliveries - List all deliveries (optional ?siteId=...)
router.get('/', async (req, res) => {
  try {
    const { siteId } = req.query
    const pool = getPool()
    if (pool) {
      try {
        let query = 'SELECT * FROM deliveries'
        const params = []
        if (siteId) {
          query += ' WHERE site_id ILIKE $1'
          params.push(String(siteId).trim())
        }
        query += ' ORDER BY id ASC'
        const result = await pool.query(query, params)
        if (result.rows && result.rows.length > 0) {
          const list = result.rows.map(formatDeliveryRow)
          if (siteId) {
            return res.json(list.filter((d) => d.siteId === siteId))
          }
          return res.json(list)
        }
      } catch (err) {
        console.warn('PostgreSQL deliveries query failed, using local collection:', err.message)
      }
    }

<<<<<<< HEAD
    const deliveries = getCollection('deliveries') || []
    if (siteId) {
      return res.json(deliveries.filter((d) => d.siteId === siteId))
    }
    res.json(deliveries)
=======
    const deliveries = await getCollectionDirect('deliveries')
    if (siteId) {
      return res.json(deliveries.filter((d) => d.siteId === siteId))
    }
    return res.json(deliveries)
>>>>>>> c93e7056994b12a97d317b7b571b8d42a2ca0eb5
  } catch (err) {
    console.error('Error in GET /api/deliveries:', err)
    return res.status(500).json({ error: 'Failed to retrieve deliveries' })
  }
})

<<<<<<< HEAD
// GET /api/deliveries/:id - Single delivery by ID or Site ID
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
    if (delivery) {
      return res.json(delivery)
=======
// GET /api/deliveries/:idOrSiteId - Single delivery OR list of deliveries for a siteId
router.get('/:idOrSiteId', async (req, res) => {
  try {
    const { idOrSiteId } = req.params
    const pool = getPool()
    if (pool) {
      try {
        const result = await pool.query(
          'SELECT * FROM deliveries WHERE id = $1 OR site_id = $1 ORDER BY id ASC',
          [idOrSiteId]
        )
        if (result.rows.length === 1 && result.rows[0].id === idOrSiteId) {
          return res.json(formatDeliveryRow(result.rows[0]))
        } else if (result.rows.length > 0) {
          return res.json(result.rows.map(formatDeliveryRow))
        }
      } catch (err) {
        console.warn(`PostgreSQL lookup failed for delivery ${idOrSiteId}:`, err.message)
      }
    }

    const deliveries = await getCollectionDirect('deliveries')

    // 1. Match delivery ID (e.g. DEL-882)
    const item = deliveries.find((d) => d.id === idOrSiteId)
    if (item) {
      return res.json(item)
>>>>>>> c93e7056994b12a97d317b7b571b8d42a2ca0eb5
    }

    const deliveries = getCollection('deliveries') || []
    const siteDeliveries = deliveries.filter((d) => d.siteId === id)
    if (siteDeliveries.length > 0) {
      return res.json(siteDeliveries)
    }

    return res.status(404).json({ error: `Delivery or site '${id}' not found` })
  } catch (err) {
    console.error(`Error in GET /api/deliveries/${req.params.id}:`, err)
    return res.status(500).json({ error: 'Failed to retrieve deliveries' })
  }
})

export default router
