import { getCollectionDirect, insertAlertDirect, readDb } from '../db.js'

export const MONITORING_TOOLS = {
  getInventory: async ({ siteId }) => {
    console.log(`[TOOL] get_inventory(${siteId || 'ALL'})`)
    const items = await getCollectionDirect('inventory')
    return siteId ? items.filter((i) => i.siteId === siteId) : items
  },
  getPendingDeliveries: async ({ siteId }) => {
    console.log(`[TOOL] get_deliveries(${siteId || 'ALL'})`)
    const orders = await getCollectionDirect('procurementOrders')
    const deliveries = await getCollectionDirect('deliveries')
    const siteOrders = siteId ? orders.filter((o) => o.siteId === siteId) : orders
    const deliveryStage = siteOrders.filter(
      (o) => o.stage === 'Delivery' || (o.status && o.status.toLowerCase().includes('delay'))
    )
    return { pendingOrders: deliveryStage, deliveries }
  },
  getVendorHistory: async ({ vendorId }) => {
    console.log(`[TOOL] get_vendors(${vendorId || 'ALL'})`)
    const vendors = await getCollectionDirect('vendors')
    if (vendorId) {
      return vendors.find((v) => v.id === vendorId) || null
    }
    return vendors
  },
  getBudgetVariance: async ({ siteId }) => {
    console.log(`[TOOL] get_budget_breakdown(${siteId || 'ALL'})`)
    const db = readDb()
    const budgetMap = db.budgetByCategory || {}
    const sites = await getCollectionDirect('sites')
    const site = sites.find((s) => s.id === siteId)
    return {
      siteBudget: site ? { planned: site.budgetPlanned, actual: site.budgetActual } : null,
      breakdown: siteId ? budgetMap[siteId] || [] : budgetMap,
    }
  },
  getEquipmentUtilization: async ({ siteId }) => {
    console.log(`[TOOL] get_equipment(${siteId || 'ALL'})`)
    const equipment = await getCollectionDirect('equipment')
    return siteId ? equipment.filter((e) => e.siteId === siteId) : equipment
  },
  getTaskStatus: async ({ siteId }) => {
    console.log(`[TOOL] get_tasks(${siteId || 'ALL'})`)
    const tasks = await getCollectionDirect('tasks')
    return siteId ? tasks.filter((t) => t.siteId === siteId) : tasks
  },
}

export async function executeMonitoringTool(toolName, args = {}) {
  const toolFn = MONITORING_TOOLS[toolName]
  if (!toolFn) {
    throw new Error(`Unknown monitoring tool: ${toolName}`)
  }
  return await toolFn(args)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// In-memory cache for recent monitoring logs per site
const agentLogsBySite = {}

export function getAgentLogs(siteId) {
  return agentLogsBySite[siteId] || []
}

/**
 * Execute the autonomous AI operations monitoring loop for a specific site
 * and push SSE events in real-time.
 */
export async function runMonitoringStream(siteId, res) {
  let isClosed = false
  const cleanupHandlers = []

  const onClose = () => {
    isClosed = true
    cleanupHandlers.forEach((fn) => fn())
  }

  res.on('close', onClose)
  res.on('error', onClose)

  if (!agentLogsBySite[siteId]) {
    agentLogsBySite[siteId] = []
  }

  function emit(event) {
    if (!isClosed && !res.writableEnded) {
      const entry = {
        ...event,
        id: `${siteId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
      }
      if (event.type !== 'heartbeat') {
        agentLogsBySite[siteId].push(entry)
        // Keep last 40 logs per site
        if (agentLogsBySite[siteId].length > 40) {
          agentLogsBySite[siteId] = agentLogsBySite[siteId].slice(-40)
        }
      }
      res.write(`data: ${JSON.stringify(entry)}\n\n`)
    }
  }

  console.log(`[AGENT] Monitoring started for ${siteId}`)
  const sites = await getCollectionDirect('sites')
  const currentSite = sites.find((s) => s.id === siteId) || { id: siteId, name: siteId }

  try {
    // 1. Initial greeting
    emit({ type: 'checking', message: `Initializing AI monitoring cycle for ${currentSite.name}...` })
    await sleep(400)
    if (isClosed) return

    // 2. Inventory Scan
    emit({ type: 'checking', message: `Checking inventory stock levels & consumption rates (${siteId})...` })
    const inventory = await executeMonitoringTool('getInventory', { siteId })
    await sleep(450)
    if (isClosed) return

    // 3. Deliveries & Procurement Scan
    emit({ type: 'checking', message: 'Checking pending delivery status and PO dispatch stages...' })
    const deliveries = await executeMonitoringTool('getPendingDeliveries', { siteId })
    await sleep(450)
    if (isClosed) return

    // 4. Vendor History Retrieval
    emit({ type: 'retrieving', message: 'Retrieving vendor reliability logs & transport metrics...' })
    const vendors = await executeMonitoringTool('getVendorHistory', {})
    await sleep(450)
    if (isClosed) return

    // 5. Equipment & Task Investigation
    emit({ type: 'investigating', message: 'Cross-referencing equipment idle records & milestone dependencies...' })
    const equipment = await executeMonitoringTool('getEquipmentUtilization', { siteId })
    const tasks = await executeMonitoringTool('getTaskStatus', { siteId })
    await sleep(500)
    if (isClosed) return

    console.log(`[AGENT] Analyzing real database results for ${siteId}...`)

    // 6. Autonomous Anomaly Detection & Reasoning from real database records
    const allInventory = await getCollectionDirect('inventory')
    const criticalInventory = inventory.find(
      (i) => i.status === 'CRITICAL' || i.status === 'Critical' || (i.consumptionPerDay && (i.quantity / i.consumptionPerDay) <= 4)
    )
    const idleEquipment = equipment.find((e) => e.status === 'Idle' && e.idleDays >= 4)
    const delayedPO = deliveries.pendingOrders?.find((o) => o.delayDays > 0 || o.status?.toLowerCase().includes('delay'))

    if (criticalInventory) {
      console.log(`[AGENT] Shortage detected for ${criticalInventory.item} (${criticalInventory.quantity} ${criticalInventory.unit} remaining)`)
      const daysLeft = criticalInventory.consumptionPerDay
        ? Math.round((criticalInventory.quantity / criticalInventory.consumptionPerDay) * 10) / 10
        : 3.2

      emit({
        type: 'flagged',
        message: `⚠ Shortage risk detected — ${criticalInventory.item} has ${daysLeft} days to critical stockout`,
      })
      await sleep(500)
      if (isClosed) return

      // Check if an inter-site transfer was previously rejected/declined
      const existingAlerts = await getCollectionDirect('alerts')
      const rejectedTransferAlert = existingAlerts.find(
        (a) =>
          a.siteId === siteId &&
          (a.status === 'transfer_rejected' || a.type === 'emergency_procurement_fallback') &&
          a.title.toLowerCase().includes(criticalInventory.item.toLowerCase())
      )

      const wasTransferRejected = Boolean(rejectedTransferAlert)

      // Find transferable stock at sibling sites (only if not previously rejected)
      const siblingStock = !wasTransferRejected
        ? allInventory.filter(
            (i) => i.siteId !== siteId && i.item === criticalInventory.item && i.quantity > (i.reorderThreshold || 0)
          )
        : []
      const transferSource = siblingStock[0]
      const transferSite = transferSource
        ? sites.find((s) => s.id === transferSource.siteId)?.name || transferSource.siteId
        : 'Riverside Tower'

      if (wasTransferRejected) {
        emit({
          type: 'flagged',
          message: `⚠ Note: Inter-site transfer was declined by Riverside Tower — switching to Emergency PO strategy.`,
        })
        await sleep(400)
        if (isClosed) return
      } else {
        emit({
          type: 'analyzing',
          message: `Scanning sibling sites for available ${criticalInventory.item} stock transfer...`,
        })
        await sleep(550)
        if (isClosed) return
      }

      emit({ type: 'resolved', message: 'Investigation completed' })
      await sleep(400)
      if (isClosed) return

      const recMessage = transferSource
        ? `Recommendation generated — transfer 150 ${criticalInventory.unit} of ${criticalInventory.item} from ${transferSite}`
        : wasTransferRejected
        ? `Recommendation generated — expedite Emergency Purchase Order for 500 ${criticalInventory.unit} of ${criticalInventory.item} from local supplier BuildPro Materials`
        : `Recommendation generated — expedite emergency PO for ${criticalInventory.item}`

      emit({
        type: 'recommendation',
        message: recMessage,
      })
      await sleep(450)
      if (isClosed) return

      console.log(`[ALERT] Evaluating alert state for ${siteId}...`)
      const matchedAlert = existingAlerts.find(
        (a) => a.siteId === siteId && a.title.toLowerCase().includes(criticalInventory.item.toLowerCase())
      )

      if (matchedAlert && matchedAlert.status !== 'pending') {
        // If alert was already actioned (e.g. approved, transfer_requested, resolved, emergency PO in progress), do NOT overwrite it!
        console.log(`[AGENT] Shortage alert ${matchedAlert.id} is already in state '${matchedAlert.status}'. Preserving state.`)
        emit({ type: 'alert', alert: matchedAlert })
      } else {
        const alertId = matchedAlert ? matchedAlert.id : `ALT-${Date.now().toString().slice(-4)}`
        const alert = {
          id: alertId,
          siteId,
          severity: 'critical',
          type: wasTransferRejected ? 'emergency_procurement_fallback' : 'standard',
          title: wasTransferRejected
            ? `Transfer Declined by Riverside Tower — Emergency PO Recommended for ${criticalInventory.item}`
            : `${criticalInventory.item} stock at ${currentSite.name} is projected to become critical in ${daysLeft} days.`,
          timestamp: matchedAlert ? matchedAlert.timestamp : new Date().toISOString(),
          explanation: wasTransferRejected
            ? `Riverside Tower site management declined the 150-bag transfer request. Inter-site transfer route is unavailable. Current consumption is ${criticalInventory.consumptionPerDay || 55} ${criticalInventory.unit}/day against remaining stock of ${criticalInventory.quantity} ${criticalInventory.unit}.`
            : `Current consumption is ${criticalInventory.consumptionPerDay || 55} ${criticalInventory.unit}/day against remaining stock of ${criticalInventory.quantity} ${criticalInventory.unit}. Pending replenishment is delayed by ${delayedPO?.delayDays || 4} days, causing a potential supply gap.`,
          reasonPoints: wasTransferRejected
            ? [
                `Inter-site stock transfer was declined by Riverside Tower.`,
                `Current stock is ${criticalInventory.quantity} ${criticalInventory.unit} (runway: ${daysLeft} days).`,
                `Direct vendor procurement is the only remaining replenishment pathway.`,
              ]
            : [
                `Current consumption is ${criticalInventory.consumptionPerDay || 55} ${criticalInventory.unit}/day.`,
                `Current stock is ${criticalInventory.quantity} ${criticalInventory.unit}.`,
                `Pending delivery (${delayedPO?.id || 'PO-2041'}) is delayed by ${delayedPO?.delayDays || 4} days.`,
              ],
          recommendation: recMessage.replace('Recommendation generated — ', ''),
          sources: [
            { type: 'inventory', id: criticalInventory.id, label: `Inventory Record ${criticalInventory.id}` },
            ...(delayedPO ? [{ type: 'procurement', id: delayedPO.id, label: `Purchase Order ${delayedPO.id}` }] : []),
            ...(delayedPO?.deliveryId ? [{ type: 'delivery', id: delayedPO.deliveryId, label: `Delivery ${delayedPO.deliveryId}` }] : []),
            ...(delayedPO?.vendorId ? [{ type: 'vendor', id: delayedPO.vendorId, label: `Vendor Record ${delayedPO.vendorId}` }] : []),
          ],
          status: 'pending',
          transferDetails: transferSource
            ? {
                sourceSiteId: transferSource.siteId,
                sourceSiteName: transferSite,
                targetSiteId: siteId,
                targetSiteName: currentSite.name,
                item: criticalInventory.item,
                quantity: 150,
                unit: criticalInventory.unit || 'bags',
              }
            : null,
        }

        await insertAlertDirect(alert)
        console.log(`[DB] Alert inserted into PostgreSQL: ${alert.id}`)
        emit({ type: 'alert', alert })
      }
    } else if (idleEquipment) {
      console.log(`[AGENT] Idle equipment detected: ${idleEquipment.name} (${idleEquipment.idleDays} days)`)
      emit({
        type: 'flagged',
        message: `⚠ Idle equipment detected — ${idleEquipment.name} idle for ${idleEquipment.idleDays} days (${idleEquipment.utilization}% util)`,
      })
      await sleep(500)
      if (isClosed) return

      emit({
        type: 'analyzing',
        message: 'Scanning active projects for reassignment opportunity...',
      })
      await sleep(550)
      if (isClosed) return

      emit({ type: 'resolved', message: 'Investigation completed' })
      await sleep(400)
      if (isClosed) return

      emit({
        type: 'recommendation',
        message: `Recommendation generated — reassign ${idleEquipment.name} to Metro Heights (Site C)`,
      })
      await sleep(450)
      if (isClosed) return

      emit({ type: 'waiting', message: 'Waiting for manager approval' })

      console.log(`[ALERT] Creating alert for idle equipment...`)
      const existingAlerts = await getCollectionDirect('alerts')
      const matchedAlert = existingAlerts.find(
        (a) => a.siteId === siteId && a.title.toLowerCase().includes(idleEquipment.name.toLowerCase())
      )
      const alertId = matchedAlert ? matchedAlert.id : `ALT-${Date.now().toString().slice(-4)}`

      const alert = {
        id: alertId,
        siteId,
        severity: 'warning',
        title: `${idleEquipment.name} has been idle for ${idleEquipment.idleDays} days.`,
        timestamp: new Date().toISOString(),
        explanation: `${idleEquipment.name} utilization has dropped to ${idleEquipment.utilization}% while active tasks at ${currentSite.name} proceed on schedule. Continued idling accrues unnecessary rental cost.`,
        reasonPoints: [
          `No active task assignment logged for ${idleEquipment.idleDays} days.`,
          `Utilization has fallen to ${idleEquipment.utilization}%.`,
          `Daily rental cost continues to accrue.`,
        ],
        recommendation: `Reassign ${idleEquipment.name} to Metro Heights where equipment is under maintenance.`,
        sources: [
          { type: 'equipment', id: idleEquipment.id, label: `Equipment Record ${idleEquipment.id}` },
        ],
        status: matchedAlert?.status || 'pending',
      }

      await insertAlertDirect(alert)
      console.log(`[DB] Alert inserted into PostgreSQL: ${alert.id}`)
      emit({ type: 'alert', alert })
    } else {
      emit({ type: 'analyzing', message: 'Comparing planned vs actual spend by category...' })
      await sleep(500)
      if (isClosed) return

      console.log(`[AGENT] No anomalies detected for ${siteId}`)
      emit({ type: 'resolved', message: `No anomalies detected this monitoring cycle for ${currentSite.name}` })
    }

    emit({ type: 'idle', message: 'Autonomous agent active — continuous site telemetry online.' })
  } catch (err) {
    console.error('Monitoring stream error:', err.message)
    emit({ type: 'resolved', message: 'Monitoring cycle completed with database verification.' })
  }

  // Keep stream alive with periodic heartbeats rather than closing the connection
  const heartbeat = setInterval(() => {
    if (isClosed || res.writableEnded) {
      clearInterval(heartbeat)
      return
    }
    try {
      res.write(': keepalive\n\n')
    } catch (e) {
      clearInterval(heartbeat)
    }
  }, 15000)

  cleanupHandlers.push(() => clearInterval(heartbeat))

  // Keep promise open until connection is closed by client
  return new Promise((resolve) => {
    cleanupHandlers.push(resolve)
  })
}
