import { getPlantsWithStatus } from '@/lib/db'
import { getWeatherLaCiotat, weatherDescription, weatherEmoji, WeatherData } from '@/lib/weather'
import WeatherWidget from './components/WeatherWidget'
import PlantCard from './components/PlantCard'
import AddPlantForm from './components/AddPlantForm'
import PushSubscribe from './components/PushSubscribe'

export const dynamic = 'force-dynamic'

export default async function Home() {
  // --- Météo ---
  let weather: WeatherData | null = null
  let weatherError = false
  try {
    weather = await getWeatherLaCiotat()
  } catch {
    weatherError = true
  }

  // --- Plantes ---
  const plants = getPlantsWithStatus()
  const plantsNeedingWater = plants.filter((p) => p.needsWatering && !p.watered_today)

  // --- Recommandation du jour ---
  const rainingToday = weather?.willRainToday ?? false
  let recommendation: { icon: string; text: string; color: string }

  if (plantsNeedingWater.length === 0) {
    recommendation = {
      icon: '✅',
      text: 'Toutes vos plantes sont bien arrosées !',
      color: 'bg-green-100 border-green-300 text-green-800',
    }
  } else if (rainingToday) {
    recommendation = {
      icon: '🌧️',
      text: `Il va pleuvoir aujourd'hui (${weather!.dailyPrecipitation.toFixed(1)} mm prévus) — la pluie s'en charge !`,
      color: 'bg-blue-100 border-blue-300 text-blue-800',
    }
  } else {
    const names = plantsNeedingWater.map((p) => `${p.emoji} ${p.name}`).join(', ')
    recommendation = {
      icon: '💧',
      text: `${plantsNeedingWater.length} plante(s) à arroser aujourd'hui : ${names}`,
      color: 'bg-amber-100 border-amber-300 text-amber-800',
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* En-tête */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-800 flex items-center gap-2">
            🌿 Mes Plantes
          </h1>
          <p className="text-sm text-green-600 mt-0.5">La Ciotat · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <PushSubscribe />
      </header>

      {/* Météo */}
      {weather ? (
        <WeatherWidget
          temperature={weather.temperature}
          description={weatherDescription(weather.weatherCode)}
          emoji={weatherEmoji(weather.weatherCodeMax)}
          precipitation={weather.dailyPrecipitation}
          currentPrecipitation={weather.currentPrecipitation}
        />
      ) : weatherError ? (
        <div className="rounded-xl border border-gray-200 bg-white/60 p-4 text-sm text-gray-500">
          Météo indisponible pour le moment.
        </div>
      ) : null}

      {/* Recommandation du jour */}
      <div className={`rounded-xl border px-4 py-3 text-sm font-medium flex items-start gap-2 ${recommendation.color}`}>
        <span className="text-base mt-0.5">{recommendation.icon}</span>
        <span>{recommendation.text}</span>
      </div>

      {/* Liste des plantes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-green-900 text-lg">Mes plantes</h2>
          <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
            {plants.length} plante{plants.length > 1 ? 's' : ''}
          </span>
        </div>

        {plants.length === 0 ? (
          <div className="rounded-xl border border-dashed border-green-300 bg-white/40 p-8 text-center text-green-600 text-sm">
            Aucune plante encore. Ajoutez votre première plante ci-dessous !
          </div>
        ) : (
          <div className="space-y-3">
            {plants.map((plant) => (
              <PlantCard
                key={plant.id}
                id={plant.id}
                name={plant.name}
                emoji={plant.emoji}
                wateringFrequencyDays={plant.watering_frequency_days}
                lastWatered={plant.last_watered}
                wateredToday={plant.watered_today === 1}
                needsWatering={plant.needsWatering}
                daysSinceWatering={plant.daysSinceWatering}
                nextWateringDate={plant.nextWateringDate}
                rainingToday={rainingToday}
              />
            ))}
          </div>
        )}
      </section>

      {/* Ajouter une plante */}
      <section>
        <h2 className="font-semibold text-green-900 text-lg mb-3">Ajouter une plante</h2>
        <AddPlantForm />
      </section>
    </main>
  )
}
