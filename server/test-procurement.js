import app from './index.js'
import http from 'http'

const PORT = 5001 // use 5001 for automated test to avoid collision

const server = http.createServer(app)

server.listen(PORT, async () => {
  console.log(`Test server running on port ${PORT}`)
  const base = `http://localhost:${PORT}/api`

  try {
    // 1. Get all procurement
    console.log('\n--- Test 1: GET /api/procurement ---')
    let res = await fetch(`${base}/procurement`)
    let data = await res.json()
    console.log(`Status: ${res.status}, Count: ${data.length}`)
    if (res.status !== 200 || !Array.isArray(data) || data.length === 0) throw new Error('Test 1 failed')

    // 2. Get site-specific procurement
    console.log('\n--- Test 2: GET /api/procurement?siteId=SITE-002 ---')
    res = await fetch(`${base}/procurement?siteId=SITE-002`)
    data = await res.json()
    console.log(`Status: ${res.status}, Count: ${data.length}`)
    const allSite2 = data.every((o) => o.siteId === 'SITE-002')
    console.log(`All siteId === SITE-002: ${allSite2}`)
    if (res.status !== 200 || !allSite2 || data.length === 0) throw new Error('Test 2 failed')

    // 3. Get one procurement
    console.log('\n--- Test 3: GET /api/procurement/PO-2041 ---')
    res = await fetch(`${base}/procurement/PO-2041`)
    data = await res.json()
    console.log(`Status: ${res.status}, ID: ${data.id}, Item: ${data.item}, Stage: ${data.stage}`)
    if (res.status !== 200 || data.id !== 'PO-2041') throw new Error('Test 3 failed')

    // 4. Get vendor
    console.log('\n--- Test 4: GET /api/vendors/VEN-017 ---')
    res = await fetch(`${base}/vendors/VEN-017`)
    data = await res.json()
    console.log(`Status: ${res.status}, ID: ${data.id}, Name: ${data.name}`)
    if (res.status !== 200 || data.id !== 'VEN-017') throw new Error('Test 4 failed')

    // 5. Get delivery
    console.log('\n--- Test 5: GET /api/deliveries/DEL-882 ---')
    res = await fetch(`${base}/deliveries/DEL-882`)
    data = await res.json()
    console.log(`Status: ${res.status}, ID: ${data.id}, PO: ${data.poId}`)
    if (res.status !== 200 || data.id !== 'DEL-882') throw new Error('Test 5 failed')

    // 6. Update procurement PATCH
    console.log('\n--- Test 6: PATCH /api/procurement/PO-2041 ---')
    res = await fetch(`${base}/procurement/PO-2041`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'Approval', status: 'Approved' }),
    })
    data = await res.json()
    console.log(`Status: ${res.status}, Updated stage: ${data.stage}, status: ${data.status}`)
    if (res.status !== 200 || data.stage !== 'Approval' || data.status !== 'Approved') throw new Error('Test 6 failed')

    // Verify subsequent GET returns updated
    res = await fetch(`${base}/procurement/PO-2041`)
    data = await res.json()
    console.log(`Verification GET Status: ${res.status}, stage: ${data.stage}, status: ${data.status}`)
    if (data.stage !== 'Approval' || data.status !== 'Approved') throw new Error('Test 6 verification failed')

    // Restore PO-2041 back to initial state
    await fetch(`${base}/procurement/PO-2041`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'Delivery', status: 'Delivery delayed' }),
    })

    // 7. Invalid ID 404 tests
    console.log('\n--- Test 7: 404 tests for invalid IDs ---')
    res = await fetch(`${base}/procurement/PO-NONEXISTENT`)
    console.log(`Procurement 404 Status: ${res.status}`)
    if (res.status !== 404) throw new Error('Test 7a failed')

    res = await fetch(`${base}/vendors/VEN-NONEXISTENT`)
    console.log(`Vendor 404 Status: ${res.status}`)
    if (res.status !== 404) throw new Error('Test 7b failed')

    res = await fetch(`${base}/deliveries/DEL-NONEXISTENT`)
    console.log(`Delivery 404 Status: ${res.status}`)
    if (res.status !== 404) throw new Error('Test 7c failed')

    // 8. Invalid PATCH stage 400 test
    console.log('\n--- Test 8: 400 test for invalid stage ---')
    res = await fetch(`${base}/procurement/PO-2041`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'NonExistentStage' }),
    })
    console.log(`Invalid stage status: ${res.status}`)
    if (res.status !== 400) throw new Error('Test 8 failed')

    console.log('\n========================================')
    console.log('ALL PROCUREMENT BACKEND API TESTS PASSED!')
    console.log('========================================\n')
  } catch (err) {
    console.error('\n❌ Test execution failed:', err)
  } finally {
    server.close(() => {
      console.log('Test server closed.')
      process.exit(0)
    })
  }
})
