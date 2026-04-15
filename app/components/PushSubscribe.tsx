'use client'

import { useState, useEffect } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const arr = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i)
  return arr.buffer
}

type State = 'idle' | 'subscribed' | 'denied' | 'unsupported' | 'loading' | 'error'

export default function PushSubscribe() {
  const [state, setState] = useState<State>('idle')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }
    // Vérifie si déjà souscrit
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      if (sub) setState('subscribed')
    })
  }, [])

  async function subscribe() {
    if (!VAPID_PUBLIC_KEY) {
      alert('Clé VAPID non configurée. Voir README.')
      return
    }

    setState('loading')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState('denied')
        return
      }

      // Enregistrement du service worker
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Souscription push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      // Envoi au serveur
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      if (!res.ok) throw new Error('Erreur serveur')
      setState('subscribed')
    } catch (err) {
      console.error('[push]', err)
      setState('error')
    }
  }

  async function unsubscribe() {
    setState('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setState('idle')
    } catch {
      setState('error')
    }
  }

  if (state === 'unsupported' || !VAPID_PUBLIC_KEY) return null

  return (
    <div>
      {state === 'subscribed' ? (
        <button
          onClick={unsubscribe}
          className="text-xs text-green-700 bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
          title="Désactiver les notifications"
        >
          🔔 Notifs activées
        </button>
      ) : state === 'denied' ? (
        <span className="text-xs text-gray-400">🔕 Notifs bloquées</span>
      ) : (
        <button
          onClick={subscribe}
          disabled={state === 'loading'}
          className="text-xs text-sky-700 bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg hover:bg-sky-200 transition-colors flex items-center gap-1 disabled:opacity-60"
          title="Recevoir un rappel chaque matin à 8h"
        >
          {state === 'loading' ? '⏳ …' : '🔔 Activer les notifs'}
        </button>
      )}
      {state === 'error' && (
        <p className="text-xs text-red-500 mt-1">Erreur. Réessayez.</p>
      )}
    </div>
  )
}
