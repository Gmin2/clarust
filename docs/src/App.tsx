import { DialRoot } from "dialkit"
import "dialkit/styles.css"
import { TopNav } from "./components/TopNav"
import { Sidebar } from "./components/Sidebar"
import { MainContent } from "./components/MainContent"
import { RightToc } from "./components/RightToc"
import { Footer } from "./components/Footer"
import { CookieBanner } from "./components/CookieBanner"
import { LayoutDials } from "./components/LayoutDials"

export default function App() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <TopNav />
      <div className="mx-auto flex max-w-[var(--container-w)] px-4 lg:px-8">
        <Sidebar />
        <main className="flex min-w-0 flex-1">
          <MainContent />
          <RightToc />
        </main>
      </div>
      <Footer />
      <CookieBanner />
      <LayoutDials />
      <DialRoot position="top-right" />
    </div>
  )
}
