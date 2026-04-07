import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 w-full", className)}
      classNames={{
        months: "flex flex-col space-y-4",
        month: "space-y-3",
        caption: "flex justify-between items-center mb-4 px-1",
        caption_label: "text-sm font-semibold text-[#1f2a44]",
        nav: "flex gap-1",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 p-0 opacity-70 hover:opacity-100 hover:bg-[#f3f6fc]",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "grid grid-cols-7 mb-2 gap-1",
        head_cell: "text-[#6b7280] text-xs font-semibold w-full text-center py-2",
        row: "grid grid-cols-7 gap-1 mb-1",
        cell: "w-full text-center",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-full p-0 font-normal text-sm text-[#1f2a44] hover:bg-[#f0f4f9] rounded-md",
        ),
        day_range_end: "day-range-end",
        day_selected: "bg-[#0073ea] text-white hover:bg-[#0060c0] font-semibold rounded-md",
        day_today: "font-semibold text-[#0073ea] bg-[#f0f4f9]",
        day_outside: "text-[#d1d5db] opacity-50",
        day_disabled: "text-[#d1d5db] opacity-30",
        day_range_middle: "bg-[#f0f4f9]",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
