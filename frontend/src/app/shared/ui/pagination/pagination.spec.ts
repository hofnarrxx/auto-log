import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Pagination } from './pagination';

describe('Pagination', () => {
  let fixture: ComponentFixture<Pagination>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Pagination, TranslateModule.forRoot()],
    });

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      common: {
        pagination: {
          showing: 'Showing {{from}}-{{to}} of {{total}}',
        },
      },
    });
    translate.use('en');

    fixture = TestBed.createComponent(Pagination);
  });

  function query<T extends HTMLElement>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector);
  }

  function queryAll<T extends HTMLElement>(selector: string): T[] {
    return Array.from(fixture.nativeElement.querySelectorAll(selector));
  }

  it('renders nothing when there are no pages', () => {
    fixture.componentInstance.page = 0;
    fixture.componentInstance.totalPages = 0;
    fixture.detectChanges();

    expect(query('.pagination')).toBeFalsy();
  });

  it('disables Previous on the first page and Next on the last page', () => {
    fixture.componentInstance.page = 0;
    fixture.componentInstance.totalPages = 3;
    fixture.componentInstance.totalElements = 30;
    fixture.componentInstance.size = 10;
    fixture.detectChanges();

    const buttons = queryAll<HTMLButtonElement>('.pager-btn');
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[buttons.length - 1].disabled).toBe(false);
  });

  it('marks the current page button as active', () => {
    fixture.componentInstance.page = 1;
    fixture.componentInstance.totalPages = 3;
    fixture.componentInstance.totalElements = 30;
    fixture.componentInstance.size = 10;
    fixture.detectChanges();

    const active = query<HTMLButtonElement>('.pager-number.active');
    expect(active?.textContent?.trim()).toBe('2');
  });

  it('emits pageChange when a page number is clicked', () => {
    fixture.componentInstance.page = 0;
    fixture.componentInstance.totalPages = 3;
    fixture.componentInstance.totalElements = 30;
    fixture.componentInstance.size = 10;
    fixture.detectChanges();

    const emitted: number[] = [];
    fixture.componentInstance.pageChange.subscribe((page) => emitted.push(page));

    const numberButtons = queryAll<HTMLButtonElement>('.pager-number');
    numberButtons[numberButtons.length - 1].click();

    expect(emitted).toEqual([2]);
  });

  it('emits pageChange when Next is clicked', () => {
    fixture.componentInstance.page = 0;
    fixture.componentInstance.totalPages = 3;
    fixture.componentInstance.totalElements = 30;
    fixture.componentInstance.size = 10;
    fixture.detectChanges();

    const emitted: number[] = [];
    fixture.componentInstance.pageChange.subscribe((page) => emitted.push(page));

    const buttons = queryAll<HTMLButtonElement>('.pager-btn');
    buttons[buttons.length - 1].click();

    expect(emitted).toEqual([1]);
  });

  it('shows the "Showing X-Y of Z" readout', () => {
    fixture.componentInstance.page = 1;
    fixture.componentInstance.totalPages = 3;
    fixture.componentInstance.totalElements = 25;
    fixture.componentInstance.size = 10;
    fixture.detectChanges();

    const text = query('.pagination-info')?.textContent ?? '';
    expect(text).toContain('11');
    expect(text).toContain('20');
    expect(text).toContain('25');
  });

  it('emits sizeChange when the page-size select changes', () => {
    fixture.componentInstance.page = 0;
    fixture.componentInstance.totalPages = 3;
    fixture.componentInstance.totalElements = 30;
    fixture.componentInstance.size = 10;
    fixture.componentInstance.pageSizeOptions = [10, 20, 50];
    fixture.detectChanges();

    const emitted: number[] = [];
    fixture.componentInstance.sizeChange.subscribe((size) => emitted.push(size));

    const select = query<HTMLSelectElement>('.pagination-size select')!;
    select.value = '20';
    select.dispatchEvent(new Event('change'));

    expect(emitted).toEqual([20]);
  });
});
