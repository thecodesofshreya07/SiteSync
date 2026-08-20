import jwt from 'jsonwebtoken'
import { findById, getCollection } from '../db.js'
import { initialUsers } from '../../client/src/data/users.js'

export const JWT_SECRET = process.env.JWT_SECRET || 'sitesync-super-secret-jwt-key-2026'

/**
 * Middleware: Verify Bearer JWT Token
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' })
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' })
    }

    // Lookup fresh user info
    const users = getCollection('users') || []
    let user = users.find((u) => u.id === decoded.sub || u.id === decoded.id)
    if (!user) {
      user = initialUsers.find((u) => u.id === decoded.sub || u.id === decoded.id) || decoded
    }

    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' })
    }

    // Attach authenticated identity to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      projectUid: user.projectId || user.projectUid || '1',
      siteId: user.siteId || null,
    }

    next()
  })
}

/**
 * Middleware: Enforce Allowed Roles
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' })
    }

    // Admin always has access
    if (req.user.role === 'Admin') {
      return next()
    }

    if (allowedRoles.includes(req.user.role)) {
      return next()
    }

    return res.status(403).json({
      error: `Access Denied. Role '${req.user.role}' is not authorized to access this resource.`,
    })
  }
}

/**
 * Middleware: Enforce Site-Level Authorization Scope
 */
export function requireSiteAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' })
  }

  // 1. Admin & Finance can access all sites
  if (req.user.role === 'Admin' || req.user.role === 'Finance') {
    return next()
  }

  const requestedSiteId = req.query.siteId || req.params.siteId || req.params.id || req.body?.siteId

  // 2. Contractor is strictly restricted to their assigned siteId
  if (req.user.role === 'Contractor') {
    if (requestedSiteId && requestedSiteId !== req.user.siteId && req.user.siteId !== 'NA') {
      return res.status(403).json({
        error: `Access Denied. Contractor '${req.user.email}' is restricted to site '${req.user.siteId}'.`,
      })
    }
  }

  // 3. Project Manager is restricted to sites under their project
  if (req.user.role === 'Project Manager') {
    const pId = String(req.user.projectUid || '1')
    if (pId && pId !== 'NA') {
      const sites = getCollection('sites') || []
      const allowedSiteIds = sites
        .filter((s) => String(s.projectId || '1') === pId || s.manager === req.user.name || pId === '1')
        .map((s) => s.id)

      if (requestedSiteId && allowedSiteIds.length > 0 && !allowedSiteIds.includes(requestedSiteId)) {
        return res.status(403).json({
          error: `Access Denied. Project Manager '${req.user.email}' is restricted to project '${pId}'.`,
        })
      }
    }
  }

  next()
}
