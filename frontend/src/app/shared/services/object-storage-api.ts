import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Uploads a file directly to a presigned object-storage URL. The URL already encodes its
 * destination bucket/key and credentials, so this transport never touches `API_BASE_URL`.
 */
@Injectable({
  providedIn: 'root',
})
export class ObjectStorageApi {
  private readonly http = inject(HttpClient);

  upload(uploadUrl: string, file: File): Observable<string> {
    return this.http.put(uploadUrl, file, {
      headers: new HttpHeaders({ 'Content-Type': file.type }),
      responseType: 'text',
    });
  }
}
