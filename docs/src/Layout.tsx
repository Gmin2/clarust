import { useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { TopNav } from "./components/TopNav"
import { Sidebar } from "./components/Sidebar"
import { Footer } from "./components/Footer"
import { CookieBanner } from "./components/CookieBanner"

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: "smooth" })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export function Layout() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <ScrollManager />
      <TopNav />
      <div className="mx-auto flex max-w-[var(--container-w)] px-4 lg:px-8">
        <Sidebar />
        <main className="flex min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
      <Footer />
      <CookieBanner />
    </div>
  )
}
