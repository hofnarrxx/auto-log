import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Modal } from './modal';

@Component({
  imports: [Modal],
  template: `
    <button id="trigger" (click)="open = true">Open</button>
    @if (open) {
      <app-modal (closed)="open = false">
        <button id="first">First</button>
        <button id="last">Last</button>
      </app-modal>
    }
  `,
})
class HostComponent {
  open = false;
}

describe('Modal', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  function query<T extends HTMLElement>(selector: string): T {
    return fixture.nativeElement.querySelector(selector) as T;
  }

  it('moves focus into the panel when opened', () => {
    query<HTMLButtonElement>('#trigger').click();
    fixture.detectChanges();

    expect(document.activeElement?.id).toBe('first');
  });

  it('restores focus to the trigger after closing', () => {
    const trigger = query<HTMLButtonElement>('#trigger');
    trigger.focus();

    trigger.click();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(document.activeElement?.id).toBe('trigger');
  });

  it('closes on Escape', () => {
    query<HTMLButtonElement>('#trigger').click();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.open).toBe(false);
  });

  it('closes when the backdrop is clicked', () => {
    query<HTMLButtonElement>('#trigger').click();
    fixture.detectChanges();

    query<HTMLElement>('.modal-backdrop').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.open).toBe(false);
  });

  it('traps Tab focus within the panel', () => {
    query<HTMLButtonElement>('#trigger').click();
    fixture.detectChanges();

    const last = query<HTMLButtonElement>('#last');
    last.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    fixture.detectChanges();

    expect(document.activeElement?.id).toBe('first');
  });
});
