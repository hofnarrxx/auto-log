import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MaintenanceRecordDetails } from './maintenance-record-details';
import type { MaintenanceRecord } from '../../models';

describe('MaintenanceRecordDetails', () => {
  let fixture: ComponentFixture<MaintenanceRecordDetails>;

  const record: MaintenanceRecord = {
    id: 1,
    vehicleId: 1,
    serviceDate: '2026-01-01',
    title: 'Oil change',
    mileage: 1000,
    category: 'oil_change',
    description: 'Full synthetic',
    cost: 150,
    currency: 'EUR',
    attachments: [
      {
        id: 1,
        fileName: 'invoice.pdf',
        contentType: 'application/pdf',
        sizeBytes: 100,
        url: null,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MaintenanceRecordDetails, TranslateModule.forRoot()],
    });
    fixture = TestBed.createComponent(MaintenanceRecordDetails);
    fixture.componentInstance.record = record;
  });

  it('renders the record fields', () => {
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Oil change');
    expect(text).toContain('invoice.pdf');
  });

  it('hides the open-attachment action unless attachmentsOpenable is set', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.link-btn')).toBeFalsy();
  });

  it('emits attachmentOpened when the open action is used', () => {
    fixture.componentInstance.attachmentsOpenable = true;
    fixture.detectChanges();

    let emitted: unknown = null;
    fixture.componentInstance.attachmentOpened.subscribe((attachment) => (emitted = attachment));

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.link-btn')!.click();

    expect(emitted).toEqual(record.attachments![0]);
  });
});
