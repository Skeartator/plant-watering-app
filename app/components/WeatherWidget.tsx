'use client'

interface WeatherWidgetProps {
  temperature: number
  description: string
  emoji: string
  precipitation: number       // prévisions jour en mm
  currentPrecipitation: number // pluie actuellement
}

export default function WeatherWidget({
  temperature,
  description,
  emoji,
  precipitation,
  currentPrecipitation,
}: WeatherWidgetProps) {
  return (
    <div className="rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 px-5 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <span className="text-4xl" role="img" aria-label={description}>
          {emoji}
        </span>
        <div>
          <p className="text-2xl font-bold text-sky-900">{Math.round(temperature)}°C</p>
          <p className="text-sm text-sky-700">{description}</p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-sm font-medium text-sky-800">
          {precipitation > 0
            ? `${precipitation.toFixed(1)} mm prévus`
            : 'Pas de pluie prévue'}
        </p>
        {currentPrecipitation > 0 && (
          <p className="text-xs text-sky-600 mt-0.5">
            🌧️ {currentPrecipitation.toFixed(1)} mm en ce moment
          </p>
        )}
        <p className="text-xs text-sky-500 mt-0.5">La Ciotat</p>
      </div>
    </div>
  )
}
