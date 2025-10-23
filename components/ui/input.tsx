import * as React from "react"
import { cn } from "@/lib/utils"

function Input({
                   className,
                   type,
                   value,
                   ...props
               }: Omit<React.ComponentProps<"input">, "value"> & {
    value?: string | number | boolean | { url?: string } | { url?: string }[] | null
}) {
    // Pastikan value selalu dalam tipe yang diterima <input>
    let safeValue: string | number | readonly string[] | undefined

    if (value == null) {
        safeValue = ""
    } else if (typeof value === "boolean") {
        safeValue = value ? "true" : "false"
    } else if (Array.isArray(value)) {
        safeValue = value
            .map((v) =>
                typeof v === "object" && v?.url ? v.url : String(v)
            )
            .join(", ")
    } else if (typeof value === "object") {
        safeValue = JSON.stringify(value)
    } else {
        safeValue = value
    }

    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                className
            )}
            value={safeValue}
            {...props}
        />
    )
}

export { Input }
