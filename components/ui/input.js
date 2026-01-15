import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-white/30 shadow-inner transition-all focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none",
        className
      )}
      {...props}
    />
  )
})

Input.displayName = "Input"
export { Input }
