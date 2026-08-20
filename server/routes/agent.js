import { Router } from 'express'
import { runMonitoringStream, getAgentLogs } from '../services/dashboardAgent.js'

const router = Router()

// GET /api/agent/history?siteId=SITE-002
router.get('/history', (req, res) => {
  const siteId = req.query.siteId || 'SITE-002'
  const logs = getAgentLogs(siteId)
  res.json({ siteId, logs })
})

// GET /api/agent/stream?siteId=SITE-002 - SSE real-time streaming endpoint
router.get('/stream', async (req, res) => {
  const siteId = req.query.siteId || 'SITE-002'

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  })

  // Flush headers
  if (res.flushHeaders) {
    res.flushHeaders()
  }

  await runMonitoringStream(siteId, res)
})

import { getCollectionDirect, findById } from '../db.js'

// GET /api/agent/subtasks?siteId=SITE-002&status=pending
router.get('/subtasks', async (req, res) => {
  try {
    const siteId = req.query.siteId || req.query.site_id
    const status = req.query.status
    const subtasks = await getCollectionDirect('agentSubtasks')
    
    let filtered = Array.isArray(subtasks) ? [...subtasks] : []
    if (siteId) {
      filtered = filtered.filter((s) => (s.siteId || s.site_id) === siteId)
    }
    if (status) {
      filtered = filtered.filter((s) => s.status === status)
    }

    filtered.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0))
    res.json(filtered)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/agent/subtasks/:id - Detailed subtask view with joined related record and alert
router.get('/subtasks/:id', async (req, res) => {
  try {
    const subtasks = await getCollectionDirect('agentSubtasks')
    const subtask = subtasks.find((s) => s.id === req.params.id)
    if (!subtask) {
      return res.status(404).json({ error: 'Agent subtask not found' })
    }

    let relatedRecord = null
    const relType = (subtask.related_record_type || subtask.relatedRecordType || '').toLowerCase()
    const relId = subtask.related_record_id || subtask.relatedRecordId

    if (relType && relId) {
      if (relType === 'inventory') relatedRecord = findById('inventory', relId)
      else if (relType === 'procurement' || relType === 'purchase_order') relatedRecord = findById('procurementOrders', relId)
      else if (relType === 'equipment') relatedRecord = findById('equipment', relId)
      else if (relType === 'task') relatedRecord = findById('tasks', relId)
      else if (relType === 'delivery') relatedRecord = findById('deliveries', relId)
      else if (relType === 'vendor') relatedRecord = findById('vendors', relId)
    }

    let linkedAlert = null
    const alertId = subtask.parent_alert_id || subtask.parentAlertId
    if (alertId) {
      linkedAlert = findById('alerts', alertId)
    }

    res.json({
      ...subtask,
      relatedRecord,
      linkedAlert,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
