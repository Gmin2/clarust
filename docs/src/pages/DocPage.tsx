import type { ReactNode } from "react"
import { useParams } from "react-router-dom"
import { CodeBlock } from "../components/CodeBlock"
import { Page, PrevNext } from "../components/Page"
import { Link, H2, P, Code, Callout, Table } from "../components/prose"
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

const MACRO_EXAMPLE = `use clarust_lang::prelude::*;

#[contract]
#[impl_trait(".sip-010-trait.sip-010-trait")]
pub struct Token {
    supply: DataVar<Uint>,
}

#[contract_impl]
impl Token {
    #[public]
    pub fn mint(&self, amount: Uint) -> Response<Uint, Uint> {
        let next = self.bump(amount);
        ok(next)
    }

    #[readonly]
    pub fn total(&self) -> Uint {
        self.supply.get()
    }

    #[private]
    fn bump(&self, amount: Uint) -> Uint {
        let next = self.supply.get() + amount;
        self.supply.set(next);
        next
    }
}`

const MACRO_ROWS: [string, string][] = [
  ["#[contract]", "on a struct: this is the contract, its fields become storage"],
  ["#[contract_impl]", "on an impl block: its methods become contract functions"],
  ["#[public]", "(define-public ...), an entry point that must return a Response"],
  ["#[readonly]", "(define-read-only ...), cannot mutate state"],
  ["#[private]", "(define-private ...), an internal helper, not callable from outside"],
  ['#[impl_trait("...")]', "(impl-trait ...), promises the contract matches a trait; clarinet enforces it"],
]

const STORAGE_ROWS: [string, string][] = [
  ["DataVar<T>", "define-data-var. .get() reads (var-get), .set(v) writes (var-set)"],
  ["Map<K, V>", "define-map. .get(k) returns an Option (map-get?), .set/.insert/.delete write"],
  ["FungibleToken", "define-fungible-token, balances tracked by the runtime"],
  ["NonFungibleToken<Id>", "define-non-fungible-token keyed by Id"],
]

const HELPER_ROWS: [string, string][] = [
  ["ok(v) / err(e)", "the two arms of a Response: (ok v) / (err e)"],
  ["some(v) / none()", "an optional value: (some v) / none"],
  ["tx_sender()", "the caller, tx-sender"],
  ["asserts(cond, code)", "guard: (asserts! cond (err code)), aborts the tx when cond is false"],
  ["ft_mint / ft_transfer", "ft-mint? / ft-transfer? on a FungibleToken"],
  ["ft_get_balance / ft_get_supply", "ft-get-balance / ft-get-supply"],
  ["nft_mint / nft_transfer", "nft-mint? / nft-transfer? on a NonFungibleToken"],
  ["nft_get_owner", "nft-get-owner?, returns an Option"],
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
      <Table head={["Rust", "Clarity"]} rows={TYPE_ROWS} />
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
  macros: () => (
    <>
      <P>
        the attributes come from <Code>clarust-macros</Code> and are re-exported by the prelude. at
        build time they pass the item through unchanged, so rustc compiles your contract like any
        Rust; the clarust compiler reads them to decide what each item becomes.
      </P>
      <Table head={["Attribute", "What it does"]} rows={MACRO_ROWS} />
      <P>a contract using them together:</P>
      <CodeBlock lang="rust" code={MACRO_EXAMPLE} />
      <Callout>
        <Code>#[private]</Code> functions are not callable from outside the contract; use them for
        shared logic between your public and read-only functions.
      </Callout>
    </>
  ),
  prelude: () => (
    <>
      <P>
        everything you write a contract against comes from one import,{" "}
        <Code>use clarust_lang::prelude::*</Code>. it is split into storage, the value types, and a
        set of helpers that map to Clarity builtins.
      </P>
      <H2 id="storage-types">Storage</H2>
      <P>the four kinds of contract storage, written as struct fields:</P>
      <Table head={["Type", "Lowers to"]} rows={STORAGE_ROWS} />
      <H2 id="value-types">Value types</H2>
      <P>used for parameters, return types, and locals:</P>
      <Table head={["Rust", "Clarity"]} rows={TYPE_ROWS} />
      <H2 id="helpers">Helpers</H2>
      <P>functions you call inside a body, each maps to a Clarity builtin:</P>
      <Table head={["Helper", "Maps to"]} rows={HELPER_ROWS} />
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
