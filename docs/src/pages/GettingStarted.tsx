import type { ReactNode } from "react"
import { CodeBlock } from "../components/CodeBlock"
import { Page, PrevNext } from "../components/Page"
import { P, Code, Callout } from "../components/prose"
import { examples } from "../examples"
import { pageNav, pageHref } from "./nav"

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="relative pl-14 pb-10 last:pb-0">
      <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-white text-[13px] font-medium text-grey-1">
        {n}
      </span>
      <h3 className="text-[17px] font-semibold tracking-[-0.2px] text-ink">{title}</h3>
      <div className="mt-3 space-y-4">{children}</div>
    </li>
  )
}

const CARGO = `[dependencies]
clarust-lang = { git = "https://github.com/clarust/clarust" }`

export function GettingStarted() {
  const { prev, next } = pageNav("getting-started")
  return (
    <Page>
      <h1 className="font-[var(--font-repro)] text-[length:var(--title-size)] font-semibold tracking-[-0.6px] text-ink">
        Getting Started
      </h1>
      <p className="mt-3 text-[16px] leading-[24px] tracking-[-0.09px] text-grey-2">
        To get started, follow the steps below.
      </p>

      <ol className="relative mt-9">
        <span className="absolute left-4 top-3 bottom-6 w-px bg-ink/[0.09]" aria-hidden />

        <Step n={1} title="Add the crate">
          <P>
            add <Code>clarust-lang</Code> to a Rust crate. it gives you the types you write contracts
            against, so rustc checks your code and your editor autocompletes.
          </P>
          <CodeBlock lang="Cargo.toml" code={CARGO} />
        </Step>

        <Step n={2} title="Write a contract">
          <P>
            a <Code>#[contract]</Code> struct is storage, a <Code>#[contract_impl]</Code> is its
            functions. this is real Rust, it compiles with <Code>cargo build</Code>.
          </P>
          <CodeBlock lang="counter.rs" code={examples[0].rust} />
        </Step>

        <Step n={3} title="Compile to Clarity">
          <P>run the compiler on the source file. it writes the Clarity next to teaching comments.</P>
          <CodeBlock
            lang="shell"
            code={"$ clarust contracts/counter/src/lib.rs\n# -> counter.clar"}
          />
        </Step>

        <Step n={4} title="Check with clarinet">
          <P>
            <Code>--check</Code> runs <Code>clarinet check</Code> on the output and maps any error
            back to the line in your Rust source.
          </P>
          <CodeBlock lang="shell" code={"$ clarust contracts/counter/src/lib.rs --check\n# clarinet checked 1 contract"} />
          <Callout>
            the Rust does not run on Stacks, it is transpiled. so rustc accepting it is necessary but
            not enough, anything Clarity cant express (loops, HashMap) is rejected with a clear error.
          </Callout>
        </Step>
      </ol>

      <PrevNext
        prev={prev && { href: pageHref(prev.slug), title: prev.title }}
        next={next && { href: pageHref(next.slug), title: next.title }}
      />
    </Page>
  )
}
