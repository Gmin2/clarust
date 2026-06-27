# clarust

write a Stacks smart contract in real Rust, compile it to Clarity.

you write a normal `.rs` file against the `clarust-lang` crate, so rustc type-checks
it and rust-analyzer gives you autocomplete, exactly like writing an Anchor program
for Solana. clarust reads that same file and emits readable, auditable Clarity that
you deploy. think Anchor, but the artifact is Clarity instead of a BPF program.

## why

Clarity is the wall new Stacks devs hit: lisp-shaped, decidable, its own type system.
the tooling around it is good, but the language itself is the onboarding cost. clarust
lets you write in Rust, which you already know, and produces the Clarity for you, the
Clarity stays the thing you read, own, and deploy. it is an on-ramp into Clarity, not
a way to avoid it.

## what a contract looks like

```rust
use clarust_lang::prelude::*;

#[contract]
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
}
```

that compiles under rustc. struct fields are storage, impl methods are functions,
`self.count.get()` is `var-get`. clarust turns it into:

```clarity
(define-data-var count uint u0)

(define-public (increment (step uint))
  (let ((new-count (+ (var-get count) step)))
    (begin
      (var-set count new-count)
      (ok new-count))))

(define-read-only (get-count)
  (var-get count))
```

## the workspace

```
crates/clarust          the compiler: the IR, the clarity emitter, the rust frontend, the cli
crates/clarust-lang     real rust types you write contracts against (Uint, DataVar, Map, Response, ...)
crates/clarust-macros   the #[contract] / #[public] / #[readonly] attribute macros
contracts/              example contracts, each a real crate that compiles under rustc
conformance/            the test gate
```

it is a cargo workspace: `crates/*` are the toolchain, `contracts/*` are example
contracts that depend on `clarust-lang`.

the compiler is split at a narrow waist: the rust frontend turns source into a
clarity-shaped IR, and the orchestrator turns the IR into clarity, owns the teaching
comments, and maps diagnostics back to your source. the `Frontend` trait is still the
seam, so another language could be added later, but real Rust is what ships.

## try it

```
CARGO_HOME="$PWD/.cargo-home" cargo build --release

# transpile a contract to clarity, with teaching comments
./target/release/clarust contracts/counter/src/lib.rs

# run clarinet on it; errors point back at your rust source line
./target/release/clarust contracts/counter/src/lib.rs --check

# the whole gate: every contract compiles under rustc, matches its golden, passes clarinet
bash conformance/run.sh
```

## what works today

contracts: counter, ledger, vault (guarded withdraw), coin (fungible token), nft
(non-fungible token), gate (branching), and token, a full SIP-010 fungible token that
implements the trait and passes clarinet trait conformance. each compiles under rustc
and transpiles to clarinet-clean Clarity.

supported in contract bodies: data vars, maps, fungible and non-fungible tokens, trait
conformance via `#[impl_trait(...)]`, constants, public/read-only/private functions,
arithmetic, comparisons, if/else, asserts guards, `tx_sender()`, the token and map
builtins, `Optional` via Rust's `Option`, and sized buffers (`Buff<34>`).

`--check` runs clarinet and rewrites each diagnostic from the generated-clarity line
back to the line in your `.rs`.

## honest gaps

- the Rust you write does not run on Stacks, it is transpiled. so rustc accepting your
  code is necessary but not sufficient: a `for` loop or a `HashMap` compiles in Rust
  but clarust rejects it, because Clarity has no such thing. the frontend errors
  clearly instead of emitting something broken.
- a contract that implements a trait needs the trait contract present to verify, so
  `--check` (which scaffolds a solo project) wont resolve it; the conformance runner
  sets up the dependency. see `contracts/token`.
- `--check` maps to the source line but reuses clarinet's column, so columns can be off.
