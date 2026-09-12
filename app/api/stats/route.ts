import { NextResponse } from "next/server"
import { readDb } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const db = await readDb()
    return NextResponse.json(db.stats ?? {})
  } catch (err) {
    console.error("[/api/stats GET]", err)
    return NextResponse.json({ error: "failed to read stats" }, { status: 500 })
  }
}