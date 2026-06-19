import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  EvidenceRecord,
  EvidenceCreatePayload,
  EvidenceUpdatePayload,
} from '../models/evidence.model';

interface BackendEventImage {
  id: number;
  evento_id: number;
  storage_ref: string;
  storage_provider: string;
  filename: string | null;
  content_type: string | null;
  es_frame_representativo: boolean;
  confianza_arma: number;
  confianza_rostro: number;
  created_at: string;
}

function mapEventImage(b: BackendEventImage): EvidenceRecord {
  return {
    id: String(b.id),
    eventId: String(b.evento_id),
    storageRef: b.storage_ref,
    storageProvider: b.storage_provider,
    filename: b.filename ?? undefined,
    contentType: b.content_type ?? undefined,
    esFrameRepresentativo: b.es_frame_representativo,
    confianzaArma: b.confianza_arma,
    confianzaRostro: b.confianza_rostro,
    createdAt: b.created_at,
  };
}

@Injectable({ providedIn: 'root' })
export class EvidenceService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  list(params: { eventoId?: number } = {}) {
    let httpParams = new HttpParams();
    if (params.eventoId !== undefined) httpParams = httpParams.set('evento_id', String(params.eventoId));
    return this.http
      .get<BackendEventImage[]>(`${this.base}/event-images`, { params: httpParams })
      .pipe(map((arr) => arr.map(mapEventImage)));
  }

  listByEvent(eventId: string) {
    return this.list({ eventoId: Number(eventId) });
  }

  getById(id: string) {
    return this.http.get<BackendEventImage>(`${this.base}/event-images/${id}`).pipe(
      map(mapEventImage),
      catchError(() => of(null)),
    );
  }

  create(payload: EvidenceCreatePayload) {
    const body = {
      evento_id: payload.eventId,
      storage_ref: payload.storageRef,
      storage_provider: payload.storageProvider ?? 'local',
      filename: payload.filename ?? null,
      content_type: payload.contentType ?? null,
      es_frame_representativo: payload.esFrameRepresentativo ?? false,
      confianza_arma: payload.confianzaArma ?? 0,
      confianza_rostro: payload.confianzaRostro ?? 0,
    };
    return this.http
      .post<BackendEventImage>(`${this.base}/event-images`, body)
      .pipe(map(mapEventImage));
  }

  upload(eventoId: number, file: File, esFrameRepresentativo = false) {
    const formData = new FormData();
    formData.append('evento_id', String(eventoId));
    formData.append('es_frame_representativo', String(esFrameRepresentativo));
    formData.append('file', file);
    return this.http
      .post<BackendEventImage>(`${this.base}/event-images/upload`, formData)
      .pipe(
        map(mapEventImage),
        catchError(() => of(null)),
      );
  }

  update(id: string, payload: EvidenceUpdatePayload) {
    const body: Record<string, unknown> = {};
    if (payload.storageRef !== undefined) body['storage_ref'] = payload.storageRef;
    if (payload.storageProvider !== undefined) body['storage_provider'] = payload.storageProvider;
    if (payload.filename !== undefined) body['filename'] = payload.filename;
    if (payload.contentType !== undefined) body['content_type'] = payload.contentType;
    if (payload.esFrameRepresentativo !== undefined) body['es_frame_representativo'] = payload.esFrameRepresentativo;
    if (payload.confianzaArma !== undefined) body['confianza_arma'] = payload.confianzaArma;
    if (payload.confianzaRostro !== undefined) body['confianza_rostro'] = payload.confianzaRostro;
    return this.http
      .patch<BackendEventImage>(`${this.base}/event-images/${id}`, body)
      .pipe(map(mapEventImage));
  }

  delete(id: string) {
    return this.http.delete<BackendEventImage>(`${this.base}/event-images/${id}`).pipe(
      map(mapEventImage),
      catchError(() => of(null)),
    );
  }
}
