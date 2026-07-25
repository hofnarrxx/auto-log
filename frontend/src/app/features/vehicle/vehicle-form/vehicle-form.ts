import { Component, inject, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { VehicleStore } from '../vehicle-store';
import { Vehicle as VehicleModel } from '../models';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { of, switchMap, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-vehicle-form',
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: './vehicle-form.html',
  styleUrl: './vehicle-form.css',
})
export class VehicleForm {
  private vehicleStore = inject(VehicleStore);
  private http = inject(HttpClient);
  private readonly vehicleApi = `${environment.apiBaseUrl}/vehicles`;
  private static readonly MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  private static readonly MAX_IMAGE_DIMENSION = 1600;
  private static readonly IMAGE_QUALITY = 0.75;
  @Input() vehicle?: VehicleModel;
  @Output() closed = new EventEmitter<void>();
  selectedImagePreviewUrl: string | null = null;
  private previewObjectUrl: string | null = null;
  private selectedImageFile: File | null = null;
  private currentImageKey: string | null = null;

  readonly currentYear = new Date().getFullYear();
  readonly fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'LPG', 'CNG'];

  protected fuelTypeLabel(fuelType: string): string {
    switch (fuelType.trim().toLowerCase()) {
      case 'petrol':
        return 'vehicle.form.fuelTypes.petrol';
      case 'diesel':
        return 'vehicle.form.fuelTypes.diesel';
      case 'hybrid':
        return 'vehicle.form.fuelTypes.hybrid';
      case 'electric':
        return 'vehicle.form.fuelTypes.electric';
      case 'lpg':
        return 'vehicle.form.fuelTypes.lpg';
      case 'cng':
        return 'vehicle.form.fuelTypes.cng';
      default:
        return fuelType;
    }
  }

  private integerValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    return Number.isInteger(value) ? null : { notInteger: true };
  }

  form = new FormGroup({
    brand: new FormControl('', Validators.required),
    model: new FormControl('', Validators.required),
    year: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1886),
      Validators.max(this.currentYear),
      this.integerValidator.bind(this)
    ]),
    mileage: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]),
    fuelType: new FormControl<string | null>(null, Validators.required),
    licensePlate: new FormControl<string | null>(null)
  });

  ngOnInit() {
    if (this.vehicle) {
      this.form.patchValue(this.vehicle);
      this.selectedImagePreviewUrl = this.vehicle.imageUrl ?? null;
      this.currentImageKey = this.vehicle.imageKey ?? null;
    }
  }

  save() {
    if (this.form.invalid) return;

    if (this.vehicle) {
      this.saveExistingVehicle();
      return;
    }

    this.saveNewVehicle();
  }

  cancel() {
    this.closed.emit();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    this.prepareImage(file)
      .then(prepared => {
        if (prepared.size > VehicleForm.MAX_IMAGE_BYTES) {
          return;
        }

        this.selectedImageFile = prepared;

        if (this.previewObjectUrl) {
          URL.revokeObjectURL(this.previewObjectUrl);
        }

        this.previewObjectUrl = URL.createObjectURL(prepared);
        this.selectedImagePreviewUrl = this.previewObjectUrl;
      })
      .catch(() => {
        // Skip preview if compression fails; selection remains unchanged.
      });
  }

  private saveExistingVehicle() {
    const vehicleId = this.vehicle!.id;
    const payload = {
      id: vehicleId,
      ...this.form.value as any,
      imageKey: this.currentImageKey ?? null,
    } as VehicleModel;

    const update$ = this.selectedImageFile
      ? this.uploadSelectedImage(vehicleId, this.selectedImageFile).pipe(
          switchMap(objectKey => {
            this.currentImageKey = objectKey;
            return this.vehicleStore.update({
              ...payload,
              imageKey: objectKey,
            });
          })
        )
      : this.vehicleStore.update(payload);

    update$.subscribe(() => {
      this.closed.emit();
    });
  }

  private saveNewVehicle() {
    const payload = {
      ...this.form.value as any,
      imageKey: null,
    } as VehicleModel;

    this.vehicleStore
      .add(payload)
      .pipe(
        switchMap(created => {
          if (!this.selectedImageFile) {
            return of(created);
          }

          return this.uploadSelectedImage(created.id, this.selectedImageFile).pipe(
            switchMap(objectKey =>
              this.vehicleStore.update({
                ...payload,
                id: created.id,
                imageKey: objectKey,
              })
            )
          );
        })
      )
      .subscribe(() => {
        this.closed.emit();
      });
  }

  private uploadSelectedImage(vehicleId: number, file: File) {
    return this.http
      .post<VehicleImageUploadUrlResponse>(
        `${this.vehicleApi}/${vehicleId}/image/upload-url`,
        {
          fileName: file.name,
          contentType: file.type,
          sizeBytes: file.size,
        }
      )
      .pipe(
        switchMap(response =>
          this.uploadToR2(response.uploadUrl, file).pipe(
            map(() => response.objectKey)
          )
        )
      );
  }

  private uploadToR2(uploadUrl: string, file: File) {
    return this.http.put(uploadUrl, file, {
      headers: new HttpHeaders({ 'Content-Type': file.type }),
      responseType: 'text',
    });
  }

  private async prepareImage(file: File): Promise<File> {
    if (!file.type.startsWith('image/')) {
      return file;
    }

    const maxSize = VehicleForm.MAX_IMAGE_DIMENSION;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', VehicleForm.IMAGE_QUALITY)
    );

    if (!blob) {
      return file;
    }

    const name = file.name.replace(/\.[^.]+$/, '.jpg');
    return new File([blob], name, { type: 'image/jpeg' });
  }
}

interface VehicleImageUploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
}
