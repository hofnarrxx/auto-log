import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { Fuel, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { FuelList, type FuelQueryChange } from './fuel-list';
import type { FuelListRecord } from '../../../../shared/utils/fuel-list.utils';

const RECORD: FuelListRecord = {
  id: 1,
  date: '2026-01-01',
  mileage: 1000,
  cost: 200,
  amount: 40,
  gasStation: 'Shell',
  currency: 'PLN',
};

describe('FuelList', () => {
  let fixture: ComponentFixture<FuelList<FuelListRecord>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FuelList, TranslateModule.forRoot()],
      providers: [
        { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Fuel }) },
      ],
    });
    fixture = TestBed.createComponent(FuelList<FuelListRecord>);
    fixture.componentInstance.records = [RECORD];
    fixture.componentInstance.totalRecords = 1;
    fixture.componentInstance.totalElements = 1;
  });

  it('renders the given records', () => {
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Shell');
  });

  it('shows the "no records" empty state when there are none at all', () => {
    fixture.componentInstance.records = [];
    fixture.componentInstance.totalRecords = 0;
    fixture.componentInstance.totalElements = 0;
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('vehicle.fuelTab.empty.none');
  });

  it('shows the "filtered to nothing" empty state when records exist but the page is empty', () => {
    fixture.componentInstance.records = [];
    fixture.componentInstance.totalRecords = 5;
    fixture.componentInstance.totalElements = 0;
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('vehicle.fuelTab.empty.filtered');
  });

  it('debounces the gas-station search before emitting queryChange', async () => {
    fixture.detectChanges();

    const emitted: FuelQueryChange[] = [];
    fixture.componentInstance.queryChange.subscribe((change) => emitted.push(change));

    const input = fixture.nativeElement.querySelector('input[type="text"]') as HTMLInputElement;
    input.value = 'Sh';
    input.dispatchEvent(new Event('input'));
    await new Promise((resolve) => setTimeout(resolve, 100));
    input.value = 'Shell';
    input.dispatchEvent(new Event('input'));

    expect(emitted.length).toBe(0);

    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(emitted).toEqual([{ gasStation: 'Shell', sort: 'newest' }]);
  });

  it('emits queryChange immediately when the sort changes', () => {
    fixture.detectChanges();

    const emitted: FuelQueryChange[] = [];
    fixture.componentInstance.queryChange.subscribe((change) => emitted.push(change));

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'price-low-high';
    select.dispatchEvent(new Event('change'));

    expect(emitted).toEqual([{ gasStation: '', sort: 'price-low-high' }]);
  });

  it('emits pageChange and sizeChange from the pager', () => {
    fixture.componentInstance.totalPages = 3;
    fixture.componentInstance.totalElements = 30;
    fixture.componentInstance.size = 10;
    fixture.detectChanges();

    const pages: number[] = [];
    const sizes: number[] = [];
    fixture.componentInstance.pageChange.subscribe((page) => pages.push(page));
    fixture.componentInstance.sizeChange.subscribe((size) => sizes.push(size));

    fixture.nativeElement
      .querySelectorAll('.pager-number')[1]
      .dispatchEvent(new Event('click', { bubbles: true }));
    expect(pages).toEqual([1]);

    const sizeSelect = fixture.nativeElement.querySelector(
      '.pagination-size select'
    ) as HTMLSelectElement;
    sizeSelect.value = '20';
    sizeSelect.dispatchEvent(new Event('change'));
    expect(sizes).toEqual([20]);
  });

  it('marks records with a mileage warning', () => {
    fixture.componentInstance.mileageWarningRecordIds = new Set([RECORD.id]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.entry-warning-side')).toBeTruthy();
  });

  it('emits recordSelected and addRequested', () => {
    fixture.componentInstance.showAddButton = true;
    fixture.detectChanges();

    const selected: FuelListRecord[] = [];
    fixture.componentInstance.recordSelected.subscribe((record) => selected.push(record));
    let addRequestedCount = 0;
    fixture.componentInstance.addRequested.subscribe(() => addRequestedCount++);

    (fixture.nativeElement.querySelector('.timeline-item') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('.add-record-btn') as HTMLButtonElement).click();

    expect(selected).toEqual([RECORD]);
    expect(addRequestedCount).toBe(1);
  });
});
