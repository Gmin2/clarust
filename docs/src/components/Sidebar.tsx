import type { ComponentType, SVGProps } from "react"
import { Doc, Grid, Layers, Tools, Rocket, Shield, Coin } from "./icons"

type Icon = ComponentType<SVGProps<SVGSVGElement>>

type Item = { label: string; icon: Icon; href: string; active?: boolean }
type Group = { title: string; items: Item[] }

const groups: Group[] = [
  {
    title: "Introduction",
    items: [
      { label: "Overview", icon: Doc, href: "#", active: true },
      { label: "Quickstart", icon: Rocket, href: "#quickstart" },
    ],
  },
  {
    title: "Writing contracts",
    items: [
      { label: "Storage", icon: Layers, href: "#storage" },
      { label: "Functions", icon: Tools, href: "#functions" },
      { label: "Types", icon: Grid, href: "#types" },
      { label: "Control flow", icon: Doc, href: "#control-flow" },
    ],
  },
  {
    title: "Tokens",
    items: [
      { label: "Tokens", icon: Coin, href: "#tokens" },
      { label: "SIP-010 trait", icon: Doc, href: "#sip-010" },
    ],
  },
  {
    title: "Tooling",
    items: [{ label: "Verifying", icon: Shield, href: "#verifying" }],
  },
]

function Row({ item }: { item: Item }) {
  const Ico = item.icon
  return (
    <a
      href={item.href}
      className={[
        "group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[14px] transition-colors duration-200 ease-out",
        item.active
          ? "bg-[#978eff]/[0.08] text-ink font-medium"
          : "text-grey-2 hover:bg-[#1a1a1a]/[0.04] hover:text-ink",
      ].join(" ")}
    >
      <Ico
        className={[
          "shrink-0 group-hover:scale-105 group-hover:-translate-y-px",
          item.active ? "text-accent" : "opacity-90",
        ].join(" ")}
        style={{ transition: "opacity 0.15s, transform 0.2s ease-out" }}
      />
      <span className="flex-1 tracking-[-0.09px]">{item.label}</span>
    </a>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden lg:block w-[var(--sidebar-w)] shrink-0">
      <nav className="sticky top-[var(--header-h)] max-h-[calc(100vh-var(--header-h))] overflow-y-auto px-3 py-10 pr-4">
        {groups.map((g) => (
          <div key={g.title} className="mb-6 last:mb-0">
            <p className="mb-2 px-2.5 font-[var(--font-repro)] text-[14px] font-semibold tracking-[-0.09px] text-ink">
              {g.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {g.items.map((it) => (
                <Row key={g.title + it.label} item={it} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
