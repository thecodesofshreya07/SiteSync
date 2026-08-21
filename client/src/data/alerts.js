// Every alert is born PENDING. Approve/Dismiss/Snooze mutate status client-side.
export const initialAlerts = [
  {
    id: 'ALT-009',
    siteId: 'SITE-002',
    severity: 'critical',
    title: 'Cement stock at Warehouse Expansion is projected to become critical in 3.2 days.',
    timestamp: '2026-08-19T10:42:11',
    explanation:
      'Current consumption is 55 bags/day against a remaining stock of 180 bags. The pending replenishment order is delayed by 4 days, which means the site will run out of cement roughly 2.4 days before the delayed delivery arrives — halting foundation reinforcement work at Warehouse Expansion.',
    reasonPoints: [
      'Current consumption is 55 bags/day.',
      'Current stock is 180 bags.',
      'Pending delivery (PO-2041) is delayed by 4 days.',
    ],
    recommendation: 'Transfer 150 bags from Site A (INV-018, currently at 860 bags) to cover the gap until PO-2041 arrives.',
    sources: [
      { type: 'inventory', id: 'INV-104', label: 'Inventory Transaction INV-104' },
      { type: 'procurement', id: 'PO-2041', label: 'Purchase Order PO-2041' },
      { type: 'delivery', id: 'DEL-882', label: 'Delivery DEL-882' },
      { type: 'vendor', id: 'VEN-017', label: 'Historical Vendor Record VEN-017' },
    ],
    status: 'pending',
  },
  {
    id: 'ALT-010',
    siteId: 'SITE-001',
    severity: 'warning',
    title: 'Tower Crane TC-04 has been idle for 6 days.',
    timestamp: '2026-08-19T09:15:47',
    explanation:
      'TC-04 was last logged against an active task on 13 Aug. Utilization has dropped to 38% this week while Structural Work at Riverside Tower continues on schedule using ground-level equipment. Continued idling represents avoidable rental cost.',
    reasonPoints: [
      'No task assignment logged since 13 Aug 2026.',
      'Utilization has fallen to 38%, down from a 7-day average of 81%.',
      'Rental cost continues to accrue at ₹18,500/day regardless of usage.',
    ],
    recommendation: 'Reassign TC-04 to Metro Heights (Site C), where Tower Crane TC-09 is currently under maintenance and piling work needs crane support.',
    sources: [
      { type: 'equipment', id: 'EQ-018', label: 'Equipment Record EQ-018' },
      { type: 'task', id: 'TASK-018', label: 'Task TASK-018' },
    ],
    status: 'pending',
  },
  {
    id: 'ALT-011',
    siteId: 'SITE-002',
    severity: 'warning',
    title: 'Site budget is trending 11.8% above planned spend.',
    timestamp: '2026-08-19T08:52:30',
    explanation:
      'Warehouse Expansion actual spend of ₹3.47 Cr against a planned ₹3.10 Cr is being driven primarily by steel procurement, equipment rental, and additional labor charges. The steel overage traces back to an emergency alternate-vendor purchase made after the original delivery was delayed.',
    reasonPoints: [
      'Steel procurement is ₹8.4L above plan (PO-2045, alternate vendor surcharge).',
      'Equipment rental is ₹2.1L above plan due to CM-12 extended usage.',
      'Additional labor cost is ₹1.4L above plan from weekend shifts to recover schedule.',
    ],
    recommendation: 'Flag PO-2045 for Finance review and lock remaining Warehouse Expansion discretionary procurement pending budget reconciliation.',
    sources: [
      { type: 'procurement', id: 'PO-2045', label: 'Purchase Order PO-2045' },
      { type: 'site', id: 'SITE-002', label: 'Warehouse Expansion Budget Record' },
      { type: 'vendor', id: 'VEN-022', label: 'Vendor History VEN-022' },
    ],
    status: 'pending',
  },
  {
    id: 'ALT-012',
    siteId: 'SITE-002',
    severity: 'medium',
    title: 'Foundation task may miss its milestone due to delayed steel delivery.',
    timestamp: '2026-08-19T08:20:05',
    explanation:
      'Foundation Reinforcement (TASK-031) is 65% complete but depends on the remaining Steel Rebar 12mm delivery under PO-2045, currently in the Purchase Order stage. If the order is not dispatched within 2 days, the 22 Aug milestone is at risk.',
    reasonPoints: [
      'TASK-031 is 65% complete with 4 working days remaining until its 22 Aug due date.',
      'PO-2045 has not yet progressed past Purchase Order stage.',
      'Remaining reinforcement work requires the full 8-tonne rebar order on site.',
    ],
    recommendation: 'Expedite PO-2045 with Metro Steel Ltd and confirm a dispatch date within 48 hours to protect the milestone.',
    sources: [
      { type: 'task', id: 'TASK-031', label: 'Task TASK-031' },
      { type: 'procurement', id: 'PO-2045', label: 'Purchase Order PO-2045' },
    ],
    status: 'pending',
  },
]
