// Each entry: { type, message } — type drives the status dot color.
// The Dashboard replays these with real timestamps computed at mount time,
// spaced a few seconds apart, to feel like a live monitoring process.

export const activityScripts = {
  'SITE-002': [
    { type: 'checking', message: 'Monitoring Site B inventory...' },
    { type: 'checking', message: 'Checking cement consumption (INV-104)...' },
    { type: 'checking', message: 'Checking pending delivery status (PO-2041)...' },
    { type: 'retrieving', message: 'Retrieving vendor history for VEN-017...' },
    { type: 'investigating', message: 'Comparing consumption rate against remaining stock...' },
    { type: 'flagged', message: '⚠ Shortage risk detected — 3.2 days to critical' },
    { type: 'analyzing', message: 'Checking Site A stock availability for transfer option...' },
    { type: 'resolved', message: 'Investigation completed' },
    { type: 'recommendation', message: 'Recommendation generated — transfer 150 bags from Site A' },
    { type: 'waiting', message: 'Waiting for manager approval' },
  ],
  'SITE-001': [
    { type: 'checking', message: 'Monitoring Riverside Tower equipment logs...' },
    { type: 'checking', message: 'Checking Tower Crane TC-04 task assignment...' },
    { type: 'investigating', message: 'Cross-referencing utilization against 7-day average...' },
    { type: 'retrieving', message: 'Retrieving rental cost record for TC-04...' },
    { type: 'flagged', message: '⚠ Idle equipment detected — TC-04, 6 days' },
    { type: 'analyzing', message: 'Scanning nearby sites for reassignment opportunity...' },
    { type: 'resolved', message: 'Investigation completed' },
    { type: 'recommendation', message: 'Recommendation generated — reassign TC-04 to Metro Heights' },
    { type: 'waiting', message: 'Waiting for manager approval' },
  ],
  'SITE-003': [
    { type: 'checking', message: 'Monitoring Metro Heights task board...' },
    { type: 'checking', message: 'Checking Tower Crane TC-09 maintenance schedule...' },
    { type: 'retrieving', message: 'Retrieving piling task progress (TASK-033)...' },
    { type: 'analyzing', message: 'Comparing crew allocation against plan...' },
    { type: 'resolved', message: 'No anomalies detected this cycle' },
  ],
  'SITE-004': [
    { type: 'checking', message: 'Monitoring Greenfield Commercial Complex budget...' },
    { type: 'checking', message: 'Checking excavation progress (TASK-055)...' },
    { type: 'retrieving', message: 'Retrieving Generator GN-11 utilization log...' },
    { type: 'analyzing', message: 'Comparing planned vs actual spend by category...' },
    { type: 'resolved', message: 'No anomalies detected this cycle' },
  ],
}

export function getActivityScript(siteId) {
  return activityScripts[siteId] || activityScripts['SITE-002']
}
