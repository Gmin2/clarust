import type { ReactNode } from "react"
import { useParams } from "react-router-dom"
import { CodeBlock } from "../components/CodeBlock"
import { Page, PrevNext } from "../components/Page"
import { Link, H2, P, Code, Callout, Table } from "../components/prose"
import { pages, pageNav, pageHref } from "./nav"

const ST_VAR = `#[contract]
pub struct Counter {
    count: DataVar<Uint>,    // -> (define-data-var count uint u0)
}`

const ST_VAR_USE = `let n = self.count.get();   // (var-get count)
self.count.set(n + step);   // (var-set count (+ n step))`

const ST_MAP = `#[contract]
pub struct Ledger {
    balances: Map<Principal, Uint>,
    //  -> (define-map balances principal uint)
}`

const ST_MAP_USE = `let bal = self.balances.get(who).unwrap_or(Uint(0));
//  (default-to u0 (map-get? balances who))
self.balances.set(who, bal + amount);
//  (map-set balances who (+ bal amount))`

const FN_PUBLIC = `#[public]
pub fn increment(&self, step: Uint) -> Response<Uint, Uint> {
    let new_count = self.count.get() + step;
    self.count.set(new_count);
    ok(new_count)
}
//  -> (define-public (increment (step uint)) ...)`

const FN_READONLY = `#[readonly]
pub fn get_count(&self) -> Uint {
    self.count.get()
}
//  -> (define-read-only (get-count) (var-get count))`

const CTRL = `#[public]
pub fn decrement(&self, step: Uint) -> Response<Uint, Uint> {
    let current = self.count.get();
    if step > current {
        err(Uint(1))
    } else {
        self.count.set(current - step);
        ok(self.count.get())
    }
}
//  -> (if (> step current) (err u1) (begin ...))`

const TOK_FT = `#[contract]
pub struct Coin {
    coin: FungibleToken,    // -> (define-fungible-token coin)
}`

const TOK_FT_USE = `ft_mint(self.coin, amount, recipient)
//  (ft-mint? coin amount recipient)
ft_transfer(self.coin, amount, sender, recipient)
//  (ft-transfer? coin amount sender recipient)`

const SIP_IMPL = `#[contract]
#[impl_trait(".sip-010-trait.sip-010-trait")]
pub struct Token {
    clarity_coin: FungibleToken,
}
//  -> (impl-trait .sip-010-trait.sip-010-trait)`

const SIP_TRANSFER = `#[public]
pub fn transfer(&self, amount: Uint, sender: Principal,
                recipient: Principal, memo: Option<Buff<34>>)
    -> Response<bool, Uint>
{
    asserts(sender == tx_sender(), ERR_NOT_OWNER);
    ft_transfer(self.clarity_coin, amount, sender, recipient)
}
//  (transfer (amount uint) (sender principal)
//            (recipient principal) (memo (optional (buff 34))))`

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
        a contract's state lives in struct fields. each field is one slot of storage, and its type
        picks the Clarity declaration. the two you reach for most are a single value and a map.
      </P>
      <H2 id="data-var">A single value</H2>
      <P>
        a <Code>DataVar&lt;T&gt;</Code> holds one value of type <Code>T</Code>. the counter keeps its
        running total in one:
      </P>
      <CodeBlock lang="rust" code={ST_VAR} />
      <P>
        inside a function you read it with <Code>.get()</Code> and write it with <Code>.set()</Code>,
        which become <Code>var-get</Code> and <Code>var-set</Code>:
      </P>
      <CodeBlock lang="rust" code={ST_VAR_USE} />
      <H2 id="map">A map</H2>
      <P>
        a <Code>Map&lt;K, V&gt;</Code> stores one value per key, the way you keep a balance per
        account. a ledger keeps a <Code>Uint</Code> per <Code>Principal</Code>:
      </P>
      <CodeBlock lang="rust" code={ST_MAP} />
      <P>
        a map read might find nothing, so <Code>.get()</Code> returns an <Code>Option</Code>. pair it
        with <Code>.unwrap_or</Code> to supply a default, which lowers to <Code>default-to</Code>:
      </P>
      <CodeBlock lang="rust" code={ST_MAP_USE} />
      <Callout>
        the other two storage types are tokens, <Code>FungibleToken</Code> and{" "}
        <Code>NonFungibleToken&lt;Id&gt;</Code>, covered under <Link href="/tokens">Tokens</Link>.
      </Callout>
    </>
  ),
  functions: () => (
    <>
      <P>
        methods on the <Code>#[contract_impl]</Code> block become the contract's functions. an
        attribute on each one sets how it can be called.
      </P>
      <H2 id="public">Public</H2>
      <P>
        <Code>#[public]</Code> is an entry point, anyone can call it. it must return a{" "}
        <Code>Response</Code>, which forces every caller to handle success or failure:
      </P>
      <CodeBlock lang="rust" code={FN_PUBLIC} />
      <H2 id="read-only">Read-only</H2>
      <P>
        <Code>#[readonly]</Code> functions are free to call and cannot change state, the compiler
        enforces it:
      </P>
      <CodeBlock lang="rust" code={FN_READONLY} />
      <H2 id="private">Private</H2>
      <P>
        <Code>#[private]</Code> is an internal helper, callable only from other functions in the same
        contract. across all three, the <Code>&amp;self</Code> receiver is the contract instance,
        never a Clarity parameter.
      </P>
    </>
  ),
  types: () => (
    <>
      <P>
        the types in <Code>clarust-lang</Code> mirror Clarity's model, so the mapping is direct. you
        have already seen most of them: the counter uses <Code>Uint</Code>, the ledger uses{" "}
        <Code>Principal</Code> keys, and the SIP-010 token uses <Code>Option&lt;Buff&lt;34&gt;&gt;</Code>{" "}
        for its memo.
      </P>
      <Table head={["Rust", "Clarity"]} rows={TYPE_ROWS} />
    </>
  ),
  "control-flow": () => (
    <>
      <P>
        <Code>if/else</Code> is an expression: it evaluates to a value, and it lowers straight to
        Clarity's <Code>if</Code>. the counter's decrement uses it to refuse to go below zero:
      </P>
      <CodeBlock lang="rust" code={CTRL} />
      <P>
        both branches produce the function's <Code>Response</Code>. arithmetic and comparisons map to
        prefix form:
      </P>
      <Table
        head={["Rust", "Clarity"]}
        rows={[
          ["a + b", "(+ a b)"],
          ["a - b", "(- a b)"],
          ["a == b", "(is-eq a b)"],
          ["a > b", "(> a b)"],
          ["a && b", "(and a b)"],
        ]}
      />
    </>
  ),
  tokens: () => (
    <>
      <P>
        tokens are storage too, but the runtime tracks every balance for you, so you never keep a
        manual balance sheet.
      </P>
      <H2 id="fungible">Fungible</H2>
      <P>a <Code>FungibleToken</Code> field becomes <Code>define-fungible-token</Code>:</P>
      <CodeBlock lang="rust" code={TOK_FT} />
      <P>
        mint and move it with the <Code>ft_*</Code> helpers, which map to the matching Clarity
        builtins:
      </P>
      <CodeBlock lang="rust" code={TOK_FT_USE} />
      <H2 id="non-fungible">Non-fungible</H2>
      <P>
        a <Code>NonFungibleToken&lt;Id&gt;</Code> works the same way with the <Code>nft_*</Code>{" "}
        helpers, keyed by an id. see the full <Link href="/examples/coin">fungible</Link> and{" "}
        <Link href="/examples/nft">nft</Link> contracts.
      </P>
    </>
  ),
  "sip-010": () => (
    <>
      <P>
        a trait is a fixed set of function signatures a contract promises to implement. SIP-010 is
        the Stacks fungible-token standard, the shape wallets and exchanges expect.
      </P>
      <P>
        mark the struct with <Code>#[impl_trait("...")]</Code> and clarinet checks that every
        function matches the trait exactly:
      </P>
      <CodeBlock lang="rust" code={SIP_IMPL} />
      <P>
        the trait fixes the shape of each function, down to the optional memo on transfer, and
        clarust emits it verbatim:
      </P>
      <CodeBlock lang="rust" code={SIP_TRANSFER} />
      <Callout>
        a contract that implements a trait needs the trait contract present to verify. the full
        token is in the <Link href="/examples/token">examples</Link>.
      </Callout>
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
