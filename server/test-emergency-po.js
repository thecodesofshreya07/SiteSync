const API_BASE = 'http://localhost:4000/api'

async function testEmergencyPOApproval() {
  console.log('--- STARTING EMERGENCY PO ALERT APPROVAL TEST ---')

  // 1. Create the alert described by the user
  console.log('\n[STEP 1] Creating alert with recommendation: "expedite emergency PO for ultratech wala cement : desh ka number 1 choice"...')
  const alertRes = await fetch(`${API_BASE}/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: `ALT-TEST-${Date.now().toString().slice(-4)}`,
      siteId: 'SITE-001',
      severity: 'critical',
      title: 'Ultratech Cement stock projected to stockout in 1.0 days',
      explanation: 'Current consumption is 10 bags/day against remaining stock of 10 bags. Pending replenishment is delayed by 8 days, causing a potential supply gap.',
      reasonPoints: [
        'Current consumption is 10 bags/day.',
        'Current stock is 10 bags.',
        'Pending delivery (PO-2070) is delayed by 8 days.',
      ],
      recommendation: 'expedite emergency PO for ultratech wala cement : desh ka number 1 choice',
      status: 'pending',
    }),
  })

  const createdAlert = await alertRes.json()
  console.log('Created Alert ID:', createdAlert.id, '| Status:', createdAlert.status)

  // 2. Approve the alert
  console.log('\n[STEP 2] Simulating user clicking "Approve" on the Alert Card...')
  const approveRes = await fetch(`${API_BASE}/alerts/${createdAlert.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved' }),
  })

  const approvedAlert = await approveRes.json()
  console.log('Approved Alert response status:', approvedAlert.status)
  console.log('Updated Alert Title:', approvedAlert.title)
  console.log('Updated Alert Explanation:', approvedAlert.explanation)

  // 3. Query procurement orders to verify the real PO was raised in the database
  console.log('\n[STEP 3] Verifying real Emergency Purchase Order in procurement database...')
  const poRes = await fetch(`${API_BASE}/procurement?siteId=SITE-001`)
  const orders = await poRes.json()

  const emergencyPO = orders.find(
    (o) =>
      (o.id.startsWith('PO-EMG') || (o.note && o.note.includes(createdAlert.id))) &&
      o.item.toLowerCase().includes('cement')
  )

  if (emergencyPO) {
    console.log('\n======================================================')
    console.log('✓ SUCCESS: REAL EMERGENCY PURCHASE ORDER FOUND IN DB!')
    console.log('======================================================')
    console.log('PO ID:', emergencyPO.id)
    console.log('Item:', emergencyPO.item)
    console.log('Vendor:', emergencyPO.vendorName, `(${emergencyPO.vendorId})`)
    console.log('Quantity:', emergencyPO.quantity, emergencyPO.unit)
    console.log('Total Amount:', `₹${emergencyPO.amount?.toLocaleString('en-IN')}`)
    console.log('Stage:', emergencyPO.stage)
    console.log('Status:', emergencyPO.status)
    console.log('Delivery Date:', emergencyPO.expectedDelivery)
    console.log('Audit Note:', emergencyPO.note)
  } else {
    console.error('✗ FAILED: Emergency PO not found in procurement orders list.')
    process.exit(1)
  }

  process.exit(0)
}

testEmergencyPOApproval().catch((err) => {
  console.error('Test execution error:', err)
  process.exit(1)
})
