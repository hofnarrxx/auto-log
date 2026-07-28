import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VehicleImageService } from '../../services/vehicle-image.service';
import { VehicleImagePicker } from './vehicle-image-picker';

describe('VehicleImagePicker', () => {
  let fixture: ComponentFixture<VehicleImagePicker>;
  let component: VehicleImagePicker;
  let vehicleImageService: jasmine.SpyObj<VehicleImageService>;

  beforeEach(() => {
    vehicleImageService = jasmine.createSpyObj<VehicleImageService>(
      'VehicleImageService',
      ['prepareImage'],
      { maxImageBytes: 5 * 1024 * 1024 }
    );

    TestBed.configureTestingModule({
      imports: [VehicleImagePicker],
      providers: [{ provide: VehicleImageService, useValue: vehicleImageService }],
    });

    fixture = TestBed.createComponent(VehicleImagePicker);
    component = fixture.componentInstance;
  });

  function selectFile(file: File) {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    Object.defineProperty(input, 'files', { value: dataTransfer.files });
    input.dispatchEvent(new Event('change'));
  }

  it('shows the current image url as the initial preview', () => {
    component.currentImageUrl = 'https://example.com/vehicle.jpg';
    fixture.detectChanges();

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.src).toBe('https://example.com/vehicle.jpg');
  });

  it('emits the prepared file and shows a preview once selected', async () => {
    const original = new File(['data'], 'photo.png', { type: 'image/png' });
    const prepared = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    vehicleImageService.prepareImage.and.resolveTo(prepared);

    fixture.detectChanges();
    const emitted: File[] = [];
    component.imageSelected.subscribe((file) => emitted.push(file));

    selectFile(original);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(emitted).toEqual([prepared]);
    expect(fixture.nativeElement.querySelector('img')).toBeTruthy();
  });

  it('does not emit when the prepared file exceeds the size limit', async () => {
    const original = new File(['data'], 'photo.png', { type: 'image/png' });
    const tooLarge = new File([new Uint8Array(10)], 'photo.jpg', { type: 'image/jpeg' });
    Object.defineProperty(tooLarge, 'size', { value: 10 * 1024 * 1024 });
    vehicleImageService.prepareImage.and.resolveTo(tooLarge);

    fixture.detectChanges();
    const emitted: File[] = [];
    component.imageSelected.subscribe((file) => emitted.push(file));

    selectFile(original);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(emitted).toEqual([]);
  });
});
