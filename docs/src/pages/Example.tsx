import { useParams } from "react-router-dom"
import { CodeCompare } from "../components/CodeBlock"
import { Page, PrevNext } from "../components/Page"
import { P } from "../components/prose"
import { examples } from "../examples"
import { pageHref, pages } from "./nav"

export function Example() {
  const { slug } = useParams()
  const idx = examples.findIndex((e) => e.slug === slug)
  const ex = examples[idx]

  if (!ex) {
    return (
      <Page>
        <h1 className="text-[20px] font-semibold text-ink">Example not found</h1>
      </Page>
    )
  }

  const prev = examples[idx - 1]
  const next = examples[idx + 1]
  const lastDoc = pages[pages.length - 1]

  return (
    <Page width="hero">
      <p className="mb-2 font-[var(--font-mono)] text-[12px] tracking-[-0.09px] text-accent">
        Example
      </p>
      <h1 className="font-[var(--font-repro)] text-[length:var(--title-size)] font-semibold tracking-[-0.6px] text-ink">
        {ex.title}
      </h1>
      <div className="mt-4" style={{ maxWidth: "var(--content-w)" }}>
        <P>{ex.blurb}</P>
      </div>

      <div className="mt-7">
        <CodeCompare
          rust={ex.rust}
          clarity={ex.clarity}
          rustName={`${ex.slug}.rs`}
          clarityName={`${ex.slug}.clar`}
        />
      </div>

      <div style={{ maxWidth: "var(--content-w)" }}>
        <PrevNext
          prev={
            prev
              ? { href: `/examples/${prev.slug}`, title: prev.title }
              : { href: pageHref(lastDoc.slug), title: lastDoc.title }
          }
          next={next ? { href: `/examples/${next.slug}`, title: next.title } : undefined}
        />
      </div>
    </Page>
  )
}
