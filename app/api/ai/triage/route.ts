// app/api/ai/triage/route.ts
// POST /api/ai/triage — real AI classification of a citizen grievance.
// Server-only: the Gemini key lives in .env.local and never reaches the client.
// Contract on success: { category, priority, confidence, suggestedInstitution, reasoning, model, aiRan: true }
// Contract on failure/unavailable: 503 { aiRan: false, reason } — the client falls back to local heuristics.

import { NextRequest, NextResponse } from "next/server"
import { readDb } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const CATEGORIES = [
  "Water Resources",
  "Agriculture",
  "Healthcare",
  "Energy",
  "Mining",
  "Education",
  "Environment",
  "Urban Development",
]
const PRIORITIES = ["High", "Medium", "Low"]
const TIMEOUT_MS = 12000

const unavailable = (reason: string) =>
  NextResponse.json({ aiRan: false, reason }, { status: 503 })

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return unavailable("GEMINI_API_KEY not configured on the server")

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 })
  }

  const title = String(body.title ?? "").trim()
  const description = String(body.description ?? "").trim()
  const district = String(body.district ?? "").trim()
  const submitterType = String(body.submitterType ?? "").trim()
  if (!title || !description) {
    return NextResponse.json({ error: "title and description are required" }, { status: 400 })
  }

  // Ground the institution suggestion in the REAL directory
  let institutions: string[] = []
  try {
    const db = await readDb()
    institutions = (db.universities ?? []).map((u) => u.name).filter(Boolean)
  } catch {
    institutions = []
  }
  if (institutions.length === 0) {
    institutions = ["BIT Mesra", "IIT (ISM) Dhanbad", "Birsa Agricultural University", "NIT Jamshedpur", "RIMS Ranchi"]
  }

  const prompt = `You are the grievance-triage engine of SAHYOG, a Jharkhand state platform that routes citizen problems to university research labs.

Classify this grievance and respond with STRICT JSON ONLY (no markdown, no code fences, no extra text).

Grievance:
- Title: ${title}
- Description: ${description}
- District: ${district || "unspecified"}
- Submitter: ${submitterType || "citizen"}

Rules:
1. "category": exactly one of ${JSON.stringify(CATEGORIES)}.
2. "priority": exactly one of ${JSON.stringify(PRIORITIES)} — calibrate conservatively:
   - "High" ONLY when there is imminent danger to life or health, active drinking-water contamination, structural collapse risk, fire/electrical hazard, or an urgent seasonal deadline affecting a large population.
   - "Medium" when there is real damage or degraded public service WITHOUT imminent danger (worn infrastructure, crop losses, waterlogging, equipment failures, school building disrepair, service delays).
   - "Low" for minor, cosmetic, localized, or already-mitigated issues.
   When the danger is not clearly imminent, choose "Medium". Do NOT inflate severity — most field reports should be Medium, not High.
3. "confidence": integer 0-100 reflecting how certain you are about the category.
4. "suggestedInstitution": exactly one of ${JSON.stringify(institutions)} — pick the lab whose research strengths best match the category (e.g. IIT ISM Dhanbad for Mining/Energy, RIMS Ranchi for Healthcare, Birsa Agricultural University for Agriculture).
5. "reasoning": one or two sentences, max 45 words, justifying category+priority in plain administrative English.

Respond now with ONLY the JSON object.`

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    })

    const call = model.generateContent(prompt)
    const result = await Promise.race([
      call,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
    ])

    const raw = result.response.text().trim()
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim()
    const parsed = JSON.parse(cleaned)

    // Coerce everything into the contract — never trust the model blindly
    const category = CATEGORIES.includes(parsed.category) ? parsed.category : "Urban Development"
    const priority = PRIORITIES.includes(parsed.priority) ? parsed.priority : "Medium"
    const confidence = Math.max(0, Math.min(100, Math.round(Number(parsed.confidence) || 0)))
    const suggestedInstitution = institutions.includes(parsed.suggestedInstitution)
      ? parsed.suggestedInstitution
      : institutions[0]
    const reasoning = String(parsed.reasoning ?? "").trim().slice(0, 400) ||
      "Classified from title and description semantics."

    return NextResponse.json({
      category,
      priority,
      confidence,
      suggestedInstitution,
      reasoning,
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      aiRan: true,
    })
  } catch (err: any) {
    const msg = String(err?.message || err)
    console.error("[/api/ai/triage] Gemini failure:", msg)
    if (msg === "timeout") return unavailable("AI service timed out after 12s")
    return unavailable(`AI service error: ${msg.slice(0, 120)}`)
  }
}
