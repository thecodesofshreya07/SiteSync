import { getCollectionDirect, readDb } from '../db.js'

/**
 * Load all retrievable operational records from live PostgreSQL tables
 * and format them into searchable semantic text documents with rich metadata.
 */
export async function loadAllRetrievableRecords() {
  const [sites, inventory, procurementOrders, deliveries, equipment, tasks, vendors, alerts] =
    await Promise.all([
      getCollectionDirect('sites'),
      getCollectionDirect('inventory'),
      getCollectionDirect('procurementOrders'),
      getCollectionDirect('deliveries'),
      getCollectionDirect('equipment'),
      getCollectionDirect('tasks'),
      getCollectionDirect('vendors'),
      getCollectionDirect('alerts'),
    ])

  const siteMap = new Map((sites || []).map((s) => [s.id, s.name]))
  const vendorMap = new Map((vendors || []).map((v) => [v.id, v.name]))

  const documents = []

  // 1. INVENTORY DOCUMENTS (Highest priority for stock & material queries)
  for (const item of inventory || []) {
    const siteName = siteMap.get(item.siteId) || item.siteId
    const daysLeft =
      item.consumptionPerDay && item.consumptionPerDay > 0
        ? Math.round((item.quantity / item.consumptionPerDay) * 10) / 10
        : 'N/A'

    const docText = `Inventory Record ${item.id}: ${item.item} at ${siteName} (${item.siteId}). Current Stock Quantity: ${item.quantity} ${item.unit || 'units'}. Status: ${item.status || 'Normal'}. Daily Consumption Rate: ${item.consumptionPerDay || 0} ${item.unit || 'units'}/day. Reorder Safety Threshold: ${item.reorderThreshold || 0} ${item.unit || 'units'}. Estimated Days to Stockout: ${daysLeft} days. Last Transaction: ${item.lastTransaction?.type || 'None'} (${item.lastTransaction?.quantity || 0} ${item.unit || ''} on ${item.lastTransaction?.date || 'N/A'}, related PO: ${item.lastTransaction?.relatedPO || 'None'}).`

    documents.push({
      id: item.id,
      type: 'inventory',
      siteId: item.siteId,
      siteName,
      label: `Inventory ${item.id} (${item.item})`,
      item: item.item,
      category: 'Material Inventory',
      text: docText,
    })
  }

  // 2. PROCUREMENT / PURCHASE ORDER DOCUMENTS
  for (const po of procurementOrders || []) {
    const siteName = siteMap.get(po.siteId) || po.siteId
    const vendorName = vendorMap.get(po.vendorId) || po.vendor || po.vendorId || 'Vendor'

    const docText = `Purchase Order ${po.id}: Material: ${po.item} for ${siteName} (${po.siteId}). Vendor: ${vendorName} (${po.vendorId || ''}). Total Order Amount: ₹${po.amount?.toLocaleString('en-IN') || 0}. Quantity: ${po.quantity || 'N/A'} ${po.unit || ''}. Current Procurement Stage: ${po.stage || 'In Progress'}. Status: ${po.status || 'Active'}. Expected Delivery Date: ${po.expectedDelivery || 'TBD'}. Delay Days: ${po.delayDays || 0} days.`

    documents.push({
      id: po.id,
      type: 'procurement',
      siteId: po.siteId,
      siteName,
      label: `Purchase Order ${po.id} (${po.item})`,
      item: po.item,
      category: 'Procurement Order',
      text: docText,
    })
  }

  // 3. DELIVERY TRACKING DOCUMENTS
  for (const del of deliveries || []) {
    const siteName = siteMap.get(del.siteId) || del.siteId
    const docText = `Delivery Tracking ${del.id}: Related Purchase Order: ${del.poId}. Site: ${siteName} (${del.siteId}). Delivery Status: ${del.status || 'Active'}. Delay Days: ${del.delayDays || 0} days. Delay Reason: ${del.delayReason || 'None'}. Expected Date: ${del.expectedDate || 'N/A'}. Revised Arrival Date: ${del.revisedDate || 'N/A'}. Carrier: ${del.carrier || 'Standard Transport'}.`

    documents.push({
      id: del.id,
      type: 'delivery',
      siteId: del.siteId,
      siteName,
      label: `Delivery ${del.id}`,
      category: 'Delivery Tracking',
      text: docText,
    })
  }

  // 4. EQUIPMENT UTILIZATION DOCUMENTS
  for (const eq of equipment || []) {
    const siteName = siteMap.get(eq.siteId) || eq.siteId
    const docText = `Equipment Record ${eq.id}: ${eq.name} (${eq.category || 'Machinery'}) at ${siteName} (${eq.siteId}). Operating Status: ${eq.status || 'Active'}. Weekly Utilization Rate: ${eq.utilization || 0}%. Idle Days: ${eq.idleDays || 0} days. Assigned Task: ${eq.assignedTaskName || eq.assignedTask || 'No active task'}. Daily Rental Rate: ₹${eq.dailyCost || 0}/day.`

    documents.push({
      id: eq.id,
      type: 'equipment',
      siteId: eq.siteId,
      siteName,
      label: `Equipment ${eq.id} (${eq.name})`,
      category: 'Equipment',
      text: docText,
    })
  }

  // 5. PROJECT TASKS & MILESTONES
  for (const task of tasks || []) {
    const siteName = siteMap.get(task.siteId) || task.siteId
    const docText = `Project Task ${task.id}: ${task.name} at ${siteName} (${task.siteId}). Priority: ${task.priority || 'Medium'}. Completion Progress: ${task.progress || 0}%. Kanban Column: ${task.column || 'In Progress'}. Due Date: ${task.dueDate || 'N/A'}. Assignee: ${task.assignee || 'Field Team'}. Dependencies / Risks: ${task.riskNotes || 'On schedule'}.`

    documents.push({
      id: task.id,
      type: 'task',
      siteId: task.siteId,
      siteName,
      label: `Task ${task.id} (${task.name})`,
      category: 'Construction Task',
      text: docText,
    })
  }

  // 6. VENDORS
  for (const ven of vendors || []) {
    const docText = `Vendor Record ${ven.id}: ${ven.name}. Supply Category: ${ven.category || 'General Materials'}. Reliability Rating: ${ven.reliability || 'Moderate'}. Average Delivery Delay: ${ven.averageDelayDays || 0} days. Active Orders Count: ${ven.activeOrdersCount || 0}.`

    documents.push({
      id: ven.id,
      type: 'vendor',
      label: `Vendor ${ven.id} (${ven.name})`,
      category: 'Vendor Registry',
      text: docText,
    })
  }

  // 7. SITES & BUDGETS
  const db = readDb()
  const budgetMap = db.budgetByCategory || {}

  for (const site of sites || []) {
    const catBudgets = budgetMap[site.id] || []
    const catSummary = catBudgets.map((b) => `${b.category}: Planned ₹${b.planned}, Actual ₹${b.actual}`).join('; ')
    const docText = `Site & Budget Record ${site.id}: ${site.name} located in ${site.location}. Project Status: ${site.status || 'Active'}. Total Planned Budget: ₹${site.budgetPlanned?.toLocaleString('en-IN') || 0}. Total Actual Spend: ₹${site.budgetActual?.toLocaleString('en-IN') || 0}. Progress: ${site.progress || 0}%. Budget Breakdown: ${catSummary}.`

    documents.push({
      id: site.id,
      type: 'site',
      siteId: site.id,
      siteName: site.name,
      label: `Site ${site.id} (${site.name})`,
      category: 'Site Budget & Overview',
      text: docText,
    })
  }

  // 8. ACTIVE ALERTS
  for (const alert of alerts || []) {
    const siteName = siteMap.get(alert.siteId) || alert.siteId
    const docText = `AI Operations Alert ${alert.id}: Title: ${alert.title} at ${siteName} (${alert.siteId}). Severity: ${alert.severity || 'warning'}. Status: ${alert.status || 'pending'}. Explanation: ${alert.explanation || ''}. Recommendation: ${alert.recommendation || ''}.`

    documents.push({
      id: alert.id,
      type: 'alert',
      siteId: alert.siteId,
      siteName,
      label: `Alert ${alert.id}`,
      category: 'Operations Alert',
      text: docText,
    })
  }

  return documents
}
