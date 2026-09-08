"use client"

import { useState } from "react"
import { Send, CheckCircle2, BrainCircuit, FileText, Camera, MapPin, Building, User } from "lucide-react"

export default function SubmitChallengePage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Store form data between steps
  const [formData, setFormData] = useState({
    title: "",
    submitterType: "",
    district: "",
    description: ""
  })

  // Simulated AI Output
  const [aiAnalysis, setAiAnalysis] = useState({
    category: "",
    priority: "Medium",
    confidence: 0,
    institution: ""
  })

  // Step 1: Simulate AI Analysis
  const handleAnalyze = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsAnalyzing(true)

    const form = e.currentTarget
    const data = new FormData(form)
    
    setFormData({
      title: data.get("title") as string,
      submitterType: data.get("submitterType") as string,
      district: data.get("district") as string,
      description: data.get("description") as string
    })

    // Simulate AI processing delay for the demo
    setTimeout(() => {
      // Fake AI logic based on keywords
      const titleLower = (data.get("title") as string).toLowerCase()
      let category = "Urban Development"
      let priority = "Medium"
      let institution = "Ranchi University"
      
      if (titleLower.includes("water") || titleLower.includes("river") || titleLower.includes("drought")) {
        category = "Water Resources"
        priority = "High"
        institution = "BIT Mesra"
      } else if (titleLower.includes("crop") || titleLower.includes("farm") || titleLower.includes("soil")) {
        category = "Agriculture"
        priority = "High"
        institution = "Birsa Agricultural University"
      } else if (titleLower.includes("health") || titleLower.includes("medical") || titleLower.includes("clinic")) {
        category = "Healthcare"
        priority = "High"
        institution = "RIMS Ranchi"
      }

      setAiAnalysis({
        category,
        priority,
        confidence: Math.floor(Math.random() * 8 + 90), // 90-98%
        institution
      })
      
      setIsAnalyzing(false)
      setStep(2)
    }, 1800)
  }

  // Step 2: Final Database Submission
  const handleFinalSubmit = async () => {
    setIsSubmitting(true)
    
    const newProblem = {
      id: `SIP-${Math.floor(1000 + Math.random() * 9000)}`,
      title: formData.title,
      category: aiAnalysis.category,
      location: formData.district, // Now strictly a Jharkhand district
      status: "New",
      submittedDate: new Date().toISOString().split("T")[0],
      institution: "Unassigned", // Will be assigned later in pipeline
      priority: aiAnalysis.priority,
      confidence: aiAnalysis.confidence
    }

    try {
      const response = await fetch("http://localhost:5000/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProblem)
      })
      
      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setStep(1)
          setFormData({ title: "", submitterType: "", district: "", description: "" })
        }, 3000)
      }
    } catch (error) {
      console.error("Failed to submit:", error)
      alert("Database error. Is json-server running?")
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

      <div className="rounded-xl border border-border/80 bg-card/60 shadow-sm backdrop-blur overflow-hidden">
        
        {/* STEP 1: DATA INGESTION FORM */}
        {step === 1 && (
          <form onSubmit={handleAnalyze} className="p-6 md:p-8 space-y-6">
            
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-foreground">Problem Title</label>
              <input 
                required id="title" name="title" type="text" 
                placeholder="e.g., Unseasonal crop blight destroying paddy yields"
                className="w-full rounded-md border border-input bg-background/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="submitterType" className="text-sm font-medium text-foreground">Submitter Origin</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <select 
                    required id="submitterType" name="submitterType"
                    className="w-full rounded-md border border-input bg-background/50 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
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
                    required id="district" name="district"
                    className="w-full rounded-md border border-input bg-background/50 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
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
              <label htmlFor="description" className="text-sm font-medium text-foreground">Detailed Telemetry / Impact</label>
              <textarea 
                required id="description" name="description" rows={3}
                placeholder="Describe the societal impact, population affected, and duration of the problem..."
                className="w-full rounded-md border border-input bg-background/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Stub for File Uploads */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Evidence & Documentation</label>
              <div className="rounded-lg border-2 border-dashed border-border/80 bg-background/30 p-8 flex flex-col items-center justify-center text-center hover:bg-background/50 transition-colors cursor-pointer">
                <div className="flex gap-4 mb-3 text-muted-foreground">
                  <Camera className="size-6" />
                  <FileText className="size-6" />
                </div>
                <p className="text-sm font-medium text-foreground">Drag and drop field evidence here</p>
                <p className="text-xs text-muted-foreground mt-1">Supports Geotagged Photos, MP4, and PDF reports up to 50MB</p>
                <button type="button" className="mt-4 rounded bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80">
                  Browse Files
                </button>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={isAnalyzing}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-80 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <BrainCircuit className="size-4 animate-pulse" />
                    Extracting NLP Vectors...
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
          <div className="p-6 md:p-8 space-y-6">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-center gap-2 text-primary mb-4">
                <BrainCircuit className="size-5" />
                <h3 className="font-semibold">AI Triage Complete</h3>
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
                  <span className="block text-xs text-muted-foreground mb-1">NLP Confidence Score</span>
                  <span className="font-mono font-medium text-emerald-400">{aiAnalysis.confidence}%</span>
                </div>
                <div className="rounded border border-border/60 bg-background/50 p-3">
                  <span className="block text-xs text-muted-foreground mb-1">Suggested Academic Node</span>
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <Building className="size-3 text-muted-foreground" /> {aiAnalysis.institution}
                  </span>
                </div>
              </div>
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
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow transition-colors hover:bg-emerald-500 disabled:opacity-50"
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
              <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-emerald-500 bg-emerald-500/10 py-3 rounded border border-emerald-500/20">
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