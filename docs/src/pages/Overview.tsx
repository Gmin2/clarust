import { CodeCompare } from "../components/CodeBlock"
import { Page, PrevNext } from "../components/Page"
import { Link, P, Code } from "../components/prose"
import { examples } from "../examples"
import { pageNav, pageHref } from "./nav"

const counter = examples[0]

export function Overview() {
  const { next } = pageNav("")
  return (
    <Page width="hero">
      <div style={{ maxWidth: "var(--content-w)" }}>
        <h1 className="font-[var(--font-repro)] text-[length:var(--title-size)] font-semibold tracking-[-0.6px] text-ink">
          clarust
        </h1>
        <div className="mt-5 space-y-4">
          <P>
            Stacks runs smart contracts written in <Link>Clarity</Link>, a decidable, lisp-shaped
            language with its own type system. it is safe by design but unfamiliar, and that is the
            wall most new Stacks devs hit. the tooling around it (<Link>clarinet</Link>, the checker
            and dev environment) is good; the language is the cost.
          </P>
          <P>
            clarust lets you write the contract in real Rust instead, against the{" "}
            <Link>clarust-lang</Link> crate, so rustc type-checks it and your editor autocompletes,
            like an Anchor program for Solana. clarust reads that file and emits readable Clarity
            that <Code>clarinet</Code> accepts. here is the same counter, the Rust you write and the
            Clarity it becomes:
          </P>
        </div>
      </div>

      <div className="mt-7">
        <CodeCompare rust={counter.rust} clarity={counter.clarity} />
      </div>

      <div className="mt-8" style={{ maxWidth: "var(--content-w)" }}>
        <P>
          the generated Clarity is the thing you read, own, and deploy. clarust is an on-ramp into
          Clarity, not a way to avoid it: struct fields become storage, impl methods become
          functions, and <Code>self.count.get()</Code> becomes <Code>var-get</Code>.
        </P>
        <PrevNext prev={undefined} next={next && { href: pageHref(next.slug), title: next.title }} />
      </div>
    </Page>
  )
}
