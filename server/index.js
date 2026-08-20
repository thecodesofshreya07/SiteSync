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

const app = express()

// Middleware
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
)
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
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

const PORT = config.port

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SiteSync Express server scaffold listening on http://localhost:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
})

export default app
