import type { ReactNode } from "react"
import { Info } from "./icons"

export function Link({ children, href = "#" }: { children: ReactNode; href?: string }) {
  return (
    <a
      href={href}
      className="font-medium text-link underline decoration-link/30 underline-offset-2 transition-opacity duration-200 ease-out hover:opacity-70"
    >
      {children}
    </a>
  )
}

export function H2({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 pt-2 text-[20px] font-semibold tracking-[-0.33px] text-ink">
      {children}
    </h2>
  )
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[16px] leading-[24px] tracking-[-0.09px] text-grey-1">{children}</p>
}

export function Code({ children }: { children: string }) {
  return (
    <code className="rounded-[5px] border border-ink/[0.07] bg-paper-2 px-1.5 py-0.5 font-[var(--font-mono)] text-[13px] text-ink">
      {children}
    </code>
  )
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-ink/[0.06] bg-paper-2 px-4 py-3.5">
      <Info className="h-4 w-4 shrink-0 text-grey-3" />
      <p className="text-[14px] leading-[21px] tracking-[-0.09px] text-grey-2">{children}</p>
    </div>
  )
}
