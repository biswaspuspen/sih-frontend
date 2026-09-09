import { Search, Bell, Landmark, Menu } from "lucide-react"

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/80 px-5 py-3.5 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3 lg:hidden">
        {/* Mobile Hamburger Menu Button */}
        <button
          type="button"
          aria-label="Toggle menu"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
        
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Landmark className="size-4" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold">Sahyug</span>
        </div>
      </div>

      {/* SEARCH BAR SECTION - INCREASED SIZE */}
      <div className="relative hidden max-w-2xl flex-1 md:block">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search challenges, regions, universities..."
          aria-label="Search"
          className="w-full rounded-lg border border-border bg-card py-3 pl-12 pr-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary"
        >
          <Bell className="size-4.5" aria-hidden="true" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" aria-hidden="true" />
        </button>
        <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground lg:hidden">
          RM
        </div>
      </div>
    </header>
  )
}