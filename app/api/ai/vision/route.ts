// app/api/ai/vision/route.ts
// POST /api/ai/vision — Gemini analyzes an uploaded geotagged photo and
// autofills the grievance title + description. Body: { mimeType, data (base64) }
// Success: { aiRan: true, title, description }
// Failure: 503 { aiRan: false, reason } — the client falls back to manual entry.

import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const TIMEOUT_MS = 20000

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return NextResponse.json({ aiRan: false, reason: "GEMINI_API_KEY not configured" }, { status: 503 })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 })
  }

  const mimeType =
    typeof body.mimeType === "string" && body.mimeType.startsWith("image/")
      ? body.mimeType
      : "image/jpeg"
  const data = String(body.data ?? "")
  if (!data) return NextResponse.json({ error: "image data is required" }, { status: 400 })

  const prompt = `You are the evidence-intake agent for SAHYOG, a Jharkhand state platform that turns citizen photos of civic and environmental problems into structured grievance records.

Look at the photo and respond with STRICT JSON ONLY (no markdown, no code fences):

{
  "title": "a short title, max 12 words, naming the visible problem (e.g. 'Silted drainage canal flooding the market road')",
  "description": "2-3 sentences, max 70 words, describing what the photo shows, the visible severity, and the likely impact on people or the environment. Write as a formal field report."
}

Rules:
- Identify the real problem in THIS photo — never invent a problem that isn't visible.
- Infer the Jharkhand context where relevant (mining, agriculture, water, urban civic, school infrastructure, etc.).
- If the photo shows no clear problem, describe exactly what is visible and note that severity is unclear.

Respond now with ONLY the JSON object.`

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    })

    const result = await Promise.race([
      model.generateContent([
        { text: prompt },
        { inlineData: { mimeType, data } },
      ]),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
    ])

    const raw = result.response.text().trim()
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({
      aiRan: true,
      title: String(parsed.title ?? "").trim().slice(0, 160),
      description: String(parsed.description ?? "").trim().slice(0, 600),
    })
  } catch (err: any) {
    const msg = String(err?.message || err)
    console.error("[/api/ai/vision] Gemini failure:", msg)
    if (msg === "timeout") return NextResponse.json({ aiRan: false, reason: "AI timed out after 20s" }, { status: 503 })
    return NextResponse.json({ aiRan: false, reason: msg.slice(0, 200) }, { status: 503 })
  }
}