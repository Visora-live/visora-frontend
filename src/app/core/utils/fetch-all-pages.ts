import { HttpClient, HttpParams } from '@angular/common/http';
import { EMPTY, Observable, expand, reduce } from 'rxjs';

/**
 * Fetches every page of a skip/limit list endpoint and concatenates the results.
 *
 * The backend caps list endpoints (default limit=50, max 500). Views that filter
 * or count client-side need the whole set, otherwise anything past the first
 * page silently disappears (e.g. only 50 events visible after a long session).
 */
export function fetchAllPages<T>(
  http: HttpClient,
  url: string,
  params: Record<string, string> = {},
  pageSize = 500,
  maxPages = 20,
): Observable<T[]> {
  const getPage = (page: number) =>
    http.get<T[]>(url, {
      params: new HttpParams({
        fromObject: { ...params, skip: String(page * pageSize), limit: String(pageSize) },
      }),
    });

  return getPage(0).pipe(
    expand((items, i) => (items.length === pageSize && i + 1 < maxPages ? getPage(i + 1) : EMPTY)),
    reduce((all, items) => all.concat(items), [] as T[]),
  );
}
