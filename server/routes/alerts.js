import { Router } from 'express'
import {
  getCollectionDirect,
  insertAlertDirect,
  updateAlertStatusDirect,
  getPool,
  setCollection,
  updateByIdDirect,
} from '../db.js'

const router = Router()

// GET /api/alerts - List all alerts (optional ?siteId=...)
router.get('/', async (req, res) => {
  try {
    const { siteId } = req.query
    const alerts = await getCollectionDirect('alerts')
    if (siteId) {
      const filtered = alerts.filter((a) => a.siteId === siteId)
      return res.json(filtered)
    }
    return res.json(alerts)
  } catch (err) {
    console.error('Error fetching alerts:', err)
    return res.status(500).json({ error: 'Failed to retrieve alerts from PostgreSQL' })
  }
})

// GET /api/alerts/:id - Get single alert by ID
router.get('/:id', async (req, res) => {
  try {
    const alerts = await getCollectionDirect('alerts')
    const alert = alerts.find((a) => a.id === req.params.id)
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found in database' })
    }
    return res.json(alert)
  } catch (err) {
    console.error(`Error fetching alert ${req.params.id}:`, err)
    return res.status(500).json({ error: 'Failed to retrieve alert' })
  }
})

// POST /api/alerts - Create new alert
router.post('/', async (req, res) => {
  try {
    const payload = req.body
    if (!payload || !payload.siteId || !payload.title) {
      return res.status(400).json({ error: 'Missing required alert fields: siteId, title' })
    }

    const newId = payload.id || `ALT-${String(Date.now()).slice(-4)}`
    const newAlert = {
      id: newId,
      siteId: payload.siteId,
      severity: payload.severity || 'warning',
      title: payload.title,
      timestamp: payload.timestamp || new Date().toISOString(),
      explanation: payload.explanation || '',
      reasonPoints: Array.isArray(payload.reasonPoints) ? payload.reasonPoints : [],
      recommendation: payload.recommendation || '',
      sources: Array.isArray(payload.sources) ? payload.sources : [],
      status: payload.status || 'pending',
      type: payload.type || 'standard',
      transferDetails: payload.transferDetails || null,
    }

    await insertAlertDirect(newAlert)
    console.log(`[ALERT] Created and persisted alert in PostgreSQL with ID: ${newId}`)
    return res.status(201).json(newAlert)
  } catch (err) {
    console.error('Error creating alert:', err)
    return res.status(500).json({ error: 'Failed to create alert in database' })
  }
})

// PATCH /api/alerts/:id - Update alert status (approve, dismiss, snooze, cross-site transfer)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const alerts = await getCollectionDirect('alerts')
    const existing = alerts.find((a) => a.id === id)
    if (!existing) {
      return res.status(404).json({ error: 'Alert not found in PostgreSQL database' })
    }

    const { status } = req.body || {}
    const validStatuses = [
      'pending',
      'approved',
      'dismissed',
      'snoozed',
      'resolved',
      'transfer_requested',
      'transfer_rejected',
    ]
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`,
      })
    }

    const pool = getPool()

    // -------------------------------------------------------------------------
    // 1. Target Site (Site B) approves a transfer recommendation
    // -------------------------------------------------------------------------
    const isShortageTransferApproval =
      status === 'approved' &&
      (existing.transferDetails || existing.recommendation?.toLowerCase().includes('transfer')) &&
      existing.type !== 'incoming_transfer_request'

    if (isShortageTransferApproval) {
      const sites = await getCollectionDirect('sites')
      const targetSiteObj = sites.find((s) => s.id === existing.siteId)
      const targetSiteName = targetSiteObj?.name || (existing.siteId === 'SITE-002' ? 'Warehouse Expansion' : existing.siteId)

      const transferDetails = existing.transferDetails || {
        sourceSiteId: 'SITE-001',
        sourceSiteName: 'Riverside Tower',
        targetSiteId: existing.siteId,
        targetSiteName,
        item: existing.title.includes('Cement') ? 'Cement Portland Type I' : 'Cement Portland Type I',
        quantity: 150,
        unit: 'bags',
      }

      // 1a. Transition Target Site (Site B) alert status to 'transfer_requested'
      const updatedSiteBAlert = {
        ...existing,
        status: 'transfer_requested',
        transferDetails: {
          ...transferDetails,
          requestedAt: new Date().toISOString(),
        },
      }
      await insertAlertDirect(updatedSiteBAlert)

      // 1b. Create the paired incoming transfer authorization alert for Source Site (Riverside Tower - SITE-001)
      const incomingAlertId = `ALT-TRF-${Date.now().toString().slice(-4)}`
      const incomingAlert = {
        id: incomingAlertId,
        siteId: transferDetails.sourceSiteId,
        severity: 'warning',
        type: 'incoming_transfer_request',
        title: `Transfer Request from ${transferDetails.targetSiteName}: ${transferDetails.quantity} ${transferDetails.unit} of ${transferDetails.item}`,
        timestamp: new Date().toISOString(),
        explanation: `${transferDetails.targetSiteName} (${transferDetails.targetSiteId}) has requested an urgent stock transfer of ${transferDetails.quantity} ${transferDetails.unit} of ${transferDetails.item} due to critical delivery delays. ${transferDetails.sourceSiteName} currently holds available surplus inventory.`,
        reasonPoints: [
          `${transferDetails.targetSiteName} project management approved an emergency transfer request.`,
          `Requested volume: ${transferDetails.quantity} ${transferDetails.unit} of ${transferDetails.item}.`,
          `Authorizing this request will automatically deduct stock from ${transferDetails.sourceSiteName} and dispatch to ${transferDetails.targetSiteName}.`,
        ],
        recommendation: `Authorize dispatch of ${transferDetails.quantity} ${transferDetails.unit} of ${transferDetails.item} to ${transferDetails.targetSiteName}, or Decline to keep stock on site.`,
        sources: [
          ...(existing.sources || []),
          { type: 'alert', id: existing.id, label: `Original Shortage Alert ${existing.id}` },
        ],
        status: 'pending',
        transferDetails: {
          ...transferDetails,
          targetAlertId: existing.id,
        },
      }

      await insertAlertDirect(incomingAlert)
      console.log(`[ALERT] Created incoming transfer request for ${transferDetails.sourceSiteId} (ID: ${incomingAlertId})`)
      return res.json(updatedSiteBAlert)
    }

    // -------------------------------------------------------------------------
    // 2. Source Site (Riverside Tower) responds to the incoming_transfer_request
    // -------------------------------------------------------------------------
    if (existing.type === 'incoming_transfer_request') {
      const transfer = existing.transferDetails || {}
      const targetAlertId = transfer.targetAlertId
      const allInventory = await getCollectionDirect('inventory')

      if (status === 'approved') {
        // --- TRANSFER APPROVED BY RIVERSIDE TOWER ---
        const itemToTransfer = transfer.item || 'Cement Portland Type I'
        const qtyToTransfer = Number(transfer.quantity) || 150

        // 2a. Deduct stock from Source Site (Riverside Tower)
        const sourceItem = allInventory.find(
          (i) => i.siteId === existing.siteId && i.item.toLowerCase() === itemToTransfer.toLowerCase()
        )
        if (sourceItem) {
          const newSourceQty = Math.max((sourceItem.quantity || 0) - qtyToTransfer, 0)
          const nowIso = new Date().toISOString()
          const sourceTxn = {
            type: 'Transfer Out',
            quantity: qtyToTransfer,
            date: nowIso.slice(0, 10),
            note: `Approved transfer dispatch to ${transfer.targetSiteName || transfer.targetSiteId}`,
          }
          if (pool) {
            try {
              await pool.query(
                `UPDATE inventory SET quantity = $1, last_updated = $2, last_transaction = $3, data = jsonb_set(jsonb_set(data, '{quantity}', $4::jsonb), '{lastTransaction}', $5::jsonb) WHERE id = $6`,
                [newSourceQty, nowIso, JSON.stringify(sourceTxn), JSON.stringify(newSourceQty), JSON.stringify(sourceTxn), sourceItem.id]
              )
            } catch (err) {
              console.warn('Error updating source site inventory in PostgreSQL:', err.message)
            }
          }
          await updateByIdDirect('inventory', sourceItem.id, {
            quantity: newSourceQty,
            lastUpdated: nowIso,
            lastTransaction: sourceTxn,
          })
          console.log(`[TRANSFER] Deducted ${qtyToTransfer} ${transfer.unit} from ${existing.siteId} (new qty: ${newSourceQty})`)
        }

        // 2b. Add stock to Target Site (Site B)
        const targetItem = allInventory.find(
          (i) => i.siteId === transfer.targetSiteId && i.item.toLowerCase() === itemToTransfer.toLowerCase()
        )
        if (targetItem) {
          const newTargetQty = (targetItem.quantity || 0) + qtyToTransfer
          const threshold = targetItem.reorderThreshold || 250
          const targetStatus = newTargetQty <= threshold * 0.5 ? 'CRITICAL' : newTargetQty <= threshold ? 'LOW' : 'OK'
          const nowIso = new Date().toISOString()
          const targetTxn = {
            type: 'Transfer In',
            quantity: qtyToTransfer,
            date: nowIso.slice(0, 10),
            note: `Received transfer from ${transfer.sourceSiteName || existing.siteId}`,
          }
          if (pool) {
            try {
              await pool.query(
                `UPDATE inventory SET quantity = $1, status = $2, last_updated = $3, last_transaction = $4, data = jsonb_set(jsonb_set(jsonb_set(data, '{quantity}', $5::jsonb), '{status}', $6::jsonb), '{lastTransaction}', $7::jsonb) WHERE id = $8`,
                [newTargetQty, targetStatus, nowIso, JSON.stringify(targetTxn), JSON.stringify(newTargetQty), JSON.stringify(targetStatus), JSON.stringify(targetTxn), targetItem.id]
              )
            } catch (err) {
              console.warn('Error updating target site inventory in PostgreSQL:', err.message)
            }
          }
          await updateByIdDirect('inventory', targetItem.id, {
            quantity: newTargetQty,
            status: targetStatus,
            lastUpdated: nowIso,
            lastTransaction: targetTxn,
          })
          console.log(`[TRANSFER] Added ${qtyToTransfer} ${transfer.unit} to ${transfer.targetSiteId} (new qty: ${newTargetQty}, status: ${targetStatus})`)
        }

        // 2c. Update Riverside Tower alert to approved
        const updatedSourceAlert = {
          ...existing,
          status: 'approved',
          resolvedAt: new Date().toISOString(),
        }
        await insertAlertDirect(updatedSourceAlert)

        // 2d. Resolve Site B's target alert and update title/explanation
        if (targetAlertId) {
          const targetAlert = alerts.find((a) => a.id === targetAlertId)
          if (targetAlert) {
            await insertAlertDirect({
              ...targetAlert,
              status: 'resolved',
              resolvedAt: new Date().toISOString(),
              title: `✓ Transfer Received: ${qtyToTransfer} ${transfer.unit} of ${itemToTransfer} arrived from ${transfer.sourceSiteName || 'Riverside Tower'}`,
              explanation: `${qtyToTransfer} ${transfer.unit} of ${itemToTransfer} have been successfully transferred from ${transfer.sourceSiteName || 'Riverside Tower'} and logged into local inventory. Stock is now restored to safe operational levels.`,
            })
          }
        }

        return res.json(updatedSourceAlert)
      } else if (status === 'dismissed') {
        // --- TRANSFER REJECTED BY RIVERSIDE TOWER ---
        // 2a. Mark Riverside Tower alert as dismissed
        const updatedSourceAlert = {
          ...existing,
          status: 'dismissed',
          rejectedAt: new Date().toISOString(),
        }
        await insertAlertDirect(updatedSourceAlert)

        // 2b. Mark Site B alert as transfer_rejected
        if (targetAlertId) {
          const targetAlert = alerts.find((a) => a.id === targetAlertId)
          if (targetAlert) {
            await insertAlertDirect({
              ...targetAlert,
              status: 'transfer_rejected',
              rejectedAt: new Date().toISOString(),
            })
          }
        }

        // 2c. Create Emergency Fallback Alert at Site B
        const emergencyAlertId = `ALT-EMG-${Date.now().toString().slice(-4)}`
        const emergencyAlert = {
          id: emergencyAlertId,
          siteId: transfer.targetSiteId || 'SITE-002',
          severity: 'critical',
          type: 'emergency_procurement_fallback',
          title: `Stock Transfer Declined by ${transfer.sourceSiteName || 'Riverside Tower'} — Emergency Purchase Order Needed`,
          timestamp: new Date().toISOString(),
          explanation: `${transfer.sourceSiteName || 'Riverside Tower'} was unable to authorize the ${transfer.quantity || 150} ${transfer.unit || 'bags'} transfer. Critical supply shortage for ${transfer.item || 'Cement Portland Type I'} remains active at ${transfer.targetSiteName || 'Warehouse Expansion'}.`,
          reasonPoints: [
            `Inter-site stock transfer request was declined by ${transfer.sourceSiteName || 'Riverside Tower'}.`,
            `Critical stockout risk remains unresolved without alternative replenishment.`,
            `Direct expedited purchase order required with guaranteed 24-48h supplier dispatch.`,
          ],
          recommendation: `Expedite Emergency Purchase Order for 500 ${transfer.unit || 'bags'} of ${transfer.item || 'Cement Portland Type I'} from local vendor BuildPro Materials.`,
          sources: [
            ...(existing.sources || []),
            { type: 'alert', id: existing.id, label: `Declined Transfer ${existing.id}` },
          ],
          status: 'pending',
        }

        await insertAlertDirect(emergencyAlert)
        console.log(`[ALERT] Created Emergency Fallback Alert for ${transfer.targetSiteId} (ID: ${emergencyAlertId})`)

        return res.json(updatedSourceAlert)
      }
    }

    // Standard single alert status update
    const updated = await updateAlertStatusDirect(id, status)
    console.log(`[ALERT] Updated alert ${id} status to '${status}' in PostgreSQL`)
    return res.json(updated || { ...existing, status })
  } catch (err) {
    console.error(`Error updating alert ${req.params.id}:`, err)
    return res.status(500).json({ error: 'Failed to update alert in database' })
  }
})

// DELETE /api/alerts - Clear alerts table for testing
router.delete('/', async (req, res) => {
  try {
    const pool = getPool()
    if (pool) {
      await pool.query('DELETE FROM alerts')
    }
    setCollection('alerts', [])
    console.log('[ALERT] Cleared all alerts from PostgreSQL')
    return res.json({ status: 'ok', message: 'All alerts cleared from PostgreSQL' })
  } catch (err) {
    console.error('Error clearing alerts:', err)
    return res.status(500).json({ error: 'Failed to clear alerts from database' })
  }
})

export default router

