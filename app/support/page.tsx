"use client"

import { useEffect, useState } from "react"
import { LifeBuoy, Activity, CheckCircle2, ChevronDown, Send, Mail, Phone, RefreshCw, Inbox } from "lucide-react"

function readCookie(name: string): string {
  if (typeof document === "undefined") return ""
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"))
  return m ? decodeURIComponent(m[1]) : ""
}

type Ticket = {
  id: string
  category: string
  subject: string
  createdAt: string
  status: string
  raisedBy: string
}

const FAQS: { q: string; a: string }[] = [
  {
    q: "A citizen says their SIP is missing from the ledger.",
    a: "The ledger is the single source of truth — if it shows on /api/problems, it will appear on every page after a refresh. If it never posted, the citizen's browser likely had no backend running at submit time (check the dev server).",
  },
  {
    q: "How do I reset all demo data before a presentation?",
    a: "Settings → Data & Ledger → Factory Reset Ledger. Takes 2 seconds, restores the pristine seed. Use it right before judges walk in.",
  },
  {
    q: "Can universities see which industries are watching their solutions?",
    a: "Yes — My Interests shows every industry watch on their deliverables the moment it is expressed on the Solution Exchange.",
  },
  {
    q: "Where do Express/Withdraw Interest records live?",
    a: "In the interests ledger. Any admin can audit it directly at /api/interests in the browser.",
  },
]

export default function SupportPage() {
  const [role, setRole] = useState("")
  const [name, setName] = useState("")
  const [health, setHealth] = useState<{ ok: boolean; problems: number } | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [form, setForm] = useState({ category: "General", subject: "", message: "" })
  const [sending, setSending] = useState(false)
  const [sentMsg, setSentMsg] = useState("")
  const [formErr, setFormErr] = useState("")

  const loadSupportData = async () => {
    try {
      const [pRes, tRes] = await Promise.all([fetch("/api/problems"), fetch("/api/support")])
      setHealth({ ok: pRes.ok, problems: pRes.ok ? (await pRes.json()).length : 0 })
      if (tRes.ok) setTickets(await tRes.json())
    } catch {
      setHealth({ ok: false, problems: 0 })
    }
  }

  useEffect(() => {
    setRole(readCookie("userRole") || "user")
    setName(readCookie("userName") || "System User")
    loadSupportData()
  }, [])

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErr("")
    setSentMsg("")
    if (form.subject.trim().length < 5 || form.message.trim().length < 15) {
      setFormErr("Give us a subject (5+ chars) and a message (15+ chars) so the ticket is actionable.")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, raisedBy: name, role }),
      })
      if (!res.ok) throw new Error("failed")
      setSentMsg("✅ Ticket logged into the control room queue. It will surface during the next admin review.")
      setForm({ category: "General", subject: "", message: "" })
      loadSupportData()
    } catch {
      setFormErr("Ticket could not be logged — check the app server and retry.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-3xl mx-auto w-full">
      <div className="mb-8 flex items-center gap-2.5">
        <LifeBuoy className="size-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Control Room Support</h1>
      </div>

      {/* System health */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur p-5 mb-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
            <Activity className="size-4 text-primary" /> System Health
          </h2>
          <button onClick={loadSupportData} className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <RefreshCw className="size-3" /> re-check
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2.5 text-sm">
          {health === null ? (
            <span className="text-muted-foreground text-xs">checking…</span>
          ) : health.ok ? (
            <>
              <span className="size-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-foreground font-medium">API online</span>
              <span className="text-muted-foreground text-xs">· ledger serving {health.problems} SIP records · same-origin routes on :3002</span>
            </>
          ) : (
            <>
              <span className="size-2.5 rounded-full bg-rose-400" />
              <span className="text-rose-300 font-medium">API unreachable</span>
              <span className="text-muted-foreground text-xs">· is the dev server running?</span>
            </>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <a
          href="mailto:controlroom@sahyog.gov.in?subject=Sahyog%20Support%20Request"
          className="rounded-xl border border-border/80 bg-card/60 backdrop-blur p-4 flex items-center gap-3 hover:border-primary/40 transition-colors"
        >
          <Mail className="size-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Email Control Room</p>
            <p className="text-xs text-muted-foreground">controlroom@sahyog.gov.in</p>
          </div>
        </a>
        <a
          href="tel:+911800123456"
          className="rounded-xl border border-border/80 bg-card/60 backdrop-blur p-4 flex items-center gap-3 hover:border-primary/40 transition-colors"
        >
          <Phone className="size-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Helpline (24×7, demo)</p>
            <p className="text-xs text-muted-foreground">1800-123-456</p>
          </div>
        </a>
      </div>

      {/* Ticket form */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur p-5 mb-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 inline-flex items-center gap-2">
          <Send className="size-4 text-primary" /> Log a Control-Room Ticket
        </h2>
        <form onSubmit={submitTicket} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-md border border-input bg-background/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option>General</option>
                <option>Bug Report</option>
                <option>Data Correction</option>
                <option>Node Onboarding</option>
                <option>Brokerage Between Nodes</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Subject</label>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g., SIP-1004 assigned to wrong node"
                className="w-full rounded-md border border-input bg-background/50 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={3}
              placeholder="Describe the issue with district / SIP references so we can trace it on the ledger…"
              className="w-full rounded-md border border-input bg-background/50 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          {formErr && <p className="text-xs text-rose-400">{formErr}</p>}
          {sentMsg && (
            <p className="text-xs text-emerald-400 inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-4" /> {sentMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            <Send className="size-4" /> {sending ? "Logging…" : "Submit Ticket"}
          </button>
        </form>
      </div>

      {/* Recent tickets */}
      {tickets.length > 0 && (
        <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur p-5 mb-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Recent Tickets</h2>
          <ul className="space-y-2">
            {tickets.slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background/40 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs text-foreground truncate">{t.subject}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {t.category} · {t.raisedBy} · {new Date(t.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                  {t.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* FAQ */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur p-5">
        <h2 className="text-sm font-semibold text-foreground mb-2 inline-flex items-center gap-2">
          <Inbox className="size-4 text-primary" /> Field Manual (FAQ)
        </h2>
        <div className="divide-y divide-border/50">
          {FAQS.map((f, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full py-3 flex items-center justify-between gap-3 text-left text-sm text-foreground hover:text-primary transition-colors"
              >
                {f.q}
                <ChevronDown className={`size-4 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <p className="pb-3.5 text-xs text-muted-foreground leading-relaxed animate-fadeIn">{f.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}