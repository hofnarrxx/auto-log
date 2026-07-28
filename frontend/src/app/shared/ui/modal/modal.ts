import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Shared modal shell: traps focus while open, restores it to the trigger on close, and closes on
 * Escape. Feature dialogs should render their content through this component instead of
 * duplicating backdrop/panel markup.
 */
@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class Modal implements AfterViewInit, OnDestroy {
  @Output() closed = new EventEmitter<void>();
  @ViewChild('panel') private panelRef?: ElementRef<HTMLElement>;

  private previouslyFocusedElement: HTMLElement | null = null;

  ngAfterViewInit() {
    this.previouslyFocusedElement = document.activeElement as HTMLElement | null;
    this.focusFirstElement();
  }

  ngOnDestroy() {
    this.previouslyFocusedElement?.focus?.();
  }

  close() {
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  protected onEscape() {
    this.close();
  }

  @HostListener('document:keydown.tab', ['$event'])
  protected onTab(event: Event) {
    const focusable = this.focusableElements();
    if (!focusable.length) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    const shiftKey = (event as KeyboardEvent).shiftKey;

    if (shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusFirstElement() {
    const panel = this.panelRef?.nativeElement;
    if (!panel) {
      return;
    }

    const target = this.focusableElements()[0] ?? panel;
    target.focus();
  }

  private focusableElements(): HTMLElement[] {
    const panel = this.panelRef?.nativeElement;
    if (!panel) {
      return [];
    }

    return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  }
}
