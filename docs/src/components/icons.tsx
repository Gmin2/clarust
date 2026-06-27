import type { SVGProps } from "react"

type P = SVGProps<SVGSVGElement>

const base = (props: P) => ({
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
})

export const Chevron = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 4l4 4-4 4" />
  </svg>
)

export const Caret = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 6l4 4 4-4" />
  </svg>
)

export const ArrowLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="M10 4l-4 4 4 4" />
  </svg>
)

export const Search = (p: P) => (
  <svg {...base(p)}>
    <circle cx="7.2" cy="7.2" r="4.2" />
    <path d="M10.5 10.5L13 13" />
  </svg>
)

export const Info = (p: P) => (
  <svg {...base(p)}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 7.2v3.4M8 5.2v.2" />
  </svg>
)

export const Doc = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="2.5" width="9" height="11" rx="1.6" />
    <path d="M5.8 6h4.4M5.8 8.4h4.4M5.8 10.8h2.6" />
  </svg>
)

export const Grid = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.8" y="2.8" width="4" height="4" rx="1" />
    <rect x="9.2" y="2.8" width="4" height="4" rx="1" />
    <rect x="2.8" y="9.2" width="4" height="4" rx="1" />
    <rect x="9.2" y="9.2" width="4" height="4" rx="1" />
  </svg>
)

export const Layers = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 2.5l5.2 2.8L8 8 2.8 5.3 8 2.5z" />
    <path d="M3 8l5 2.7L13 8M3 10.6l5 2.7 5-2.7" />
  </svg>
)

export const UserIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="8" cy="5.6" r="2.4" />
    <path d="M3.6 13c.6-2.3 2.3-3.4 4.4-3.4s3.8 1.1 4.4 3.4" />
  </svg>
)

export const Tools = (p: P) => (
  <svg {...base(p)}>
    <path d="M9.8 3.2a2.6 2.6 0 00.6 2.8 2.6 2.6 0 002.8.6L9.8 3.2z" />
    <path d="M9.2 6.8L3.4 12.6M5.2 3.4l2 2" />
  </svg>
)

export const Rocket = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 2.5c2.4 1 3.6 3.2 3.4 6.2L8 11 4.6 8.7C4.4 5.7 5.6 3.5 8 2.5z" />
    <circle cx="8" cy="6.4" r="1.1" />
    <path d="M5.6 11.4c-.9.5-1.2 1.6-1.1 2.3 .8.1 1.8-.2 2.3-1.1" />
  </svg>
)

export const Globe = (p: P) => (
  <svg {...base(p)}>
    <circle cx="8" cy="8" r="5.5" />
    <path d="M2.5 8h11M8 2.5c1.6 1.5 2.4 3.5 2.4 5.5S9.6 12 8 13.5C6.4 12 5.6 10 5.6 8S6.4 4 8 2.5z" />
  </svg>
)

export const Shield = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 2.5l4.5 1.8v3.4c0 2.9-1.9 4.7-4.5 5.8-2.6-1.1-4.5-2.9-4.5-5.8V4.3L8 2.5z" />
  </svg>
)

export const Book = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 3.6c1.4-.6 3.4-.6 5 .4 1.6-1 3.6-1 5-.4v8c-1.4-.6-3.4-.6-5 .4-1.6-1-3.6-1-5-.4v-8z" />
    <path d="M8 4v8.4" />
  </svg>
)

export const Coin = (p: P) => (
  <svg {...base(p)}>
    <circle cx="8" cy="8" r="5.5" />
    <path d="M8 5v6M6.4 6.4h2.2a1.3 1.3 0 010 2.6H6.6h2a1.3 1.3 0 010 2.6H6.4" />
  </svg>
)
