import { useEffect, useState } from "react"
import { motion } from "framer-motion"

const items = [
  { id: "quickstart", label: "Quickstart" },
  { id: "storage", label: "Storage" },
  { id: "functions", label: "Functions" },
  { id: "types", label: "Types" },
  { id: "control-flow", label: "Control Flow" },
  { id: "tokens", label: "Tokens" },
  { id: "sip-010", label: "SIP-010 Trait" },
  { id: "verifying", label: "Verifying" },
  { id: "limits", label: "What Doesn't Map" },
  { id: "next-steps", label: "Next Steps" },
]

export function RightToc() {
  const [active, setActive] = useState(items[0].id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: "-72px 0px -65% 0px", threshold: 0 },
    )
    items.forEach((it) => {
      const el = document.getElementById(it.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <aside className="hidden xl:block w-[var(--toc-w)] shrink-0">
      <div className="sticky top-[60px] max-h-[calc(100vh-60px)] overflow-y-auto px-2 py-10">
        <p className="mb-3 px-3 font-[var(--font-repro)] text-[13px] font-medium tracking-[-0.09px] text-grey-2">
          On this page
        </p>
        <nav className="flex flex-col">
          {items.map((it) => {
            const isActive = active === it.id
            return (
              <a
                key={it.id}
                href={`#${it.id}`}
                onClick={() => setActive(it.id)}
                className="relative px-3 py-1.5"
              >
                {isActive && (
                  <motion.span
                    layoutId="toc-active"
                    className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-accent"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <span
                  className={[
                    "block text-[13px] leading-[18px] tracking-[-0.09px] transition-colors duration-200 ease-out",
                    isActive ? "text-ink font-medium" : "text-grey-2 hover:text-ink",
                  ].join(" ")}
                >
                  {it.label}
                </span>
              </a>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
