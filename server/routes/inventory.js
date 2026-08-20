import { Router } from 'express'
import { getCollection, findById, updateById } from '../db.js'

const router = Router()

// GET /api/inventory - List inventory items (optionally filter by ?siteId=...)
router.get('/', (req, res) => {
  const { siteId } = req.query
  const inventory = getCollection('inventory')
  if (siteId) {
    return res.json(inventory.filter((item) => item.siteId === siteId))
  }
  return res.json(inventory)
})

// GET /api/inventory/:idOrSiteId - Single item by ID OR list of items for a siteId
router.get('/:idOrSiteId', (req, res) => {
  const { idOrSiteId } = req.params
  const inventory = getCollection('inventory')

  // First check if it matches a single item ID (e.g. INV-018)
  const item = inventory.find((i) => i.id === idOrSiteId)
  if (item) {
    return res.json(item)
  }

  // Next check if it matches a site ID (e.g. SITE-001)
  const siteItems = inventory.filter((i) => i.siteId === idOrSiteId)
  if (siteItems.length > 0) {
    return res.json(siteItems)
  }

  return res.status(404).json({ error: `Inventory item or site '${idOrSiteId}' not found` })
})

// POST /api/inventory/:id/transaction - Log a stock transaction (Stock In, Stock Out, Transfer)
router.post('/:id/transaction', (req, res) => {
  const { id } = req.params
  const { type = 'Stock In', quantity, note } = req.body

  const item = findById('inventory', id)
  if (!item) {
    return res.status(404).json({ error: 'Inventory item not found' })
  }

  const qty = Number(quantity)
  if (!qty || qty <= 0 || isNaN(qty)) {
    return res.status(400).json({ error: 'Invalid transaction quantity' })
  }

  let newQuantity = item.quantity
  if (type === 'Stock In') {
    newQuantity += qty
  } else if (type === 'Stock Out' || type === 'Transfer') {
    newQuantity -= qty
  }
  newQuantity = Math.max(0, Math.round(newQuantity * 100) / 100)

  // Status calculation based on reorder threshold
  const threshold = item.reorderThreshold || 0
  let status = 'OK'
  if (newQuantity <= threshold * 0.5) {
    status = 'CRITICAL'
  } else if (newQuantity <= threshold) {
    status = 'LOW'
  } else {
    status = 'OK'
  }

  const now = new Date()
  const lastUpdated = now.toISOString()
  const lastTransaction = {
    type,
    quantity: qty,
    date: now.toISOString().slice(0, 10),
    relatedPO: item.lastTransaction?.relatedPO || null,
    ...(note ? { note } : {}),
  }

  const updatedItem = updateById('inventory', id, {
    quantity: newQuantity,
    status,
    lastUpdated,
    lastTransaction,
  })

  if (!updatedItem) {
    return res.status(500).json({ error: 'Failed to update inventory item' })
  }

  return res.json(updatedItem)
})

export default router
