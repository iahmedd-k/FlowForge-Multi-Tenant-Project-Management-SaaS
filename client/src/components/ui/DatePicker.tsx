import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (date: string) => void;
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value, onChange, className, ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
      value ? new Date(value) : undefined
    );

    const handleDateSelect = (date: Date | undefined) => {
      if (date) {
        const isoString = date.toISOString().split("T")[0];
        setSelectedDate(date);
        onChange?.(isoString);
        setOpen(false);
      }
    };

    const displayDate = selectedDate
      ? selectedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Pick a date";

    return (
      <div className="relative w-full">
        <input
          type="hidden"
          ref={ref}
          value={value || ""}
          {...props}
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200 flex items-center justify-between transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
            className
          )}
          disabled={props.disabled}
        >
          <span>{displayDate}</span>
          <CalendarIcon className="h-4 w-4 opacity-50" />
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg p-3 z-50">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
              initialFocus
            />
          </div>
        )}
        {open && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)} 
          />
        )}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

export { DatePicker };
