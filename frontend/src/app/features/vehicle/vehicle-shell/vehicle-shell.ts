import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { parseVehicleTab, type VehicleTab } from '../utils/vehicle-tab.utils';

/**
 * Route shell for `/vehicles/:id`. Owns the vehicle-tab navigation so the app shell
 * (`core/layout/app-layout`) does not need to know vehicle route details.
 */
@Component({
  selector: 'app-vehicle-shell',
  imports: [RouterLink, RouterOutlet, TranslateModule],
  templateUrl: './vehicle-shell.html',
  styleUrl: './vehicle-shell.css',
})
export class VehicleShell {
  private readonly route = inject(ActivatedRoute);

  private readonly paramMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly vehicleId = computed(() => this.paramMap().get('id'));
  readonly activeTab = computed(() => parseVehicleTab(this.queryParamMap().get('tab')));

  protected isTabActive(tab: VehicleTab): boolean {
    return this.activeTab() === tab;
  }
}
