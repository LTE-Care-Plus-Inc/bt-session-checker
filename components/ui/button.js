import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl font-medium transition-all focus:outline-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      size: {
        default: "h-11 px-6 text-sm",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-base",
      },
    },
    defaultVariants: { size: "default" },
  }
)

const Button = React.forwardRef(
  ({ className, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        className={cn(
          buttonVariants({ size }),
          "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_40px_-12px_rgba(34,211,238,0.9)] hover:shadow-[0_0_70px_-14px_rgba(59,130,246,0.95)]",
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"
export { Button }
