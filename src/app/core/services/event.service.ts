import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { VisoraEvent, EventType, EventSeverity, EventStatus, PersonIdentification } from '../models/event.model';

interface BackendEvent {
  id: number;
  tipo: string;
  severidad: string;
  estado: string;
  fecha_hora: string;
  comentario: string | null;
  camara_id: number;
  tienda_id: number | null;
  created_at: string;
  updated_at: string;
}

interface BackendIdentification {
  id: number;
  nombre: string | null;
  apellido: string | null;
  apellido_materno: string | null;
  dni: string | null;
  edad: number | null;
}

interface BackendEventImage {
  id: number;
  evento_id: number;
  es_frame_representativo: boolean;
  storage_ref: string;
}

interface BackendCameraMin {
  id: number;
  nombre_cam: string;
  ubicacion_camara: string | null;
  tienda_id: number;
}

interface BackendStoreMin {
  id: number;
  nombre: string;
}

function mapTipo(t: string): EventType {
  const n = t.toLowerCase();
  if (n === 'facial_recognition' || n.includes('facial') || n.includes('reconocimiento')) return 'facial_recognition';
  if (n === 'weapon_detection' || n.includes('arma') || n.includes('weapon')) return 'weapon_detection';
  if (n === 'system' || n === 'sistema') return 'system';
  return 'suspicious_activity';
}

function mapSeveridad(s: string): EventSeverity {
  const n = s.toLowerCase();
  if (n === 'normal' || n === 'baja') return 'normal';
  if (n === 'critical' || n === 'critica' || n === 'alta') return 'critical';
  return 'suspicious'; // 'media' → suspicious
}

function mapEstadoEvento(s: string): EventStatus {
  if (s === 'revisado' || s === 'reviewed') return 'reviewed';
  if (s === 'descartado' || s === 'dismissed' || s === 'cerrado') return 'dismissed';
  return 'pending';
}

function mapEvent(
  b: BackendEvent,
  cameraName: string,
  storeId: string,
  storeName: string,
  location: string,
  apiBase: string,
  identifications: PersonIdentification[] = [],
  eventImageId?: number,
): VisoraEvent {
  const tipo = b.tipo?.toLowerCase() ?? '';
  const isWeapon = tipo === 'weapon_detection' || tipo.includes('weapon') || tipo.includes('arma');
  let finalIdents = identifications;
  if (isWeapon && finalIdents.length === 0 && b.comentario) {
    const parsed = parseWeaponPerson(b.comentario);
    if (parsed) finalIdents = [parsed];
  }
  const snapshotUrl = isWeapon
    ? eventImageId != null
      ? `${apiBase}/event-images/${eventImageId}/file`
      : `${apiBase}/cameras/${b.camara_id}/detect/snapshot`
    : undefined;
  return {
    id: String(b.id),
    cameraId: String(b.camara_id),
    cameraName,
    storeId,
    storeName,
    location,
    severity: mapSeveridad(b.severidad),
    type: mapTipo(b.tipo),
    status: mapEstadoEvento(b.estado),
    description: b.comentario ?? '',
    timestamp: b.fecha_hora,
    evidence: [],
    recommendedActions: [],
    identifications: finalIdents,
    snapshotUrl,
  };
}

function mapIdentification(b: BackendIdentification): PersonIdentification {
  return {
    id: String(b.id),
    dni: b.dni ?? undefined,
    nombres: b.nombre ?? undefined,
    apellidoPaterno: b.apellido ?? undefined,
    apellidoMaterno: b.apellido_materno ?? undefined,
    edad: b.edad ?? undefined,
  };
}

function parseWeaponPerson(comentario: string): PersonIdentification | null {
  // Matches "Portador identificado: Nombre Apellido (DNI: 00000008)"
  // or      "Portador: Nombre Apellido (DNI: 00000008)"
  const m = comentario.match(/Portador(?:\s+identificado)?:\s+([^(]+?)\s*\(DNI:\s*([^)]+)\)/i);
  if (!m) return null;
  const fullName = m[1].trim();
  const dni = m[2].trim();
  // Heuristic split: last token(s) → apellido paterno, rest → nombres
  const parts = fullName.split(/\s+/);
  const apellidoPaterno = parts.length > 1 ? parts[parts.length - 1] : undefined;
  const nombres = parts.length > 1 ? parts.slice(0, -1).join(' ') : fullName;
  return { id: 'parsed', dni, nombres, apellidoPaterno };
}

export interface EventListResponse {
  items: VisoraEvent[];
  total: number;
  todayCount: number;
  criticalCount: number;
  suspiciousCount: number;
  evidenceCount: number;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  list(tiendaId?: string | null) {
    const evtUrl = tiendaId ? `${this.base}/events?tienda_id=${tiendaId}` : `${this.base}/events`;
    const camUrl = tiendaId ? `${this.base}/cameras?tienda_id=${tiendaId}` : `${this.base}/cameras`;
    return forkJoin([
      this.http.get<BackendEvent[]>(evtUrl),
      this.http.get<BackendCameraMin[]>(camUrl).pipe(catchError(() => of([] as BackendCameraMin[]))),
      this.http.get<BackendStoreMin[]>(`${this.base}/stores`).pipe(catchError(() => of([] as BackendStoreMin[]))),
    ]).pipe(
      map(([events, cameras, stores]) => {
        const camMap = new Map(cameras.map((c) => [c.id, c]));
        const storeMap = new Map(stores.map((s) => [s.id, s.nombre]));
        const today = new Date().toISOString().slice(0, 10);
        const items = events
          .map((e) => {
            const cam = camMap.get(e.camara_id);
            return mapEvent(
              e,
              cam?.nombre_cam ?? `Cámara ${e.camara_id}`,
              cam ? String(cam.tienda_id) : '',
              cam ? (storeMap.get(cam.tienda_id) ?? '') : '',
              cam?.ubicacion_camara ?? '',
              this.base,
              [],
            );
          })
          .filter((e) => e.status !== 'dismissed');
        return {
          items,
          total: items.length,
          todayCount: items.filter((e) => e.timestamp.startsWith(today)).length,
          criticalCount: items.filter((e) => e.severity === 'critical').length,
          suspiciousCount: items.filter((e) => e.severity === 'suspicious').length,
          evidenceCount: 0, // evidence not stored in backend events
        };
      }),
    );
  }

  getById(id: string) {
    return this.http.get<BackendEvent>(`${this.base}/events/${id}`).pipe(
      switchMap((evt) =>
        forkJoin({
          cam: this.http.get<BackendCameraMin>(`${this.base}/cameras/${evt.camara_id}`).pipe(
            catchError(() => of(null as BackendCameraMin | null)),
          ),
          store: evt.tienda_id
            ? this.http.get<BackendStoreMin>(`${this.base}/stores/${evt.tienda_id}`).pipe(
                catchError(() => of(null as BackendStoreMin | null)),
              )
            : of(null as BackendStoreMin | null),
          idents: this.http.get<BackendIdentification[]>(`${this.base}/identifications?evento_id=${evt.id}`).pipe(
            catchError(() => of([] as BackendIdentification[])),
          ),
          images: this.http.get<BackendEventImage[]>(`${this.base}/event-images?evento_id=${evt.id}`).pipe(
            catchError(() => of([] as BackendEventImage[])),
          ),
        }).pipe(
          map(({ cam, store, idents, images }) => {
            const repImage = images.find((i) => i.es_frame_representativo) ?? images[0];
            return mapEvent(
              evt,
              cam?.nombre_cam ?? `Cámara ${evt.camara_id}`,
              String(evt.tienda_id ?? cam?.tienda_id ?? ''),
              store?.nombre ?? '',
              cam?.ubicacion_camara ?? '',
              this.base,
              idents.map(mapIdentification),
              repImage?.id,
            );
          }),
        ),
      ),
      catchError(() => of(null)),
    );
  }

  updateStatus(id: string, status: EventStatus) {
    const estadoMap: Record<EventStatus, string> = {
      pending: 'abierto',
      reviewed: 'revisado',
      dismissed: 'descartado',
    };
    return this.http
      .patch<BackendEvent>(`${this.base}/events/${id}`, { estado: estadoMap[status] })
      .pipe(
        map((e) => mapEvent(e, '', '', '', '', this.base)),
        catchError(() => of(null)),
      );
  }

  create(payload: { tipo: string; severidad: string; camaraId: number; comentario?: string }) {
    const body = {
      tipo: payload.tipo,
      severidad: payload.severidad,
      camara_id: payload.camaraId,
      comentario: payload.comentario ?? null,
    };
    return this.http.post<BackendEvent>(`${this.base}/events`, body).pipe(
      map((e) => mapEvent(e, '', '', '', '', this.base)),
    );
  }

  delete(id: string) {
    // Errors propagate so the caller can show 403/404 messages.
    return this.http.delete<BackendEvent>(`${this.base}/events/${id}`).pipe(
      map((e) => mapEvent(e, '', '', '', '', this.base)),
    );
  }
}
