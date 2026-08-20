import { Router } from 'express'
import { getCollectionDirect, updateByIdDirect } from '../db.js'

const router = Router()

// GET /api/inventory - List inventory items (optionally filter by ?siteId=...)
router.get('/', async (req, res) => {
  try {
    const { siteId } = req.query
    const inventory = await getCollectionDirect('inventory')
    if (siteId) {
      return res.json(inventory.filter((item) => item.siteId === siteId))
    }
    return res.json(inventory)
  } catch (err) {
    console.error('Error in GET /api/inventory:', err)
    return res.status(500).json({ error: 'Failed to retrieve inventory' })
  }
})

// GET /api/inventory/:idOrSiteId - Single item by ID OR list of items for a siteId
router.get('/:idOrSiteId', async (req, res) => {
  try {
    const { idOrSiteId } = req.params
    const inventory = await getCollectionDirect('inventory')

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
  } catch (err) {
    console.error(`Error in GET /api/inventory/${req.params.idOrSiteId}:`, err)
    return res.status(500).json({ error: 'Failed to retrieve inventory data' })
  }
})

// POST /api/inventory/:id/transaction - Log a stock transaction (Stock In, Stock Out, Transfer)
router.post('/:id/transaction', async (req, res) => {
  try {
    const { id } = req.params
    const { type = 'Stock In', quantity, note } = req.body

    const inventory = await getCollectionDirect('inventory')
    const item = inventory.find((i) => i.id === id)
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    const qty = Number(quantity)
    if (!qty || qty <= 0 || isNaN(qty)) {
      return res.status(400).json({ error: 'Invalid transaction quantity' })
    }

    let newQuantity = Number(item.quantity)
    if (type === 'Stock In') {
      newQuantity += qty
    } else if (type === 'Stock Out' || type === 'Transfer') {
      newQuantity -= qty
    }
    newQuantity = Math.max(0, Math.round(newQuantity * 100) / 100)

    // Status calculation based on reorder threshold
    const threshold = Number(item.reorderThreshold) || 0
    let newStatus = 'OK'
    if (newQuantity <= threshold * 0.5) {
      newStatus = 'CRITICAL'
    } else if (newQuantity <= threshold) {
      newStatus = 'LOW'
    }

    const transactionRecord = {
      type,
      quantity: qty,
      date: new Date().toISOString().split('T')[0],
      note: note || `${type} of ${qty} ${item.unit}`,
    }

    const updated = await updateByIdDirect('inventory', id, {
      quantity: newQuantity,
      status: newStatus,
      lastTransaction: transactionRecord,
    })

    return res.json(updated)
  } catch (err) {
    console.error(`Error in POST /api/inventory/${req.params.id}/transaction:`, err)
    return res.status(500).json({ error: 'Failed to process transaction' })
  }
})

export default router
