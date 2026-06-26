# conformance

the gate that keeps the compiler honest. run it:

```
bash conformance/run.sh
```

for every contract under `contracts/`, it checks three things:

1. **rustc** - the contract compiles as real Rust against `clarust-lang`
2. **golden** - clarust transpiles it to the frozen `expected.clar` (comments ignored)
3. **clarinet** - the generated clarity passes `clarinet check`

a failure in any of the three exits non-zero. the goldens are frozen snapshots; if a
change to the compiler shifts the output, regenerate with
`clarust contracts/<name>/src/lib.rs --plain` and review the diff before committing.

why all three: rustc proves the contract is real Rust, clarinet proves the output is
valid Clarity, and the golden proves it is the *right* Clarity. a contract can compile
and pass clarinet and still be the wrong contract, the golden catches that.
