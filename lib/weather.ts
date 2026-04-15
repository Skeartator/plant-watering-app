const LAT = 43.17
const LON = 5.61
const TIMEZONE = 'Europe/Paris'

export interface WeatherData {
  temperature: number
  currentPrecipitation: number
  dailyPrecipitation: number // forecast total for today
  weatherCode: number
  weatherCodeMax: number
  willRainToday: boolean // daily forecast > 1mm
  isRainingNow: boolean  // current > 0
}

export async function getWeatherLaCiotat(): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${LAT}&longitude=${LON}` +
    `&current=temperature_2m,precipitation,weather_code` +
    `&daily=precipitation_sum,weather_code_max` +
    `&timezone=${encodeURIComponent(TIMEZONE)}` +
    `&forecast_days=1`

  const res = await fetch(url, { next: { revalidate: 1800 } })
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`)

  const data = await res.json()

  return {
    temperature: data.current.temperature_2m,
    currentPrecipitation: data.current.precipitation,
    dailyPrecipitation: data.daily.precipitation_sum[0] ?? 0,
    weatherCode: data.current.weather_code,
    weatherCodeMax: data.daily.weather_code_max[0] ?? data.current.weather_code,
    willRainToday: (data.daily.precipitation_sum[0] ?? 0) > 1,
    isRainingNow: data.current.precipitation > 0,
  }
}

export function weatherDescription(code: number): string {
  const map: Record<number, string> = {
    0: 'Ciel dégagé',
    1: 'Principalement dégagé',
    2: 'Partiellement nuageux',
    3: 'Couvert',
    45: 'Brouillard',
    48: 'Brouillard givrant',
    51: 'Bruine légère',
    53: 'Bruine modérée',
    55: 'Bruine dense',
    61: 'Pluie légère',
    63: 'Pluie modérée',
    65: 'Pluie forte',
    71: 'Neige légère',
    73: 'Neige modérée',
    75: 'Neige forte',
    80: 'Averses légères',
    81: 'Averses modérées',
    82: 'Averses violentes',
    95: 'Orage',
    96: 'Orage avec grêle',
    99: 'Orage violent avec grêle',
  }
  return map[code] ?? 'Conditions inconnues'
}

export function weatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 2) return '🌤️'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 55) return '🌦️'
  if (code <= 65) return '🌧️'
  if (code <= 75) return '❄️'
  if (code <= 82) return '🌦️'
  return '⛈️'
}
