import { useState } from 'react'
import { Calendar, Clock, AlertTriangle, CheckCircle2, ChevronRight, Layers, ArrowRight } from 'lucide-react'
import { formatDate } from '../../lib/utils'
import Badge from '../common/Badge'

export default function GanttView({ tasks = [] }) {
  const [selectedTask, setSelectedTask] = useState(null)

  // Sort tasks by due date or priority
  const sortedTasks = [...tasks].sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))

  // Calculate critical path (tasks with High/Critical priority that are not Done)
  const criticalTasks = sortedTasks.filter(
    (t) => (t.priority === 'High' || t.priority === 'Critical') && t.column !== 'Done'
  )

  return (
    <div className="space-y-4 font-public">
      {/* Critical Path Callout */}
      {criticalTasks.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
            <AlertTriangle size={15} className="text-amber-600" />
            <span>Critical Path Milestones ({criticalTasks.length} Active Bottlenecks)</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {criticalTasks.map((t) => (
              <span
                key={t.id}
                onClick={() => setSelectedTask(t)}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-white border border-amber-300 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm hover:border-teal-500 transition-colors"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>{t.name}</span>
                <span className="text-[10px] text-slate-500 font-ibm">Due {formatDate(t.dueDate)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Gantt Timeline Board */}
      <div className="rounded-xl border border-surface-border bg-white shadow-card overflow-hidden">
        <div className="border-b border-surface-border bg-slate-100/80 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={15} className="text-teal-600" />
            <span>Project Milestones & Dependency Gantt Schedule</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 font-ibm">{tasks.length} total milestones</span>
        </div>

        <div className="divide-y divide-surface-border font-ibm">
          {sortedTasks.map((task) => {
            const progress = task.progress || (task.column === 'Done' ? 100 : task.column === 'In Progress' ? 50 : 10)
            const isCritical = (task.priority === 'High' || task.priority === 'Critical') && task.column !== 'Done'

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold font-mono text-slate-500">{task.id}</span>
                      <h4 className="text-sm font-bold text-slate-900 font-public">{task.name}</h4>
                      <Badge tone={task.column === 'Done' ? 'green' : isCritical ? 'red' : 'blue'}>
                        {task.column?.toUpperCase() || 'IN PROGRESS'}
                      </Badge>
                      {isCritical && <Badge tone="amber">CRITICAL PATH</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-slate-600 line-clamp-1">
                      Assigned to: <span className="font-semibold text-slate-800">{task.assignee || 'Field Team'}</span> · Target: {formatDate(task.dueDate)}
                    </p>
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div className="w-full sm:w-64 shrink-0">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Milestone Completion</span>
                      <span className="text-teal-700">{progress}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progress === 100 ? 'bg-green-500' : isCritical ? 'bg-amber-500' : 'bg-teal-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Task Dependency & Schedule Inspection Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-surface-border bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-surface-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {selectedTask.id}
                  </span>
                  <Badge
                    tone={
                      selectedTask.column === 'Done'
                        ? 'green'
                        : selectedTask.priority === 'Critical' || selectedTask.priority === 'High'
                        ? 'red'
                        : 'blue'
                    }
                  >
                    {selectedTask.column?.toUpperCase() || 'IN PROGRESS'}
                  </Badge>
                </div>
                <h3 className="mt-2 text-base font-bold text-slate-950 font-public">
                  {selectedTask.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 font-ibm text-xs">
              {/* Target Due Date & Progress */}
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Target Due Date</span>
                  <p className="mt-0.5 text-sm font-bold text-slate-900 flex items-center gap-1.5 font-public">
                    <Calendar size={14} className="text-teal-600" />
                    {formatDate(selectedTask.dueDate)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Milestone Progress</span>
                  <p className="mt-0.5 text-sm font-bold text-teal-700">
                    {selectedTask.progress || (selectedTask.column === 'Done' ? 100 : selectedTask.column === 'In Progress' ? 50 : 10)}% Completed
                  </p>
                </div>
              </div>

              {/* Dependency Chain */}
              <div className="rounded-xl border border-surface-border p-3.5">
                <span className="text-[11px] font-bold text-slate-700 font-public uppercase tracking-wider block mb-2">
                  Task Dependency & Sequence Chain
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <div className="rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700">
                    {selectedTask.dependencies?.[0] || 'Prerequisite Stage Approval'}
                  </div>
                  <ArrowRight size={14} className="text-slate-400 shrink-0" />
                  <div className="rounded-lg border border-teal-300 bg-teal-50 px-2.5 py-1.5 font-bold text-teal-900">
                    {selectedTask.name}
                  </div>
                </div>
              </div>

              {/* Assignment & Operational Details */}
              <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Assigned Team / Contractor:</span>
                  <span className="font-bold text-slate-900">{selectedTask.assignee || 'General Field Team'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Priority Level:</span>
                  <span className={`font-bold ${selectedTask.priority === 'High' || selectedTask.priority === 'Critical' ? 'text-red-700' : 'text-slate-800'}`}>
                    {selectedTask.priority || 'Normal'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Site Location:</span>
                  <span className="font-bold text-slate-900">{selectedTask.siteId || 'Active Project Site'}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 transition-colors shadow-sm"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
