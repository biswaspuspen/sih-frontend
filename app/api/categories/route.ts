import { NextResponse } from "next/server"
import { readDb } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const db = await readDb()
    const categories = Array.from(
      new Set(
        (db.problems ?? [])
          .map((p) => p.category)
          .filter(Boolean)
      )
    ).sort()
    return NextResponse.json(categories)
  } catch (err) {
    console.error("[/api/categories GET]", err)
    return NextResponse.json({ error: "failed to read categories" }, { status: 500 })
  }
}