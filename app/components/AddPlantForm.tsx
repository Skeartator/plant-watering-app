'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const EMOJI_OPTIONS = ['🌱', '🌿', '🌺', '🌸', '🌻', '🌵', '🍃', '🍀', '🪴', '🌴', '🌾', '🎋', '🎍', '🍅', '🌶️', '🥬', '🌹', '🪷']

export default function AddPlantForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🌱')
  const [frequency, setFrequency] = useState(3)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!name.trim()) {
      setError('Veuillez saisir un nom.')
      return
    }

    const res = await fetch('/api/plants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), emoji, watering_frequency_days: frequency }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Erreur lors de l\'ajout.')
      return
    }

    setName('')
    setEmoji('🌱')
    setFrequency(3)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    startTransition(() => router.refresh())
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-green-200 bg-white/70 px-4 py-4 space-y-3 shadow-sm"
    >
      {/* Emoji picker */}
      <div>
        <label className="block text-xs font-medium text-green-800 mb-1.5">Emoji</label>
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`text-xl w-9 h-9 rounded-lg transition-all
                ${emoji === e
                  ? 'bg-green-200 ring-2 ring-green-500 scale-110'
                  : 'bg-gray-100 hover:bg-green-100'
                }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Nom */}
      <div>
        <label htmlFor="plant-name" className="block text-xs font-medium text-green-800 mb-1">
          Nom de la plante
        </label>
        <input
          id="plant-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex: Lavande, Basilic…"
          maxLength={60}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
        />
      </div>

      {/* Fréquence */}
      <div>
        <label htmlFor="plant-freq" className="block text-xs font-medium text-green-800 mb-1">
          Arroser tous les <span className="text-green-700 font-bold">{frequency}</span> jours
        </label>
        <input
          id="plant-freq"
          type="range"
          min={1}
          max={30}
          value={frequency}
          onChange={(e) => setFrequency(Number(e.target.value))}
          className="w-full accent-green-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>1 j</span>
          <span>30 j</span>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-green-600">✅ Plante ajoutée !</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium text-sm py-2 rounded-lg transition-colors disabled:opacity-60 active:scale-[0.98]"
      >
        {isPending ? 'Ajout…' : `Ajouter ${emoji} ${name || 'la plante'}`}
      </button>
    </form>
  )
}
