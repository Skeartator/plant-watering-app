import { NextResponse } from 'next/server'
import { saveSubscription, removeSubscription } from '@/lib/db'

export async function POST(request: Request) {
  const sub = await request.json()
  const endpoint: string | undefined = sub?.endpoint
  const p256dh: string | undefined = sub?.keys?.p256dh
  const auth: string | undefined = sub?.keys?.auth

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'Subscription invalide.' }, { status: 400 })
  }

  saveSubscription(endpoint, p256dh, auth)
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const { endpoint } = await request.json()
  if (!endpoint) return NextResponse.json({ error: 'endpoint manquant' }, { status: 400 })

  removeSubscription(endpoint)
  return NextResponse.json({ success: true })
}
