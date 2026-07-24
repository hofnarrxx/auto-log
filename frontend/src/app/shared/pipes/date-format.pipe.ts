import { Pipe, PipeTransform } from '@angular/core';
import { formatAppDate, formatAppDateTime } from '../utils/date-format.utils';

export type DateFormatMode = 'date' | 'datetime';

@Pipe({
  name: 'dateFormat',
  standalone: true,
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string | null | undefined, mode: DateFormatMode = 'date'): string {
    return mode === 'datetime' ? formatAppDateTime(value) : formatAppDate(value);
  }
}
