import { useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { TopNav } from "./components/TopNav"
import { Sidebar } from "./components/Sidebar"
import { Footer } from "./components/Footer"
import { Search } from "./components/Search"

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
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <div className="min-h-screen bg-white text-ink">
      <ScrollManager />
      <TopNav onOpenSearch={() => setSearchOpen(true)} />
      <div className="mx-auto flex max-w-[var(--container-w)] px-4 lg:px-8">
        <Sidebar />
        <main className="flex min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
      <Footer />
      <Search open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
