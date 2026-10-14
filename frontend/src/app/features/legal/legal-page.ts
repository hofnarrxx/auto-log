import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { LanguageService } from '../../core/i18n/language.service';
import { SiteFooter } from '../../shared/ui/site-footer/site-footer';

export type LegalDocument = 'privacy' | 'terms';

interface LegalSection {
  heading: string;
  paragraphs?: string[];
  items?: string[];
}

/** Bump when the privacy policy or terms change in a way users should know about. */
export const LEGAL_LAST_UPDATED = '2026-10-13';

@Component({
  selector: 'app-legal-page',
  imports: [FormsModule, RouterLink, TranslateModule, SiteFooter],
  templateUrl: './legal-page.html',
  styleUrl: './legal-page.css',
})
export class LegalPage {
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly languageService = inject(LanguageService);

  readonly docType: LegalDocument =
    this.route.snapshot.data['legal'] === 'terms' ? 'terms' : 'privacy';
  readonly lastUpdated = LEGAL_LAST_UPDATED;
  readonly contactEmail = environment.contactEmail;
  readonly selectedLanguage = this.languageService.selectedLanguage;

  private readonly rawSections = toSignal(this.translate.stream(`legal.${this.docType}.sections`), {
    initialValue: [] as unknown,
  });

  readonly sections = computed<LegalSection[]>(() => {
    const raw = this.rawSections();
    if (!Array.isArray(raw)) {
      return [];
    }
    return (raw as LegalSection[]).map((section) => ({
      heading: this.fill(section.heading),
      paragraphs: section.paragraphs?.map((text) => this.fill(text)),
      items: section.items?.map((text) => this.fill(text)),
    }));
  });

  onLanguageChange(language: string) {
    this.languageService.setLanguage(language);
  }

  private fill(text: string): string {
    return text.replaceAll('{{email}}', this.contactEmail);
  }
}
