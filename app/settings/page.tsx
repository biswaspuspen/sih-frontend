"use client"

import { User, Bell, Database, Globe, Save, CheckCircle2 } from "lucide-react"
import { useState } from "react"

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex-1 px-6 py-8 lg:px-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          System Configuration
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage platform parameters, regional data synchronization intervals, and operational alerts.
        </p>
      </div>

      <div className="space-y-6">
        {/* Analyst Profile & Institutional Home */}
        <div className="rounded-xl border border-border/80 bg-card/60 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border/50 bg-muted/10 flex items-center gap-2">
            <User className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Analyst Profile & Department</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Operator Name</label>
              <div className="text-sm font-medium text-foreground bg-background/50 border border-input rounded-md px-3 py-2">R. Mehta</div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Assigned Department</label>
              <div className="text-sm font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2 truncate">
                JCSTI · Dept. of Higher & Technical Education
              </div>
            </div>
          </div>
        </div>

        {/* Global Configurations (Data Sync & Language) */}
        <div className="rounded-xl border border-border/80 bg-card/60 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border/50 bg-muted/10 flex items-center gap-2">
            <Database className="size-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-foreground">Global Telemetry Parameters</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Database className="size-3" /> Panchayat Data Sync Interval
              </label>
              <select className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none">
                <option>Real-time (WebSocket)</option>
                <option>Every 5 Minutes (Polling)</option>
                <option>Hourly Batch Sync</option>
                <option>Daily Digest (Low Bandwidth Mode)</option>
              </select>
              <p className="text-[10px] text-muted-foreground mt-1.5">Adjust for low-bandwidth districts (e.g., Latehar, Garhwa).</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Globe className="size-3" /> Default NLP Language Processor
              </label>
              <select className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none">
                <option>Auto-Detect (Multilingual)</option>
                <option>Hindi (Primary)</option>
                <option>English (Primary)</option>
                <option>Santhali (Regional Fallback)</option>
              </select>
              <p className="text-[10px] text-muted-foreground mt-1.5">Sets the baseline model for the AI Triage engine.</p>
            </div>
          </div>
        </div>

        {/* Alert Preferences */}
        <div className="rounded-xl border border-border/80 bg-card/60 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border/50 bg-muted/10 flex items-center gap-2">
            <Bell className="size-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-foreground">Operational Alerts</h2>
          </div>
          <div className="p-5 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="mt-1 size-4 rounded border-input bg-background/50 text-primary focus:ring-primary/50" />
              <div>
                <span className="block text-sm font-medium text-foreground group-hover:text-primary transition-colors">Critical priority challenges logged (Citizen Trigger)</span>
                <span className="block text-xs text-muted-foreground mt-0.5">Notify when NLP flags life-threatening or immediate state-level risks.</span>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="mt-1 size-4 rounded border-input bg-background/50 text-primary focus:ring-primary/50" />
              <div>
                <span className="block text-sm font-medium text-foreground group-hover:text-primary transition-colors">University resolution progress digest (Academic Trigger)</span>
                <span className="block text-xs text-muted-foreground mt-0.5">Weekly summaries of prototype development across nodal centers.</span>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="mt-1 size-4 rounded border-input bg-background/50 text-primary focus:ring-primary/50" />
              <div>
                <span className="block text-sm font-medium text-foreground group-hover:text-primary transition-colors">Industry partner matched or funding confirmed (CSR Trigger)</span>
                <span className="block text-xs text-muted-foreground mt-0.5">Alert when a corporate entity commits capital to an active academic pilot.</span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/90">
            {saved ? <><CheckCircle2 className="size-4" /> Configuration Saved</> : <><Save className="size-4" /> Save System State</>}
          </button>
        </div>
      </div>
    </div>
  )
}