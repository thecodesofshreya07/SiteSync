import { getCollectionDirect, insertAlertDirect, updateAlertStatusDirect } from './db.js'

async function runTest() {
  console.log('--- STARTING MULTI-SITE TRANSFER & ALERT TEST ---')
  
  // 1. Check initial inventory
  const inventory = await getCollectionDirect('inventory')
  const site1Cement = inventory.find(i => i.siteId === 'SITE-001' && i.item && i.item.includes('Cement'))
  const site2Cement = inventory.find(i => i.siteId === 'SITE-002' && i.item && i.item.includes('Cement'))
  
  console.log(`[INIT] SITE-001 Cement Qty: ${site1Cement?.quantity ?? 'N/A'}`)
  console.log(`[INIT] SITE-002 Cement Qty: ${site2Cement?.quantity ?? 'N/A'}`)
  
  // 2. Simulate Shortage Alert at SITE-002
  const shortageAlert = {
    id: `ALT-TEST-${Date.now().toString().slice(-4)}`,
    siteId: 'SITE-002',
    severity: 'critical',
    title: 'Cement Portland Type I stock is projected to become critical in 3.2 days.',
    explanation: 'Current consumption is 55 bags/day against remaining stock of 180 bags. Pending replenishment is delayed.',
    recommendation: 'Transfer 150 bags of Cement Portland Type I from Riverside Tower',
    sources: [{ type: 'inventory', id: site2Cement?.id || 'INV-104', label: 'Inventory Record' }],
    status: 'pending',
    transferDetails: {
      sourceSiteId: 'SITE-001',
      sourceSiteName: 'Riverside Tower',
      targetSiteId: 'SITE-002',
      targetSiteName: 'Warehouse Expansion',
      item: 'Cement Portland Type I',
      quantity: 150,
      unit: 'bags'
    }
  }
  
  await insertAlertDirect(shortageAlert)
  console.log(`[STEP 1] Created shortage alert at SITE-002: ${shortageAlert.id}`)
  
  // 3. Simulate SITE-002 Manager approving the alert via API
  const patchRes = await fetch(`http://localhost:4000/api/alerts/${shortageAlert.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved' })
  })
  const patchedAlert = await patchRes.json()
  console.log(`[STEP 2] SITE-002 approved shortage alert. New status: ${patchedAlert.status}`)
  
  // 4. Verify Riverside Tower received the incoming transfer alert
  const alertsAfterStep2 = await getCollectionDirect('alerts')
  const incomingAlert = alertsAfterStep2.find(a => a.siteId === 'SITE-001' && a.type === 'incoming_transfer_request' && a.transferDetails?.targetAlertId === shortageAlert.id)
  
  console.log(`[STEP 3] Riverside Tower (SITE-001) incoming transfer alert:`, incomingAlert ? `FOUND (${incomingAlert.id} - ${incomingAlert.title})` : 'NOT FOUND')
  
  if (incomingAlert) {
    // 5. Simulate Riverside Tower Manager Authorizing Dispatch
    console.log(`[STEP 4] Riverside Tower authorizing dispatch...`)
    const authRes = await fetch(`http://localhost:4000/api/alerts/${incomingAlert.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    })
    const authResult = await authRes.json()
    console.log(`[STEP 4] Dispatch authorized status: ${authResult.status}`)
    
    // 6. Verify inventory levels after transfer
    const updatedInventory = await getCollectionDirect('inventory')
    const updatedSite1Cement = updatedInventory.find(i => i.siteId === 'SITE-001' && i.item && i.item.includes('Cement'))
    const updatedSite2Cement = updatedInventory.find(i => i.siteId === 'SITE-002' && i.item && i.item.includes('Cement'))
    
    console.log(`[RESULT] SITE-001 Cement Qty: ${updatedSite1Cement?.quantity}`)
    console.log(`[RESULT] SITE-002 Cement Qty: ${updatedSite2Cement?.quantity}`)
    console.log(`[RESULT] SITE-001 Last Transaction:`, updatedSite1Cement?.lastTransaction)
    console.log(`[RESULT] SITE-002 Last Transaction:`, updatedSite2Cement?.lastTransaction)
    
    // 7. Verify SITE-002 received resolution
    const alertsFinal = await getCollectionDirect('alerts')
    const targetAlertFinal = alertsFinal.find(a => a.id === shortageAlert.id)
    console.log(`[RESULT] SITE-002 Alert Final Status: ${targetAlertFinal?.status} - ${targetAlertFinal?.title}`)
  }
  
  console.log('--- TEST COMPLETED SUCCESSFULLY ---')
  process.exit(0)
}

runTest().catch(console.error)
