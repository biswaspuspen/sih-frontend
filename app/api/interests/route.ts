import { NextRequest, NextResponse } from "next/server"
import { readDb, writeDb, nextId, matchesQuery } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const db = await readDb()
    const params = new URL(req.url).searchParams
    return NextResponse.json((db.interests ?? []).filter((i) => matchesQuery(i, params)))
  } catch (err) {
    console.error("[/api/interests GET]", err)
    return NextResponse.json({ error: "failed to read interests" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const db = await readDb()
    if (!Array.isArray(db.interests)) db.interests = []
    const record = { ...body, id: nextId(db.interests) }
    db.interests.push(record)
    await writeDb(db)
    return NextResponse.json(record, { status: 201 })
  } catch (err) {
    console.error("[/api/interests POST]", err)
    return NextResponse.json({ error: "failed to create interest" }, { status: 500 })
  }
}