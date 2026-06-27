import { CodeBlock, CodeCompare } from "../components/CodeBlock"
import { RightToc } from "../components/RightToc"
import { Caret, Chevron } from "../components/icons"
import { Link, H2, P, Code, Callout } from "../components/prose"
import { examples } from "../examples"

const counter = examples[0]

const STORAGE = `#[contract]
pub struct Ledger {
    total: DataVar<Uint>,
    balances: Map<Principal, Uint>,
}
// -> (define-data-var total uint u0)
// -> (define-map balances principal uint)`

const FUNCTIONS = `#[public]                          // (define-public ...), must return a response
pub fn deposit(&self, amount: Uint) -> Response<Uint, Uint> {
    let who = tx_sender();         // tx-sender
    let current = self.balances.get(who).unwrap_or(Uint(0));
    self.balances.set(who, current + amount);
    ok(current + amount)
}

#[readonly]                        // (define-read-only ...), cannot mutate
pub fn balance_of(&self, who: Principal) -> Uint {
    self.balances.get(who).unwrap_or(Uint(0))
}`

const CONTROL = `#[readonly]
pub fn max_of(&self, a: Uint, b: Uint) -> Uint {
    if a > b { a } else { b }
}
// -> (define-read-only (max-of (a uint) (b uint))
//      (if (> a b) a b))`

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

export function Overview() {
  return (
    <>
      <div className="min-w-0 flex-1 px-4 py-[var(--main-py)] lg:px-[length:var(--main-px)]">
        <div className="mx-auto max-w-[var(--content-w)]">
          <div className="mb-8 flex items-start justify-between gap-4">
            <h1 className="font-[var(--font-repro)] text-[length:var(--title-size)] font-semibold tracking-[-0.6px] text-ink">
              clarust
            </h1>
            <button className="flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-paper-2 px-3 py-1.5 text-[13px] text-grey-2 transition-colors duration-200 ease-out hover:text-ink hover:bg-ink/[0.03]">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border border-grey-4 text-[8px]">
                {"</>"}
              </span>
              Copy for LLM
              <Caret className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-4">
            <P>
              Stacks runs smart contracts written in <Link>Clarity</Link>, a decidable,
              lisp-shaped language with its own type system. it is safe by design, but unfamiliar,
              and that is the wall most new Stacks devs hit. the tooling around it (
              <Link>clarinet</Link>, the checker and dev environment) is good, the language is the
              cost.
            </P>
            <P>
              clarust lets you write the contract in real Rust instead. you write a normal{" "}
              <Code>.rs</Code> file against the <Link>clarust-lang</Link> crate, so rustc
              type-checks it and your editor gives you autocomplete, like writing an Anchor program
              for Solana. clarust reads that file and emits readable Clarity that{" "}
              <Code>clarinet</Code> accepts. the difference from Anchor is the artifact: Clarity, not
              a BPF program. here is the same counter, the Rust you write and the Clarity it becomes:
            </P>
          </div>

          <div className="mt-6">
            <CodeCompare rust={counter.rust} clarity={counter.clarity} />
          </div>

          <div className="mt-8 space-y-4">
            <P>
              the generated Clarity is the thing you read, own, and deploy. clarust is an on-ramp
              into Clarity, not a way to avoid it. struct fields become storage, impl methods become
              functions, and <Code>self.count.get()</Code> becomes <Code>var-get</Code>.
            </P>
          </div>

          <section className="mt-12 space-y-5">
            <H2 id="quickstart">Quickstart</H2>
            <P>
              add <Code>clarust-lang</Code> to a crate, write a contract, and run the compiler on the
              source file.
            </P>
            <CodeBlock
              lang="shell"
              code={`$ clarust contracts/counter/src/lib.rs\n# writes counter.clar, with teaching comments tying\n# each line back to the rust it came from`}
            />
          </section>

          <section className="mt-12 space-y-5">
            <H2 id="storage">Storage</H2>
            <P>
              struct fields are contract storage. a <Code>DataVar&lt;T&gt;</Code> is a single value
              (<Code>define-data-var</Code>), a <Code>Map&lt;K, V&gt;</Code> is key/value storage
              (<Code>define-map</Code>). you read and write through <Code>.get()</Code> and{" "}
              <Code>.set()</Code> on <Code>self</Code>.
            </P>
            <CodeBlock lang="rust" code={STORAGE} />
          </section>

          <section className="mt-12 space-y-5">
            <H2 id="functions">Functions</H2>
            <P>
              methods on the impl become contract functions. <Code>#[public]</Code> is an entry
              point and must return a <Code>Response</Code>; <Code>#[readonly]</Code> cannot mutate
              state. the <Code>&amp;self</Code> receiver is the contract instance, not a Clarity
              parameter.
            </P>
            <CodeBlock lang="rust" code={FUNCTIONS} />
            <Callout>
              map reads come back as an <Code>Option</Code>, so <Code>.unwrap_or(Uint(0))</Code>{" "}
              lowers to <Code>(default-to u0 (map-get? ...))</Code>.
            </Callout>
          </section>

          <section className="mt-12 space-y-5">
            <H2 id="types">Types</H2>
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
                  {[
                    ["Uint", "uint"],
                    ["Int", "int"],
                    ["bool", "bool"],
                    ["Principal", "principal"],
                    ["Buff<34>", "(buff 34)"],
                    ["Option<T>", "(optional T)"],
                    ["Response<T, E>", "(response T E)"],
                  ].map(([r, c]) => (
                    <tr key={r} className="border-b border-ink/[0.04] last:border-0">
                      <td className="px-4 py-2">{r}</td>
                      <td className="px-4 py-2 text-grey-2">{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-12 space-y-5">
            <H2 id="control-flow">Control Flow</H2>
            <P>
              <Code>if/else</Code> is an expression and lowers to Clarity's <Code>if</Code>.
              arithmetic and comparisons map to prefix form (<Code>a + b</Code> to{" "}
              <Code>(+ a b)</Code>, <Code>a == b</Code> to <Code>(is-eq a b)</Code>).
            </P>
            <CodeBlock lang="rust" code={CONTROL} />
          </section>

          <section className="mt-12 space-y-5">
            <H2 id="tokens">Tokens</H2>
            <P>
              a <Code>FungibleToken</Code> field becomes <Code>define-fungible-token</Code> and a{" "}
              <Code>NonFungibleToken&lt;Id&gt;</Code> becomes <Code>define-non-fungible-token</Code>.
              the runtime tracks balances, so there is no manual balance sheet. see the{" "}
              <Link href="/examples/coin">fungible</Link> and <Link href="/examples/nft">nft</Link>{" "}
              examples.
            </P>
          </section>

          <section className="mt-12 space-y-5">
            <H2 id="sip-010">SIP-010 Trait</H2>
            <P>
              mark a contract with <Code>#[impl_trait(...)]</Code> to promise it matches a trait;
              clarinet enforces the signatures. the <Link href="/examples/token">token example</Link>{" "}
              is a full SIP-010 fungible token that passes trait conformance, memo and all.
            </P>
            <Callout>
              a contract that implements a trait needs the trait contract present to verify.
            </Callout>
          </section>

          <section className="mt-12 space-y-5">
            <H2 id="verifying">Verifying</H2>
            <P>
              <Code>--check</Code> scaffolds a clarinet project, runs <Code>clarinet check</Code>,
              and rewrites each diagnostic from the generated-clarity line back to the line in your
              Rust source. so an error points where you actually wrote it.
            </P>
            <CodeBlock lang="shell" code={VERIFY} />
          </section>

          <section className="mt-12 space-y-5">
            <H2 id="limits">What Doesn't Map</H2>
            <P>
              the Rust you write does not run on Stacks, it is transpiled. so rustc accepting your
              code is necessary but not sufficient: a loop or a <Code>HashMap</Code> compiles in Rust
              but clarust rejects it, because Clarity has no such thing. the compiler errors clearly
              instead of emitting something broken.
            </P>
            <CodeBlock lang="rust" code={LOOPS} />
          </section>

          <section className="mt-12 space-y-5">
            <H2 id="next-steps">Next Steps</H2>
            <ul className="space-y-2.5">
              <li className="flex gap-3 text-[16px] leading-[24px] tracking-[-0.09px] text-grey-1">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-grey-4" />
                <span>
                  Walk the <Link href="/examples/counter">example contracts</Link>: counter, ledger,
                  vault, coin, nft, token.
                </span>
              </li>
              <li className="flex gap-3 text-[16px] leading-[24px] tracking-[-0.09px] text-grey-1">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-grey-4" />
                <span>Read the type reference for everything in clarust-lang.</span>
              </li>
            </ul>
          </section>

          <div className="mt-14 border-t border-ink/[0.06] pt-8">
            <div className="grid grid-cols-1">
              <a
                href="/examples/counter"
                className="group rounded-xl border border-ink/[0.06] bg-paper-2 px-5 py-4 text-right transition-colors duration-200 ease-out hover:border-ink/15"
              >
                <span className="flex items-center justify-end gap-1 text-[13px] text-grey-3">
                  Next <Chevron className="h-3.5 w-3.5" />
                </span>
                <span className="mt-1 block text-[15px] font-medium text-ink">
                  Examples: Counter
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
      <RightToc />
    </>
  )
}
