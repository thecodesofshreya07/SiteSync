import express from 'express'
import cors from 'cors'
import { config } from './config.js'

import authRouter from './routes/auth.js'
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
import photosRouter from './routes/photos.js'

import { getPool } from './db.js'

const app = express()

// Production-Ready CORS Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-user-site-id', 'x-user-email', 'Accept'],
  })
)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.get('/', (req, res) => {
  res.json({
    name: 'SiteSync API',
    version: '1.0.0',
    port: config.port,
    status: 'running',
    health: '/api/health',
  })
})

// Health check with DB status (Public)
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

// Public Auth Router
app.use('/api/auth', authRouter)

// Protected Routers
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
app.use('/api/photos', photosRouter)

const PORT = process.env.PORT || config.port || 4000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)

  const pool = getPool()
  if (pool) {
    pool.query('SELECT current_database(), current_user, inet_server_addr()').then((res) => {
      let hostInfo = 'Supabase Cloud'
      if (config.databaseUrl) {
        try {
          const u = new URL(config.databaseUrl)
          hostInfo = u.host
        } catch (_) {}
      }
      console.log(`✓ Connected to PostgreSQL [Host: ${hostInfo}, DB: ${res.rows[0].current_database}, User: ${res.rows[0].current_user}]`)
    }).catch((err) => {
      console.error(`❌ PostgreSQL connection failed: ${err.message}`)
      console.warn(`ℹ Falling back to local cache (${config.dbPath})`)
    })
  } else {
    console.log(`ℹ No PostgreSQL configured. Using local JSON database (${config.dbPath})`)
  }
})

export default app
