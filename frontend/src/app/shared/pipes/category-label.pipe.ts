import { Pipe, PipeTransform } from '@angular/core';
import { getMaintenanceCategoryLabel } from '../utils/maintenance-list.utils';

@Pipe({
  name: 'categoryLabel',
  standalone: true,
})
export class CategoryLabelPipe implements PipeTransform {
  transform(category: string | null | undefined): string {
    if (!category) {
      return '';
    }

    return getMaintenanceCategoryLabel(category);
  }
}
