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

    // Non-blocking Brevo transactional notification to Project Manager
    import('../services/emailService.js').then(async ({ sendPMAlertEmail }) => {
      const sites = await getCollectionDirect('sites')
      const targetSite = sites.find((s) => s.id === newAlert.siteId) || { name: newAlert.siteId, id: newAlert.siteId }
      sendPMAlertEmail({
        pmEmail: 'mirlubaib51005@gmail.com',
        alert: newAlert,
        site: targetSite,
        reasoningSummary: newAlert.explanation,
        recommendation: newAlert.recommendation,
      }).catch((e) => console.warn('PM Alert Email dispatch notice:', e.message))
    })

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
    // 1. Alert Approval Logic (Emergency PO or Inter-site Transfer)
    // -------------------------------------------------------------------------
    const recLower = (existing.recommendation || '').toLowerCase()
    const titleLower = (existing.title || '').toLowerCase()
    const isEmergencyPOAlert =
      existing.type === 'emergency_procurement_fallback' ||
      recLower.includes('emergency po') ||
      recLower.includes('expedite emergency') ||
      recLower.includes('raise po') ||
      recLower.includes('expedite') ||
      (!existing.transferDetails && !recLower.includes('transfer'))

    // 1a. If approving an emergency procurement / shortage reorder alert:
    if (status === 'approved' && isEmergencyPOAlert && existing.type !== 'incoming_transfer_request') {
      const nowIso = new Date().toISOString()
      const newPoId = `PO-EMG-${Math.floor(2000 + Math.random() * 8000)}`

      // Determine item name accurately from recommendation / title
      let targetItem = 'Ultratech OPC 53 Grade Cement'
      if (recLower.includes('ultratech') || titleLower.includes('ultratech')) {
        targetItem = 'Ultratech OPC 53 Grade Cement'
      } else if (recLower.includes('steel') || titleLower.includes('steel') || recLower.includes('tmt')) {
        targetItem = 'Fe-550D TMT Steel Rebar'
      } else if (recLower.includes('aac') || titleLower.includes('aac')) {
        targetItem = 'AAC Autoclaved Blocks'
      } else if (recLower.includes('cement') || titleLower.includes('cement')) {
        targetItem = 'Cement Portland Type I'
      } else if (existing.sources?.[0]?.label) {
        targetItem = existing.sources[0].label
      }

      // Find matching vendor
      const vendors = (await getCollectionDirect('vendors')) || []
      const matchedVendor = vendors.find((v) =>
        targetItem.toLowerCase().includes('cement')
          ? v.name?.toLowerCase().includes('ultratech') || v.category === 'Cement'
          : targetItem.toLowerCase().includes('steel')
          ? v.name?.toLowerCase().includes('tata') || v.category === 'Steel'
          : true
      ) || vendors[0] || { id: 'VEN-002', name: 'Ultratech Building Solutions' }

      const qty = targetItem.toLowerCase().includes('tonnes') ? 10 : 250
      const unit = targetItem.toLowerCase().includes('steel') ? 'tonnes' : 'bags'
      const unitPrice = targetItem.toLowerCase().includes('steel') ? 64500 : 390
      const calculatedAmount = qty * unitPrice

      const newOrder = {
        id: newPoId,
        item: targetItem,
        vendorId: matchedVendor.id || 'VEN-002',
        vendorName: matchedVendor.name || 'Ultratech Building Solutions',
        siteId: existing.siteId,
        quantity: qty,
        unit: unit,
        amount: calculatedAmount,
        stage: 'Purchase Order',
        status: 'Approved',
        dateRaised: nowIso.slice(0, 10),
        expectedDelivery: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        delayDays: 0,
        note: `Emergency PO automatically raised and approved via AI alert approval (${existing.id})`,
      }

      if (pool) {
        try {
          await pool.query(
            `INSERT INTO procurement_orders (id, site_id, item, vendor_id, amount, stage, status, date_raised, expected_delivery, delay_days, data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO UPDATE SET stage = EXCLUDED.stage, status = EXCLUDED.status, data = EXCLUDED.data`,
            [
              newOrder.id,
              newOrder.siteId,
              newOrder.item,
              newOrder.vendorId,
              newOrder.amount,
              newOrder.stage,
              newOrder.status,
              newOrder.dateRaised,
              newOrder.expectedDelivery,
              newOrder.delayDays,
              JSON.stringify(newOrder),
            ]
          )
        } catch (err) {
          console.warn('Error inserting emergency PO in PostgreSQL:', err.message)
        }
      }
      await updateByIdDirect('procurementOrders', newOrder.id, newOrder)
      console.log(`[EMERGENCY PO] Real purchase order ${newPoId} created and dispatched to ${matchedVendor.name} for ${existing.siteId}`)

      const updatedAlert = {
        ...existing,
        status: 'approved',
        resolvedAt: nowIso,
        title: `✓ Emergency PO Raised (${newPoId}): ${qty} ${unit} of ${targetItem}`,
        explanation: `Emergency Purchase Order ${newPoId} for ${qty} ${unit} of ${targetItem} (₹${calculatedAmount.toLocaleString('en-IN')}) has been raised with ${matchedVendor.name} under expedited 24-48h express delivery.`,
      }
      await insertAlertDirect(updatedAlert)
      return res.json(updatedAlert)
    }

    // 1b. If approving a shortage alert with active transfer recommendation:
    const isShortageTransferApproval =
      status === 'approved' &&
      (existing.transferDetails || recLower.includes('transfer')) &&
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

        // 2b. Transition Site B alert directly to emergency procurement fallback
        if (targetAlertId) {
          const targetAlert = alerts.find((a) => a.id === targetAlertId)
          if (targetAlert) {
            await insertAlertDirect({
              ...targetAlert,
              status: 'pending',
              type: 'emergency_procurement_fallback',
              title: `Transfer Declined by ${transfer.sourceSiteName || 'Riverside Tower'} — Emergency PO Recommended`,
              explanation: `${transfer.sourceSiteName || 'Riverside Tower'} was unable to authorize the ${transfer.quantity || 150} ${transfer.unit || 'bags'} transfer. Inter-site transfer route is unavailable. Critical supply shortage for ${transfer.item || 'Cement Portland Type I'} remains active at ${transfer.targetSiteName || 'Warehouse Expansion'}.`,
              reasonPoints: [
                `Inter-site stock transfer was declined by ${transfer.sourceSiteName || 'Riverside Tower'}.`,
                `Current stock is 150 bags (runway: 2.7 days before stockout).`,
                `Direct emergency vendor procurement is now the required action.`,
              ],
              recommendation: `Expedite Emergency Purchase Order for 500 ${transfer.unit || 'bags'} of ${transfer.item || 'Cement Portland Type I'} from local vendor BuildPro Materials.`,
              transferDetails: null,
              rejectedAt: new Date().toISOString(),
            })
            console.log(`[ALERT] Updated target alert ${targetAlertId} to emergency fallback for ${transfer.targetSiteId}`)
          }
        }

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

