const cols = [
  { title: "Docs", links: ["Overview", "Quickstart", "Writing contracts", "Tokens", "Tooling"] },
  { title: "Reference", links: ["clarust-lang", "Macros", "clarinet check", "Conformance"] },
  { title: "Stacks", links: ["Clarity Book", "Clarinet", "Stacks.js", "SIP-010", "Explorer"] },
  { title: "Project", links: ["GitHub", "Issues", "Changelog", "License"] },
]

function FooterLink({ children }: { children: string }) {
  return (
    <a
      href="#"
      className="text-[14px] tracking-[-0.09px] text-grey-1 transition-colors duration-200 ease-out hover:text-ink"
    >
      {children}
    </a>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-ink/[0.06] px-8 pb-16 pt-14">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4">
          {cols.map((c) => (
            <div key={c.title} className="flex flex-col gap-3.5">
              <p className="mb-0.5 font-[var(--font-repro)] text-[14px] font-medium text-accent">
                {c.title}
              </p>
              {c.links.map((l) => (
                <FooterLink key={l}>{l}</FooterLink>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-16 flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 8 12 4l7 4v8l-7 4-7-4z" stroke="#978eff" strokeWidth="2" strokeLinejoin="round" />
            <path d="M9 10.5 12 9l3 1.5M12 9v6" stroke="#978eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-[var(--font-regola)] text-[22px] font-semibold tracking-[-0.5px] text-accent">
            clarust
          </span>
        </div>
        <p className="mt-4 max-w-[760px] text-[13px] leading-[20px] tracking-[-0.09px] text-grey-3">
          clarust lets you write Stacks smart contracts in real Rust and compiles them to Clarity,
          the language Stacks runs. the Rust is type-checked by rustc and the generated Clarity is
          what you read, own, and deploy. clarust is a developer tool, not the Stacks protocol, and
          the contracts you write are transpiled, not run as Rust on chain.
        </p>
      </div>
    </footer>
  )
}
