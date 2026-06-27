import { Fragment, type ReactNode } from "react"

const KEYWORDS = new Set([
  "pub", "fn", "impl", "struct", "let", "return", "use", "if", "else", "self", "mut", "const",
  // clarity special forms
  "define-public", "define-read-only", "define-private", "define-data-var", "define-map",
  "define-fungible-token", "define-non-fungible-token", "define-constant", "define-trait",
  "impl-trait", "begin", "ok", "err", "some", "none", "asserts!", "try!", "var-get", "var-set",
  "map-get?", "map-set", "map-insert", "map-delete", "default-to", "is-eq", "ft-transfer?",
  "ft-mint?", "ft-get-balance", "ft-get-supply", "nft-mint?", "nft-transfer?", "nft-get-owner?",
  "tx-sender",
])

const TYPES = new Set([
  "Uint", "Int", "Principal", "Response", "DataVar", "Map", "FungibleToken", "NonFungibleToken",
  "Buff", "Option", "StringAscii", "StringUtf8", "bool", "uint", "int", "principal", "response",
  "optional", "buff", "string-ascii", "string-utf8",
])

const TOKEN = /(\/\/[^\n]*|;;[^\n]*)|("(?:[^"\\]|\\.)*")|(#\[[^\]]*\])|([A-Za-z_][A-Za-z0-9_!?-]*)|(\d+)/g

function colorFor(word: string): string | null {
  if (KEYWORDS.has(word)) return "var(--tok-kw)"
  if (TYPES.has(word)) return "var(--tok-type)"
  return null
}

function highlightLine(line: string, key: number): ReactNode {
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  TOKEN.lastIndex = 0
  let i = 0
  while ((m = TOKEN.exec(line)) !== null) {
    if (m.index > last) out.push(<Fragment key={`${key}-p${i++}`}>{line.slice(last, m.index)}</Fragment>)
    const [text, comment, str, attr, ident, num] = m
    let color: string | null = null
    if (comment) color = "var(--tok-comment)"
    else if (str) color = "var(--tok-str)"
    else if (attr) color = "var(--tok-attr)"
    else if (num) color = "var(--tok-num)"
    else if (ident) color = colorFor(ident)
    out.push(
      color ? (
        <span key={`${key}-t${i++}`} style={{ color }}>{text}</span>
      ) : (
        <Fragment key={`${key}-t${i++}`}>{text}</Fragment>
      ),
    )
    last = m.index + text.length
  }
  if (last < line.length) out.push(<Fragment key={`${key}-e`}>{line.slice(last)}</Fragment>)
  return out
}

export function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const lines = code.replace(/\n$/, "").split("\n")
  return (
    <div className="overflow-hidden rounded-xl border border-ink/[0.07] bg-[#fcfbfb]">
      <div className="flex items-center justify-between border-b border-ink/[0.06] px-4 py-2.5">
        <span className="font-[var(--font-mono)] text-[12px] tracking-[-0.09px] text-grey-2">{lang}</span>
        <span className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-grey-4/50" />
          <span className="h-2 w-2 rounded-full bg-grey-4/50" />
          <span className="h-2 w-2 rounded-full bg-grey-4/50" />
        </span>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-[var(--font-mono)] text-[length:var(--code-size)] leading-[1.6] text-ink">
        <code>
          {lines.map((ln, idx) => (
            <div key={idx}>{ln.length ? highlightLine(ln, idx) : " "}</div>
          ))}
        </code>
      </pre>
    </div>
  )
}

export function CodeCompare({
  rust,
  clarity,
  rustName = "counter.rs",
  clarityName = "counter.clar",
}: {
  rust: string
  clarity: string
  rustName?: string
  clarityName?: string
}) {
  return (
    <div
      className="grid"
      style={{
        gap: "var(--code-gap)",
        gridTemplateColumns: "repeat(var(--hero-cols), minmax(0, 1fr))",
      }}
    >
      <CodeBlock lang={rustName} code={rust} />
      <CodeBlock lang={clarityName} code={clarity} />
    </div>
  )
}
