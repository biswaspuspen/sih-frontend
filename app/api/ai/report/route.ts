// app/api/ai/report/route.ts
// POST /api/ai/report — Gemini reviews a university's submitted solution for a SIP.
// Body: { problemId, solutionNotes, solutionFileName }
// Success: writes problem.aiReport (persisted) and returns { aiRan: true, aiReport }
// Failure: 503 { aiRan: false, reason } — the UI keeps the upload and shows "AI review pending".

import { NextRequest, NextResponse } from "next/server"
import { readDb, writeDb } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const TIMEOUT_MS = 12000
const RECS = ["Strongly Recommended", "Conditional Pilot", "Needs Revision", "Not Feasible"]

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

  const problemId = body.problemId != null ? String(body.problemId) : ""
  const solutionNotes = String(body.solutionNotes ?? "").trim()
  const solutionFileName = String(body.solutionFileName ?? "").trim()
  if (!problemId) return NextResponse.json({ error: "problemId is required" }, { status: 400 })

  const db = await readDb()
  const idx = (Array.isArray(db.problems) ? db.problems : []).findIndex(
    (p) => String(p.id) === problemId || String(p.sipId ?? "") === problemId
  )
  if (idx === -1) return NextResponse.json({ error: "problem not found" }, { status: 404 })

  const p = db.problems[idx]

  const prompt = `You are the independent AI assessor inside SAHYOG, a Jharkhand state innovation platform. A university research node has SUBMITTED a solution to a citizen grievance. Write a structured technical verification note for the state control room.

Grievance:
- SIP: ${p.sipId || p.id}
- Title: ${p.title ?? ""}
- Category: ${p.category ?? ""}
- District: ${p.location ?? ""}
- Description: ${p.description ?? ""}

Submitted solution:
- Design document: ${solutionFileName || "not attached"}
- Research notes: ${solutionNotes || "(no notes provided)"}
- Implementing node: ${p.institution ?? "unknown"}

Respond with STRICT JSON ONLY (no markdown, no code fences):
1. "summary": 2-3 sentences, max 60 words — what the solution does and how it maps to the grievance.
2. "feasibilityScore": integer 0-100 — technical feasibility for real field deployment given the Jharkhand context (infrastructure, cost, maintainability).
3. "risks": array of 2-4 short strings (max 12 words each) — deployment/regulatory/maintenance risks. If notes look strong, still name monitoring risks.
4. "recommendation": exactly one of ${JSON.stringify(RECS)}.

Respond now with ONLY the JSON object.`

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
    })

    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
    ])

    const raw = result.response.text().trim()
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim()
    const parsed = JSON.parse(cleaned)

    const aiReport = {
      summary: String(parsed.summary ?? "").trim().slice(0, 500) || "Assessment generated.",
      feasibilityScore: Math.max(0, Math.min(100, Math.round(Number(parsed.feasibilityScore) || 0))),
      risks: (Array.isArray(parsed.risks) ? parsed.risks : [])
        .map((r: unknown) => String(r).trim())
        .filter(Boolean)
        .slice(0, 5),
      recommendation: RECS.includes(parsed.recommendation) ? parsed.recommendation : "Conditional Pilot",
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      generatedAt: new Date().toISOString(),
      aiRan: true,
    }

    db.problems[idx] = { ...db.problems[idx], aiReport }
    await writeDb(db)

    return NextResponse.json({ aiRan: true, aiReport })
  } catch (err: any) {
    const msg = String(err?.message || err)
    console.error("[/api/ai/report] Gemini failure:", msg)
    if (msg === "timeout") return unavailable("AI service timed out after 12s")
    return unavailable(`AI service error: ${msg.slice(0, 200)}`)
  }
}