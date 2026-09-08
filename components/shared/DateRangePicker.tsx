"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type SingleProps = {
  mode: "single";
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
};

type RangeProps = {
  mode: "range";
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
};

type Props = (SingleProps | RangeProps) & {
  numberOfMonths?: number;
  placeholder?: string;
  // range 모드에서 from/to 둘 다 선택되면 팝오버 자동으로 닫을지
  closeOnComplete?: boolean;
};

export function DateRangePicker(props: Props) {
  const {
    numberOfMonths = 1,
    placeholder = "날짜 선택",
    closeOnComplete = true,
  } = props;
  const [open, setOpen] = useState(false);

  const label =
    props.mode === "single"
      ? props.value
        ? format(props.value, "yyyy.MM.dd", { locale: ko })
        : null
      : props.value?.from
        ? props.value.to
          ? `${format(props.value.from, "yyyy.MM.dd", { locale: ko })} ~ ${format(
              props.value.to,
              "yyyy.MM.dd",
              { locale: ko },
            )}`
          : format(props.value.from, "yyyy.MM.dd", { locale: ko })
        : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-start text-left font-normal min-w-[240px]"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label ?? (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {props.mode === "single" ? (
          <Calendar
            mode="single"
            selected={props.value}
            onSelect={(date) => {
              props.onChange(date);
              setOpen(false); // 단일 선택은 고르는 즉시 닫아도 자연스러움
            }}
            locale={ko}
            numberOfMonths={numberOfMonths}
          />
        ) : (
          <Calendar
            mode="range"
            selected={props.value}
            onSelect={(range) => {
              props.onChange(range);
              if (closeOnComplete && range?.from && range?.to) {
                setOpen(false);
              }
            }}
            locale={ko}
            numberOfMonths={numberOfMonths}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
