import { format, isValid, parse } from 'date-fns'
import { CalendarIcon, ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const ISO = 'yyyy-MM-dd'

/** Parse a `YYYY-MM-DD` string as a *local* date (new Date('2026-11-14') would be UTC). */
function fromIso(value: string): Date | undefined {
  if (!value) return undefined
  const date = parse(value, ISO, new Date())
  return isValid(date) ? date : undefined
}

interface DatePickerProps {
  id?: string
  /** Selected day as `YYYY-MM-DD`, or '' for none. */
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

/**
 * Styled replacement for `<input type="date">`: a pill button that opens a calendar popover
 * with "Today" and "Clear" shortcuts. Works with the same `YYYY-MM-DD` string the API expects.
 */
export function DatePicker({ id, value, onChange, placeholder = 'Any date', className }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = fromIso(value)
  // Month shown when the popover opens: the selected one, else the current one.
  const [month, setMonth] = useState<Date | undefined>(selected)

  const choose = (date: Date | undefined) => {
    onChange(date ? format(date, ISO) : '')
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setMonth(selected ?? new Date())
        setOpen(next)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          size="pill"
          className={cn('justify-between font-medium', !selected && 'text-muted-foreground', className)}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon data-icon="inline-start" className="text-primary" />
            {selected ? format(selected, 'MMM d, yyyy') : placeholder}
          </span>
          <ChevronDownIcon data-icon="inline-end" className="opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto rounded-2xl p-0 shadow-xl shadow-navy/10">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={choose}
          month={month}
          onMonthChange={setMonth}
          captionLayout="dropdown"
          startMonth={new Date(2020, 0)}
          endMonth={new Date(2035, 11)}
          className="p-3 [--cell-radius:9999px] [--cell-size:--spacing(9)]"
          autoFocus
        />
        <div className="flex items-center justify-between border-t px-3 py-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => choose(undefined)} disabled={!selected}>
            Clear
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => choose(new Date())}>
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
