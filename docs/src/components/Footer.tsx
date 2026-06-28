const REPO = "https://github.com/Gmin2/clarust"

export function Footer() {
  return (
    <footer className="border-t border-ink/[0.06] px-8 py-6">
      <div className="mx-auto flex max-w-[var(--container-w)] items-center justify-between">
        <div className="flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 8 12 4l7 4v8l-7 4-7-4z" stroke="#978eff" strokeWidth="2" strokeLinejoin="round" />
            <path d="M9 10.5 12 9l3 1.5M12 9v6" stroke="#978eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-[var(--font-regola)] text-[15px] font-semibold tracking-[-0.3px] text-grey-2">
            clarust
          </span>
        </div>
        <a
          href={REPO}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-[13px] text-grey-2 transition-colors duration-200 ease-out hover:text-ink"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M8 .2a8 8 0 00-2.5 15.6c.4.07.55-.17.55-.38v-1.3c-2.2.48-2.67-1.07-2.67-1.07-.36-.92-.88-1.16-.88-1.16-.72-.49.05-.48.05-.48.8.056 1.22.82 1.22.82.71 1.2 1.86.86 2.31.66.07-.51.28-.86.5-1.06-1.76-.2-3.6-.88-3.6-3.9 0-.86.3-1.57.82-2.12-.08-.2-.36-1 .08-2.1 0 0 .67-.21 2.2.81a7.6 7.6 0 014 0c1.52-1.02 2.19-.81 2.19-.81.44 1.1.16 1.9.08 2.1.51.55.82 1.26.82 2.12 0 3.03-1.85 3.7-3.61 3.89.29.24.54.72.54 1.46v2.16c0 .21.15.46.55.38A8 8 0 008 .2z" />
          </svg>
          GitHub
        </a>
      </div>
    </footer>
  )
}
