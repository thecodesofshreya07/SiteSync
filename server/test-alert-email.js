import 'dotenv/config'
import { sendPMAlertEmail } from './services/emailService.js'

async function runTest() {
  console.log('--- SENDING HIGH-FIDELITY LIVE ALERT EMAIL ---')

  const alert = {
    id: 'ALT-CEMENT-8821',
    severity: 'critical',
    title: 'Ultratech OPC 53 Grade Cement stock at Riverside Tower reached critical stockout (0.8 days runway)',
    explanation: 'Daily consumption is 40 bags/day against remaining stock of 30 bags. Pending replenishment PO-2070 is delayed by 4 days, creating an active concrete pouring bottleneck.',
    reasonPoints: [
      'Current stock balance has dropped to 30 bags.',
      'Daily consumption rate is 40 bags/day for active Level 15 deck slab casting.',
      'Pending delivery PO-2070 delayed by 4 days due to supplier transport bottleneck.',
      'Site B — Warehouse Expansion holds available surplus inventory of 300 bags.',
    ],
    recommendation: 'Authorize emergency stock transfer of 150 bags from Site B — Warehouse Expansion to prevent slab pouring stoppage.',
    siteId: 'SITE-001',
  }

  const site = {
    id: 'SITE-001',
    name: 'Riverside Tower',
  }

  const result = await sendPMAlertEmail({
    pmEmail: 'mirlubaib51005@gmail.com',
    alert,
    site,
    reasoningSummary: alert.explanation,
    recommendation: alert.recommendation,
  })

  console.log('Delivery Result:', result)
}

runTest().catch(console.error)
