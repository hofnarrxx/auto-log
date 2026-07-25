import { Injectable, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export type NotificationKind = 'error' | 'success';

export interface AppNotification {
  id: number;
  kind: NotificationKind;
  messageKey: string;
}

export interface HttpErrorMapping {
  fallback: string;
  byStatus?: Partial<Record<number, string>>;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private nextId = 1;
  private readonly autoDismissMs = 4500;
  private readonly items = signal<AppNotification[]>([]);
  private dismissTimers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly notifications = this.items.asReadonly();
  readonly latest = computed(() => this.items().at(-1) ?? null);

  notifyError(messageKey: string): void {
    this.push('error', messageKey);
  }

  notifySuccess(messageKey: string): void {
    this.push('success', messageKey);
  }

  notifyHttpError(error: unknown, mapping: HttpErrorMapping): void {
    this.notifyError(this.mapHttpError(error, mapping));
  }

  mapHttpError(error: unknown, mapping: HttpErrorMapping): string {
    const status = error instanceof HttpErrorResponse ? error.status : undefined;
    if (status !== undefined && mapping.byStatus?.[status]) {
      return mapping.byStatus[status]!;
    }

    return mapping.fallback;
  }

  dismiss(id: number): void {
    this.clearTimer(id);
    this.items.update(list => list.filter(item => item.id !== id));
  }

  clear(): void {
    this.dismissTimers.forEach(timer => clearTimeout(timer));
    this.dismissTimers.clear();
    this.items.set([]);
  }

  private push(kind: NotificationKind, messageKey: string): void {
    const notification: AppNotification = {
      id: this.nextId++,
      kind,
      messageKey,
    };

    this.items.update(list => [...list, notification]);
    this.scheduleDismiss(notification.id);
  }

  private scheduleDismiss(id: number): void {
    this.clearTimer(id);
    const timer = setTimeout(() => this.dismiss(id), this.autoDismissMs);
    this.dismissTimers.set(id, timer);
  }

  private clearTimer(id: number): void {
    const timer = this.dismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.dismissTimers.delete(id);
    }
  }
}
