import { NextResponse } from 'next/server'
import { getPlantById, recordWatering } from '@/lib/db'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const plantId = parseInt(params.id, 10)
  if (isNaN(plantId)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
  }

  const plant = getPlantById(plantId)
  if (!plant) {
    return NextResponse.json({ error: 'Plante introuvable.' }, { status: 404 })
  }

  recordWatering(plantId)
  return NextResponse.json({ success: true })
}
