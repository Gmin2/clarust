import type { ReactNode } from "react"
import { CodeBlock, CodeCompare } from "./CodeBlock"
import { Info, Caret, ArrowLeft, Chevron } from "./icons"

function Link({ children }: { children: ReactNode }) {
  return (
    <a
      href="#"
      className="font-medium text-link underline decoration-link/30 underline-offset-2 transition-opacity duration-200 ease-out hover:opacity-70"
    >
      {children}
    </a>
  )
}

function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-20 pt-2 text-[20px] font-semibold tracking-[-0.33px] text-ink">
      {children}
    </h2>
  )
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-[16px] leading-[24px] tracking-[-0.09px] text-grey-1">{children}</p>
}

function Code({ children }: { children: string }) {
  return (
    <code className="rounded-[5px] border border-ink/[0.07] bg-paper-2 px-1.5 py-0.5 font-[var(--font-mono)] text-[13px] text-ink">
      {children}
    </code>
  )
}

function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-ink/[0.06] bg-paper-2 px-4 py-3.5">
      <Info className="h-4 w-4 shrink-0 text-grey-3" />
      <p className="text-[14px] leading-[21px] tracking-[-0.09px] text-grey-2">{children}</p>
    </div>
  )
}

const HERO_RUST = `#[contract]
pub struct Counter {
    count: DataVar<Uint>,
}

#[contract_impl]
impl Counter {
    #[public]
    pub fn increment(&self, step: Uint) -> Response<Uint, Uint> {
        let new_count = self.count.get() + step;
        self.count.set(new_count);
        ok(new_count)
    }

    #[readonly]
    pub fn get_count(&self) -> Uint {
        self.count.get()
    }
}`

const HERO_CLARITY = `(define-data-var count uint u0)

(define-public (increment (step uint))
  (let ((new-count (+ (var-get count) step)))
    (begin
      (var-set count new-count)
      (ok new-count))))

(define-read-only (get-count)
  (var-get count))`

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

const FT = `#[contract]
pub struct Coin {
    coin: FungibleToken,
}

#[contract_impl]
impl Coin {
    #[public]
    pub fn mint(&self, amount: Uint, recipient: Principal) -> Response<bool, Uint> {
        ft_mint(self.coin, amount, recipient)
    }
}`

const SIP010 = `#[contract]
#[impl_trait(".sip-010-trait.sip-010-trait")]
pub struct Token {
    clarity_coin: FungibleToken,
}

#[contract_impl]
impl Token {
    #[public]
    pub fn transfer(
        &self,
        amount: Uint,
        sender: Principal,
        recipient: Principal,
        memo: Option<Buff<34>>,
    ) -> Response<bool, Uint> {
        asserts(sender == tx_sender(), ERR_NOT_OWNER);
        ft_transfer(self.clarity_coin, amount, sender, recipient)
    }
    // get-name, get-symbol, get-decimals, get-balance,
    // get-total-supply, get-token-uri ...
}`

const VERIFY = `$ clarust contracts/token/src/lib.rs --check
error: use of unresolved variable 'foo'
--> contracts/token/src/lib.rs:21:9
   return foo;`

const LOOPS = `#[public]
pub fn bad(&self) -> Response<Uint, Uint> {
    for i in 0..10 { /* ... */ }   // rustc is fine with this
    ok(Uint(0))
}
// clarust: fn \`bad\` uses a loop; clarity has no unbounded
// iteration, rewrite with fold/map/filter`

export function MainContent() {
  return (
    <div className="min-w-0 flex-1 px-4 py-[var(--main-py)] lg:px-[length:var(--main-px)]">
      <div className="mx-auto max-w-[var(--content-w)]">
        <div className="mb-10 flex items-start justify-between gap-4">
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

        <CodeCompare rust={HERO_RUST} clarity={HERO_CLARITY} />

        <div className="mt-8 space-y-4">
          <P>
            clarust lets you write a Stacks smart contract in real Rust and compiles it to Clarity,
            the language Stacks runs. you write a normal <Code>.rs</Code> file against the{" "}
            <Link>clarust-lang</Link> crate, so rustc type-checks it and your editor gives you
            autocomplete, like writing an Anchor program for Solana. the difference is the artifact:
            Clarity, not a BPF program.
          </P>
          <P>
            the generated Clarity is the thing you read, own, and deploy. clarust is an on-ramp into
            Clarity, not a way to avoid it. struct fields become storage, impl methods become
            functions, and <Code>self.count.get()</Code> becomes <Code>var-get</Code>.
          </P>
        </div>

        <section className="mt-12 space-y-5">
          <H2 id="quickstart">Quickstart</H2>
          <P>
            add <Code>clarust-lang</Code> to a crate, write a contract, and run the compiler on the
            source file. the example above is the full counter, both halves.
          </P>
          <CodeBlock lang="shell" code={`$ clarust contracts/counter/src/lib.rs\n# writes counter.clar, with teaching comments tying each\n# line back to the rust it came from`} />
        </section>

        <section className="mt-12 space-y-5">
          <H2 id="storage">Storage</H2>
          <P>
            struct fields are contract storage. a <Code>DataVar&lt;T&gt;</Code> is a single value
            (<Code>define-data-var</Code>), a <Code>Map&lt;K, V&gt;</Code> is key/value storage
            (<Code>define-map</Code>). you read and write them through <Code>.get()</Code> and{" "}
            <Code>.set()</Code> on <Code>self</Code>.
          </P>
          <CodeBlock lang="rust" code={STORAGE} />
        </section>

        <section className="mt-12 space-y-5">
          <H2 id="functions">Functions</H2>
          <P>
            methods on the impl become contract functions. <Code>#[public]</Code> is a public entry
            point and must return a <Code>Response</Code>; <Code>#[readonly]</Code> cannot mutate
            state. the <Code>&amp;self</Code> receiver is the contract instance and is not a Clarity
            parameter.
          </P>
          <CodeBlock lang="rust" code={FUNCTIONS} />
          <Callout>
            map reads come back as an <Code>Option</Code>, so <Code>.unwrap_or(Uint(0))</Code> lowers
            to <Code>(default-to u0 (map-get? ...))</Code>.
          </Callout>
        </section>

        <section className="mt-12 space-y-5">
          <H2 id="types">Types</H2>
          <P>
            the types in <Code>clarust-lang</Code> mirror Clarity's model so the mapping is direct:
          </P>
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
            <Code>if/else</Code> is an expression and lowers to Clarity's <Code>if</Code>. arithmetic
            and comparisons map to their prefix forms (<Code>a + b</Code> to <Code>(+ a b)</Code>,{" "}
            <Code>a == b</Code> to <Code>(is-eq a b)</Code>).
          </P>
          <CodeBlock lang="rust" code={CONTROL} />
        </section>

        <section className="mt-12 space-y-5">
          <H2 id="tokens">Tokens</H2>
          <P>
            a <Code>FungibleToken</Code> field becomes <Code>define-fungible-token</Code> and a{" "}
            <Code>NonFungibleToken&lt;Id&gt;</Code> becomes <Code>define-non-fungible-token</Code>.
            the runtime tracks balances, so there is no manual balance sheet. the{" "}
            <Code>ft_*</Code> and <Code>nft_*</Code> helpers map to the matching Clarity builtins.
          </P>
          <CodeBlock lang="rust" code={FT} />
        </section>

        <section className="mt-12 space-y-5">
          <H2 id="sip-010">SIP-010 Trait</H2>
          <P>
            mark a contract with <Code>#[impl_trait(...)]</Code> to promise it matches a trait.
            clarinet enforces the signatures. the token example is a full SIP-010 fungible token
            that passes trait conformance, including the <Code>(optional (buff 34))</Code> memo
            parameter.
          </P>
          <CodeBlock lang="rust" code={SIP010} />
          <Callout>
            a contract that implements a trait needs the trait contract present to verify. see{" "}
            <Link>contracts/token</Link>.
          </Callout>
        </section>

        <section className="mt-12 space-y-5">
          <H2 id="verifying">Verifying</H2>
          <P>
            <Code>--check</Code> scaffolds a clarinet project, runs <Code>clarinet check</Code>, and
            rewrites each diagnostic from the generated-clarity line back to the line in your Rust
            source. so an error points where you actually wrote it.
          </P>
          <CodeBlock lang="shell" code={VERIFY} />
        </section>

        <section className="mt-12 space-y-5">
          <H2 id="limits">What Doesn't Map</H2>
          <P>
            the Rust you write does not run on Stacks, it is transpiled. so rustc accepting your code
            is necessary but not sufficient: a loop or a <Code>HashMap</Code> compiles in Rust but
            clarust rejects it, because Clarity has no such thing. the compiler errors clearly
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
                Read the <Link>type reference</Link> for everything in clarust-lang.
              </span>
            </li>
            <li className="flex gap-3 text-[16px] leading-[24px] tracking-[-0.09px] text-grey-1">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-grey-4" />
              <span>
                Walk the <Link>example contracts</Link>: counter, ledger, vault, coin, nft, token.
              </span>
            </li>
          </ul>
        </section>

        <div className="mt-14 border-t border-ink/[0.06] pt-8">
          <div className="grid grid-cols-2 gap-4">
            <a
              href="#"
              className="group rounded-xl border border-ink/[0.06] bg-paper-2 px-5 py-4 transition-colors duration-200 ease-out hover:border-ink/15"
            >
              <span className="flex items-center gap-1 text-[13px] text-grey-3">
                <ArrowLeft className="h-3.5 w-3.5" /> Previous
              </span>
              <span className="mt-1 block text-[15px] font-medium text-ink">Introduction</span>
            </a>
            <a
              href="#"
              className="group rounded-xl border border-ink/[0.06] bg-paper-2 px-5 py-4 text-right transition-colors duration-200 ease-out hover:border-ink/15"
            >
              <span className="flex items-center justify-end gap-1 text-[13px] text-grey-3">
                Next <Chevron className="h-3.5 w-3.5" />
              </span>
              <span className="mt-1 block text-[15px] font-medium text-ink">Storage</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
