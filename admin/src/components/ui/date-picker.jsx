"use client";

import * as React from "react";
import { format, isValid, parse } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ISO_DATE = "yyyy-MM-dd";

function parseIsoDate(value) {
  if (value == null || String(value).trim() === "") return undefined;
  const d = parse(String(value).trim(), ISO_DATE, new Date());
  return isValid(d) ? d : undefined;
}

/**
 * Calendar popover bound to an ISO `yyyy-MM-dd` string (empty = no date).
 * Works with react-hook-form via `value`, `onChange`, `onBlur`, `ref`.
 */
export const DatePicker = React.forwardRef(function DatePicker(
  {
    className,
    value,
    onChange,
    onBlur,
    id,
    name,
    disabled,
    placeholder = "Pick a date",
    invalid,
    ...props
  },
  ref
) {
  const selected = React.useMemo(() => parseIsoDate(value), [value]);
  const [open, setOpen] = React.useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onBlur?.();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          type="button"
          variant="outline"
          id={id}
          name={name}
          disabled={disabled}
          aria-invalid={invalid ? true : undefined}
          data-empty={!selected}
          className={cn(
            "h-9 w-full justify-start px-3 text-left font-normal shadow-sm",
            "data-[empty=true]:text-muted-foreground",
            invalid && "border-red-500 focus-visible:ring-red-200",
            className
          )}
          {...props}
        >
          <CalendarIcon className="size-4 shrink-0 opacity-70" />
          {selected ? (
            format(selected, "PPP")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? new Date()}
          onSelect={(date) => {
            onChange?.(date ? format(date, ISO_DATE) : "");
            setOpen(false);
          }}
          initialFocus
        />
        {selected ? (
          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full text-muted-foreground"
              onClick={() => {
                onChange?.("");
                setOpen(false);
              }}
            >
              Clear date
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
});

DatePicker.displayName = "DatePicker";
