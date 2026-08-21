import { getCollectionDirect, readDb } from '../db.js'

async function resolveSiteId(input) {
  if (!input || typeof input !== 'string') return null
  const clean = input.trim().toLowerCase()
  if (clean === 'null' || clean === 'undefined' || clean === '') return null

  const sites = await getCollectionDirect('sites')
  // Check exact ID match
  const byId = sites.find((s) => s.id.toLowerCase() === clean)
  if (byId) return byId.id

  // Check name includes match
  const byName = sites.find((s) => s.name.toLowerCase().includes(clean))
  if (byName) return byName.id

  return input
}

export const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_sites',
      description: 'Retrieve summary of all construction sites or a specific site by ID or name (Riverside Tower, Warehouse Expansion, Metro Heights, Greenfield).',
      parameters: {
        type: 'object',
        properties: {
          siteId: {
            type: ['string', 'null'],
            description: 'Optional site ID or site name (e.g. SITE-001 or "Riverside Tower")',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_inventory',
      description: 'Retrieve site inventory records including current stock quantity, units, reorder threshold, consumption rate per day, days to stockout, status (Normal, Low, Critical), and last transaction.',
      parameters: {
        type: 'object',
        properties: {
          siteId: {
            type: ['string', 'null'],
            description: 'Optional site ID or site name to filter inventory (e.g. SITE-001, "Riverside Tower", SITE-002)',
          },
          item: {
            type: ['string', 'null'],
            description: 'Optional item name to search for (e.g. "Cement", "Steel", "Bricks", "PVC Pipes")',
          },
          criticalOnly: {
            type: ['boolean', 'null'],
            description: 'Set to true to only return low or critical stock items needing attention',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_procurement_orders',
      description: 'Retrieve procurement purchase orders (PO), items, quantities, stages (Material Request, Vendor Quote, Approval, Purchase Order, Delivery, Expense), status, amounts in INR, and vendor IDs.',
      parameters: {
        type: 'object',
        properties: {
          siteId: {
            type: ['string', 'null'],
            description: 'Optional site ID or site name filter',
          },
          stage: {
            type: ['string', 'null'],
            description: 'Optional procurement stage filter',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_equipment',
      description: 'Retrieve construction equipment details, utilization %, idle days, status (Active, Idle, Under Maintenance), and assigned site.',
      parameters: {
        type: 'object',
        properties: {
          siteId: {
            type: ['string', 'null'],
            description: 'Optional site ID or site name filter',
          },
          status: {
            type: ['string', 'null'],
            description: 'Optional status filter: Active, Idle, or Under Maintenance',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_tasks',
      description: 'Retrieve project milestones and construction tasks, completion percentage, due dates, assignee, and risks.',
      parameters: {
        type: 'object',
        properties: {
          siteId: {
            type: ['string', 'null'],
            description: 'Optional site ID or site name filter',
          },
          atRiskOnly: {
            type: ['boolean', 'null'],
            description: 'If true, returns only tasks flagged at risk or delayed',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_deliveries',
      description: 'Retrieve material delivery tracking records, PO IDs, expected delivery dates, revised dates, delay reasons, and status.',
      parameters: {
        type: 'object',
        properties: {
          delayedOnly: {
            type: ['boolean', 'null'],
            description: 'If true, returns only delayed deliveries',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_vendors',
      description: 'Retrieve vendor registry, categories, reliability rating (High, Moderate, Low), and average delay metrics.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: ['string', 'null'],
            description: 'Optional vendor category filter',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_alerts',
      description: 'Retrieve active operations alerts, severity (critical, warning, info), title, description, and recommended actions.',
      parameters: {
        type: 'object',
        properties: {
          siteId: {
            type: ['string', 'null'],
            description: 'Optional site ID filter',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_budget_breakdown',
      description: 'Retrieve detailed planned vs actual spend by category (Structural, Steel, Cement, MEP, Finishing, Equipment, Labor) for a site.',
      parameters: {
        type: 'object',
        properties: {
          siteId: {
            type: 'string',
            description: 'Site ID (e.g. SITE-001, SITE-002, SITE-003, SITE-004)',
          },
        },
        required: ['siteId'],
      },
    },
  },
]

export async function executeTool(toolName, args = {}) {
  const targetSiteId = await resolveSiteId(args.siteId)

  switch (toolName) {
    case 'get_sites': {
      const sites = await getCollectionDirect('sites')
      if (targetSiteId) {
        return sites.filter((s) => s.id === targetSiteId)
      }
      return sites
    }

    case 'get_inventory': {
      let items = await getCollectionDirect('inventory')
      if (targetSiteId) {
        items = items.filter((i) => i.siteId === targetSiteId)
      }
      if (args.item && typeof args.item === 'string') {
        const itemTerm = args.item.toLowerCase()
        items = items.filter((i) => i.item.toLowerCase().includes(itemTerm))
      }
      if (args.criticalOnly) {
        items = items.filter(
          (i) => i.status === 'Critical' || i.status === 'CRITICAL' || i.status === 'Low' || i.status === 'LOW' || (i.daysToStockout && i.daysToStockout <= 5)
        )
      }
      return items
    }

    case 'get_procurement_orders': {
      let orders = await getCollectionDirect('procurementOrders')
      if (targetSiteId) {
        orders = orders.filter((o) => o.siteId === targetSiteId)
      }
      if (args.stage && typeof args.stage === 'string') {
        orders = orders.filter((o) => o.stage?.toLowerCase() === args.stage.toLowerCase())
      }
      return orders
    }

    case 'get_equipment': {
      let eq = await getCollectionDirect('equipment')
      if (targetSiteId) {
        eq = eq.filter((e) => e.siteId === targetSiteId)
      }
      if (args.status && typeof args.status === 'string') {
        eq = eq.filter((e) => e.status?.toLowerCase() === args.status.toLowerCase())
      }
      return eq
    }

    case 'get_tasks': {
      let tasks = await getCollectionDirect('tasks')
      if (targetSiteId) {
        tasks = tasks.filter((t) => t.siteId === targetSiteId)
      }
      if (args.atRiskOnly) {
        tasks = tasks.filter((t) => t.priority === 'High' || t.progress < 70 || t.column === 'In Progress')
      }
      return tasks
    }

    case 'get_deliveries': {
      let deliveries = await getCollectionDirect('deliveries')
      if (args.delayedOnly) {
        deliveries = deliveries.filter((d) => d.status === 'Delayed' || (d.delayDays && d.delayDays > 0))
      }
      return deliveries
    }

    case 'get_vendors': {
      let vendors = await getCollectionDirect('vendors')
      if (args.category && typeof args.category === 'string') {
        vendors = vendors.filter((v) => v.category?.toLowerCase().includes(args.category.toLowerCase()))
      }
      return vendors
    }

    case 'get_alerts': {
      let alerts = await getCollectionDirect('alerts')
      if (targetSiteId) {
        alerts = alerts.filter((a) => a.siteId === targetSiteId)
      }
      return alerts
    }

    case 'get_budget_breakdown': {
      const db = readDb()
      const budgetMap = db.budgetByCategory || {}
      if (targetSiteId) {
        return budgetMap[targetSiteId] || []
      }
      return budgetMap
    }

    default:
      throw new Error(`Unknown tool name: "${toolName}"`)
  }
}
