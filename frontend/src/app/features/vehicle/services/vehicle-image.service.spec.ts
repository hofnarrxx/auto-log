import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ObjectStorageApi } from '../../../shared/services/object-storage-api';
import { VehicleApi } from './vehicle-api';
import { VehicleImageService } from './vehicle-image.service';

async function createTestImageFile(name: string, type: string): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 4;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, 4, 4);

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((result) => resolve(result!), type)
  );

  return new File([blob], name, { type });
}

describe('VehicleImageService', () => {
  let service: VehicleImageService;
  let vehicleApi: jasmine.SpyObj<VehicleApi>;
  let objectStorageApi: jasmine.SpyObj<ObjectStorageApi>;

  beforeEach(() => {
    vehicleApi = jasmine.createSpyObj<VehicleApi>('VehicleApi', ['requestImageUploadUrl']);
    objectStorageApi = jasmine.createSpyObj<ObjectStorageApi>('ObjectStorageApi', ['upload']);

    TestBed.configureTestingModule({
      providers: [
        { provide: VehicleApi, useValue: vehicleApi },
        { provide: ObjectStorageApi, useValue: objectStorageApi },
      ],
    });

    service = TestBed.inject(VehicleImageService);
  });

  it('passes non-image files through unchanged', async () => {
    const file = new File(['data'], 'invoice.pdf', { type: 'application/pdf' });

    const result = await service.prepareImage(file);

    expect(result).toBe(file);
  });

  it('re-encodes images to JPEG', async () => {
    const file = await createTestImageFile('photo.png', 'image/png');

    const result = await service.prepareImage(file);

    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('photo.jpg');
  });

  it('requests an upload URL and uploads the file, returning the object key', (done) => {
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    vehicleApi.requestImageUploadUrl.and.returnValue(
      of({ uploadUrl: 'https://storage/upload', objectKey: 'vehicles/1/photo.jpg' })
    );
    objectStorageApi.upload.and.returnValue(of('ok'));

    service.upload(1, file).subscribe((objectKey) => {
      expect(vehicleApi.requestImageUploadUrl).toHaveBeenCalledWith(1, file);
      expect(objectStorageApi.upload).toHaveBeenCalledWith('https://storage/upload', file);
      expect(objectKey).toBe('vehicles/1/photo.jpg');
      done();
    });
  });
});
