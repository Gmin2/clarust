import { Link } from "react-router-dom"
import { Search } from "./icons"

function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 8 12 4l7 4v8l-7 4-7-4z"
        stroke="#201d1d"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M9 10.5 12 9l3 1.5M12 9v6" stroke="#201d1d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const navItems: { label: string; to: string; external?: boolean }[] = [
  { label: "Docs", to: "/" },
  { label: "Examples", to: "/examples/counter" },
  { label: "GitHub", to: "https://github.com/Gmin2/clarust", external: true },
  { label: "Stacks", to: "https://www.stacks.co", external: true },
]

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#201d1d]/[0.06]">
      <div className="mx-auto flex h-[var(--header-h)] max-w-[var(--container-w)] items-center justify-between px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex items-center">
            <span className="font-[var(--font-regola)] text-[length:var(--logo-size)] font-semibold tracking-[-0.5px] text-ink flex items-center gap-1.5">
              <LogoMark />
              <span className="-ml-0.5">clarust</span>
            </span>
          </span>
          <span className="ml-2 text-[15px] text-grey-2 tracking-[-0.09px]">Docs</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item, i) => {
            const cls =
              "group relative rounded-full border border-transparent px-4 py-2 text-[length:var(--nav-size)] text-grey-1 transition-[color,background-color,border-color] duration-200 ease-out hover:bg-[#1a1a1a]/[0.06] hover:text-ink hover:border-ink/10"
            const dot =
              i === 0 ? (
                <span className="clarust-dot absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
              ) : null
            return item.external ? (
              <a key={item.label} href={item.to} className={cls}>
                {item.label}
                {dot}
              </a>
            ) : (
              <Link key={item.label} to={item.to} className={cls}>
                {item.label}
                {dot}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#"
            className="rounded-full bg-[#1a1a1a] px-6 py-2.5 text-[15px] font-medium text-white transition-opacity duration-200 ease-out hover:opacity-80"
          >
            Get started
          </a>
          <button
            aria-label="Search"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1a1a1a] text-white transition-opacity duration-200 ease-out hover:opacity-80"
          >
            <Search className="[&_*]:stroke-white" />
          </button>
        </div>
      </div>
    </header>
  )
}
