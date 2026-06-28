import { useState, type ComponentType, type SVGProps } from "react"
import { NavLink } from "react-router-dom"
import { Doc, Grid, Layers, Tools, Rocket, Shield, Coin } from "./icons"
import { Chevron } from "./icons"
import { pages, pageHref } from "../pages/nav"
import { examples } from "../examples"

type Icon = ComponentType<SVGProps<SVGSVGElement>>

const pageIcons: Record<string, Icon> = {
  "": Doc,
  "getting-started": Rocket,
  storage: Layers,
  functions: Tools,
  types: Grid,
  "control-flow": Doc,
  tokens: Coin,
  "sip-010": Doc,
  verifying: Shield,
  limits: Doc,
}

const exampleIcons: Record<string, Icon> = {
  counter: Grid,
  ledger: Layers,
  vault: Shield,
  coin: Coin,
  nft: Coin,
  token: Doc,
}

const rowBase =
  "group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[14px] transition-colors duration-200 ease-out"

function Row({ to, label, icon: Ico, end }: { to: string; label: string; icon: Icon; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          rowBase,
          isActive
            ? "bg-[#978eff]/[0.08] text-ink font-medium"
            : "text-grey-2 hover:bg-[#1a1a1a]/[0.04] hover:text-ink",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Ico
            className={[
              "shrink-0 group-hover:scale-105 group-hover:-translate-y-px",
              isActive ? "text-accent" : "opacity-90",
            ].join(" ")}
            style={{ transition: "opacity 0.15s, transform 0.2s ease-out" }}
          />
          <span className="flex-1 tracking-[-0.09px]">{label}</span>
        </>
      )}
    </NavLink>
  )
}

function GroupTitle({ children }: { children: string }) {
  return (
    <p className="mb-2 px-2.5 font-[var(--font-repro)] text-[14px] font-semibold tracking-[-0.09px] text-ink">
      {children}
    </p>
  )
}

export function Sidebar() {
  const [examplesOpen, setExamplesOpen] = useState(true)

  // group the page list in order, preserving first-seen group order
  const groups: { title: string; items: typeof pages }[] = []
  for (const p of pages) {
    let g = groups.find((x) => x.title === p.group)
    if (!g) {
      g = { title: p.group, items: [] }
      groups.push(g)
    }
    g.items.push(p)
  }

  return (
    <aside className="hidden lg:block w-[var(--sidebar-w)] shrink-0">
      <nav className="sticky top-[var(--header-h)] max-h-[calc(100vh-var(--header-h))] overflow-y-auto px-3 py-10 pr-4">
        {groups.map((g) => (
          <div key={g.title} className="mb-6">
            <GroupTitle>{g.title}</GroupTitle>
            <div className="flex flex-col gap-0.5">
              {g.items.map((p) => (
                <Row
                  key={p.slug}
                  to={pageHref(p.slug)}
                  label={p.title}
                  icon={pageIcons[p.slug] ?? Doc}
                  end={p.slug === ""}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="mb-6">
          <button
            onClick={() => setExamplesOpen((v) => !v)}
            className="mb-2 flex w-full items-center justify-between px-2.5 text-ink"
          >
            <span className="font-[var(--font-repro)] text-[14px] font-semibold tracking-[-0.09px]">
              Examples
            </span>
            <Chevron
              className={`h-3.5 w-3.5 text-grey-3 transition-transform duration-200 ease-out ${examplesOpen ? "rotate-90" : ""}`}
            />
          </button>
          {examplesOpen && (
            <div className="flex flex-col gap-0.5">
              {examples.map((e) => (
                <Row
                  key={e.slug}
                  to={`/examples/${e.slug}`}
                  label={e.title}
                  icon={exampleIcons[e.slug] ?? Doc}
                />
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  )
}
