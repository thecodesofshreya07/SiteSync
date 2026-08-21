import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { getCollection, findById, setCollection, getPool } from '../db.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const router = Router()

const ALLOWED_CREATION_ROLES = ['Project Manager', 'Contractor', 'Finance', 'Accountant']

function formatUserRow(row) {
  if (!row) return null
  const baseData = row.data && typeof row.data === 'object' ? row.data : {}
  return {
    ...baseData,
    id: row.id || baseData.id,
    name: row.name || baseData.name,
    email: row.email || baseData.email,
    phone: row.phone || baseData.phone,
    role: row.role || baseData.role,
    projectId: row.project_id || baseData.projectId || (baseData.role === 'Project Manager' ? 'NA' : undefined),
    siteId: row.site_id || baseData.siteId || (baseData.role === 'Contractor' ? 'NA' : undefined),
    status: row.status || baseData.status || 'Not Active',
    createdAt: row.created_at || baseData.createdAt || new Date().toISOString().slice(0, 10),
  }
}

// GET /api/users - List all users (Authenticated)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pool = getPool()

    if (pool) {
      try {
        const result = await pool.query('SELECT * FROM users ORDER BY id ASC')
        if (result.rows && result.rows.length > 0) {
          return res.json(result.rows.map(formatUserRow))
        }
      } catch (err) {
        console.warn('PostgreSQL users query warning, using local collection cache:', err.message)
      }
    }

    const users = getCollection('users') || []
    res.json(users.map(formatUserRow))
  } catch (err) {
    console.error('Error fetching users:', err)
    res.status(500).json({ error: 'Failed to retrieve users' })
  }
})

// GET /api/users/:id - Get single user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const pool = getPool()

    if (pool) {
      try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id])
        if (result.rows.length > 0) {
          return res.json(formatUserRow(result.rows[0]))
        }
      } catch (err) {
        console.warn(`PostgreSQL user lookup failed for ${id}:`, err.message)
      }
    }

    const user = findById('users', id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(formatUserRow(user))
  } catch (err) {
    console.error(`Error fetching user ${req.params.id}:`, err)
    res.status(500).json({ error: 'Failed to retrieve user' })
  }
})

// POST /api/users - Create new Project Manager, Contractor, or Finance account (Admin Only)
router.post('/', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { name, email, phone, role, siteId, projectId, status, password } = req.body

    // Required Validation: Name, Email, Phone, Role
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full Name is required' })
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' })
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address' })
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Phone number is required' })
    }
    if (!role || !ALLOWED_CREATION_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Role must be Project Manager, Contractor, or Finance. Admin accounts cannot be created.' })
    }

    // Optional fields with default fallbacks
    const finalStatus = status && status.trim() ? status.trim() : 'Active'
    let finalProjectId = 'NA'
    let finalSiteId = 'NA'

    if (role === 'Project Manager') {
      finalProjectId = projectId && projectId.trim() ? projectId.trim() : 'PROJECT-001'
    } else if (role === 'Contractor') {
      finalSiteId = siteId && siteId.trim() ? siteId.trim() : 'SITE-002'
    }

    const normalizedEmail = email.trim().toLowerCase()
    const pool = getPool()
    let existingUser = null

    // Check duplicate email in PostgreSQL
    if (pool) {
      try {
        const check = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [normalizedEmail])
        if (check.rows.length > 0) {
          existingUser = check.rows[0]
        }
      } catch (err) {
        console.warn('PostgreSQL email duplicate check warning:', err.message)
      }
    }

    // Check duplicate email in local collection cache
    const currentList = getCollection('users') || []
    if (!existingUser && currentList.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      existingUser = true
    }

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' })
    }

    const id = `USR-${Math.floor(100 + Math.random() * 900)}`
    const createdAt = new Date().toISOString().slice(0, 10)
    const rawPassword = password || 'password123'
    const passwordHash = bcrypt.hashSync(rawPassword, 10)

    const newUser = {
      id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      projectId: finalProjectId,
      siteId: finalSiteId,
      status: finalStatus,
      passwordHash,
      createdAt,
    }

    // Save to PostgreSQL if available
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO users (id, name, email, phone, role, site_id, project_id, status, password_hash, created_at, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            id,
            newUser.name,
            newUser.email,
            newUser.phone,
            role,
            finalSiteId,
            finalProjectId,
            finalStatus,
            passwordHash,
            createdAt,
            JSON.stringify(newUser),
          ]
        )
      } catch (err) {
        console.warn('PostgreSQL insert user warning:', err.message)
      }
    }

    // Save to local DB cache
    currentList.push(newUser)
    setCollection('users', currentList)

    res.status(201).json(formatUserRow(newUser))
  } catch (err) {
    console.error('Error creating user:', err)
    res.status(500).json({ error: 'Failed to create user account' })
  }
})

export default router
