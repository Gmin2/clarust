import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { useNavigate } from "react-router-dom"
import { pages, pageHref } from "../pages/nav"
import { examples } from "../examples"
import { Search as SearchIcon } from "./icons"

type Entry = { title: string; href: string; group: string; keywords: string }

const KEYWORDS: Record<string, string> = {
  "": "clarust overview intro rust clarity anchor",
  "getting-started": "install setup quickstart cargo build steps",
  storage: "data-var define-data-var map define-map get set var-get var-set",
  functions: "public readonly private define-public define-read-only entry point",
  types: "uint int bool principal buff option response sized",
  "control-flow": "if else comparison arithmetic prefix asserts",
  tokens: "fungible non-fungible ft nft define-fungible-token mint transfer",
  "sip-010": "trait impl-trait standard memo conformance",
  verifying: "check clarinet diagnostics error source line",
  limits: "loops hashmap recursion transpile rejected",
  macros: "contract contract_impl public readonly private impl_trait attribute",
  prelude: "clarust-lang ok err some none asserts tx_sender helpers builtins",
}

function buildIndex(): Entry[] {
  const docs = pages.map((p) => ({
    title: p.title,
    href: pageHref(p.slug),
    group: p.group,
    keywords: KEYWORDS[p.slug] ?? "",
  }))
  const ex = examples.map((e) => ({
    title: e.title,
    href: `/examples/${e.slug}`,
    group: "Examples",
    keywords: e.blurb,
  }))
  return [...docs, ...ex]
}

export function Search({ open, onClose }: { open: boolean; onClose: () => void }) {
  const index = useMemo(buildIndex, [])
  const [q, setQ] = useState("")
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return index
    return index.filter((e) =>
      `${e.title} ${e.group} ${e.keywords}`.toLowerCase().includes(t),
    )
  }, [q, index])

  useEffect(() => {
    if (open) {
      setQ("")
      setActive(0)
      const id = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(id)
    }
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [q])

  if (!open) return null

  const go = (href: string) => {
    onClose()
    navigate(href)
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === "Enter") {
      const r = results[active]
      if (r) go(r.href)
    } else if (e.key === "Escape") {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 px-4 pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] overflow-hidden rounded-2xl bg-white shadow-[rgba(0,0,0,0.12)_0px_16px_48px_0px,rgba(0,0,0,0.06)_0px_0px_0px_1px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-ink/[0.06] px-4">
          <SearchIcon className="h-4 w-4 shrink-0 text-grey-3" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search the docs..."
            className="w-full bg-transparent py-4 text-[15px] text-ink outline-none placeholder:text-grey-3"
          />
          <kbd className="rounded border border-ink/10 px-1.5 py-0.5 text-[11px] text-grey-3">esc</kbd>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-[14px] text-grey-3">No results for "{q}"</p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.href}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.href)}
                className={[
                  "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors",
                  i === active ? "bg-[#978eff]/[0.1]" : "",
                ].join(" ")}
              >
                <span className="text-[14px] font-medium text-ink">{r.title}</span>
                <span className="text-[12px] text-grey-3">{r.group}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
