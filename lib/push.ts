import webpush from 'web-push'

let initialized = false

export function initWebPush(): boolean {
  if (initialized) return true

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const email = process.env.VAPID_EMAIL || 'mailto:admin@example.com'

  if (!publicKey || !privateKey) {
    console.warn('[push] VAPID keys missing — notifications disabled.')
    return false
  }

  webpush.setVapidDetails(email, publicKey, privateKey)
  initialized = true
  return true
}

export interface PushSubscriptionRecord {
  endpoint: string
  p256dh: string
  auth: string
}

export async function sendNotification(
  sub: PushSubscriptionRecord,
  payload: { title: string; body: string; icon?: string; url?: string }
): Promise<void> {
  if (!initWebPush()) throw new Error('VAPID not configured')

  await webpush.sendNotification(
    {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    },
    JSON.stringify(payload)
  )
}
