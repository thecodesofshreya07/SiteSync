import { Router } from 'express'
import { getCollectionDirect, updateByIdDirect } from '../db.js'

const router = Router()

// GET /api/tasks - List tasks (optional ?siteId=...)
router.get('/', async (req, res) => {
  try {
    const { siteId } = req.query
    const tasks = await getCollectionDirect('tasks')
    if (siteId) {
      return res.json(tasks.filter((t) => t.siteId === siteId))
    }
    return res.json(tasks)
  } catch (err) {
    console.error('Error in GET /api/tasks:', err)
    return res.status(500).json({ error: 'Failed to retrieve tasks' })
  }
})

// GET /api/tasks/:idOrSiteId - Single task OR list of tasks for a siteId
router.get('/:idOrSiteId', async (req, res) => {
  try {
    const { idOrSiteId } = req.params
    const tasks = await getCollectionDirect('tasks')

    // 1. Check single task ID (e.g. TASK-001)
    const task = tasks.find((t) => t.id === idOrSiteId)
    if (task) {
      return res.json(task)
    }

    // 2. Check site ID (e.g. SITE-001)
    const siteTasks = tasks.filter((t) => t.siteId === idOrSiteId)
    if (siteTasks.length > 0) {
      return res.json(siteTasks)
    }

    return res.status(404).json({ error: `Task or site '${idOrSiteId}' not found` })
  } catch (err) {
    console.error(`Error in GET /api/tasks/${req.params.idOrSiteId}:`, err)
    return res.status(500).json({ error: 'Failed to retrieve tasks' })
  }
})

// PATCH /api/tasks/:id - Update task (e.g., progress, column)
router.patch('/:id', async (req, res) => {
  try {
    const updated = await updateByIdDirect('tasks', req.params.id, req.body)
    if (!updated) {
      return res.status(404).json({ error: 'Task not found' })
    }
    return res.json(updated)
  } catch (err) {
    console.error(`Error in PATCH /api/tasks/${req.params.id}:`, err)
    return res.status(500).json({ error: 'Failed to update task' })
  }
})

export default router
