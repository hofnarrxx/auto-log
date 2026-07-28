import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { FuelRecordDetails } from './fuel-record-details';
import type { FuelRecord } from '../../models';

describe('FuelRecordDetails', () => {
  let fixture: ComponentFixture<FuelRecordDetails>;

  const record: FuelRecord = {
    id: 1,
    vehicleId: 1,
    date: '2026-01-01',
    mileage: 1000,
    cost: 200,
    amount: 40,
    gasStation: 'Shell',
    currency: 'EUR',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FuelRecordDetails, TranslateModule.forRoot()],
    });
    fixture = TestBed.createComponent(FuelRecordDetails);
    fixture.componentInstance.record = record;
  });

  it('renders the record fields', () => {
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Shell');
  });

  it('shows the mileage warning when flagged', () => {
    fixture.componentInstance.hasMileageWarning = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.detail-warning')).toBeTruthy();
  });

  it('hides the mileage warning by default', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.detail-warning')).toBeFalsy();
  });
});
