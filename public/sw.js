// Service Worker — notifications push pour l'arrosage des plantes

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'Arrosage', body: event.data?.text() ?? '' }
  }

  const title = data.title || '🌿 Arrosage des plantes'
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200],
    tag: 'watering-reminder',
    renotify: true,
    data: { url: data.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url === url && 'focus' in c)
        if (existing) return existing.focus()
        return self.clients.openWindow(url)
      })
  )
})
