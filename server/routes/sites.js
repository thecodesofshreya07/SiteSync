import { Router } from 'express'
import { getCollectionDirect } from '../db.js'
import { fetchSiteForecast } from '../services/weatherService.js'

const router = Router()

// GET /api/sites - List sites
router.get('/', async (req, res) => {
  try {
    const sites = await getCollectionDirect('sites')
    res.json(sites)
  } catch (err) {
    console.error('Error in GET /api/sites:', err)
    res.status(500).json({ error: 'Failed to retrieve sites' })
  }
})

// GET /api/sites/:id/weather - 7-day live weather forecast & task risk flags
router.get('/:id/weather', async (req, res) => {
  try {
    const forecast = await fetchSiteForecast(req.params.id)
    res.json(forecast)
  } catch (err) {
    console.error('Error in GET /api/sites/:id/weather:', err)
    res.status(500).json({ error: 'Failed to retrieve site weather forecast' })
  }
})

// GET /api/sites/:id/budget - Site budget by category
router.get('/:id/budget', async (req, res) => {
  try {
    const budgetByCategory = await getCollectionDirect('budgetByCategory')
    const budget = budgetByCategory[req.params.id] || []
    res.json(budget)
  } catch (err) {
    console.error('Error in GET /api/sites/:id/budget:', err)
    res.status(500).json({ error: 'Failed to retrieve site budget' })
  }
})

// GET /api/sites/:id - Single site
router.get('/:id', async (req, res) => {
  try {
    const sites = await getCollectionDirect('sites')
    const site = sites.find((s) => s.id === req.params.id)
    if (!site) {
      return res.status(404).json({ error: 'Site not found' })
    }
    res.json(site)
  } catch (err) {
    console.error('Error in GET /api/sites/:id:', err)
    res.status(500).json({ error: 'Failed to retrieve site' })
  }
})

export default router
