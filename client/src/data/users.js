export const initialUsers = [
  {
    id: 'USR-001',
    name: 'Aarav Mehta',
    email: 'aarav.mehta@sitesync.com',
    phone: '+91 98765 43210',
    role: 'Product Manager',
    projectId: '1',
    status: 'Active',
    createdAt: '2026-08-15',
  },
  {
    id: 'USR-002',
    name: 'Priya Sharma',
    email: 'priya.sharma@sitesync.com',
    phone: '+91 98765 43211',
    role: 'Product Manager',
    projectId: 'NA',
    status: 'Not Active',
    createdAt: '2026-08-16',
  },
  {
    id: 'USR-003',
    name: 'Rohan Kapoor',
    email: 'rohan.kapoor@sitesync.com',
    phone: '+91 98765 43212',
    role: 'Product Manager',
    projectId: 'NA',
    status: 'Not Active',
    createdAt: '2026-08-17',
  },
  {
    id: 'USR-004',
    name: 'Vikram Construction',
    email: 'contact@vikramconst.com',
    phone: '+91 98123 45678',
    role: 'Contractor',
    siteId: 'SITE-001',
    status: 'Active',
    createdAt: '2026-08-18',
  },
  {
    id: 'USR-005',
    name: 'BuildPro Contractors',
    email: 'admin@buildpro.com',
    phone: '+91 98234 56789',
    role: 'Contractor',
    siteId: 'SITE-002',
    status: 'Active',
    createdAt: '2026-08-19',
  },
  {
    id: 'USR-006',
    name: 'Apex Infra Contractors',
    email: 'contact@apexinfra.com',
    phone: '+91 98345 67890',
    role: 'Contractor',
    siteId: 'SITE-003',
    status: 'Active',
    createdAt: '2026-08-20',
  },
]

export function getUsers() {
  return [...initialUsers]
}

export function getUserById(id) {
  return initialUsers.find((u) => u.id === id)
}
