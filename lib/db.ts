import path from 'path'

// Minimal typings for node-sqlite3-wasm (no native compilation needed)
interface SQLiteDB {
  exec(sql: string): void
  run(sql: string, params?: unknown[]): { changes: number; lastInsertRowid: number | bigint }
  all(sql: string, params?: unknown[]): unknown[]
  get(sql: string, params?: unknown[]): unknown
  close(): void
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Database } = require('node-sqlite3-wasm') as { Database: new (path: string) => SQLiteDB }

// Sur Vercel, seul /tmp est accessible en écriture
const DB_PATH =
  process.env.DB_PATH ||
  (process.env.VERCEL ? '/tmp/plants.db' : path.join(process.cwd(), 'plants.db'))

let _db: SQLiteDB | null = null

function getDb(): SQLiteDB {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.exec(`PRAGMA journal_mode = WAL;`)
    _db.exec(`PRAGMA foreign_keys = ON;`)
    _db.exec(`
      CREATE TABLE IF NOT EXISTS plants (
        id                      INTEGER PRIMARY KEY AUTOINCREMENT,
        name                    TEXT    NOT NULL,
        emoji                   TEXT    NOT NULL DEFAULT '🌱',
        watering_frequency_days INTEGER NOT NULL DEFAULT 3,
        created_at              DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS watering_history (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        plant_id   INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
        watered_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint   TEXT UNIQUE NOT NULL,
        p256dh     TEXT NOT NULL,
        auth       TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)
  }
  return _db
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlantRow {
  id: number
  name: string
  emoji: string
  watering_frequency_days: number
  created_at: string
  last_watered: string | null
  watered_today: number // 0 or 1
}

export interface PlantWithStatus extends PlantRow {
  needsWatering: boolean
  daysSinceWatering: number | null
  nextWateringDate: string | null
}

export interface PushSubscriptionRecord {
  endpoint: string
  p256dh: string
  auth: string
}

// ─── Plants ───────────────────────────────────────────────────────────────────

const PLANT_QUERY = `
  SELECT
    p.*,
    MAX(wh.watered_at) AS last_watered,
    (SELECT COUNT(*) FROM watering_history wh2
     WHERE wh2.plant_id = p.id
       AND DATE(wh2.watered_at, 'localtime') = DATE('now', 'localtime')) AS watered_today
  FROM plants p
  LEFT JOIN watering_history wh ON wh.plant_id = p.id
  GROUP BY p.id
  ORDER BY p.name ASC`

function addStatus(rows: PlantRow[]): PlantWithStatus[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return rows.map((plant) => {
    let needsWatering = true
    let daysSinceWatering: number | null = null
    let nextWateringDate: string | null = null

    if (plant.last_watered) {
      const last = new Date(plant.last_watered)
      last.setHours(0, 0, 0, 0)
      daysSinceWatering = Math.floor(
        (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
      )
      needsWatering = daysSinceWatering >= plant.watering_frequency_days
      const next = new Date(last)
      next.setDate(next.getDate() + plant.watering_frequency_days)
      nextWateringDate = next.toISOString().split('T')[0]
    }

    return { ...plant, needsWatering, daysSinceWatering, nextWateringDate }
  })
}

export function getPlantsWithStatus(): PlantWithStatus[] {
  const db = getDb()
  return addStatus(db.all(PLANT_QUERY) as PlantRow[])
}

export function getAllPlants(): PlantRow[] {
  return getDb().all(PLANT_QUERY) as PlantRow[]
}

export function getPlantById(id: number): PlantRow | undefined {
  return getDb().get('SELECT * FROM plants WHERE id = ?', [id]) as PlantRow | undefined
}

export function createPlant(name: string, emoji: string, freq: number): number {
  const db = getDb()
  const result = db.run(
    'INSERT INTO plants (name, emoji, watering_frequency_days) VALUES (?, ?, ?)',
    [name, emoji, freq]
  )
  return result.lastInsertRowid as number
}

export function deletePlant(id: number): boolean {
  const db = getDb()
  const existing = db.get('SELECT id FROM plants WHERE id = ?', [id])
  if (!existing) return false
  db.run('DELETE FROM plants WHERE id = ?', [id])
  return true
}

// ─── Watering ─────────────────────────────────────────────────────────────────

export function recordWatering(plantId: number): void {
  getDb().run('INSERT INTO watering_history (plant_id) VALUES (?)', [plantId])
}

// ─── Push subscriptions ───────────────────────────────────────────────────────

export function saveSubscription(endpoint: string, p256dh: string, auth: string): void {
  getDb().run(
    `INSERT INTO push_subscriptions (endpoint, p256dh, auth)
     VALUES (?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth`,
    [endpoint, p256dh, auth]
  )
}

export function removeSubscription(endpoint: string): void {
  getDb().run('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint])
}

export function getAllSubscriptions(): PushSubscriptionRecord[] {
  return getDb().all('SELECT endpoint, p256dh, auth FROM push_subscriptions') as PushSubscriptionRecord[]
}

export function removeSubscriptions(endpoints: string[]): void {
  const db = getDb()
  for (const ep of endpoints) {
    db.run('DELETE FROM push_subscriptions WHERE endpoint = ?', [ep])
  }
}
