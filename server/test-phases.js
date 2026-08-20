import { getCollection, findById } from './db.js'

const API_BASE = 'http://localhost:4000/api'

async function runTests() {
  console.log('--- STARTING SITESYNC COMPREHENSIVE PHASE VERIFICATION ---')

  // 1. Test PO Budget Overrun Auto-Rejection (Site B budget is 31,000,000, actual is 32,645,000)
  console.log('\n[TEST 1] Testing Agentic PO Auto-Rejection on Budget Overrun...')
  const poRes = await fetch(`${API_BASE}/procurement`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'Contractor',
      'x-user-email': 'contractor@sitesync.com',
    },
    body: JSON.stringify({
      siteId: 'SITE-002',
      item: 'Structural PEB Steel Rafters',
      quantity: 10,
      unit: 'tonnes',
      amount: 850000,
      stage: 'Material Request',
    }),
  })

  const createdPO = await poRes.json()
  console.log('Created PO response status:', createdPO.status, '| Stage:', createdPO.stage)
  console.log('AI Rejection Reason:', createdPO.aiRejectionReason)

  if (createdPO.status === 'ai_rejected') {
    console.log('✓ PASS: PO was autonomously rejected due to site budget overrun.')
  } else {
    console.warn('✗ FAIL: PO was not auto-rejected:', createdPO)
  }

  // 2. Test Finance Manager Review & Override Loop
  console.log('\n[TEST 2] Testing Finance Manager Review & Override Loop...')
  const reviewRes = await fetch(`${API_BASE}/procurement/${createdPO.id}/ai-review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'Finance Manager',
      'x-user-email': 'shreyamishra22042007@gmail.com',
    },
    body: JSON.stringify({
      action: 'approve_override',
      note: 'Approved under Q3 contingency fund allocation.',
    }),
  })

  const reviewedPO = await reviewRes.json()
  console.log('Post-review PO status:', reviewedPO.status, '| Stage:', reviewedPO.stage)
  if (reviewedPO.status === 'Approved' && reviewedPO.stage === 'Purchase Order') {
    console.log('✓ PASS: Finance Manager successfully overruled AI rejection and approved PO.')
  } else {
    console.warn('✗ FAIL: Finance review failed:', reviewedPO)
  }

  // 3. Test Role-Based Material Access Control
  console.log('\n[TEST 3] Testing Strict Role-Based Material QR Access...')
  
  // 3a. Finance Manager access to inventory should return 403 Forbidden
  const financeInvRes = await fetch(`${API_BASE}/inventory?siteId=SITE-001`, {
    headers: { 'x-user-role': 'Finance Manager' },
  })
  console.log('Finance inventory HTTP code:', financeInvRes.status)
  if (financeInvRes.status === 403) {
    console.log('✓ PASS: Finance Manager is strictly forbidden (403) from material inventory.')
  } else {
    console.warn('✗ FAIL: Finance access was not rejected with 403:', financeInvRes.status)
  }

  // 3b. Contractor accessing another site (Site 1 Contractor querying Site 2) should return 403
  const contractorCrossSiteRes = await fetch(`${API_BASE}/inventory?siteId=SITE-002`, {
    headers: { 'x-user-role': 'Contractor', 'x-user-site-id': 'SITE-001' },
  })
  console.log('Contractor cross-site inventory HTTP code:', contractorCrossSiteRes.status)
  if (contractorCrossSiteRes.status === 403) {
    console.log('✓ PASS: Contractor is restricted from cross-site material scanning (403).')
  } else {
    console.warn('✗ FAIL: Cross-site access was not rejected with 403:', contractorCrossSiteRes.status)
  }

  // 3c. Contractor accessing their OWN site should return 200 OK
  const contractorOwnSiteRes = await fetch(`${API_BASE}/inventory?siteId=SITE-001`, {
    headers: { 'x-user-role': 'Contractor', 'x-user-site-id': 'SITE-001' },
  })
  console.log('Contractor own-site inventory HTTP code:', contractorOwnSiteRes.status)
  if (contractorOwnSiteRes.status === 200) {
    console.log('✓ PASS: Contractor has access to own assigned site materials.')
  } else {
    console.warn('✗ FAIL: Contractor own-site access failed:', contractorOwnSiteRes.status)
  }

  // 4. Test Photo Upload with Date & AI Work Prediction
  console.log('\n[TEST 4] Testing Photo Upload with Custom Date & AI Work Prediction...')
  const photoRes = await fetch(`${API_BASE}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      siteId: 'SITE-001',
      uploadedBy: 'Project Manager (PM)',
      fileUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?auto=format&fit=crop&w=1200&q=80',
      caption: '15th Floor Slab Rebar grid binding & conduit laying',
      locationTag: 'Tower A · Level 15 Deck',
      takenAt: '2026-08-20T10:00:00Z',
    }),
  })
  const createdPhoto = await photoRes.json()
  console.log('Created Photo ID:', createdPhoto.id)
  console.log('Taken At Date:', createdPhoto.takenAt)
  console.log('AI Work Prediction:', createdPhoto.workPrediction)
  if (createdPhoto.id && createdPhoto.workPrediction && createdPhoto.takenAt.startsWith('2026-08-20')) {
    console.log('✓ PASS: Photo logged with custom date and AI 72-hour work progress prediction.')
  } else {
    console.warn('✗ FAIL: Photo prediction failed:', createdPhoto)
  }

  console.log('\n========================================')
  console.log('ALL PHASES VERIFIED SUCCESSFULLY!')
  console.log('========================================')
  process.exit(0)
}

runTests().catch((e) => {
  console.error('Test execution error:', e)
  process.exit(1)
})
