// lib/db.ts — SERVER-ONLY helpers. Read/write the runtime copy of db.json.
// The git-tracked root db.json is the pristine seed. At runtime the API
// works on data/db.json (auto-created on first read). Factory reset =
// delete the data/ folder. Never import this file from client components.

import { promises as fsp } from "fs"
import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const RUNTIME_DB = path.join(DATA_DIR, "db.json")
const SEED_DB = path.join(process.cwd(), "db.json")

export type Db = {
  problems: any[]
  teamMembers: any[]
  universities: any[]
  industry: any[]
  interests: any[]
  stats: Record<string, any>
  [collection: string]: any
}

function ensureDb(): void {
  if (!fs.existsSync(SEED_DB)) {
    throw new Error("Seed db.json not found at project root — API cannot start without it.")
  }
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(RUNTIME_DB)) {
    fs.copyFileSync(SEED_DB, RUNTIME_DB)
    console.warn("[db] runtime store created: data/db.json (seeded from root db.json)")
  }
}

export async function readDb(): Promise<Db> {
  ensureDb()
  const raw = await fsp.readFile(RUNTIME_DB, "utf8")
  return JSON.parse(raw) as Db
}

export async function writeDb(db: Db): Promise<void> {
  ensureDb()
  await fsp.writeFile(RUNTIME_DB, JSON.stringify(db, null, 2) + "\n")
}

// Incremental string ids ("8", "9", ...) — deterministic; UI displays sipId, not this.
export function nextId(items: any[]): string {
  const max = items.reduce((m, x) => {
    const n = parseInt(x?.id, 10)
    return Number.isNaN(n) ? m : Math.max(m, n)
  }, 0)
  return String(max + 1)
}

// json-server parity: every query param must equal the record's field (string-compare)
export function matchesQuery(item: Record<string, any>, params: URLSearchParams): boolean {
  for (const [key, value] of params.entries()) {
    if (String(item[key] ?? "") !== value) return false
  }
  return true
}