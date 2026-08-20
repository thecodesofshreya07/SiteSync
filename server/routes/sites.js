import { Router } from 'express'
import { getCollection, findById } from '../db.js'

const router = Router()

// GET /api/sites - List sites
router.get('/', (req, res) => {
  const sites = getCollection('sites')
  res.json(sites)
})

// GET /api/sites/:id/budget - Site budget by category
router.get('/:id/budget', (req, res) => {
  const budgetByCategory = getCollection('budgetByCategory')
  const budget = budgetByCategory[req.params.id] || []
  res.json(budget)
})

// GET /api/sites/:id - Single site
router.get('/:id', (req, res) => {
  const site = findById('sites', req.params.id)
  if (!site) {
    return res.status(404).json({ error: 'Site not found' })
  }
  res.json(site)
})

export default router
