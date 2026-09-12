// POST /api/reseed — factory reset: overwrite the runtime store with the pristine seed
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST() {
  try {
    const RUNTIME = path.join(process.cwd(), "data", "db.json")
    const SEED = path.join(process.cwd(), "db.json")
    if (!fs.existsSync(SEED)) {
      return NextResponse.json({ error: "seed db.json missing at project root" }, { status: 500 })
    }
    fs.mkdirSync(path.dirname(RUNTIME), { recursive: true })
    fs.copyFileSync(SEED, RUNTIME)
    const db = JSON.parse(fs.readFileSync(RUNTIME, "utf8"))
    return NextResponse.json({
      ok: true,
      problems: db.problems?.length ?? 0,
      interests: db.interests?.length ?? 0,
    })
  } catch (err) {
    console.error("[/api/reseed POST]", err)
    return NextResponse.json({ error: "reseed failed" }, { status: 500 })
  }
}