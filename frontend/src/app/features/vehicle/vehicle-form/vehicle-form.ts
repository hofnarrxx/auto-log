import { Component, inject, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { VehicleStore } from '../vehicle-store';
import { Vehicle as VehicleModel } from '../vehicle-model';

@Component({
  selector: 'app-vehicle-form',
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: './vehicle-form.html',
  styleUrl: './vehicle-form.css',
})
export class VehicleForm {
  private vehicleStore = inject(VehicleStore);
  @Input() vehicle?: VehicleModel;
  @Output() closed = new EventEmitter<void>();
  selectedImageBase64: string | null = null;

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
      this.selectedImageBase64 = this.vehicle.image ?? null;
    }
  }

  save() {
    if (this.form.invalid) return;

    if (this.vehicle) {
      this.vehicleStore.update({
        id: this.vehicle.id,
        ...this.form.value as any,
        image: this.resolveImage()
      });
    } else {
      this.vehicleStore.add({
        ...this.form.value as any,
        image: this.resolveImage()
      });
    }

    this.closed.emit();
  }

  cancel() {
    this.closed.emit();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    const reader = new FileReader();

    reader.onload = () => {
      this.selectedImageBase64 = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  private resolveImage(): string | null {
    return this.selectedImageBase64 ?? this.vehicle?.image ?? null;
  }
}
