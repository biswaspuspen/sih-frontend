import { NextRequest, NextResponse } from "next/server"
import { readDb, matchesQuery } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const db = await readDb()
    const params = new URL(req.url).searchParams
    return NextResponse.json((db.industry ?? []).filter((i) => matchesQuery(i, params)))
  } catch (err) {
    console.error("[/api/industry GET]", err)
    return NextResponse.json({ error: "failed to read industry" }, { status: 500 })
  }
}