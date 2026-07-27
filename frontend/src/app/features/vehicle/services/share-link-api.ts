import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { CreateShareLinkRequest, ShareLinkResponse } from '../models';

const SHARE_LINK_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class ShareLinkApi {
  private readonly http = inject(HttpClient);
  private readonly shareLinkApi = `${inject(API_BASE_URL)}/api/share-links`;

  create(carId: number, includeAttachments: boolean): Observable<ShareLinkResponse> {
    const request: CreateShareLinkRequest = {
      carId,
      expiresAt: new Date(Date.now() + SHARE_LINK_LIFETIME_MS).toISOString(),
      includeAttachments,
    };

    return this.http.post<ShareLinkResponse>(this.shareLinkApi, request);
  }

  list(carId: number): Observable<ShareLinkResponse[]> {
    return this.http.get<ShareLinkResponse[]>(`${this.shareLinkApi}?carId=${carId}`);
  }

  revoke(id: number): Observable<void> {
    return this.http.delete<void>(`${this.shareLinkApi}/${id}`);
  }
}
