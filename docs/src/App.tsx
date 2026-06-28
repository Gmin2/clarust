import { Routes, Route } from "react-router-dom"
import { Layout } from "./Layout"
import { Overview } from "./pages/Overview"
import { GettingStarted } from "./pages/GettingStarted"
import { DocPage } from "./pages/DocPage"
import { Example } from "./pages/Example"

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="getting-started" element={<GettingStarted />} />
        <Route path="examples/:slug" element={<Example />} />
        <Route path=":slug" element={<DocPage />} />
      </Route>
    </Routes>
  )
}
