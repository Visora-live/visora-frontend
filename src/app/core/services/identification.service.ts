import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  Identification,
  IdentificationCreatePayload,
  IdentificationUpdatePayload,
} from '../models/identification.model';

interface BackendIdentification {
  id: number;
  evidencia_id: number;
  nombre: string | null;
  apellido: string | null;
  dni: string | null;
  confianza: number | null;
  fuente: string;
  created_at: string;
}

function mapIdentification(b: BackendIdentification): Identification {
  return {
    id: String(b.id),
    evidenceId: String(b.evidencia_id),
    nombre: b.nombre ?? undefined,
    apellido: b.apellido ?? undefined,
    dni: b.dni ?? undefined,
    confianza: b.confianza ?? undefined, // display-only — always manually entered, never AI-computed
    fuente: b.fuente,
    createdAt: b.created_at,
  };
}

@Injectable({ providedIn: 'root' })
export class IdentificationService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  list(params: { evidenciaId?: number; fuente?: string } = {}) {
    let httpParams = new HttpParams();
    if (params.evidenciaId !== undefined) httpParams = httpParams.set('evidencia_id', String(params.evidenciaId));
    if (params.fuente) httpParams = httpParams.set('fuente', params.fuente);
    return this.http
      .get<BackendIdentification[]>(`${this.base}/identifications`, { params: httpParams })
      .pipe(map((arr) => arr.map(mapIdentification)));
  }

  listByEvidence(evidenceId: string) {
    return this.list({ evidenciaId: Number(evidenceId) });
  }

  getById(id: string) {
    return this.http.get<BackendIdentification>(`${this.base}/identifications/${id}`).pipe(
      map(mapIdentification),
      catchError(() => of(null)),
    );
  }

  create(payload: IdentificationCreatePayload) {
    const body = {
      evidencia_id: payload.evidenceId,
      nombre: payload.nombre ?? null,
      apellido: payload.apellido ?? null,
      dni: payload.dni ?? null,
      confianza: payload.confianza ?? null,
      fuente: payload.fuente ?? 'manual',
    };
    return this.http
      .post<BackendIdentification>(`${this.base}/identifications`, body)
      .pipe(map(mapIdentification));
  }

  update(id: string, payload: IdentificationUpdatePayload) {
    const body: Record<string, unknown> = {};
    if (payload.nombre !== undefined) body['nombre'] = payload.nombre ?? null;
    if (payload.apellido !== undefined) body['apellido'] = payload.apellido ?? null;
    if (payload.dni !== undefined) body['dni'] = payload.dni ?? null;
    if (payload.confianza !== undefined) body['confianza'] = payload.confianza ?? null;
    if (payload.fuente !== undefined) body['fuente'] = payload.fuente;
    return this.http
      .patch<BackendIdentification>(`${this.base}/identifications/${id}`, body)
      .pipe(map(mapIdentification));
  }

  delete(id: string) {
    return this.http.delete<BackendIdentification>(`${this.base}/identifications/${id}`).pipe(
      map(mapIdentification),
      catchError(() => of(null)),
    );
  }
}
