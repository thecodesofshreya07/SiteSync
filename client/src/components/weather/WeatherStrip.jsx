import { useEffect, useState } from 'react'
import { CloudRain, Sun, Cloud, CloudLightning, Wind, Thermometer, AlertTriangle, CloudSun, CloudDrizzle, MapPin } from 'lucide-react'
import { formatDate } from '../../lib/utils'
import Badge from '../common/Badge'

const API_BASE = 'http://localhost:4000/api'

function getWeatherIcon(label) {
  const l = (label || '').toLowerCase()
  if (l.includes('thunder') || l.includes('lightning')) return <CloudLightning size={20} className="text-amber-400" />
  if (l.includes('heavy rain') || l.includes('shower')) return <CloudRain size={20} className="text-blue-400" />
  if (l.includes('drizzle')) return <CloudDrizzle size={20} className="text-teal-400" />
  if (l.includes('clear') || l.includes('sun')) return <Sun size={20} className="text-amber-400" />
  if (l.includes('partly')) return <CloudSun size={20} className="text-teal-300" />
  return <Cloud size={20} className="text-slate-300" />
}

export default function WeatherStrip({ siteId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!siteId) return
    let isMounted = true
    setLoading(true)

    fetch(`${API_BASE}/sites/${encodeURIComponent(siteId)}/weather`)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted) {
          setData(json)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.warn('Could not load weather forecast:', err)
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [siteId])

  if (loading) {
    return (
      <div className="rounded-xl border border-surface-border bg-white p-4 text-xs font-semibold text-slate-500 font-ibm animate-pulse">
        Loading 7-day live weather forecast...
      </div>
    )
  }

  if (!data?.forecast || data.forecast.length === 0) return null

  const days = data.forecast.slice(0, 5)
  const hasHighRisk = days.some((d) => d.riskLevel === 'high' || d.riskLevel === 'critical')

  return (
    <div className="rounded-xl border border-surface-border bg-navy-950 p-4 text-white shadow-card font-public">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <CloudSun size={18} className="text-teal-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Open-Meteo Live Forecast · {data.location || 'Job Site'}
          </h3>
        </div>
        {hasHighRisk ? (
          <Badge tone="red" className="animate-pulse">
            Weather Risk Detected for Outdoor Tasks
          </Badge>
        ) : (
          <Badge tone="green">Favorable Weather Conditions</Badge>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {days.map((d, i) => {
          const isToday = i === 0
          const isRisk = d.riskLevel === 'high' || d.riskLevel === 'critical'

          return (
            <div
              key={d.date}
              className={`rounded-lg border p-2.5 transition-colors ${
                isRisk
                  ? 'border-red-500/50 bg-red-950/30'
                  : 'border-slate-800 bg-navy-900/90'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 font-ibm">
                <span>{isToday ? 'Today' : formatDate(d.date).slice(0, 6)}</span>
                {d.precipitation > 0 && (
                  <span className="text-blue-300">{d.precipitation}mm</span>
                )}
              </div>

              <div className="my-2 flex items-center justify-between">
                {getWeatherIcon(d.label)}
                <span className="text-sm font-bold text-white font-ibm">
                  {d.maxTemp}° <span className="text-xs font-normal text-slate-400">/ {d.minTemp}°</span>
                </span>
              </div>

              <p className="text-[11px] font-medium text-slate-300 line-clamp-1 font-ibm">{d.label}</p>

              {d.riskReason && (
                <p className="mt-1 text-[10px] font-semibold leading-tight text-amber-300 line-clamp-2">
                  ⚠ {d.riskReason}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
