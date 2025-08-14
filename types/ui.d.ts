declare module '@/components/ui/date-time-picker' {
  export interface DateTimePickerProps {
    value: Date;
    onChange: (date: Date) => void;
    className?: string;
  }

  export function DateTimePicker(props: DateTimePickerProps): JSX.Element;
}
