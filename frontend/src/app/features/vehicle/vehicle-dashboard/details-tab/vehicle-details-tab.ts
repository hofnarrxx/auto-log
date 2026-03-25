import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Vehicle } from '../../vehicle-model';

@Component({
  selector: 'app-vehicle-details-tab',
  templateUrl: './vehicle-details-tab.html',
  styleUrl: './vehicle-details-tab.css',
})
export class VehicleDetailsTab {
  @Input({ required: true }) vehicle!: Vehicle;
  @Output() editRequested = new EventEmitter<void>();
  @Output() deleteRequested = new EventEmitter<void>();
}
