import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  EvidenceRecord,
  EvidenceCreatePayload,
  EvidenceUpdatePayload,
} from '../models/evidence.model';

interface BackendEvidence {
  id: number;
  evento_id: number;
  tipo: string;
  storage_provider: string;
  storage_path: string;
  storage_bucket: string | null;
  filename: string | null;
  content_type: string | null;
  ai_processed: boolean;
  created_at: string;
}

function mapEvidence(b: BackendEvidence): EvidenceRecord {
  return {
    id: String(b.id),
    eventId: String(b.evento_id),
    tipo: b.tipo,
    storagePath: b.storage_path,
    storageProvider: b.storage_provider,
    storageBucket: b.storage_bucket ?? undefined,
    filename: b.filename ?? undefined,
    contentType: b.content_type ?? undefined,
    aiProcessed: b.ai_processed, // read-only flag from backend — no AI logic triggered in frontend
    createdAt: b.created_at,
  };
}

@Injectable({ providedIn: 'root' })
export class EvidenceService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  list(params: { eventoId?: number; tipo?: string; storageProvider?: string } = {}) {
    let httpParams = new HttpParams();
    if (params.eventoId !== undefined) httpParams = httpParams.set('evento_id', String(params.eventoId));
    if (params.tipo) httpParams = httpParams.set('tipo', params.tipo);
    if (params.storageProvider) httpParams = httpParams.set('storage_provider', params.storageProvider);
    return this.http
      .get<BackendEvidence[]>(`${this.base}/evidences`, { params: httpParams })
      .pipe(map((arr) => arr.map(mapEvidence)));
  }

  listByEvent(eventId: string) {
    return this.list({ eventoId: Number(eventId) });
  }

  getById(id: string) {
    return this.http.get<BackendEvidence>(`${this.base}/evidences/${id}`).pipe(
      map(mapEvidence),
      catchError(() => of(null)),
    );
  }

  create(payload: EvidenceCreatePayload) {
    const body = {
      evento_id: payload.eventId,
      tipo: payload.tipo ?? 'snapshot',
      storage_path: payload.storagePath,
      storage_provider: payload.storageProvider ?? 'local',
      storage_bucket: payload.storageBucket ?? null,
      filename: payload.filename ?? null,
      content_type: payload.contentType ?? null,
    };
    return this.http
      .post<BackendEvidence>(`${this.base}/evidences`, body)
      .pipe(map(mapEvidence));
  }

  // Sends file bytes to backend via FormData — frontend does NOT read or process file content.
  upload(eventoId: number, file: File, tipo = 'snapshot') {
    const formData = new FormData();
    formData.append('evento_id', String(eventoId));
    formData.append('tipo', tipo);
    formData.append('file', file);
    return this.http
      .post<BackendEvidence>(`${this.base}/evidences/upload`, formData)
      .pipe(
        map(mapEvidence),
        catchError(() => of(null)),
      );
  }

  update(id: string, payload: EvidenceUpdatePayload) {
    const body: Record<string, unknown> = {};
    if (payload.tipo !== undefined) body['tipo'] = payload.tipo;
    if (payload.storagePath !== undefined) body['storage_path'] = payload.storagePath;
    if (payload.storageProvider !== undefined) body['storage_provider'] = payload.storageProvider;
    if (payload.storageBucket !== undefined) body['storage_bucket'] = payload.storageBucket;
    if (payload.filename !== undefined) body['filename'] = payload.filename;
    if (payload.contentType !== undefined) body['content_type'] = payload.contentType;
    return this.http
      .patch<BackendEvidence>(`${this.base}/evidences/${id}`, body)
      .pipe(map(mapEvidence));
  }

  delete(id: string) {
    return this.http.delete<BackendEvidence>(`${this.base}/evidences/${id}`).pipe(
      map(mapEvidence),
      catchError(() => of(null)),
    );
  }
}
