import 'dotenv/config'
import { sendPORejectionEmail } from './services/emailService.js'

async function runTest() {
  console.log('--- SENDING HIGH-FIDELITY PO REJECTION EMAIL ---')

  const po = {
    id: 'PO-2849',
    item: 'Fe-550D TMT Steel Rebar',
    quantity: 15,
    unit: 'tonnes',
    amount: 967500,
  }

  const site = {
    id: 'SITE-002',
    name: 'Site B — Warehouse Expansion',
    budgetPlanned: 31000000,
    budgetActual: 34658000,
  }

  const reasoningSummary = `PO-2849 for ₹9,67,500 would push Site B — Warehouse Expansion actual spend to ₹3,56,25,500 against a ₹3,10,00,000 budget (+14.9% over planned allocation) — auto-rejected pending Finance Manager review.`

  const result = await sendPORejectionEmail({
    financeEmail: 'shreyamishra22042007@gmail.com',
    po,
    site,
    reasoningSummary,
  })

  console.log('Delivery Result:', result)
}

runTest().catch(console.error)
