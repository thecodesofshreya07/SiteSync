import { Router } from 'express'
import { getCollection, findById, getPool } from '../db.js'

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

    const vendors = getCollection('vendors') || []
    res.json(vendors)
  } catch (err) {
    console.error('Error in GET /api/vendors:', err)
    res.status(500).json({ error: 'Failed to retrieve vendors' })
  }
})

import { getCollectionDirect } from '../db.js'

// GET /api/vendors/analytics - Aggregated vendor intelligence matrix
router.get('/analytics', async (req, res) => {
  try {
    const vendors = await getCollectionDirect('vendors')
    const orders = await getCollectionDirect('procurementOrders')
    const deliveries = await getCollectionDirect('deliveries')

    const analytics = (vendors || []).map((v) => {
      const vendorOrders = (orders || []).filter((o) => o.vendorId === v.id || o.vendor === v.name)
      const totalOrders = vendorOrders.length
      const totalSpend = vendorOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
      
      const delays = vendorOrders.map((o) => Number(o.delayDays) || 0)
      const avgDelay = delays.length > 0 ? Math.round((delays.reduce((a, b) => a + b, 0) / delays.length) * 10) / 10 : Number(v.avgDelayDays || 0)
      
      const onTimeOrders = vendorOrders.filter((o) => !o.delayDays || Number(o.delayDays) === 0).length
      const onTimePct = totalOrders > 0 ? Math.round((onTimeOrders / totalOrders) * 100) : v.avgDelayDays <= 1 ? 95 : 75
      const calculatedReliability = onTimePct >= 90 && avgDelay <= 1.5 ? 'High' : onTimePct >= 70 ? 'Moderate' : 'Low'

      return {
        id: v.id,
        name: v.name,
        category: v.category || 'Materials',
        contact: v.contact || v.phone || '+91 98200 12345',
        totalOrders,
        totalSpend,
        avgDelayDays: avgDelay,
        onTimeDeliveryPct: onTimePct,
        reliability: calculatedReliability,
        pricingScore: totalSpend > 5000000 ? 'A+ (Volume Discounted)' : 'A (Market Standard)',
        leadTimeDays: avgDelay <= 1 ? '2-3 days (Fast)' : `${Math.round(avgDelay + 3)} days (Standard)`,
      }
    })

    res.json(analytics)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/vendors/:id/stats - Single vendor deep stats
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params
    const vendors = await getCollectionDirect('vendors')
    const orders = await getCollectionDirect('procurementOrders')
    const vendor = vendors.find((v) => v.id === id)

    if (!vendor) return res.status(404).json({ error: 'Vendor not found' })

    const vendorOrders = (orders || []).filter((o) => o.vendorId === id || o.vendor === vendor.name)
    const totalOrders = vendorOrders.length
    const totalSpend = vendorOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
    const onTimeOrders = vendorOrders.filter((o) => !o.delayDays || Number(o.delayDays) === 0).length
    const onTimePct = totalOrders > 0 ? Math.round((onTimeOrders / totalOrders) * 100) : 90

    res.json({
      vendor,
      stats: {
        totalOrders,
        totalSpend,
        onTimeDeliveryPct: onTimePct,
        recentOrders: vendorOrders.slice(-5),
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
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
