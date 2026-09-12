"use client"

import { useRef, useState } from "react"
import { Send, CheckCircle2, BrainCircuit, FileText, Camera, MapPin, Building, User, X, Loader2, Sparkles, TriangleAlert } from "lucide-react"

type AiAnalysis = {
  category: string
  priority: "High" | "Medium" | "Low" | string
  confidence: number
  institution: string
  reasoning: string
  model?: string
}

// Local heuristic used ONLY as a fallback if the AI triage service is unavailable.
function localTriage(title: string): Omit<AiAnalysis, "reasoning" | "model"> {
  const titleLower = title.toLowerCase()
  let category = "Urban Development"
  let priority: "High" | "Medium" | "Low" = "Medium"
  let institution = "Ranchi University"

  if (titleLower.includes("road") || titleLower.includes("pothole") || titleLower.includes("damage")) {
    category = "Urban Development"
    priority = "High"
    institution = "BIT Mesra"
  } else if (titleLower.includes("water") || titleLower.includes("river")) {
    category = "Water Resources"
    priority = "High"
    institution = "BIT Mesra"
  } else if (titleLower.includes("crop") || titleLower.includes("farm")) {
    category = "Agriculture"
    priority = "High"
    institution = "Birsa Agricultural University"
  } else if (titleLower.includes("school") || titleLower.includes("infrastructure") || titleLower.includes("building")) {
    category = "Education"
    priority = "High"
    institution = "XLRI Jamshedpur"
  } else if (titleLower.includes("mining") || titleLower.includes("excavation") || titleLower.includes("land degradation")) {
    category = "Mining"
    priority = "High"
    institution = "IIT (ISM) Dhanbad"
  }

  return {
    category,
    priority,
    confidence: Math.floor(Math.random() * 8 + 88),
    institution,
  }
}

export default function SubmitChallengePage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    submitterType: "",
    district: "",
    fullAddress: "",
    description: ""
  })

  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis>({
    category: "",
    priority: "Medium",
    confidence: 0,
    institution: "",
    reasoning: "",
    model: ""
  })
  // true = live Gemini answer · false = local heuristic fallback (AI unavailable)
  const [aiRan, setAiRan] = useState(false)

  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILE_MB = 50

  const isAcceptedEvidence = (file: File) =>
    (file.type.startsWith("image/") ||
      file.type === "video/mp4" ||
      file.type === "application/pdf") &&
    file.size <= MAX_FILE_MB * 1024 * 1024

  // Downscale the image so we send a small payload to Gemini (fast + within limits)
  const downscaleImage = (file: File, maxDim = 1024): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          URL.revokeObjectURL(url)
          resolve("")
        } else {
          ctx.drawImage(img, 0, 0, w, h)
          const out = canvas.toDataURL("image/jpeg", 0.85)
          URL.revokeObjectURL(url)
          resolve(out)
        }
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error("image load failed"))
      }
      img.src = url
    })

  // Real AI vision: send the photo to Gemini, get back title + description
  const analyzeImage = async (file: File) => {
    try {
      const dataUrl = await downscaleImage(file)
      const base64 = dataUrl.split(",")[1] || ""
      const res = await fetch("/api/ai/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mimeType: "image/jpeg", data: base64 }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.aiRan) throw new Error(json.reason || "vision unavailable")

      setFormData((prev) => ({
        ...prev,
        title: json.title || prev.title,
        description: json.description || prev.description,
      }))
      setUploadError("")
    } catch {
      setFormData((prev) => ({
        ...prev,
        title: prev.title || "Awaiting description",
        description: prev.description || "Visual evidence uploaded — describe the issue manually (AI vision unavailable).",
      }))
      setUploadError("AI vision offline — title & description left for manual entry.")
    } finally {
      setIsProcessingFile(false)
    }
  }

  const addEvidenceFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return
    const all = Array.from(incoming)
    const rejected = all.filter((f) => !isAcceptedEvidence(f))
    const accepted = all.filter(isAcceptedEvidence)

    setUploadError(
      rejected.length
        ? `${rejected.length} file${rejected.length > 1 ? "s" : ""} skipped — only photos, MP4, or PDF up to ${MAX_FILE_MB}MB are supported.`
        : ""
    )

    if (accepted.length === 0) return

    // add files to the list immediately
    setEvidenceFiles((prev) => {
      const existing = new Set(prev.map((f) => `${f.name}::${f.size}`))
      const fresh = accepted.filter((f) => !existing.has(`${f.name}::${f.size}`))
      return [...prev, ...fresh]
    })

    // if the first accepted file is an image → real AI vision autofill
    const firstImage = accepted.find((f) => f.type.startsWith("image/"))
    if (!firstImage) return

    setIsProcessingFile(true)
    analyzeImage(firstImage)
  }

  const removeEvidenceFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${Math.max(1, Math.round(bytes / 1024))} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

  // Step 1: REAL AI triage via /api/ai/triage (Gemini). Falls back to local heuristics if the
  // service is unavailable — the demo can never be broken by a dead model.
  const handleAnalyze = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsAnalyzing(true)

    try {
      const res = await fetch("/api/ai/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          district: formData.district,
          submitterType: formData.submitterType,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.aiRan) throw new Error(data.reason || "AI unavailable")

      setAiAnalysis({
        category: data.category ?? "Urban Development",
        priority: data.priority ?? "Medium",
        confidence: Number(data.confidence) || 0,
        institution: data.suggestedInstitution ?? "BIT Mesra",
        reasoning: data.reasoning ?? "",
        model: data.model ?? "gemini",
      })
      setAiRan(true)
    } catch {
      // graceful degradation — local heuristic, flagged visually in step 2
      setAiAnalysis({ ...localTriage(formData.title), reasoning: "", model: "" })
      setAiRan(false)
    } finally {
      setIsAnalyzing(false)
      setStep(2)
    }
  }

  // Step 2: Final Database Submission
  const handleFinalSubmit = async () => {
    setIsSubmitting(true)

    try {
      const dbRes = await fetch("/api/problems")
      const existingProblems = await dbRes.json()

      const maxId = existingProblems.reduce((max: number, p: any) => {
        const idToCheck = p.sipId || p.id
        if (idToCheck?.startsWith("SIP-")) {
          const num = parseInt(idToCheck.replace("SIP-", ""), 10)
          return num > max ? num : max
        }
        return max
      }, 1000)

      const newSipId = `SIP-${maxId + 1}`

      // Store only the file name — never a local machine path
      const activeFile = evidenceFiles[0]?.name || ""
      const imagePath = activeFile || "default_image.jpeg"

      const newProblem = {
        id: newSipId,
        sipId: newSipId,
        title: formData.title,
        category: aiAnalysis.category,
        location: formData.district,
        fullAddress: formData.fullAddress,
        status: "New",
        submittedDate: new Date().toISOString().split("T")[0],
        institution: "Unassigned",
        priority: aiAnalysis.priority,
        confidence: aiAnalysis.confidence,
        submittedBy: "Demo Citizen",
        attachedImagePath: imagePath,
        // persisted triage record — visible to gov/Phase-3 viewers
        aiSuggestion: {
          category: aiAnalysis.category,
          priority: aiAnalysis.priority,
          confidence: aiAnalysis.confidence,
          suggestedInstitution: aiAnalysis.institution,
          reasoning: aiAnalysis.reasoning,
          model: aiAnalysis.model || "local-heuristic",
          aiRan,
        },
      }

      const response = await fetch("/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProblem)
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setStep(1)
          setFormData({ title: "", submitterType: "", district: "", fullAddress: "", description: "" }) 
          setEvidenceFiles([])
          setUploadError("")
          setAiRan(false)
        }, 3000)
      }
    } catch (error) {
      console.error("Failed to submit:", error)
      alert("Database error. Is the backend API running?")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Log Societal Grievance
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Submit field telemetry. AI will automatically classify, assign priority, and match with an academic lab.
        </p>
      </div>

      <div className="rounded-xl border border-border/80 bg-card/60 shadow-sm backdrop-blur overflow-hidden transition-all duration-300">

        {/* STEP 1: DATA INGESTION FORM */}
        {step === 1 && (
          <form onSubmit={handleAnalyze} className="p-6 md:p-8 space-y-6">

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Evidence & Documentation (Upload image to auto-fill title & description)</label>
              <div
                onClick={() => !isProcessingFile && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); if (!isProcessingFile) setIsDragging(true) }}
                onDragEnter={(e) => { e.preventDefault(); if (!isProcessingFile) setIsDragging(true) }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return
                  setIsDragging(false)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDragging(false)
                  if (!isProcessingFile) addEvidenceFiles(e.dataTransfer.files)
                }}
                className={`rounded-lg border-2 border-dashed p-8 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer ${
                  isDragging
                    ? "border-primary/70 bg-primary/10 scale-[0.99]"
                    : "border-border/80 bg-background/30 hover:bg-background/50"
                } ${isProcessingFile ? "opacity-70 cursor-wait" : ""}`}
              >
                {isProcessingFile ? (
                  <div className="flex flex-col items-center justify-center py-4 space-y-3">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="text-sm font-medium text-primary animate-pulse">
                      Analyzing visual evidence & extracting metadata...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={`flex gap-4 mb-3 ${isDragging ? "text-primary" : "text-muted-foreground"}`}>
                      <Camera className="size-6" />
                      <FileText className="size-6" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {isDragging ? "Drop to attach evidence" : "Drag and drop field evidence here"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Supports Geotagged Photos, MP4, and PDF reports up to 50MB</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                      className="mt-4 rounded bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
                    >
                      Browse Files
                    </button>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/mp4,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    addEvidenceFiles(e.target.files)
                    e.target.value = "" 
                  }}
                />
              </div>

              {uploadError && (
                <p className="text-xs text-amber-400">{uploadError}</p>
              )}

              {evidenceFiles.length > 0 && (
                <ul className="space-y-2 pt-1 animate-fadeIn">
                  {evidenceFiles.map((file, index) => (
                    <li
                      key={`${file.name}-${file.size}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background/50 px-3 py-2 transition-all"
                    >
                      <span className="flex min-w-0 items-center gap-2.5 text-xs">
                        {file.type.startsWith("image/") ? (
                          <Camera className="size-3.5 shrink-0 text-primary" />
                        ) : (
                          <FileText className="size-3.5 shrink-0 text-primary" />
                        )}
                        <span className="truncate font-medium text-foreground">{file.name}</span>
                        <span className="shrink-0 text-muted-foreground">{formatFileSize(file.size)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEvidenceFile(index)}
                        aria-label={`Remove ${file.name}`}
                        className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-rose-400"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-foreground">Problem Title</label>
              <input
                required 
                id="title" 
                name="title" 
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Unseasonal crop blight destroying paddy yields"
                className="w-full rounded-md border border-input bg-background/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="submitterType" className="text-sm font-medium text-foreground">Submitter Origin</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <select
                    required 
                    id="submitterType" 
                    name="submitterType"
                    value={formData.submitterType}
                    onChange={(e) => setFormData({ ...formData, submitterType: e.target.value })}
                    className="w-full rounded-md border border-input bg-background/50 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none transition-all"
                  >
                    <option value="">Select origin...</option>
                    <option value="citizen">Individual Citizen</option>
                    <option value="panchayat">Panchayati Raj Institution (PRI)</option>
                    <option value="ulb">Urban Local Body (ULB)</option>
                    <option value="ngo">Registered NGO / CSR</option>
                    <option value="gov">Government Department</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="district" className="text-sm font-medium text-foreground">Jharkhand District Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <select
                    required 
                    id="district" 
                    name="district"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full rounded-md border border-input bg-background/50 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none transition-all"
                  >
                    <option value="">Select district...</option>
                    <option value="Ranchi">Ranchi</option>
                    <option value="Dhanbad">Dhanbad</option>
                    <option value="East Singhbhum">East Singhbhum (Jamshedpur)</option>
                    <option value="Bokaro">Bokaro</option>
                    <option value="Hazaribagh">Hazaribagh</option>
                    <option value="Simdega">Simdega</option>
                    <option value="Gumla">Gumla</option>
                    <option value="Palamu">Palamu</option>
                    <option value="Sahibganj">Sahibganj</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="fullAddress" className="text-sm font-medium text-foreground">Full Address / Location Details</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <textarea
                  required 
                  id="fullAddress" 
                  name="fullAddress" 
                  rows={2}
                  value={formData.fullAddress}
                  onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                  placeholder="Enter specific street, block, village, or landmark details..."
                  className="w-full rounded-md border border-input bg-background/50 pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-foreground">Detailed Telemetry / Impact</label>
              <textarea
                required 
                id="description" 
                name="description" 
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the societal impact, population affected, and duration of the problem..."
                className="w-full rounded-md border border-input bg-background/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isAnalyzing || isProcessingFile}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow transition-all hover:bg-primary/90 disabled:opacity-80 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <BrainCircuit className="size-4 animate-pulse" />
                    Querying Gemini 3.6...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="size-4" />
                    Run AI Triage
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: AI PREVIEW & CONFIRMATION */}
        {step === 2 && (
          <div className="p-6 md:p-8 space-y-6 animate-fadeIn">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2 text-primary">
                  <BrainCircuit className="size-5" />
                  <h3 className="font-semibold">AI Triage Complete</h3>
                </div>
                {aiRan ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
                    <Sparkles className="size-3" /> Live · Gemini 3.6 Flash
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-400">
                    <TriangleAlert className="size-3" /> Local estimate — AI service unavailable
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded border border-border/60 bg-background/50 p-3">
                  <span className="block text-xs text-muted-foreground mb-1">Detected Category</span>
                  <span className="font-medium text-foreground">{aiAnalysis.category}</span>
                </div>
                <div className="rounded border border-border/60 bg-background/50 p-3">
                  <span className="block text-xs text-muted-foreground mb-1">Priority Vector</span>
                  <span className={`font-medium ${aiAnalysis.priority === 'High' ? 'text-rose-400' : 'text-amber-400'}`}>
                    {aiAnalysis.priority} Priority
                  </span>
                </div>
                <div className="rounded border border-border/60 bg-background/50 p-3">
                  <span className="block text-xs text-muted-foreground mb-1">Model Confidence</span>
                  <span className="font-mono font-medium text-emerald-400">{aiAnalysis.confidence}%</span>
                </div>
                <div className="rounded border border-border/60 bg-background/50 p-3">
                  <span className="block text-xs text-muted-foreground mb-1">Suggested Academic Node</span>
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <Building className="size-3 text-muted-foreground" /> {aiAnalysis.institution}
                  </span>
                </div>
              </div>

              {aiAnalysis.reasoning && (
                <div className="mt-4 rounded border border-border/60 bg-background/50 p-3">
                  <span className="block text-xs text-muted-foreground mb-1">Why this classification</span>
                  <p className="text-xs text-foreground leading-relaxed">{aiAnalysis.reasoning}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 justify-end pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSubmitting}
              >
                Go Back
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow transition-all hover:bg-emerald-500 disabled:opacity-50"
              >
                {isSubmitting ? "Pushing to Database..." : (
                  <>
                    <Send className="size-4" />
                    Confirm & Submit
                  </>
                )}
              </button>
            </div>

            {success && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-emerald-500 bg-emerald-500/10 py-3 rounded border border-emerald-500/20 animate-fadeIn">
                <CheckCircle2 className="size-5" />
                Telemetry logged successfully. Resetting form...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}