'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface PlantCardProps {
  id: number
  name: string
  emoji: string
  wateringFrequencyDays: number
  lastWatered: string | null
  wateredToday: boolean
  needsWatering: boolean
  daysSinceWatering: number | null
  nextWateringDate: string | null
  rainingToday: boolean
}

export default function PlantCard({
  id,
  name,
  emoji,
  wateringFrequencyDays,
  lastWatered,
  wateredToday,
  needsWatering,
  daysSinceWatering,
  nextWateringDate,
  rainingToday,
}: PlantCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localWateredToday, setLocalWateredToday] = useState(wateredToday)
  const [error, setError] = useState<string | null>(null)

  async function handleWater() {
    setError(null)
    const res = await fetch(`/api/water/${id}`, { method: 'POST' })
    if (!res.ok) {
      setError('Erreur lors de la mise à jour.')
      return
    }
    setLocalWateredToday(true)
    startTransition(() => router.refresh())
  }

  async function handleDelete() {
    if (!confirm(`Supprimer "${name}" ?`)) return
    const res = await fetch(`/api/plants?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      setError('Erreur lors de la suppression.')
      return
    }
    startTransition(() => router.refresh())
  }

  // Badge de statut
  let statusBadge: { icon: string; label: string; cls: string }
  if (localWateredToday) {
    statusBadge = {
      icon: '✅',
      label: 'Arrosé aujourd\'hui',
      cls: 'bg-green-100 text-green-700',
    }
  } else if (needsWatering && !rainingToday) {
    statusBadge = {
      icon: '💧',
      label: 'À arroser',
      cls: 'bg-amber-100 text-amber-700',
    }
  } else if (needsWatering && rainingToday) {
    statusBadge = {
      icon: '🌧️',
      label: 'Pluie prévue',
      cls: 'bg-blue-100 text-blue-700',
    }
  } else {
    statusBadge = {
      icon: '🌿',
      label: 'Pas besoin',
      cls: 'bg-emerald-100 text-emerald-700',
    }
  }

  const lastWateredLabel = (() => {
    if (!lastWatered) return 'Jamais arrosé'
    if (daysSinceWatering === 0) return 'Arrosé aujourd\'hui'
    if (daysSinceWatering === 1) return 'Arrosé hier'
    return `Il y a ${daysSinceWatering} jours`
  })()

  const nextLabel = (() => {
    if (!nextWateringDate) return null
    const next = new Date(nextWateringDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diff = Math.floor((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diff <= 0) return 'Maintenant'
    if (diff === 1) return 'Demain'
    return `Dans ${diff} jours`
  })()

  return (
    <div className="rounded-xl border border-green-200 bg-white/70 shadow-sm px-4 py-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      {/* Emoji */}
      <span className="text-3xl flex-shrink-0 w-10 text-center">{emoji}</span>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-green-900 truncate">{name}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge.cls}`}>
            {statusBadge.icon} {statusBadge.label}
          </span>
        </div>

        <div className="flex gap-3 mt-1 text-xs text-gray-500 flex-wrap">
          <span>⏱ Tous les {wateringFrequencyDays} j</span>
          <span>🗓 {lastWateredLabel}</span>
          {nextLabel && !localWateredToday && (
            <span>⏭ Prochain : {nextLabel}</span>
          )}
        </div>

        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button
          onClick={handleWater}
          disabled={localWateredToday || isPending}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap
            ${
              localWateredToday
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white active:scale-95'
            }`}
        >
          {isPending ? '...' : localWateredToday ? 'Fait ✓' : '💧 Arrosé'}
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors text-center"
          title="Supprimer la plante"
        >
          Supprimer
        </button>
      </div>
    </div>
  )
}
