import { useParams, Link as RouterLink } from "react-router-dom"
import { CodeCompare } from "../components/CodeBlock"
import { ArrowLeft, Chevron } from "../components/icons"
import { P } from "../components/prose"
import { examples } from "../examples"

export function Example() {
  const { slug } = useParams()
  const idx = examples.findIndex((e) => e.slug === slug)
  const ex = examples[idx]

  if (!ex) {
    return (
      <div className="flex-1 px-4 py-[var(--main-py)] lg:px-[length:var(--main-px)]">
        <div className="mx-auto max-w-[var(--content-w)]">
          <h1 className="text-[20px] font-semibold text-ink">Example not found</h1>
          <p className="mt-2 text-grey-2">
            <RouterLink to="/examples/counter" className="text-link underline">
              Back to Counter
            </RouterLink>
          </p>
        </div>
      </div>
    )
  }

  const prev = examples[idx - 1]
  const next = examples[idx + 1]

  return (
    <div className="min-w-0 flex-1 px-4 py-[var(--main-py)] lg:px-[length:var(--main-px)]">
      <div className="mx-auto max-w-[var(--content-w)]">
        <p className="mb-2 font-[var(--font-mono)] text-[12px] tracking-[-0.09px] text-accent">
          Example
        </p>
        <h1 className="font-[var(--font-repro)] text-[length:var(--title-size)] font-semibold tracking-[-0.6px] text-ink">
          {ex.title}
        </h1>
        <div className="mt-4 max-w-[640px]">
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

        <div className="mt-12 border-t border-ink/[0.06] pt-8">
          <div className="grid grid-cols-2 gap-4">
            {prev ? (
              <RouterLink
                to={`/examples/${prev.slug}`}
                className="group rounded-xl border border-ink/[0.06] bg-paper-2 px-5 py-4 transition-colors duration-200 ease-out hover:border-ink/15"
              >
                <span className="flex items-center gap-1 text-[13px] text-grey-3">
                  <ArrowLeft className="h-3.5 w-3.5" /> Previous
                </span>
                <span className="mt-1 block text-[15px] font-medium text-ink">{prev.title}</span>
              </RouterLink>
            ) : (
              <RouterLink
                to="/"
                className="group rounded-xl border border-ink/[0.06] bg-paper-2 px-5 py-4 transition-colors duration-200 ease-out hover:border-ink/15"
              >
                <span className="flex items-center gap-1 text-[13px] text-grey-3">
                  <ArrowLeft className="h-3.5 w-3.5" /> Previous
                </span>
                <span className="mt-1 block text-[15px] font-medium text-ink">Overview</span>
              </RouterLink>
            )}
            {next && (
              <RouterLink
                to={`/examples/${next.slug}`}
                className="group rounded-xl border border-ink/[0.06] bg-paper-2 px-5 py-4 text-right transition-colors duration-200 ease-out hover:border-ink/15"
              >
                <span className="flex items-center justify-end gap-1 text-[13px] text-grey-3">
                  Next <Chevron className="h-3.5 w-3.5" />
                </span>
                <span className="mt-1 block text-[15px] font-medium text-ink">{next.title}</span>
              </RouterLink>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
