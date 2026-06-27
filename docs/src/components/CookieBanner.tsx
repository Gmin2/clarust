import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"

export function CookieBanner() {
  const [open, setOpen] = useState(true)
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: [0.44, 0, 0.56, 1] }}
          className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white p-6 shadow-[rgba(0,0,0,0.05)_0px_6px_20px_0px,rgba(0,0,0,0.06)_0px_0px_0px_1px]"
        >
          <p className="text-[15px] leading-[21px] tracking-[-0.09px] text-grey-1">
            this is a demo docs site for clarust. it does not collect anything, the banner is just
            part of the template.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setOpen(false)}
              className="rounded-full bg-[#1a1a1a] px-5 py-2 text-[14px] font-medium text-white transition-opacity duration-200 ease-out hover:opacity-80"
            >
              Got it
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
