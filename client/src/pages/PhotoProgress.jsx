import { useEffect, useState, useRef } from 'react'
import { Camera, Plus, Calendar, MapPin, User, X, Image as ImageIcon, CheckCircle, Filter, Upload, FileUp } from 'lucide-react'
import { useSite } from '../hooks/useSite'
import { useAuth } from '../hooks/useAuth'
import { formatDate, formatTime, cn } from '../lib/utils'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Badge from '../components/common/Badge'

const API_BASE = 'http://localhost:4000/api'

export default function PhotoProgress() {
  const { selectedSite, sites } = useSite()
  const { user } = useAuth()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [filterSiteId, setFilterSiteId] = useState('')
  const fileInputRef = useRef(null)

  // Upload form state
  const [formSiteId, setFormSiteId] = useState(selectedSite?.id || 'SITE-001')
  const [formFileUrl, setFormFileUrl] = useState('')
  const [formCaption, setFormCaption] = useState('')
  const [formLocationTag, setFormLocationTag] = useState('')
  const [formTakenAt, setFormTakenAt] = useState(new Date().toISOString().slice(0, 10))
  const [submitting, setSubmitting] = useState(false)
  const [fileName, setFileName] = useState('')

  const handleLocalFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormFileUrl(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const activeFilterSite = filterSiteId || selectedSite?.id

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      const url = activeFilterSite
        ? `${API_BASE}/photos?siteId=${encodeURIComponent(activeFilterSite)}`
        : `${API_BASE}/photos`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setPhotos(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.warn('Error loading photos:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPhotos()
  }, [activeFilterSite])

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    if (!formFileUrl) return

    try {
      setSubmitting(true)
      const res = await fetch(`${API_BASE}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: formSiteId || selectedSite?.id,
          uploadedBy: user?.name ? `${user.name} (${user.role || 'Field'})` : 'Site Supervisor',
          fileUrl: formFileUrl,
          caption: formCaption,
          locationTag: formLocationTag,
          takenAt: formTakenAt ? new Date(formTakenAt).toISOString() : new Date().toISOString(),
        }),
      })

      if (res.ok) {
        setUploadOpen(false)
        setFormFileUrl('')
        setFormCaption('')
        setFormLocationTag('')
        setFormTakenAt(new Date().toISOString().slice(0, 10))
        fetchPhotos()
      }
    } catch (err) {
      console.error('Error submitting photo:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Group photos by date
  const groupedByDate = photos.reduce((acc, p) => {
    const d = (p.takenAt || p.taken_at || '').slice(0, 10) || 'Recent'
    if (!acc[d]) acc[d] = []
    acc[d].push(p)
    return acc
  }, {})

  const dateKeys = Object.keys(groupedByDate).sort((a, b) => (b > a ? 1 : -1))

  return (
    <div className="space-y-6 font-public">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Camera className="text-teal-600" size={24} />
            Photo Progress Tracking
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600 font-ibm">
            Visual milestone documentation, structural inspection captures & field evidence
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Site Filter Dropdown */}
          <div className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-white px-2.5 py-1.5 shadow-sm text-xs font-semibold text-slate-700">
            <Filter size={14} className="text-slate-500" />
            <select
              value={filterSiteId}
              onChange={(e) => setFilterSiteId(e.target.value)}
              aria-label="Filter site photos by construction site"
              className="bg-transparent text-xs font-bold text-slate-800 outline-none"
            >
              <option value="">All Project Sites</option>
              {sites?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setFormSiteId(selectedSite?.id || 'SITE-001')
              setUploadOpen(true)
            }}
          >
            Upload Progress Photo
          </Button>
        </div>
      </div>

      {/* Gallery */}
      {loading ? (
        <div className="py-16 text-center text-sm font-semibold text-slate-500 font-ibm">
          Loading site documentation photos...
        </div>
      ) : photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-card">
          <ImageIcon size={36} className="mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-bold text-slate-800">No progress photos recorded yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Click "Upload Progress Photo" to capture the first inspection or milestone photo.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {dateKeys.map((dateStr) => (
            <div key={dateStr} className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-teal-600" />
                <h3 className="text-sm font-bold text-slate-800 tracking-wide font-public">
                  {dateStr !== 'Recent' ? formatDate(dateStr) : 'Recent Captures'}
                </h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 font-ibm">
                  {groupedByDate[dateStr].length} photos
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {groupedByDate[dateStr].map((p) => {
                  const siteObj = sites?.find((s) => s.id === (p.siteId || p.site_id))
                  return (
                    <div
                      key={p.id}
                      onClick={() => setLightboxPhoto(p)}
                      className="group cursor-pointer overflow-hidden rounded-xl border border-surface-border bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
                        <img
                          src={p.fileUrl || p.file_url}
                          alt={p.caption || 'Site photo'}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                        <div className="absolute bottom-2.5 left-2.5 right-2.5">
                          <p className="text-xs font-bold text-white line-clamp-1">{p.caption}</p>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-300">
                            <span className="flex items-center gap-1">
                              <MapPin size={10} className="text-teal-400" />
                              {p.locationTag || p.location_tag || siteObj?.name || 'Site'}
                            </span>
                            <span>{formatTime(p.takenAt || p.taken_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Site Progress Photo">
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 font-public mb-1">
                Project Site
              </label>
              <select
                value={formSiteId}
                onChange={(e) => setFormSiteId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 font-ibm focus:border-teal-500 focus:outline-none"
              >
                {sites?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.location})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 font-public mb-1">
                Capture / Inspection Date
              </label>
              <input
                type="date"
                value={formTakenAt}
                onChange={(e) => setFormTakenAt(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 font-ibm focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Choose File from Local Device */}
          <div>
            <label className="block text-xs font-bold text-slate-700 font-public mb-1">
              Select Photo from Your Device
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleLocalFileChange}
              className="hidden"
            />
            
            {formFileUrl ? (
              <div className="relative rounded-xl border-2 border-teal-500/50 bg-teal-50/40 p-3 text-center">
                <img
                  src={formFileUrl}
                  alt="Preview"
                  className="mx-auto max-h-48 rounded-lg object-contain border border-slate-200 bg-white"
                />
                <p className="mt-2 text-xs font-bold text-slate-800 truncate">
                  {fileName || 'Image Selected'}
                </p>
                <div className="mt-2 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded bg-white px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-300 hover:bg-slate-50"
                  >
                    <FileUp size={12} />
                    Change Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormFileUrl('')
                      setFileName('')
                    }}
                    className="inline-flex items-center gap-1 rounded bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-100"
                  >
                    <X size={12} />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-teal-500 hover:bg-teal-50/30 transition-all"
              >
                <Upload size={28} className="mx-auto text-teal-600 mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  Click to Browse / Upload from Your Device
                </p>
                <p className="mt-1 text-[11px] text-slate-500 font-ibm">
                  Supports JPG, PNG, WEBP, or live mobile camera captures
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 font-public mb-1">
                Or Enter Image URL / Presets
              </label>
            </div>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={formFileUrl.startsWith('data:') ? '' : formFileUrl}
              onChange={(e) => {
                setFileName('')
                setFormFileUrl(e.target.value)
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 font-ibm focus:border-teal-500 focus:outline-none"
            />
            {/* Quick sample image presets */}
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] font-semibold text-slate-500">Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setFileName('Structural Slab Preset')
                  setFormFileUrl('https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?auto=format&fit=crop&w=1200&q=80')
                }}
                className="text-[11px] font-bold text-teal-600 hover:underline"
              >
                Structural Slab
              </button>
              <span className="text-slate-400">·</span>
              <button
                type="button"
                onClick={() => {
                  setFileName('Steel Erection Preset')
                  setFormFileUrl('https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=1200&q=80')
                }}
                className="text-[11px] font-bold text-teal-600 hover:underline"
              >
                Steel Erection
              </button>
              <span className="text-slate-400">·</span>
              <button
                type="button"
                onClick={() => {
                  setFileName('MEP Utilities Preset')
                  setFormFileUrl('https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80')
                }}
                className="text-[11px] font-bold text-teal-600 hover:underline"
              >
                MEP Utilities
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 font-public mb-1">
              Location / Tag (e.g. Tower B - 5th Floor)
            </label>
            <input
              type="text"
              placeholder="e.g. South Core Shear Wall · Level 3"
              value={formLocationTag}
              onChange={(e) => setFormLocationTag(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 font-ibm focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 font-public mb-1">
              Caption / Milestone Note
            </label>
            <textarea
              rows={2}
              placeholder="Describe work completed, inspection sign-off, or material placement..."
              value={formCaption}
              onChange={(e) => setFormCaption(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 font-ibm focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="neutral" type="button" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Analyzing & Saving...' : 'Save & Predict Milestone'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl bg-slate-900 shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-black"
            >
              <X size={20} />
            </button>

            <img
              src={lightboxPhoto.fileUrl || lightboxPhoto.file_url}
              alt={lightboxPhoto.caption}
              className="max-h-[55vh] w-full object-contain bg-black"
            />

            <div className="p-5 text-white font-public space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone="teal">{lightboxPhoto.locationTag || lightboxPhoto.location_tag || 'Job Site'}</Badge>
                <span className="text-xs font-medium text-slate-400 font-ibm">
                  {formatDate(lightboxPhoto.takenAt || lightboxPhoto.taken_at)} · {formatTime(lightboxPhoto.takenAt || lightboxPhoto.taken_at)}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{lightboxPhoto.caption}</h3>
              
              {/* AI Work-Progress Prediction Banner */}
              {(lightboxPhoto.workPrediction || lightboxPhoto.work_prediction) && (
                <div className="rounded-xl border border-teal-500/30 bg-teal-950/60 p-3.5 backdrop-blur-xs">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-400 text-slate-950 uppercase tracking-wide">
                      AI Estimate
                    </span>
                    <span className="text-[11px] font-medium text-teal-300">
                      Next 3 Days Work Plan
                    </span>
                  </div>
                  <p className="text-xs text-teal-100/90 leading-relaxed font-ibm">
                    {lightboxPhoto.workPrediction || lightboxPhoto.work_prediction}
                  </p>
                </div>
              )}

              <p className="text-xs text-slate-400 font-ibm flex items-center gap-1.5 pt-1">
                <User size={13} className="text-teal-400" />
                Uploaded by: <span className="font-semibold text-white">{lightboxPhoto.uploadedBy || lightboxPhoto.uploaded_by || 'Supervisor'}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
