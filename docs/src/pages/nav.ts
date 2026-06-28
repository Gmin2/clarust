export type PageMeta = { slug: string; title: string; group: string }

// ordered list of doc pages. drives the sidebar grouping and prev/next.
// the examples live in their own section (see examples.ts) after these.
export const pages: PageMeta[] = [
  { slug: "", title: "Overview", group: "Introduction" },
  { slug: "getting-started", title: "Getting Started", group: "Introduction" },
  { slug: "storage", title: "Storage", group: "Writing contracts" },
  { slug: "functions", title: "Functions", group: "Writing contracts" },
  { slug: "types", title: "Types", group: "Writing contracts" },
  { slug: "control-flow", title: "Control flow", group: "Writing contracts" },
  { slug: "tokens", title: "Tokens", group: "Tokens" },
  { slug: "sip-010", title: "SIP-010 trait", group: "Tokens" },
  { slug: "verifying", title: "Verifying", group: "Tooling" },
  { slug: "limits", title: "What doesn't map", group: "Tooling" },
]

export function pageHref(slug: string): string {
  return slug ? `/${slug}` : "/"
}

export function pageNav(slug: string): { prev?: PageMeta; next?: PageMeta } {
  const i = pages.findIndex((p) => p.slug === slug)
  if (i === -1) return {}
  return { prev: pages[i - 1], next: pages[i + 1] }
}
