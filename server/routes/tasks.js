import { Router } from 'express'
import { getCollection, findById, updateById } from '../db.js'

const router = Router()

// GET /api/tasks - List tasks (optional filter by ?siteId=...)
router.get('/', (req, res) => {
  const { siteId } = req.query
  const tasks = getCollection('tasks')
  if (siteId) {
    return res.json(tasks.filter((t) => t.siteId === siteId))
  }
  return res.json(tasks)
})

// GET /api/tasks/:idOrSiteId - Single task OR list of tasks for a siteId
router.get('/:idOrSiteId', (req, res) => {
  const { idOrSiteId } = req.params
  const tasks = getCollection('tasks')

  // 1. Check if ID matches a task (e.g. TASK-031)
  const task = tasks.find((t) => t.id === idOrSiteId)
  if (task) {
    return res.json(task)
  }

  // 2. Check if ID matches a site (e.g. SITE-001)
  const siteTasks = tasks.filter((t) => t.siteId === idOrSiteId)
  if (siteTasks.length > 0) {
    return res.json(siteTasks)
  }

  return res.status(404).json({ error: `Task or site '${idOrSiteId}' not found` })
})

// PATCH /api/tasks/:id - Update task (e.g. column or progress)
router.patch('/:id', (req, res) => {
  const updated = updateById('tasks', req.params.id, req.body)
  if (!updated) {
    return res.status(404).json({ error: 'Task not found' })
  }
  return res.json(updated)
})

export default router
