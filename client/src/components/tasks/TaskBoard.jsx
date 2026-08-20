import TaskCard from './TaskCard'

const COLUMNS = ['To Do', 'In Progress', 'Done']

export default function TaskBoard({ tasks }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.column === col)
        return (
          <div key={col}>
            <div className="mb-2.5 flex items-center justify-between px-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">{col}</p>
              <span className="rounded-full bg-navy-900/5 px-1.5 py-0.5 text-2xs font-semibold text-navy-500">
                {colTasks.length}
              </span>
            </div>
            <div className="space-y-2.5">
              {colTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {colTasks.length === 0 && (
                <div className="rounded-lg border border-dashed border-surface-border py-6 text-center text-2xs text-navy-400">
                  No tasks
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
