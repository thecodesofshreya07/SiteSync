import { writeDb } from '../db.js'

import { sites, budgetByCategory } from '../../client/src/data/sites.js'
import { tasks, timelines } from '../../client/src/data/tasks.js'
import { equipment } from '../../client/src/data/equipment.js'
import { inventory } from '../../client/src/data/inventory.js'
import { vendors, procurementOrders, deliveries } from '../../client/src/data/procurement.js'
import { initialAlerts } from '../../client/src/data/alerts.js'
import { activityScripts } from '../../client/src/data/agentActivity.js'
import { suggestedQuestions, assistantResponses } from '../../client/src/data/assistantResponses.js'

export function seed() {
  console.log('Seeding database from client/src/data/*.js...')

  const data = {
    sites,
    budgetByCategory,
    tasks,
    timelines,
    equipment,
    inventory,
    vendors,
    procurementOrders,
    deliveries,
    alerts: initialAlerts,
    agentActivity: activityScripts,
    suggestedQuestions,
    assistantResponses,
  }

  const success = writeDb(data)

  if (success) {
    console.log('Database seeded successfully!')
    console.log(`- Sites: ${sites.length}`)
    console.log(`- Tasks: ${tasks.length}`)
    console.log(`- Equipment: ${equipment.length}`)
    console.log(`- Inventory Items: ${inventory.length}`)
    console.log(`- Procurement Orders: ${procurementOrders.length}`)
    console.log(`- Alerts: ${initialAlerts.length}`)
  } else {
    console.error('Failed to seed database.')
  }
}

seed()
