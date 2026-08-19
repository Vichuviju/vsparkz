import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-full capitalize!",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  tooltip,
  tooltipProps,
  children,
  ...props
}) {
  const content = (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );

  const fallbackTooltip =
    typeof children === "string" || typeof children === "number"
      ? String(children)
      : undefined;
  const tooltipText = tooltip ?? fallbackTooltip;

  if (!tooltipText) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent {...tooltipProps}>{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { Badge, badgeVariants }
