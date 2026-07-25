import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './toast-host.html',
  styleUrl: './toast-host.css',
})
export class ToastHost {
  protected readonly notifications = inject(NotificationService);

  dismiss(id: number) {
    this.notifications.dismiss(id);
  }
}
