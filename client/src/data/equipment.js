export const equipment = [
  {
    id: 'EQ-018',
    siteId: 'SITE-001',
    name: 'Tower Crane TC-04',
    category: 'Crane',
    status: 'Idle',
    assignedTask: null,
    utilization: 38,
    idleDays: 6,
  },
  {
    id: 'EQ-022',
    siteId: 'SITE-002',
    name: 'Concrete Mixer CM-12',
    category: 'Mixer',
    status: 'Active',
    assignedTask: 'TASK-031',
    utilization: 88,
    idleDays: 0,
  },
  {
    id: 'EQ-003',
    siteId: 'SITE-004',
    name: 'Excavator EX-03',
    category: 'Excavator',
    status: 'Active',
    assignedTask: 'TASK-055',
    utilization: 91,
    idleDays: 0,
  },
  {
    id: 'EQ-008',
    siteId: 'SITE-003',
    name: 'Forklift FL-08',
    category: 'Forklift',
    status: 'Active',
    assignedTask: 'TASK-033',
    utilization: 74,
    idleDays: 0,
  },
  {
    id: 'EQ-005',
    siteId: 'SITE-002',
    name: 'Generator GN-05',
    category: 'Generator',
    status: 'Active',
    assignedTask: 'TASK-025',
    utilization: 66,
    idleDays: 0,
  },
  {
    id: 'EQ-011',
    siteId: 'SITE-001',
    name: 'Concrete Mixer CM-06',
    category: 'Mixer',
    status: 'Active',
    assignedTask: 'TASK-018',
    utilization: 79,
    idleDays: 0,
  },
  {
    id: 'EQ-014',
    siteId: 'SITE-003',
    name: 'Tower Crane TC-09',
    category: 'Crane',
    status: 'Maintenance',
    assignedTask: null,
    utilization: 0,
    idleDays: 2,
  },
  {
    id: 'EQ-027',
    siteId: 'SITE-004',
    name: 'Generator GN-11',
    category: 'Generator',
    status: 'Idle',
    assignedTask: null,
    utilization: 12,
    idleDays: 3,
  },
]

export function getEquipmentBySite(siteId) {
  return equipment.filter((e) => e.siteId === siteId)
}

export function getEquipmentById(eqId) {
  return equipment.find((e) => e.id === eqId)
}
