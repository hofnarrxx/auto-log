import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { Cog, Droplet, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { MaintenanceList, type MaintenanceQueryChange } from './maintenance-list';
import type { MaintenanceListRecord } from '../../../../shared/utils/maintenance-list.utils';

const RECORD: MaintenanceListRecord = {
  id: 1,
  serviceDate: '2026-01-01',
  title: 'Oil change',
  mileage: 1000,
  category: 'Oil change',
  cost: 150,
  currency: 'EUR',
};

describe('MaintenanceList', () => {
  let fixture: ComponentFixture<MaintenanceList<MaintenanceListRecord>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MaintenanceList, TranslateModule.forRoot()],
      providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Droplet, Cog }) },
      ],
    });
    fixture = TestBed.createComponent(MaintenanceList<MaintenanceListRecord>);
    fixture.componentInstance.records = [RECORD];
    fixture.componentInstance.totalRecords = 1;
    fixture.componentInstance.totalElements = 1;
  });

  it('renders the given records', () => {
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Oil change');
  });

  it('shows the "no records" empty state when there are none at all', () => {
    fixture.componentInstance.records = [];
    fixture.componentInstance.totalRecords = 0;
    fixture.componentInstance.totalElements = 0;
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('vehicle.maintenanceTab.empty.none');
  });

  it('shows the "filtered to nothing" empty state when records exist but the page is empty', () => {
    fixture.componentInstance.records = [];
    fixture.componentInstance.totalRecords = 5;
    fixture.componentInstance.totalElements = 0;
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('vehicle.maintenanceTab.empty.filtered');
  });

  it('debounces the title search before emitting queryChange', async () => {
    fixture.detectChanges();

    const emitted: MaintenanceQueryChange[] = [];
    fixture.componentInstance.queryChange.subscribe((change) => emitted.push(change));

    const input = fixture.nativeElement.querySelector(
      '.search-control input[type="text"]'
    ) as HTMLInputElement;
    input.value = 'brakes';
    input.dispatchEvent(new Event('input'));

    expect(emitted.length).toBe(0);

    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(emitted.length).toBe(1);
    expect(emitted[0].title).toBe('brakes');
  });

  it('emits queryChange immediately when the sort changes', () => {
    fixture.detectChanges();

    const emitted: MaintenanceQueryChange[] = [];
    fixture.componentInstance.queryChange.subscribe((change) => emitted.push(change));

    const select = fixture.nativeElement.querySelector('.sort-control select') as HTMLSelectElement;
    select.value = 'price-low-high';
    select.dispatchEvent(new Event('change'));

    expect(emitted.length).toBe(1);
    expect(emitted[0].sort).toBe('price-low-high');
  });

  it('never sends an empty categories filter when no categories are known', () => {
    fixture.detectChanges();

    const emitted: MaintenanceQueryChange[] = [];
    fixture.componentInstance.queryChange.subscribe((change) => emitted.push(change));

    (fixture.nativeElement.querySelector('.filter-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.all-option input') as HTMLInputElement).click();

    expect(emitted.length).toBe(1);
    expect(emitted[0].categories).toBeUndefined();
  });

  it('filters by the selected categories once availableCategories is known', () => {
    fixture.componentInstance.availableCategories = ['Repair', 'Oil change'];
    fixture.detectChanges();

    const emitted: MaintenanceQueryChange[] = [];
    fixture.componentInstance.queryChange.subscribe((change) => emitted.push(change));

    (fixture.nativeElement.querySelector('.filter-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    const repairCheckbox = Array.from(
      fixture.nativeElement.querySelectorAll('.category-options input')
    )[0] as HTMLInputElement;
    repairCheckbox.click();

    expect(emitted.length).toBe(1);
    expect(emitted[0].categories).toEqual(['Oil change']);
  });

  it('emits pageChange and sizeChange from the pager', () => {
    fixture.componentInstance.totalPages = 3;
    fixture.componentInstance.totalElements = 30;
    fixture.componentInstance.size = 10;
    fixture.detectChanges();

    const pages: number[] = [];
    fixture.componentInstance.pageChange.subscribe((page) => pages.push(page));

    fixture.nativeElement
      .querySelectorAll('.pager-number')[1]
      .dispatchEvent(new Event('click', { bubbles: true }));

    expect(pages).toEqual([1]);
  });

  it('marks records with a mileage warning', () => {
    fixture.componentInstance.mileageWarningRecordIds = new Set([RECORD.id]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.entry-warning-side')).toBeTruthy();
  });

  it('emits recordSelected and addRequested', () => {
    fixture.componentInstance.showAddButton = true;
    fixture.detectChanges();

    const selected: MaintenanceListRecord[] = [];
    fixture.componentInstance.recordSelected.subscribe((record) => selected.push(record));
    let addRequestedCount = 0;
    fixture.componentInstance.addRequested.subscribe(() => addRequestedCount++);

    (fixture.nativeElement.querySelector('.timeline-item') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('.add-record-btn') as HTMLButtonElement).click();

    expect(selected).toEqual([RECORD]);
    expect(addRequestedCount).toBe(1);
  });
});
