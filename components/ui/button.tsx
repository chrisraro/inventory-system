import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 state-layer touch-manipulation gap-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-elevation-2",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-elevation-2",
        outline:
          "border border-outline bg-background hover:bg-surface-container-high hover:text-accent-foreground shadow-elevation-1",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-elevation-2",
        ghost: "hover:bg-surface-container-high hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        filled: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-elevation-2",
        tonal: "bg-surface-container-high text-primary hover:bg-surface-container-highest shadow-elevation-1",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-elevation-2",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-elevation-2",
        info: "bg-info text-info-foreground hover:bg-info/90 shadow-elevation-2",
      },
      size: {
        default: "h-10 px-4 py-2 min-h-[44px]",
        sm: "h-9 rounded-lg px-3 min-h-[36px]",
        lg: "h-12 rounded-xl px-8 min-h-[48px]",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px] gap-0",
        "icon-sm": "h-8 w-8 min-h-[32px] min-w-[32px] rounded-lg gap-0",
        "icon-lg": "h-12 w-12 min-h-[48px] min-w-[48px] gap-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, leftIcon, rightIcon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    // For icon-only buttons, don't show left/right icons
    const isIconOnly = size === "icon" || size === "icon-sm" || size === "icon-lg"

    return (
      <Comp className={cn(buttonVariants({ variant, size, className }), "relative")} ref={ref} {...props}>
        {children}
        {!isIconOnly && rightIcon && (
          <span className="icon-sm flex-shrink-0 ml-auto absolute right-3">{rightIcon}</span>
        )}
      </Comp>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
