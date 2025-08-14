'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { es } from 'date-fns/locale';

import { type } from 'os';

export interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  className,
}: DateTimePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            format(value, 'PPP HH:mm', { locale: es })
          ) : (
            <span>Seleccionar fecha y hora</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-slate-700 border-slate-600">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => date && onChange(date)}
          initialFocus
          locale={es}
          className="bg-slate-700 text-white"
        />
        <div className="p-3 border-t border-slate-600">
          <input
            type="time"
            value={format(value, 'HH:mm')}
            onChange={(e) => {
              const [hours, minutes] = e.target.value.split(':');
              const newDate = new Date(value);
              newDate.setHours(parseInt(hours));
              newDate.setMinutes(parseInt(minutes));
              onChange(newDate);
            }}
            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
