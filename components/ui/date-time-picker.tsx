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

export interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  error?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  className,
  minDate,
  maxDate,
  error,
  disabled = false,
}: DateTimePickerProps) {
  // Asegurar que value es una fecha válida
  const safeValue = React.useMemo(() => {
    const date = value instanceof Date ? value : new Date();
    return isNaN(date.getTime()) ? new Date() : date;
  }, [value]);

  // Formatear la hora para el input time
  const timeValue = React.useMemo(() => {
    try {
      return format(safeValue, 'HH:mm');
    } catch (e) {
      return '00:00';
    }
  }, [safeValue]);

  // Manejar cambio de hora
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    try {
      const [hours, minutes] = e.target.value.split(':');
      const newDate = new Date(safeValue);
      newDate.setHours(parseInt(hours));
      newDate.setMinutes(parseInt(minutes));
      if (!isNaN(newDate.getTime())) {
        onChange(newDate);
      }
    } catch (e) {
      console.error('Error al cambiar la hora:', e);
    }
  };

  return (
    <div className="space-y-1">
      <Popover>
        <PopoverTrigger asChild disabled={disabled}>
          <Button
            variant={'outline'}
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600',
              error && 'border-red-500',
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {safeValue ? (
              format(safeValue, 'PPP HH:mm', { locale: es })
            ) : (
              <span>Seleccionar fecha y hora</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-slate-700 border-slate-600">
          <Calendar
            mode="single"
            selected={safeValue}
            onSelect={(date) => !disabled && date && onChange(date)}
            initialFocus
            locale={es}
            fromDate={minDate}
            toDate={maxDate}
            className="bg-slate-700 text-white"
            disabled={disabled}
          />
          <div className="p-3 border-t border-slate-600">
            <input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              disabled={disabled}
              className={cn(
                "w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white",
                error && "border-red-500",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            />
          </div>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}