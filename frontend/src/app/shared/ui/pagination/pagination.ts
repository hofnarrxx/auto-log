import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { type PageNumberEntry, buildPageNumbers } from '../../utils/pagination.utils';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * Generic numbered pager for server-side paginated lists: Prev/Next, a windowed set of page
 * buttons with ellipsis, a page-size selector, and a "Showing X-Y of Z" readout. Purely
 * presentational — the parent owns the page/size state and reacts to `pageChange`/`sizeChange`.
 */
@Component({
  selector: 'app-pagination',
  imports: [CommonModule, TranslateModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  private readonly _page = signal(0);
  private readonly _totalPages = signal(0);
  private readonly _totalElements = signal(0);
  private readonly _size = signal(DEFAULT_PAGE_SIZE_OPTIONS[1]);
  private readonly _pageSizeOptions = signal<number[]>(DEFAULT_PAGE_SIZE_OPTIONS);

  @Input()
  set page(value: number) {
    this._page.set(value ?? 0);
  }

  @Input()
  set totalPages(value: number) {
    this._totalPages.set(value ?? 0);
  }

  @Input()
  set totalElements(value: number) {
    this._totalElements.set(value ?? 0);
  }

  @Input()
  set size(value: number) {
    this._size.set(value || DEFAULT_PAGE_SIZE_OPTIONS[1]);
  }

  @Input()
  set pageSizeOptions(value: number[]) {
    this._pageSizeOptions.set(value?.length ? value : DEFAULT_PAGE_SIZE_OPTIONS);
  }

  @Output() pageChange = new EventEmitter<number>();
  @Output() sizeChange = new EventEmitter<number>();

  protected readonly currentPage = this._page.asReadonly();
  protected readonly totalPagesValue = this._totalPages.asReadonly();
  protected readonly totalElementsValue = this._totalElements.asReadonly();
  protected readonly sizeValue = this._size.asReadonly();
  protected readonly pageSizeOptionsValue = this._pageSizeOptions.asReadonly();

  protected readonly pageNumbers = computed<PageNumberEntry[]>(() =>
    buildPageNumbers(this._page(), this._totalPages())
  );
  protected readonly isFirstPage = computed(() => this._page() <= 0);
  protected readonly isLastPage = computed(() => this._page() >= this._totalPages() - 1);
  protected readonly rangeStart = computed(() =>
    this._totalElements() === 0 ? 0 : this._page() * this._size() + 1
  );
  protected readonly rangeEnd = computed(() =>
    Math.min(this._totalElements(), (this._page() + 1) * this._size())
  );

  protected goToPage(target: number) {
    if (target === this._page() || target < 0 || target >= this._totalPages()) {
      return;
    }

    this.pageChange.emit(target);
  }

  protected goToPrevious() {
    this.goToPage(this._page() - 1);
  }

  protected goToNext() {
    this.goToPage(this._page() + 1);
  }

  protected onSizeChange(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    if (!Number.isNaN(value) && value > 0 && value !== this._size()) {
      this.sizeChange.emit(value);
    }
  }
}
