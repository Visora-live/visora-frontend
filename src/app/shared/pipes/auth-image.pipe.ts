import { Pipe, PipeTransform, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable, switchMap } from 'rxjs';

/**
 * Fetches an image URL using the Angular HttpClient (adds Bearer token automatically)
 * and converts the blob response to a safe data-URL for use in [src] bindings.
 * Use with async pipe: [src]="url | authImage | async"
 */
@Pipe({ name: 'authImage', standalone: true })
export class AuthImagePipe implements PipeTransform {
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);

  transform(url: string | null | undefined): Observable<SafeUrl> | null {
    if (!url) return null;
    return this.http.get(url, { responseType: 'blob' }).pipe(
      switchMap(
        (blob) =>
          new Observable<SafeUrl>((observer) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              observer.next(this.sanitizer.bypassSecurityTrustUrl(reader.result as string));
              observer.complete();
            };
            reader.onerror = () => observer.error(reader.error);
            reader.readAsDataURL(blob);
          }),
      ),
    );
  }
}
