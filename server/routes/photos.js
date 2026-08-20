import { Router } from 'express'
import { getCollectionDirect, setCollection, getPool } from '../db.js'

const router = Router()

const INITIAL_PHOTOS = [
  {
    id: 'PHOTO-001',
    siteId: 'SITE-001',
    uploadedBy: 'Shreya Mishra (PM)',
    fileUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?auto=format&fit=crop&w=1200&q=80',
    takenAt: '2026-08-18T14:30:00Z',
    caption: 'Tower A - 14th Floor Slab Rebar Inspection and Concreting Prep',
    locationTag: 'Tower A · Level 14',
  },
  {
    id: 'PHOTO-002',
    siteId: 'SITE-001',
    uploadedBy: 'Rajesh Kumar (Supervisor)',
    fileUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    takenAt: '2026-08-19T09:15:00Z',
    caption: 'South Core Shear Wall formwork alignment check',
    locationTag: 'South Wing Core',
  },
  {
    id: 'PHOTO-003',
    siteId: 'SITE-002',
    uploadedBy: 'Shreya Mishra (PM)',
    fileUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=1200&q=80',
    takenAt: '2026-08-17T11:20:00Z',
    caption: 'Warehouse Bay 3 - Pre-engineered building (PEB) steel rafter erection',
    locationTag: 'Bay 3 · Grid E-F',
  },
  {
    id: 'PHOTO-004',
    siteId: 'SITE-002',
    uploadedBy: 'Anil Verma (Safety Officer)',
    fileUrl: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
    takenAt: '2026-08-19T16:45:00Z',
    caption: 'Heavy machinery perimeter demarcation and grounding pit check',
    locationTag: 'East Yard Equipment Zone',
  },
  {
    id: 'PHOTO-005',
    siteId: 'SITE-003',
    uploadedBy: 'Arjun Kulkarni (PM)',
    fileUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    takenAt: '2026-08-18T10:00:00Z',
    caption: 'Basement 2 MEP ducting and fire sprinkler installation progress',
    locationTag: 'Basement 2 Utility Corridor',
  },
]

// GET /api/photos?siteId=SITE-001&date=2026-08-19
router.get('/', async (req, res) => {
  try {
    const siteId = req.query.siteId || req.query.site_id
    const date = req.query.date
    let photos = await getCollectionDirect('sitePhotos')

    if (!Array.isArray(photos) || photos.length === 0) {
      photos = INITIAL_PHOTOS
      setCollection('sitePhotos', photos)
    }

    let filtered = [...photos]
    if (siteId) {
      filtered = filtered.filter((p) => (p.siteId || p.site_id) === siteId)
    }
    if (date) {
      filtered = filtered.filter((p) => (p.takenAt || p.taken_at || '').startsWith(date))
    }

    filtered.sort((a, b) => new Date(b.takenAt || b.taken_at || 0) - new Date(a.takenAt || a.taken_at || 0))
    res.json(filtered)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/photos - Upload/register site photo
router.post('/', async (req, res) => {
  try {
    const { siteId, uploadedBy, fileUrl, caption, locationTag, takenAt } = req.body || {}

    if (!siteId || !fileUrl) {
      return res.status(400).json({ error: 'siteId and fileUrl are required.' })
    }

    const newPhoto = {
      id: `PHOTO-${Date.now().toString().slice(-6)}`,
      siteId,
      uploadedBy: uploadedBy || 'Current User',
      fileUrl,
      takenAt: takenAt || new Date().toISOString(),
      caption: caption || 'Site progress photo',
      locationTag: locationTag || 'Job Site',
    }

    let photos = await getCollectionDirect('sitePhotos')
    if (!Array.isArray(photos)) photos = []
    photos.unshift(newPhoto)
    setCollection('sitePhotos', photos)

    // Save to PostgreSQL table
    const pool = getPool()
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO site_photos (id, site_id, uploaded_by, file_url, taken_at, caption, location_tag, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET data = $8`,
          [
            newPhoto.id,
            newPhoto.siteId,
            newPhoto.uploadedBy,
            newPhoto.fileUrl,
            newPhoto.takenAt,
            newPhoto.caption,
            newPhoto.locationTag,
            JSON.stringify(newPhoto),
          ]
        )
      } catch (dbErr) {
        console.warn('[DB] Error inserting site_photo into PostgreSQL:', dbErr.message)
      }
    }

    res.status(201).json(newPhoto)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
