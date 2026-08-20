import { Router } from 'express'
import { getCollection } from '../db.js'

const router = Router()

// GET /api/timeline - Timeline phases for site (optional ?siteId=...)
router.get('/', (req, res) => {
  const { siteId } = req.query
  const timelines = getCollection('timelines') || {}
  if (siteId) {
    return res.json(timelines[siteId] || [])
  }
  return res.json(timelines)
})

// GET /api/timeline/:siteId - Timeline phases for specific site
router.get('/:siteId', (req, res) => {
  const timelines = getCollection('timelines') || {}
  const siteTimeline = timelines[req.params.siteId]
  if (siteTimeline) {
    return res.json(siteTimeline)
  }
  return res.json([])
})

export default router
