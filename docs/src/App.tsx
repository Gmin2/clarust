import { Routes, Route } from "react-router-dom"
import { Layout } from "./Layout"
import { Overview } from "./pages/Overview"
import { Example } from "./pages/Example"

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="examples/:slug" element={<Example />} />
      </Route>
    </Routes>
  )
}
