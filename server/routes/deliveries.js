import { Router } from 'express'
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
  } catch (err) {
    console.error('Error fetching deliveries:', err)
    res.status(500).json({ error: 'Failed to retrieve deliveries' })
  }
})

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
    }
    res.json(delivery)
  } catch (err) {
    console.error(`Error fetching delivery ${req.params.id}:`, err)
    res.status(500).json({ error: 'Failed to retrieve delivery' })
  }
})

export default router
