import { NextResponse } from 'next/server'
import { getAllPlants, getAllSubscriptions, removeSubscriptions } from '@/lib/db'
import { getWeatherLaCiotat } from '@/lib/weather'
import { sendNotification } from '@/lib/push'

export async function GET(request: Request) {
  // Vérification du secret Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Météo
  let weather: Awaited<ReturnType<typeof getWeatherLaCiotat>> | null = null
  try {
    weather = await getWeatherLaCiotat()
  } catch (err) {
    console.error('[cron] Météo indisponible:', err)
  }

  // Plantes nécessitant de l'eau
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const plants = getAllPlants()
  const plantsNeedingWater = plants.filter((plant) => {
    if (!plant.last_watered) return true
    const last = new Date(plant.last_watered)
    last.setHours(0, 0, 0, 0)
    const days = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
    return days >= plant.watering_frequency_days
  })

  if (plantsNeedingWater.length === 0) {
    return NextResponse.json({ message: 'Aucune plante à arroser.' })
  }

  // Notification
  const title = '🌿 Arrosage des plantes'
  let body: string

  if (weather?.willRainToday) {
    body =
      `Il va pleuvoir à La Ciotat aujourd'hui (${weather.dailyPrecipitation.toFixed(1)} mm prévus)` +
      ` — pas besoin d'arroser ! 🌧️`
  } else {
    const names = plantsNeedingWater.map((p) => `${p.emoji} ${p.name}`).join(', ')
    body = `${plantsNeedingWater.length} plante(s) à arroser : ${names}`
    if (weather) body += ` · ${Math.round(weather.temperature)}°C`
  }

  const subscriptions = getAllSubscriptions()
  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      sendNotification(sub, { title, body, icon: '/icon.png', url: '/' })
    )
  )

  // Supprimer les subscriptions expirées (HTTP 410)
  const expired = results
    .map((r, i) =>
      r.status === 'rejected' &&
      (r.reason as { statusCode?: number })?.statusCode === 410
        ? subscriptions[i].endpoint
        : null
    )
    .filter(Boolean) as string[]

  if (expired.length > 0) removeSubscriptions(expired)

  return NextResponse.json({
    plantsNeedingWater: plantsNeedingWater.length,
    willRainToday: weather?.willRainToday ?? null,
    notificationsSent: results.filter((r) => r.status === 'fulfilled').length,
    subscriptionsRemoved: expired.length,
  })
}
