import { Router } from 'express'
import { getCollectionDirect, setCollection, getPool } from '../db.js'
import { groq } from '../groqClient.js'

const router = Router()

const INITIAL_PHOTOS = [
  {
    id: 'PHOTO-001',
    siteId: 'SITE-001',
    uploadedBy: 'Project Manager (PM)',
    fileUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?auto=format&fit=crop&w=1200&q=80',
    takenAt: '2026-08-18T14:30:00Z',
    caption: 'Tower A — 14th Floor Slab Steel Rebar & Concrete Pour Preparation',
    locationTag: 'Tower A · 14th Floor Deck',
    workPrediction: 'Next 3 Days: Concrete pouring for the 14th floor will finish tomorrow. Wooden shuttering will be removed on Day 3, and pillar steel work will begin.',
    predictedAt: '2026-08-18T14:35:00Z',
  },
  {
    id: 'PHOTO-002',
    siteId: 'SITE-001',
    uploadedBy: 'Rohan Sharma (Supervisor)',
    fileUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    takenAt: '2026-08-19T09:15:00Z',
    caption: 'Lift Shaft Core Wall Alignment & Formwork Check',
    locationTag: 'South Wing Lift Core',
    workPrediction: 'Next 3 Days: Concrete will be poured into the lift wall tomorrow morning. Curing spray and formwork removal will finish by Day 3.',
    predictedAt: '2026-08-19T09:20:00Z',
  },
  {
    id: 'PHOTO-003',
    siteId: 'SITE-002',
    uploadedBy: 'Vikram Singh (Contractor)',
    fileUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=1200&q=80',
    takenAt: '2026-08-17T11:20:00Z',
    caption: 'Warehouse Bay 3 — Steel Roof Rafters & Column Erection',
    locationTag: 'Bay 3 · Grid E-F',
    workPrediction: 'Next 3 Days: Steel framework will reach 90% completion. Bolt tightening and roof sheet installation will start over the weekend.',
    predictedAt: '2026-08-17T11:25:00Z',
  },
  {
    id: 'PHOTO-004',
    siteId: 'SITE-002',
    uploadedBy: 'Safety Officer Anil',
    fileUrl: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
    takenAt: '2026-08-19T16:45:00Z',
    caption: 'Heavy Crane Safety Barricading & Generator Pad Area',
    locationTag: 'East Yard Plant Zone',
    workPrediction: 'Next 3 Days: Area is cleared for heavy equipment delivery. The electrical transformer base will be ready within 48 hours.',
    predictedAt: '2026-08-19T16:50:00Z',
  },
  {
    id: 'PHOTO-005',
    siteId: 'SITE-003',
    uploadedBy: 'Priya Joshi (Contractor)',
    fileUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    takenAt: '2026-08-18T10:00:00Z',
    caption: 'Basement 2 AC Ducting & Fire Sprinkler Pipes',
    locationTag: 'Basement 2 Corridor',
    workPrediction: 'Next 3 Days: Water pressure testing on fire pipes will finish tomorrow. Electrical cable pulling through ceiling trays starts on Day 3.',
    predictedAt: '2026-08-18T10:05:00Z',
  },
]

async function generateAIWorkPrediction(caption, locationTag, siteId) {
  const fallback = `Next 3 Days: Work at ${locationTag || 'this area'} is moving on schedule. Current stage will wrap up in 2 days and the next trade work will start on Day 3.`
  try {
    if (!groq) return fallback

    const prompt = `You are a helpful construction supervisor explaining site progress in simple, plain everyday English.
A site engineer just uploaded a job photo with:
- Location: ${locationTag || 'Active Work Zone'}
- Caption / Notes: "${caption || 'General site work'}"
- Project Site: ${siteId}

Write a simple 1-2 sentence prediction of what work will be finished in the NEXT 3 DAYS.
Rules:
1. Use simple, clear everyday words that anyone can easily read and understand.
2. Avoid dense engineering jargon or confusing technical phrases.
3. Start directly with "Next 3 Days: ..."`

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 250,
    })

    const text = completion.choices?.[0]?.message?.content?.trim()
    if (text) {
      const clean = text.replace(/^next 3 days:\s*/i, '').replace(/^72-hour milestone:\s*/i, '')
      return `Next 3 Days: ${clean}`
    }
    return fallback
  } catch (err) {
    console.warn('[AI PREDICTION] Groq prediction notice:', err.message)
    return fallback
  }
}

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

// POST /api/photos - Upload/register site photo with date & AI progress prediction
router.post('/', async (req, res) => {
  try {
    const { siteId, uploadedBy, fileUrl, caption, locationTag, takenAt } = req.body || {}

    if (!siteId || !fileUrl) {
      return res.status(400).json({ error: 'siteId and fileUrl are required.' })
    }

    const resolvedDate = takenAt ? new Date(takenAt).toISOString() : new Date().toISOString()
    const workPrediction = await generateAIWorkPrediction(caption, locationTag, siteId)
    const nowIso = new Date().toISOString()

    const newPhoto = {
      id: `PHOTO-${Date.now().toString().slice(-6)}`,
      siteId,
      uploadedBy: uploadedBy || 'Site Engineer',
      fileUrl,
      takenAt: resolvedDate,
      caption: caption || 'Site progress documentation photo',
      locationTag: locationTag || 'Active Work Zone',
      workPrediction,
      predictedAt: nowIso,
    }

    let photos = await getCollectionDirect('sitePhotos')
    if (!Array.isArray(photos)) photos = [...INITIAL_PHOTOS]
    photos.unshift(newPhoto)
    setCollection('sitePhotos', photos)

    // Also persist to PostgreSQL if table exists
    const pool = getPool()
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO site_photos (id, site_id, uploaded_by, file_url, taken_at, caption, location_tag, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
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
        console.warn('PostgreSQL photo persistence notice:', dbErr.message)
      }
    }

    res.status(201).json(newPhoto)
  } catch (err) {
    console.error('Error saving photo:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
