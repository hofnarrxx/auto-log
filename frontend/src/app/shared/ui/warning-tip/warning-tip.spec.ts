import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WarningTip } from './warning-tip';

@Component({
  imports: [WarningTip],
  template: `
    <button type="button" class="row" (click)="rowClicks = rowClicks + 1">
      <app-warning-tip id="a" text="First message"></app-warning-tip>
      <app-warning-tip id="b" variant="warn" text="Second message"></app-warning-tip>
    </button>
    <p class="outside">outside</p>
  `,
})
class Host {
  rowClicks = 0;
}

describe('WarningTip', () => {
  let fixture: ComponentFixture<Host>;

  const tip = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders the message text and the warn variant class', () => {
    expect(tip('a').textContent).toContain('First message');
    expect(tip('a').classList.contains('warn')).toBe(false);
    expect(tip('b').classList.contains('warn')).toBe(true);
  });

  it('opens on click without triggering the parent click handler', () => {
    tip('a').click();
    fixture.detectChanges();

    expect(tip('a').classList.contains('open')).toBe(true);
    expect(fixture.componentInstance.rowClicks).toBe(0);
  });

  it('toggles closed on a second click', () => {
    tip('a').click();
    tip('a').click();
    fixture.detectChanges();

    expect(tip('a').classList.contains('open')).toBe(false);
  });

  it('closes the previous tip when another one is opened', () => {
    tip('a').click();
    tip('b').click();
    fixture.detectChanges();

    expect(tip('a').classList.contains('open')).toBe(false);
    expect(tip('b').classList.contains('open')).toBe(true);
  });

  it('closes when clicking elsewhere', () => {
    tip('a').click();
    (fixture.nativeElement.querySelector('.outside') as HTMLElement).click();
    fixture.detectChanges();

    expect(tip('a').classList.contains('open')).toBe(false);
  });
});
