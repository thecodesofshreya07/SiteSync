import { Router } from 'express'
import { getCollectionDirect } from '../db.js'

const router = Router()

// GET /api/timeline - List timeline (optional ?siteId=...)
router.get('/', async (req, res) => {
  try {
    const { siteId } = req.query
    const timelines = await getCollectionDirect('timelines')
    if (siteId) {
      return res.json(timelines[siteId] || [])
    }
    return res.json(timelines)
  } catch (err) {
    console.error('Error in GET /api/timeline:', err)
    return res.status(500).json({ error: 'Failed to retrieve timelines' })
  }
})

// GET /api/timeline/:siteId - Timeline for a specific siteId
router.get('/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params
    const timelines = await getCollectionDirect('timelines')
    const siteTimeline = timelines[siteId] || []
    return res.json(siteTimeline)
  } catch (err) {
    console.error(`Error in GET /api/timeline/${req.params.siteId}:`, err)
    return res.status(500).json({ error: 'Failed to retrieve timeline' })
  }
})

export default router
