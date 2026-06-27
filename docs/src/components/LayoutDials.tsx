import { useEffect } from "react"
import { useDialKit } from "dialkit"

// live controls for the page layout. writes each value onto :root as a css
// variable, so the existing var-driven styles pick it up with no prop drilling.
export function LayoutDials() {
  const p = useDialKit("Layout", {
    containerWidth: [1410, 900, 1600],
    contentWidth: [900, 480, 1100],
    sidebarWidth: [280, 180, 360],
    tocWidth: [210, 160, 320],
    mainPaddingX: [24, 0, 96],
    heroSideBySide: true,
    codeFontSize: [11.8, 10, 16],
    codeGap: [12, 0, 32],
  })

  useEffect(() => {
    const r = document.documentElement.style
    r.setProperty("--container-w", `${p.containerWidth}px`)
    r.setProperty("--content-w", `${p.contentWidth}px`)
    r.setProperty("--sidebar-w", `${p.sidebarWidth}px`)
    r.setProperty("--toc-w", `${p.tocWidth}px`)
    r.setProperty("--main-px", `${p.mainPaddingX}px`)
    r.setProperty("--hero-cols", p.heroSideBySide ? "2" : "1")
    r.setProperty("--code-size", `${p.codeFontSize}px`)
    r.setProperty("--code-gap", `${p.codeGap}px`)
  }, [p])

  return null
}
