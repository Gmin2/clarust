import { useState, type ComponentType, type SVGProps } from "react"
import { NavLink, Link } from "react-router-dom"
import { Doc, Grid, Layers, Tools, Rocket, Shield, Coin, Chevron } from "./icons"
import { examples } from "../examples"

type Icon = ComponentType<SVGProps<SVGSVGElement>>

const conceptGroups: { title: string; items: { label: string; icon: Icon; to: string }[] }[] = [
  {
    title: "Introduction",
    items: [
      { label: "Overview", icon: Doc, to: "/" },
      { label: "Quickstart", icon: Rocket, to: "/#quickstart" },
    ],
  },
  {
    title: "Writing contracts",
    items: [
      { label: "Storage", icon: Layers, to: "/#storage" },
      { label: "Functions", icon: Tools, to: "/#functions" },
      { label: "Types", icon: Grid, to: "/#types" },
      { label: "Control flow", icon: Doc, to: "/#control-flow" },
    ],
  },
  {
    title: "Tokens",
    items: [
      { label: "Tokens", icon: Coin, to: "/#tokens" },
      { label: "SIP-010 trait", icon: Doc, to: "/#sip-010" },
    ],
  },
  {
    title: "Tooling",
    items: [{ label: "Verifying", icon: Shield, to: "/#verifying" }],
  },
]

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

function HashRow({ label, icon: Ico, to }: { label: string; icon: Icon; to: string }) {
  const isOverview = to === "/"
  return (
    <NavLink
      to={to}
      end={isOverview}
      className={({ isActive }) =>
        [
          rowBase,
          isActive && isOverview
            ? "bg-[#978eff]/[0.08] text-ink font-medium"
            : "text-grey-2 hover:bg-[#1a1a1a]/[0.04] hover:text-ink",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Ico
            className={["shrink-0 group-hover:scale-105 group-hover:-translate-y-px", isActive && isOverview ? "text-accent" : "opacity-90"].join(" ")}
            style={{ transition: "opacity 0.15s, transform 0.2s ease-out" }}
          />
          <span className="flex-1 tracking-[-0.09px]">{label}</span>
        </>
      )}
    </NavLink>
  )
}

function ExampleRow({ slug, title }: { slug: string; title: string }) {
  const Ico = exampleIcons[slug] ?? Doc
  return (
    <NavLink
      to={`/examples/${slug}`}
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
            className={["shrink-0 group-hover:scale-105 group-hover:-translate-y-px", isActive ? "text-accent" : "opacity-90"].join(" ")}
            style={{ transition: "opacity 0.15s, transform 0.2s ease-out" }}
          />
          <span className="flex-1 tracking-[-0.09px]">{title}</span>
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

  return (
    <aside className="hidden lg:block w-[var(--sidebar-w)] shrink-0">
      <nav className="sticky top-[var(--header-h)] max-h-[calc(100vh-var(--header-h))] overflow-y-auto px-3 py-10 pr-4">
        {conceptGroups.map((g) => (
          <div key={g.title} className="mb-6">
            <GroupTitle>{g.title}</GroupTitle>
            <div className="flex flex-col gap-0.5">
              {g.items.map((it) =>
                it.to.includes("#") ? (
                  <Link
                    key={it.label}
                    to={it.to}
                    className={`${rowBase} text-grey-2 hover:bg-[#1a1a1a]/[0.04] hover:text-ink`}
                  >
                    <it.icon
                      className="shrink-0 opacity-90 group-hover:scale-105 group-hover:-translate-y-px"
                      style={{ transition: "opacity 0.15s, transform 0.2s ease-out" }}
                    />
                    <span className="flex-1 tracking-[-0.09px]">{it.label}</span>
                  </Link>
                ) : (
                  <HashRow key={it.label} {...it} />
                ),
              )}
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
                <ExampleRow key={e.slug} slug={e.slug} title={e.title} />
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  )
}
