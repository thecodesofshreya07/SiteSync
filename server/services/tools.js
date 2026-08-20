import { getCollection, readDb } from '../db.js'

export const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_sites',
      description: 'Retrieve summary of all construction sites including planned vs actual budget, progress %, status, and managers.',
      parameters: {
        type: 'object',
        properties: {
          siteId: {
            type: 'string',
            description: 'Optional specific site ID, e.g. SITE-001, SITE-002, SITE-003, SITE-004',
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
            type: 'string',
            description: 'Optional site ID to filter inventory (e.g. SITE-001, SITE-002)',
          },
          criticalOnly: {
            type: 'boolean',
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
            type: 'string',
            description: 'Optional site ID filter (e.g. SITE-002)',
          },
          stage: {
            type: 'string',
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
            type: 'string',
            description: 'Optional site ID filter',
          },
          status: {
            type: 'string',
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
            type: 'string',
            description: 'Optional site ID filter',
          },
          atRiskOnly: {
            type: 'boolean',
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
            type: 'boolean',
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
            type: 'string',
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
            type: 'string',
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
  switch (toolName) {
    case 'get_sites': {
      const sites = getCollection('sites')
      if (args.siteId) {
        return sites.filter((s) => s.id === args.siteId)
      }
      return sites
    }

    case 'get_inventory': {
      let items = getCollection('inventory')
      if (args.siteId) {
        items = items.filter((i) => i.siteId === args.siteId)
      }
      if (args.criticalOnly) {
        items = items.filter(
          (i) => i.status === 'Critical' || i.status === 'Low' || (i.daysToStockout && i.daysToStockout <= 5)
        )
      }
      return items
    }

    case 'get_procurement_orders': {
      let orders = getCollection('procurementOrders')
      if (args.siteId) {
        orders = orders.filter((o) => o.siteId === args.siteId)
      }
      if (args.stage) {
        orders = orders.filter((o) => o.stage?.toLowerCase() === args.stage.toLowerCase())
      }
      return orders
    }

    case 'get_equipment': {
      let eq = getCollection('equipment')
      if (args.siteId) {
        eq = eq.filter((e) => e.siteId === args.siteId)
      }
      if (args.status) {
        eq = eq.filter((e) => e.status?.toLowerCase() === args.status.toLowerCase())
      }
      return eq
    }

    case 'get_tasks': {
      let tasks = getCollection('tasks')
      if (args.siteId) {
        tasks = tasks.filter((t) => t.siteId === args.siteId)
      }
      if (args.atRiskOnly) {
        tasks = tasks.filter((t) => t.priority === 'High' || t.progress < 70 || t.column === 'In Progress')
      }
      return tasks
    }

    case 'get_deliveries': {
      let deliveries = getCollection('deliveries')
      if (args.delayedOnly) {
        deliveries = deliveries.filter((d) => d.status === 'Delayed' || (d.delayDays && d.delayDays > 0))
      }
      return deliveries
    }

    case 'get_vendors': {
      let vendors = getCollection('vendors')
      if (args.category) {
        vendors = vendors.filter((v) => v.category?.toLowerCase().includes(args.category.toLowerCase()))
      }
      return vendors
    }

    case 'get_alerts': {
      let alerts = getCollection('alerts')
      if (args.siteId) {
        alerts = alerts.filter((a) => a.siteId === args.siteId)
      }
      return alerts
    }

    case 'get_budget_breakdown': {
      const db = readDb()
      const budgetMap = db.budgetByCategory || {}
      if (args.siteId) {
        return budgetMap[args.siteId] || []
      }
      return budgetMap
    }

    default:
      throw new Error(`Unknown tool name: "${toolName}"`)
  }
}
