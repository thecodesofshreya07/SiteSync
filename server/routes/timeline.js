import { Router } from 'express'
import { getCollection } from '../db.js'

const router = Router()

// GET /api/timeline - Timeline phases for site
router.get('/', (req, res) => {
  const { siteId } = req.query
  const timelines = getCollection('timelines')
  if (siteId) {
    return res.json(timelines[siteId] || [])
  }
  res.json(timelines)
})

export default router
