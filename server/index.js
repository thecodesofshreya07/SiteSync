import express from 'express'
import cors from 'cors'
import { config } from './config.js'

import sitesRouter from './routes/sites.js'
import tasksRouter from './routes/tasks.js'
import equipmentRouter from './routes/equipment.js'
import inventoryRouter from './routes/inventory.js'
import procurementRouter from './routes/procurement.js'
import vendorsRouter from './routes/vendors.js'
import deliveriesRouter from './routes/deliveries.js'
import alertsRouter from './routes/alerts.js'
import assistantRouter from './routes/assistant.js'
import timelineRouter from './routes/timeline.js'
import usersRouter from './routes/users.js'
import agentRouter from './routes/agent.js'

import { getPool } from './db.js'

const app = express()

// Middleware
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
    credentials: true,
  })
)
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    name: 'SiteSync API',
    version: '1.0.0',
    port: config.port,
    status: 'running',
    health: '/api/health',
  })
})

// Health check with DB status
app.get('/api/health', async (req, res) => {
  const pool = getPool()
  if (!pool) {
    return res.json({ status: 'ok', database: 'local JSON (db.json)' })
  }
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', database: 'connected to Supabase PostgreSQL' })
  } catch (err) {
    res.status(500).json({ status: 'degraded', error: err.message, database: 'fallback active' })
  }
})

// Mount routers
app.use('/api/sites', sitesRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/equipment', equipmentRouter)
app.use('/api/inventory', inventoryRouter)
app.use('/api/procurement', procurementRouter)
app.use('/api/vendors', vendorsRouter)
app.use('/api/deliveries', deliveriesRouter)
app.use('/api/alerts', alertsRouter)
app.use('/api/assistant', assistantRouter)
app.use('/api/timeline', timelineRouter)
app.use('/api/users', usersRouter)
app.use('/api/agent', agentRouter)

const PORT = config.port

app.listen(PORT, async () => {
  console.log(`SiteSync Express server listening on http://localhost:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)

  const pool = getPool()
  if (pool) {
    try {
      const res = await pool.query('SELECT current_database(), current_user, inet_server_addr()')
      let hostInfo = 'Supabase Cloud'
      if (config.databaseUrl) {
        try {
          const u = new URL(config.databaseUrl)
          hostInfo = u.host
        } catch (_) {}
      }
      console.log(`✓ Connected to PostgreSQL [Host: ${hostInfo}, DB: ${res.rows[0].current_database}, User: ${res.rows[0].current_user}]`)
    } catch (err) {
      console.error(`❌ PostgreSQL connection failed: ${err.message}`)
      console.warn(`ℹ Falling back to local cache (${config.dbPath})`)
    }
  } else {
    console.log(`ℹ No PostgreSQL configured. Using local JSON database (${config.dbPath})`)
  }
})

export default app
