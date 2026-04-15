import { NextResponse } from 'next/server'
import { getAllPlants, createPlant, deletePlant } from '@/lib/db'

export async function GET() {
  return NextResponse.json(getAllPlants())
}

export async function POST(request: Request) {
  const body = await request.json()
  const { name, emoji, watering_frequency_days } = body

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'Le nom est requis.' }, { status: 400 })
  }
  const freq = parseInt(watering_frequency_days, 10)
  if (!freq || freq < 1 || freq > 365) {
    return NextResponse.json(
      { error: 'La fréquence doit être entre 1 et 365 jours.' },
      { status: 400 }
    )
  }

  const id = createPlant(name.trim(), emoji || '🌱', freq)
  return NextResponse.json({ id }, { status: 201 })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 })

  const deleted = deletePlant(parseInt(id, 10))
  if (!deleted) return NextResponse.json({ error: 'Plante introuvable.' }, { status: 404 })
  return NextResponse.json({ success: true })
}
