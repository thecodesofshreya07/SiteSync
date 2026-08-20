import { Router } from 'express'
import { getCollection, findById, updateById } from '../db.js'

const router = Router()

// GET /api/tasks - List tasks (optional filter by siteId)
router.get('/', (req, res) => {
  const { siteId } = req.query
  const tasks = getCollection('tasks')
  if (siteId) {
    return res.json(tasks.filter((t) => t.siteId === siteId))
  }
  res.json(tasks)
})

// GET /api/tasks/:id - Single task
router.get('/:id', (req, res) => {
  const task = findById('tasks', req.params.id)
  if (!task) {
    return res.status(404).json({ error: 'Task not found' })
  }
  res.json(task)
})

// PATCH /api/tasks/:id - Update task (e.g. column or progress)
router.patch('/:id', (req, res) => {
  const updated = updateById('tasks', req.params.id, req.body)
  if (!updated) {
    return res.status(404).json({ error: 'Task not found' })
  }
  res.json(updated)
})

export default router
