export const suggestedQuestions = [
  'Why is Warehouse Expansion over budget?',
  "What's currently low in stock?",
  'Which equipment is idle?',
  'What procurement deliveries are delayed?',
  'Which tasks are at risk?',
  'What should we purchase next?',
]

// Keyed by lowercase question text for simple matching; falls back to a
// generic grounded-sounding response if nothing matches.
export const assistantResponses = {
  'why is warehouse expansion over budget?': {
    answer:
      'Warehouse Expansion is currently 11.8% above planned spending.\n\nThe primary drivers are:\n\n1. Steel procurement — ₹8.4L above plan\n2. Equipment rental — ₹2.1L above plan\n3. Additional labor — ₹1.4L above plan\n\nThe steel increase is primarily associated with a delayed delivery that required an alternative vendor purchase.',
    sources: [
      { type: 'procurement', id: 'PO-2045', label: 'PO-2045' },
      { type: 'site', id: 'SITE-002', label: 'Budget Record' },
      { type: 'vendor', id: 'VEN-022', label: 'Vendor History' },
    ],
  },
  "what's currently low in stock?": {
    answer:
      "Three items are currently below their reorder threshold:\n\n1. Cement Portland Type I at Warehouse Expansion — 180 bags remaining, CRITICAL (3.2 days to stockout)\n2. Aggregate at Riverside Tower — 96 cu.m remaining, LOW\n3. Bricks at Warehouse Expansion — 6,200 units remaining, LOW\n\nCement at Warehouse Expansion is the most urgent — it's the subject of the current open critical alert.",
    sources: [
      { type: 'inventory', id: 'INV-104', label: 'INV-104' },
      { type: 'inventory', id: 'INV-063', label: 'INV-063' },
      { type: 'inventory', id: 'INV-112', label: 'INV-112' },
    ],
  },
  'which equipment is idle?': {
    answer:
      "Two units are currently idle:\n\n1. Tower Crane TC-04 at Riverside Tower — idle for 6 days, utilization down to 38%\n2. Generator GN-11 at Greenfield Commercial Complex — idle for 3 days, utilization at 12%\n\nTC-04 already has an open recommendation to reassign it to Metro Heights, where a crane is under maintenance.",
    sources: [
      { type: 'equipment', id: 'EQ-018', label: 'EQ-018' },
      { type: 'equipment', id: 'EQ-027', label: 'EQ-027' },
    ],
  },
  'what procurement deliveries are delayed?': {
    answer:
      "One delivery is currently delayed:\n\nDEL-882, covering PO-2041 (500 bags of Cement Portland Type I for Warehouse Expansion), was expected on 17 Aug and is now revised to 21 Aug — a 4-day delay. BuildPro Materials cited a transport shortage.\n\nThis delay is the direct cause of the open critical cement shortage alert at Warehouse Expansion.",
    sources: [
      { type: 'delivery', id: 'DEL-882', label: 'DEL-882' },
      { type: 'procurement', id: 'PO-2041', label: 'PO-2041' },
      { type: 'vendor', id: 'VEN-017', label: 'Vendor Record' },
    ],
  },
  'which tasks are at risk?': {
    answer:
      "Foundation Reinforcement (TASK-031) at Warehouse Expansion is the main task at risk. It's 65% complete with a due date of 22 Aug, but depends on the remaining steel rebar delivery under PO-2045, which hasn't progressed past the Purchase Order stage yet.\n\nIf the order doesn't dispatch within 48 hours, the milestone will likely slip.",
    sources: [
      { type: 'task', id: 'TASK-031', label: 'TASK-031' },
      { type: 'procurement', id: 'PO-2045', label: 'PO-2045' },
    ],
  },
  'what should we purchase next?': {
    answer:
      'Based on current consumption and pending delivery delays, the top priority purchase is:\n\nCement Portland Type I — recommended order of 500 bags for Warehouse Expansion, driven by 55 bags/day consumption and a projected shortage in 3.2 days.\n\nSecondary priority: Bricks for Warehouse Expansion (6,200 units remaining against 900/day consumption).',
    sources: [
      { type: 'inventory', id: 'INV-104', label: 'INV-104' },
      { type: 'inventory', id: 'INV-112', label: 'INV-112' },
    ],
  },
}

export function getAssistantResponse(question) {
  const key = question.trim().toLowerCase()
  if (assistantResponses[key]) return assistantResponses[key]
  return {
    answer:
      "I can help with that. Based on current operational data across your sites, I don't have a pre-computed answer for this exact question yet, but you can find related detail in Inventory, Procurement, or the Dashboard's AI Alerts panel.",
    sources: [],
  }
}
