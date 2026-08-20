import { Router } from 'express'
import { getCollectionDirect } from '../db.js'
import { timelines as defaultTimelines } from '../../client/src/data/tasks.js'

const router = Router()

// GET /api/timeline - List timeline (optional ?siteId=...)
router.get('/', async (req, res) => {
  try {
    const { siteId } = req.query
    let timelines = await getCollectionDirect('timelines')
    if (!timelines || Object.keys(timelines).length === 0 || timelines['SITE-001']?.[0]?.name === 'Foundation') {
      timelines = defaultTimelines
    }
    if (siteId) {
      return res.json(timelines[siteId] || defaultTimelines[siteId] || [])
    }
    return res.json(timelines)
  } catch (err) {
    console.error('Error in GET /api/timeline:', err)
    return res.json(defaultTimelines)
  }
})

// GET /api/timeline/:siteId - Timeline for a specific siteId
router.get('/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params
    let timelines = await getCollectionDirect('timelines')
    if (!timelines || Object.keys(timelines).length === 0 || timelines['SITE-001']?.[0]?.name === 'Foundation') {
      timelines = defaultTimelines
    }
    const siteTimeline = timelines[siteId] || defaultTimelines[siteId] || []
    return res.json(siteTimeline)
  } catch (err) {
    console.error(`Error in GET /api/timeline/${req.params.siteId}:`, err)
    return res.json(defaultTimelines[req.params.siteId] || [])
  }
})

export default router
