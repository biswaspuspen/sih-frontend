"use client"

import { HelpCircle, Mail, MessageSquare, ExternalLink, ShieldCheck, FileText } from "lucide-react"

const FAQS = [
  {
    question: "How does the AI Triage route challenges to specific universities?",
    answer: "The NLP engine vectorizes the problem description and matches it against two criteria: domain expertise (e.g., BIT Mesra for IoT, Birsa Ag for crop blights) and geographical proximity to the affected district to facilitate easier field deployments."
  },
  {
    question: "How are citizen submissions validated before academic allocation?",
    answer: "Challenges undergo a dual-pass verification. The AI initially flags anomalous or duplicate reports. Verified administrative liaisons at the block/panchayat level then confirm the systemic nature of the grievance before it enters the R&D pipeline."
  },
  {
    question: "How can an industry partner, startup, or MSME join the platform?",
    answer: "Corporate partners can register via the 'Industry Onboarding' portal. Once vetted by the JCSTI, they are granted access to the CSR Dashboard, where they can browse active academic pilots categorized by their preferred funding vectors (e.g., Sustainability, Health Tech) and commit mentorship or capital."
  },
  {
    question: "Does citizen telemetry (location and media data) remain private?",
    answer: "Yes. All geotagged photos and PII (Personally Identifiable Information) are stripped and anonymized by the ingest server. Academic nodes and industry partners only see the generalized district-level data and the core systemic issue, compliant with standard data protection protocols."
  },
  {
    question: "Can submissions be made in regional languages?",
    answer: "The ingestion form supports fully multilingual inputs. Citizens and Panchayats can submit grievances in Hindi, Santhali, or English. The backend NLP pipeline automatically translates and vectorizes regional inputs into standard English parameters for the administrative ledger."
  }
]

export default function SupportPage() {
  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          System Support & Documentation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Operational guidelines, platform security protocols, and administrator contact channels.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border/80 bg-card/60 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border/50 bg-muted/10 flex items-center gap-2">
              <HelpCircle className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Platform Architecture FAQs</h2>
            </div>
            <div className="divide-y divide-border/40">
              {FAQS.map((faq, idx) => (
                <div key={idx} className="p-5 hover:bg-muted/30 transition-colors">
                  <h3 className="text-sm font-semibold text-foreground mb-2">{faq.question}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border/80 bg-card/60 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="size-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-foreground">Escalation Channels</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">For severe system outages or misrouting anomalies in the NLP engine.</p>
            <div className="space-y-3">
              <div className="rounded border border-border/60 bg-background/50 p-3">
                <span className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">IT Operations Desk</span>
                <span className="font-mono text-xs text-primary font-medium">support@sip-gov-analytics.org</span>
              </div>
              <div className="rounded border border-border/60 bg-background/50 p-3">
                <span className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">State Nodal Officer</span>
                <span className="font-mono text-xs text-foreground font-medium">jcsti-admin@jharkhand.gov.in</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/60 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Official Documentation</h2>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-2.5 rounded hover:bg-muted/50 border border-transparent hover:border-border/60 transition-colors text-xs text-foreground font-medium group">
                <span className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-emerald-500" /> Data Privacy Policy</span>
                <ExternalLink className="size-3 text-muted-foreground group-hover:text-foreground" />
              </button>
              <button className="w-full flex items-center justify-between p-2.5 rounded hover:bg-muted/50 border border-transparent hover:border-border/60 transition-colors text-xs text-foreground font-medium group">
                <span className="flex items-center gap-2"><FileText className="size-3.5 text-blue-500" /> API Integration Docs</span>
                <ExternalLink className="size-3 text-muted-foreground group-hover:text-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}