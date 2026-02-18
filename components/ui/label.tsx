import * as React from "react"
// import * as LabelPrimitive from "@radix-ui/react-label" // Radix is not installed
// import { cva, type VariantProps } from "class-variance-authority"

// Implementing a simple Label without Radix

const Label = React.forwardRef<
    HTMLLabelElement,
    React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
    <label
        ref={ref}
        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ""}`}
        {...props}
    />
))
Label.displayName = "Label" // LabelPrimitive.Root.displayName

export { Label }
