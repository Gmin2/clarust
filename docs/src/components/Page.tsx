import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Chevron } from "./icons"

export function Page({ width = "content", children }: { width?: "content" | "hero"; children: ReactNode }) {
  const max = width === "hero" ? "var(--hero-w)" : "var(--content-w)"
  return (
    <div className="min-w-0 flex-1 px-4 py-[var(--main-py)] lg:px-[length:var(--main-px)]">
      <div style={{ maxWidth: max }}>{children}</div>
    </div>
  )
}

type NavLinkInfo = { href: string; title: string } | undefined

export function PrevNext({ prev, next }: { prev: NavLinkInfo; next: NavLinkInfo }) {
  return (
    <div className="mt-14 border-t border-ink/[0.06] pt-8">
      <div className="grid grid-cols-2 gap-4">
        {prev ? (
          <Link
            to={prev.href}
            className="group rounded-xl border border-ink/[0.06] bg-paper-2 px-5 py-4 transition-colors duration-200 ease-out hover:border-ink/15"
          >
            <span className="flex items-center gap-1 text-[13px] text-grey-3">
              <ArrowLeft className="h-3.5 w-3.5" /> Previous
            </span>
            <span className="mt-1 block text-[15px] font-medium text-ink">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={next.href}
            className="group rounded-xl border border-ink/[0.06] bg-paper-2 px-5 py-4 text-right transition-colors duration-200 ease-out hover:border-ink/15"
          >
            <span className="flex items-center justify-end gap-1 text-[13px] text-grey-3">
              Next <Chevron className="h-3.5 w-3.5" />
            </span>
            <span className="mt-1 block text-[15px] font-medium text-ink">{next.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}
