import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  const translations: Record<string, string> = {
    'seo.defaultDescription': 'Default description',
    'legal.privacy.description': 'Privacy description',
  };

  let service: SeoService;
  let meta: Meta;

  const content = (selector: string) => meta.getTag(selector)?.content;
  const canonical = () =>
    document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute('href');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: TranslateService,
          useValue: { stream: (key: string) => of(translations[key] ?? key) },
        },
      ],
    });
    service = TestBed.inject(SeoService);
    meta = TestBed.inject(Meta);
  });

  afterEach(() => {
    document.head.querySelector('link[rel="canonical"]')?.remove();
    meta.removeTag('name="robots"');
    meta.removeTag('name="referrer"');
    meta.removeTag('name="description"');
    meta.removeTag("property='og:url'");
  });

  it('marks routes without seo data as noindex and removes the canonical link', () => {
    service.apply({ indexable: true, canonicalPath: '/' });
    service.apply(undefined);

    expect(content('name="robots"')).toBe('noindex, nofollow');
    expect(canonical()).toBeUndefined();
    expect(meta.getTag("property='og:url'")).toBeNull();
  });

  it('allows indexing and sets canonical and og:url for indexable routes', () => {
    service.apply({ indexable: true, canonicalPath: '/privacy' });

    const url = `${environment.siteUrl}/privacy`;
    expect(content('name="robots"')).toBe('index, follow');
    expect(canonical()).toBe(url);
    expect(content("property='og:url'")).toBe(url);
  });

  it('uses a trailing slash for the root canonical URL', () => {
    service.apply({ indexable: true, canonicalPath: '/' });

    expect(canonical()).toBe(`${environment.siteUrl}/`);
  });

  it('reuses a single canonical link element across navigations', () => {
    service.apply({ indexable: true, canonicalPath: '/' });
    service.apply({ indexable: true, canonicalPath: '/terms' });

    expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(canonical()).toBe(`${environment.siteUrl}/terms`);
  });

  it('ignores the canonical path when the route is not indexable', () => {
    service.apply({ canonicalPath: '/privacy' });

    expect(canonical()).toBeUndefined();
  });

  it('suppresses the referrer for routes that ask for it', () => {
    service.apply({ noReferrer: true });
    expect(content('name="referrer"')).toBe('no-referrer');

    service.apply(undefined);
    expect(content('name="referrer"')).toBe('strict-origin-when-cross-origin');
  });

  it('sets the translated description, falling back to the site default', () => {
    service.apply({
      indexable: true,
      canonicalPath: '/privacy',
      descriptionKey: 'legal.privacy.description',
    });
    expect(content('name="description"')).toBe('Privacy description');

    service.apply(undefined);
    expect(content('name="description"')).toBe('Default description');
  });
});
