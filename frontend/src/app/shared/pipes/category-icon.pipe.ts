import { Pipe, PipeTransform } from '@angular/core';
import { getMaintenanceCategoryIcon } from '../utils/maintenance-list.utils';

@Pipe({
  name: 'categoryIcon',
  standalone: true,
})
export class CategoryIconPipe implements PipeTransform {
  transform(category: string | null | undefined): string {
    if (!category) {
      return 'tool-case';
    }

    return getMaintenanceCategoryIcon(category);
  }
}
