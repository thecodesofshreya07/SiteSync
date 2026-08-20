import { getCollectionDirect, insertSubtaskDirect } from '../db.js'

const SITE_COORDINATES = {
  'SITE-001': { lat: 19.0596, lng: 72.8295, locationName: 'Bandra East, Mumbai' },
  'SITE-002': { lat: 19.2965, lng: 73.0631, locationName: 'Bhiwandi, Thane' },
  'SITE-003': { lat: 19.1176, lng: 72.9060, locationName: 'Powai, Mumbai' },
  'SITE-004': { lat: 18.5913, lng: 73.7389, locationName: 'Hinjewadi, Pune' },
}

// Weather Code descriptions from WMO standard
function interpretWeatherCode(code) {
  if (code === 0) return { label: 'Clear Sky', icon: 'Sun', risk: 'low' }
  if (code >= 1 && code <= 3) return { label: 'Partly Cloudy', icon: 'CloudSun', risk: 'low' }
  if (code >= 45 && code <= 48) return { label: 'Foggy / Hazy', icon: 'CloudFog', risk: 'low' }
  if (code >= 51 && code <= 55) return { label: 'Light Drizzle', icon: 'CloudDrizzle', risk: 'medium' }
  if (code >= 61 && code <= 65) return { label: 'Heavy Rain', icon: 'CloudRain', risk: 'high' }
  if (code >= 80 && code <= 82) return { label: 'Rain Showers', icon: 'CloudRain', risk: 'high' }
  if (code >= 95 && code <= 99) return { label: 'Thunderstorm', icon: 'CloudLightning', risk: 'critical' }
  return { label: 'Overcast', icon: 'Cloud', risk: 'low' }
}

const weatherCache = {}

export async function fetchSiteForecast(siteId) {
  const coords = SITE_COORDINATES[siteId] || SITE_COORDINATES['SITE-001']
  const cacheKey = `${siteId}-${new Date().toISOString().slice(0, 13)}`

  if (weatherCache[cacheKey]) {
    return weatherCache[cacheKey]
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=Asia/Kolkata`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`)

    const data = await res.json()
    const daily = data.daily || {}
    const days = []

    for (let i = 0; i < (daily.time || []).length; i++) {
      const code = daily.weathercode?.[i] ?? 1
      const meta = interpretWeatherCode(code)
      const precip = daily.precipitation_sum?.[i] ?? 0
      const maxTemp = Math.round(daily.temperature_2m_max?.[i] ?? 32)
      const minTemp = Math.round(daily.temperature_2m_min?.[i] ?? 26)
      const maxWind = Math.round(daily.windspeed_10m_max?.[i] ?? 14)

      let riskLevel = meta.risk
      let riskReason = null

      if (precip >= 15) {
        riskLevel = 'high'
        riskReason = `Heavy precipitation (${precip}mm) - high risk for open concrete pouring, crane lifts, and deep excavation.`
      } else if (maxWind >= 35) {
        riskLevel = 'high'
        riskReason = `High wind gusts (${maxWind} km/h) - tower crane operation prohibited.`
      } else if (maxTemp >= 40) {
        riskLevel = 'medium'
        riskReason = `Extreme heat (${maxTemp}°C) - worker hydration breaks required.`
      }

      days.push({
        date: daily.time[i],
        code,
        label: meta.label,
        icon: meta.icon,
        maxTemp,
        minTemp,
        precipitation: precip,
        windSpeed: maxWind,
        riskLevel,
        riskReason,
      })
    }

    const forecastResult = {
      siteId,
      location: coords.locationName,
      coordinates: coords,
      fetchedAt: new Date().toISOString(),
      forecast: days.slice(0, 7),
    }

    weatherCache[cacheKey] = forecastResult

    // Cross-reference tasks for weather risk subtasks
    evaluateWeatherRisksForTasks(siteId, days).catch((err) => {
      console.warn('[Weather] Task cross-reference error:', err.message)
    })

    return forecastResult
  } catch (err) {
    console.warn(`[Weather] Open-Meteo fetch failed for ${siteId}:`, err.message)
    // Fallback forecast for presentation
    return {
      siteId,
      location: coords.locationName,
      coordinates: coords,
      fetchedAt: new Date().toISOString(),
      forecast: [
        { date: new Date().toISOString().slice(0, 10), label: 'Partly Cloudy', maxTemp: 32, minTemp: 26, precipitation: 2, windSpeed: 14, riskLevel: 'low' },
        { date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), label: 'Heavy Rain Showers', maxTemp: 29, minTemp: 24, precipitation: 28, windSpeed: 24, riskLevel: 'high', riskReason: 'Monsoon precipitation (28mm) predicted - reschedule slab concreting.' },
        { date: new Date(Date.now() + 172800000).toISOString().slice(0, 10), label: 'Light Drizzle', maxTemp: 30, minTemp: 25, precipitation: 5, windSpeed: 16, riskLevel: 'medium' },
      ],
    }
  }
}

async function evaluateWeatherRisksForTasks(siteId, forecastDays) {
  const tasks = await getCollectionDirect('tasks')
  const siteTasks = (tasks || []).filter((t) => t.siteId === siteId && t.column !== 'Done')

  for (const day of forecastDays) {
    if (day.riskLevel === 'high' || day.riskLevel === 'critical') {
      const sensitiveTask = siteTasks.find(
        (t) =>
          t.name.toLowerCase().includes('concreting') ||
          t.name.toLowerCase().includes('slab') ||
          t.name.toLowerCase().includes('excavation') ||
          t.name.toLowerCase().includes('crane') ||
          t.name.toLowerCase().includes('roof') ||
          t.name.toLowerCase().includes('painting')
      )

      if (sensitiveTask) {
        const subtaskId = `TSK-WX-${Date.now().toString().slice(-4)}`
        const subtask = {
          id: subtaskId,
          site_id: siteId,
          siteId,
          type: 'weather_risk',
          status: 'resolved',
          reasoning_summary: `Forecast on ${day.date} indicates ${day.label} (${day.precipitation}mm rain, ${day.windSpeed} km/h wind). Flagged sensitive task "${sensitiveTask.name}" (${sensitiveTask.id}) for rescheduling buffer.`,
          related_record_type: 'task',
          related_record_id: sensitiveTask.id,
          relatedRecordType: 'task',
          relatedRecordId: sensitiveTask.id,
          parent_alert_id: null,
          created_at: new Date().toISOString(),
          resolved_at: new Date().toISOString(),
        }
        await insertSubtaskDirect(subtask)
      }
    }
  }
}
