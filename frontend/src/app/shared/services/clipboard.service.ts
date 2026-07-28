import { Injectable } from '@angular/core';

/**
 * Small adapter around the browser clipboard so components can be tested without depending on
 * `navigator.clipboard` or `document.execCommand` directly.
 */
@Injectable({
  providedIn: 'root',
})
export class ClipboardService {
  async copy(text: string): Promise<boolean> {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall through to the legacy fallback below.
      }
    }

    return this.copyWithFallback(text);
  }

  private copyWithFallback(text: string): boolean {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      return document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
