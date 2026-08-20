import { Router } from 'express'
import { getCollection, findById, updateById } from '../db.js'

const router = Router()

// GET /api/inventory - List inventory items (optionally filter by siteId)
router.get('/', (req, res) => {
  const { siteId } = req.query
  const inventory = getCollection('inventory')
  if (siteId) {
    return res.json(inventory.filter((item) => item.siteId === siteId))
  }
  res.json(inventory)
})

// GET /api/inventory/:id - Single inventory item
router.get('/:id', (req, res) => {
  const item = findById('inventory', req.params.id)
  if (!item) {
    return res.status(404).json({ error: 'Inventory item not found' })
  }
  res.json(item)
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

  res.json(updatedItem)
})

export default router
