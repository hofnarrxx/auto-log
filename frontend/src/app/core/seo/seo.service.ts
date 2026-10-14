import { DOCUMENT } from '@angular/common';
import { Injectable, Injector, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DEFAULT_DESCRIPTION_KEY, RouteSeo } from './route-seo.model';

const DEFAULT_REFERRER = 'strict-origin-when-cross-origin';

/**
 * Keeps robots / canonical / og:url / description / referrer tags in sync with the
 * active route. Crawlers that execute JavaScript (Googlebot, Bingbot) see these values;
 * the static fallbacks live in index.html.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  // Resolved lazily to avoid a circular dependency with the HTTP interceptor (see AppTitleStrategy).
  private readonly injector = inject(Injector);

  private descriptionSub?: Subscription;

  init(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.apply(this.readRouteSeo()));
  }

  apply(seo: RouteSeo | undefined): void {
    const indexable = seo?.indexable === true;

    this.meta.updateTag({
      name: 'robots',
      content: indexable ? 'index, follow' : 'noindex, nofollow',
    });
    this.meta.updateTag({
      name: 'referrer',
      content: seo?.noReferrer ? 'no-referrer' : DEFAULT_REFERRER,
    });

    const canonicalUrl =
      indexable && seo?.canonicalPath ? this.absoluteUrl(seo.canonicalPath) : null;
    this.setCanonical(canonicalUrl);
    if (canonicalUrl) {
      this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    } else {
      this.meta.removeTag("property='og:url'");
    }

    this.applyDescription(seo?.descriptionKey ?? DEFAULT_DESCRIPTION_KEY);
  }

  private readRouteSeo(): RouteSeo | undefined {
    let seo: RouteSeo | undefined;
    let route: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;

    while (route) {
      const candidate = route.data['seo'] as RouteSeo | undefined;
      if (candidate) {
        seo = candidate;
      }
      route = route.firstChild;
    }

    return seo;
  }

  private applyDescription(key: string): void {
    this.descriptionSub?.unsubscribe();
    this.descriptionSub = this.injector
      .get(TranslateService)
      .stream(key)
      .subscribe((text: unknown) => {
        if (typeof text === 'string' && text && text !== key) {
          this.meta.updateTag({ name: 'description', content: text });
        }
      });
  }

  private setCanonical(url: string | null): void {
    const head = this.document.head;
    const existing = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!url) {
      existing?.remove();
      return;
    }

    const link = existing ?? this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    if (!existing) {
      head.appendChild(link);
    }
  }

  private absoluteUrl(path: string): string {
    const origin = environment.siteUrl.replace(/\/+$/, '');
    return path === '/' ? `${origin}/` : `${origin}${path}`;
  }
}
