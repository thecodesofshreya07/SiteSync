import { Router } from 'express'
import { getCollection, setCollection, findById, updateById } from '../db.js'

const router = Router()

// GET /api/alerts - List all alerts (optional ?siteId=...)
router.get('/', (req, res) => {
  try {
    const { siteId } = req.query
    const alerts = getCollection('alerts')
    if (siteId) {
      const filtered = alerts.filter((a) => a.siteId === siteId)
      return res.json(filtered)
    }
    return res.json(alerts)
  } catch (err) {
    console.error('Error fetching alerts:', err)
    return res.status(500).json({ error: 'Failed to retrieve alerts' })
  }
})

// GET /api/alerts/:id - Get single alert by ID
router.get('/:id', (req, res) => {
  try {
    const alert = findById('alerts', req.params.id)
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' })
    }
    return res.json(alert)
  } catch (err) {
    console.error(`Error fetching alert ${req.params.id}:`, err)
    return res.status(500).json({ error: 'Failed to retrieve alert' })
  }
})

// POST /api/alerts - Create new alert (e.g. from Agent)
router.post('/', (req, res) => {
  try {
    const payload = req.body
    if (!payload || !payload.siteId || !payload.title) {
      return res.status(400).json({ error: 'Missing required alert fields: siteId, title' })
    }

    const alerts = getCollection('alerts')
    const newId = payload.id || `ALT-${String(Date.now()).slice(-3)}`
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

    // Check if alert with same ID already exists, otherwise prepend
    const existingIdx = alerts.findIndex((a) => a.id === newId)
    if (existingIdx >= 0) {
      alerts[existingIdx] = { ...alerts[existingIdx], ...newAlert }
    } else {
      alerts.unshift(newAlert)
    }

    setCollection('alerts', alerts)
    return res.status(201).json(newAlert)
  } catch (err) {
    console.error('Error creating alert:', err)
    return res.status(500).json({ error: 'Failed to create alert' })
  }
})

// PATCH /api/alerts/:id - Update alert status (approve, dismiss, snooze)
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params
    const existing = findById('alerts', id)
    if (!existing) {
      return res.status(404).json({ error: 'Alert not found' })
    }

    const { status } = req.body || {}
    const validStatuses = ['pending', 'approved', 'dismissed', 'snoozed']
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`,
      })
    }

    const updated = updateById('alerts', id, { status })
    return res.json(updated)
  } catch (err) {
    console.error(`Error updating alert ${req.params.id}:`, err)
    return res.status(500).json({ error: 'Failed to update alert' })
  }
})

export default router
