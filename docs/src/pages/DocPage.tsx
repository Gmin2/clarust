import type { ReactNode } from "react"
import { useParams } from "react-router-dom"
import { CodeBlock } from "../components/CodeBlock"
import { Page, PrevNext } from "../components/Page"
import { Link, P, Code, Callout } from "../components/prose"
import { pages, pageNav, pageHref } from "./nav"

const STORAGE = `#[contract]
pub struct Ledger {
    total: DataVar<Uint>,
    balances: Map<Principal, Uint>,
}
// -> (define-data-var total uint u0)
// -> (define-map balances principal uint)`

const FUNCTIONS = `#[public]
pub fn deposit(&self, amount: Uint) -> Response<Uint, Uint> {
    let who = tx_sender();
    let current = self.balances.get(who).unwrap_or(Uint(0));
    self.balances.set(who, current + amount);
    ok(current + amount)
}

#[readonly]
pub fn balance_of(&self, who: Principal) -> Uint {
    self.balances.get(who).unwrap_or(Uint(0))
}`

const CONTROL = `#[readonly]
pub fn max_of(&self, a: Uint, b: Uint) -> Uint {
    if a > b { a } else { b }
}
// -> (if (> a b) a b)`

const VERIFY = `$ clarust contracts/token/src/lib.rs --check
error: use of unresolved variable 'foo'
--> contracts/token/src/lib.rs:21:9
   return foo;`

const LOOPS = `#[public]
pub fn bad(&self) -> Response<Uint, Uint> {
    for i in 0..10 { /* ... */ }   // rustc is fine with this
    ok(Uint(0))
}
// clarust: fn bad uses a loop; clarity has no unbounded
// iteration, rewrite with fold/map/filter`

const TYPE_ROWS: [string, string][] = [
  ["Uint", "uint"],
  ["Int", "int"],
  ["bool", "bool"],
  ["Principal", "principal"],
  ["Buff<34>", "(buff 34)"],
  ["Option<T>", "(optional T)"],
  ["Response<T, E>", "(response T E)"],
]

const bodies: Record<string, () => ReactNode> = {
  storage: () => (
    <>
      <P>
        struct fields are contract storage. a <Code>DataVar&lt;T&gt;</Code> is a single value
        (<Code>define-data-var</Code>), a <Code>Map&lt;K, V&gt;</Code> is key/value storage
        (<Code>define-map</Code>). you read and write through <Code>.get()</Code> and{" "}
        <Code>.set()</Code> on <Code>self</Code>.
      </P>
      <CodeBlock lang="rust" code={STORAGE} />
    </>
  ),
  functions: () => (
    <>
      <P>
        methods on the impl become contract functions. <Code>#[public]</Code> is an entry point and
        must return a <Code>Response</Code>; <Code>#[readonly]</Code> cannot mutate state. the{" "}
        <Code>&amp;self</Code> receiver is the contract instance, not a Clarity parameter.
      </P>
      <CodeBlock lang="rust" code={FUNCTIONS} />
      <Callout>
        map reads come back as an <Code>Option</Code>, so <Code>.unwrap_or(Uint(0))</Code> lowers to{" "}
        <Code>(default-to u0 (map-get? ...))</Code>.
      </Callout>
    </>
  ),
  types: () => (
    <>
      <P>the types in <Code>clarust-lang</Code> mirror Clarity's model, so the mapping is direct:</P>
      <div className="overflow-hidden rounded-xl border border-ink/[0.07]">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-ink/[0.06] bg-paper-2 text-left text-grey-2">
              <th className="px-4 py-2.5 font-medium">Rust</th>
              <th className="px-4 py-2.5 font-medium">Clarity</th>
            </tr>
          </thead>
          <tbody className="font-[var(--font-mono)] text-[13px] text-grey-1">
            {TYPE_ROWS.map(([r, c]) => (
              <tr key={r} className="border-b border-ink/[0.04] last:border-0">
                <td className="px-4 py-2">{r}</td>
                <td className="px-4 py-2 text-grey-2">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  ),
  "control-flow": () => (
    <>
      <P>
        <Code>if/else</Code> is an expression and lowers to Clarity's <Code>if</Code>. arithmetic and
        comparisons map to prefix form (<Code>a + b</Code> to <Code>(+ a b)</Code>,{" "}
        <Code>a == b</Code> to <Code>(is-eq a b)</Code>).
      </P>
      <CodeBlock lang="rust" code={CONTROL} />
    </>
  ),
  tokens: () => (
    <>
      <P>
        a <Code>FungibleToken</Code> field becomes <Code>define-fungible-token</Code> and a{" "}
        <Code>NonFungibleToken&lt;Id&gt;</Code> becomes <Code>define-non-fungible-token</Code>. the
        runtime tracks balances, so there is no manual balance sheet.
      </P>
      <P>
        see the <Link href="/examples/coin">fungible</Link> and <Link href="/examples/nft">nft</Link>{" "}
        examples for the full contracts.
      </P>
    </>
  ),
  "sip-010": () => (
    <>
      <P>
        mark a contract with <Code>#[impl_trait(...)]</Code> to promise it matches a trait; clarinet
        enforces the signatures. the <Link href="/examples/token">token example</Link> is a full
        SIP-010 fungible token that passes trait conformance, including the{" "}
        <Code>(optional (buff 34))</Code> memo.
      </P>
      <Callout>a contract that implements a trait needs the trait contract present to verify.</Callout>
    </>
  ),
  verifying: () => (
    <>
      <P>
        <Code>--check</Code> scaffolds a clarinet project, runs <Code>clarinet check</Code>, and
        rewrites each diagnostic from the generated-clarity line back to the line in your Rust
        source. so an error points where you actually wrote it.
      </P>
      <CodeBlock lang="shell" code={VERIFY} />
    </>
  ),
  limits: () => (
    <>
      <P>
        the Rust you write does not run on Stacks, it is transpiled. so rustc accepting your code is
        necessary but not sufficient: a loop or a <Code>HashMap</Code> compiles in Rust but clarust
        rejects it, because Clarity has no such thing. the compiler errors clearly instead of
        emitting something broken.
      </P>
      <CodeBlock lang="rust" code={LOOPS} />
    </>
  ),
}

export function DocPage() {
  const { slug = "" } = useParams()
  const meta = pages.find((p) => p.slug === slug)
  const body = bodies[slug]

  if (!meta || !body) {
    return (
      <Page>
        <h1 className="text-[20px] font-semibold text-ink">Page not found</h1>
      </Page>
    )
  }

  const { prev, next } = pageNav(slug)
  return (
    <Page>
      <h1 className="font-[var(--font-repro)] text-[length:var(--title-size)] font-semibold tracking-[-0.6px] text-ink">
        {meta.title}
      </h1>
      <div className="mt-6 space-y-5">{body()}</div>
      <PrevNext
        prev={prev && { href: pageHref(prev.slug), title: prev.title }}
        next={next && { href: pageHref(next.slug), title: next.title }}
      />
    </Page>
  )
}
