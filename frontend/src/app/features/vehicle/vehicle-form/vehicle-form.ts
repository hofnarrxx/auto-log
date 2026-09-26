import { Component, inject, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { VehicleStore } from '../vehicle-store';
import type { UpdateVehicleCommand, Vehicle as VehicleModel } from '../models';
import { of, switchMap } from 'rxjs';
import { FUEL_TYPES, getFuelTypeLabelKey } from '../../../shared/utils/fuel-type.utils';
import { integerValidator, MAX_MILEAGE } from '../../../shared/utils/field.validators';
import { applyServerFieldErrors } from '../../../shared/utils/server-field-errors.utils';
import { NotificationService } from '../../../shared/services/notification.service';
import { toCreateVehicleCommand, toUpdateVehicleCommand } from './vehicle-form.mapper';
import { VehicleImageService } from '../services/vehicle-image.service';
import { VehicleImagePicker } from '../ui/vehicle-image-picker/vehicle-image-picker';
import { AuthStore } from '../../../core/auth/auth-store';

@Component({
  selector: 'app-vehicle-form',
  imports: [ReactiveFormsModule, TranslateModule, VehicleImagePicker],
  templateUrl: './vehicle-form.html',
  styleUrl: './vehicle-form.css',
})
export class VehicleForm {
  private vehicleStore = inject(VehicleStore);
  private vehicleImageService = inject(VehicleImageService);
  private notifications = inject(NotificationService);
  private authStore = inject(AuthStore);
  protected readonly isDemo = this.authStore.isDemo;
  @Input() vehicle?: VehicleModel;
  @Output() closed = new EventEmitter<void>();
  private selectedImageFile: File | null = null;
  private currentImageKey: string | null = null;

  readonly currentYear = new Date().getFullYear();
  readonly fuelTypes = FUEL_TYPES;

  protected fuelTypeLabel(fuelType: string): string {
    return getFuelTypeLabelKey(fuelType) ?? fuelType;
  }

  form = new FormGroup({
    make: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    model: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    year: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1886),
      Validators.max(this.currentYear),
      integerValidator,
    ]),
    mileage: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(MAX_MILEAGE),
      integerValidator,
    ]),
    fuelType: new FormControl<string | null>(null, Validators.required),
    licensePlate: new FormControl<string | null>(null, Validators.maxLength(20)),
  });

  ngOnInit() {
    if (this.vehicle) {
      this.form.patchValue(this.vehicle);
      this.currentImageKey = this.vehicle.imageKey ?? null;
    }
  }

  save() {
    if (this.isDemo()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.vehicle) {
      this.saveExistingVehicle();
      return;
    }

    this.saveNewVehicle();
  }

  cancel() {
    this.closed.emit();
  }

  protected onImageSelected(file: File) {
    this.selectedImageFile = file;
  }

  private saveExistingVehicle() {
    const vehicleId = this.vehicle!.id;
    const command = toUpdateVehicleCommand(
      vehicleId,
      this.form.getRawValue(),
      this.currentImageKey ?? null
    );

    if (!command) {
      return;
    }

    const update$ = this.selectedImageFile
      ? this.vehicleImageService.upload(vehicleId, this.selectedImageFile).pipe(
          switchMap((objectKey) => {
            this.currentImageKey = objectKey;
            return this.vehicleStore.update({ ...command, imageKey: objectKey });
          })
        )
      : this.vehicleStore.update(command);

    update$.subscribe({
      next: () => {
        this.closed.emit();
      },
      error: (err) => this.handleSaveError(err),
    });
  }

  private saveNewVehicle() {
    const command = toCreateVehicleCommand(this.form.getRawValue(), null);

    if (!command) {
      return;
    }

    this.vehicleStore
      .add(command)
      .pipe(
        switchMap((created) => {
          if (!this.selectedImageFile) {
            return of(created);
          }

          return this.vehicleImageService.upload(created.id, this.selectedImageFile).pipe(
            switchMap((objectKey) => {
              const update: UpdateVehicleCommand = {
                ...command,
                id: created.id,
                imageKey: objectKey,
              };

              return this.vehicleStore.update(update);
            })
          );
        })
      )
      .subscribe({
        next: () => {
          this.closed.emit();
        },
        error: (err) => this.handleSaveError(err),
      });
  }

  private handleSaveError(err: unknown) {
    if (applyServerFieldErrors(this.form, err)) {
      return;
    }

    this.notifications.notifyError('vehicle.form.errors.saveFailed');
  }
}
