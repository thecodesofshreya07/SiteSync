import { Router } from 'express'
import { getCollectionDirect, insertAlertDirect, updateAlertStatusDirect, getPool, setCollection } from '../db.js'

const router = Router()

// GET /api/alerts - List all alerts (optional ?siteId=...)
router.get('/', async (req, res) => {
  try {
    const { siteId } = req.query
    const alerts = await getCollectionDirect('alerts')
    if (siteId) {
      const filtered = alerts.filter((a) => a.siteId === siteId)
      return res.json(filtered)
    }
    return res.json(alerts)
  } catch (err) {
    console.error('Error fetching alerts:', err)
    return res.status(500).json({ error: 'Failed to retrieve alerts from PostgreSQL' })
  }
})

// GET /api/alerts/:id - Get single alert by ID
router.get('/:id', async (req, res) => {
  try {
    const alerts = await getCollectionDirect('alerts')
    const alert = alerts.find((a) => a.id === req.params.id)
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found in database' })
    }
    return res.json(alert)
  } catch (err) {
    console.error(`Error fetching alert ${req.params.id}:`, err)
    return res.status(500).json({ error: 'Failed to retrieve alert' })
  }
})

// POST /api/alerts - Create new alert (e.g. from Agent)
router.post('/', async (req, res) => {
  try {
    const payload = req.body
    if (!payload || !payload.siteId || !payload.title) {
      return res.status(400).json({ error: 'Missing required alert fields: siteId, title' })
    }

    const newId = payload.id || `ALT-${String(Date.now()).slice(-4)}`
    const newAlert = {
      id: newId,
      siteId: payload.siteId,
      severity: payload.severity || 'warning',
      title: payload.title,
      timestamp: payload.timestamp || new Date().toISOString(),
      explanation: payload.explanation || '',
      reasonPoints: Array.isArray(payload.reasonPoints) ? payload.reasonPoints : [],
      recommendation: payload.recommendation || '',
      sources: Array.isArray(payload.sources) ? payload.sources : [],
      status: payload.status || 'pending',
    }

    await insertAlertDirect(newAlert)
    console.log(`[ALERT] Created and persisted alert in PostgreSQL with ID: ${newId}`)
    return res.status(201).json(newAlert)
  } catch (err) {
    console.error('Error creating alert:', err)
    return res.status(500).json({ error: 'Failed to create alert in database' })
  }
})

// PATCH /api/alerts/:id - Update alert status (approve, dismiss, snooze)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const alerts = await getCollectionDirect('alerts')
    const existing = alerts.find((a) => a.id === id)
    if (!existing) {
      return res.status(404).json({ error: 'Alert not found in PostgreSQL database' })
    }

    const { status } = req.body || {}
    const validStatuses = ['pending', 'approved', 'dismissed', 'snoozed']
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`,
      })
    }

    const updated = await updateAlertStatusDirect(id, status)
    console.log(`[ALERT] Updated alert ${id} status to '${status}' in PostgreSQL`)
    return res.json(updated || { ...existing, status })
  } catch (err) {
    console.error(`Error updating alert ${req.params.id}:`, err)
    return res.status(500).json({ error: 'Failed to update alert in database' })
  }
})

// DELETE /api/alerts - Clear alerts table for testing
router.delete('/', async (req, res) => {
  try {
    const pool = getPool()
    if (pool) {
      await pool.query('DELETE FROM alerts')
    }
    setCollection('alerts', [])
    console.log('[ALERT] Cleared all alerts from PostgreSQL')
    return res.json({ status: 'ok', message: 'All alerts cleared from PostgreSQL' })
  } catch (err) {
    console.error('Error clearing alerts:', err)
    return res.status(500).json({ error: 'Failed to clear alerts from database' })
  }
})

export default router
