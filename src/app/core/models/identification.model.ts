export interface Identification {
  id: string;
  evidenceId: string;  // evidencia_id
  nombre?: string;
  apellido?: string;
  dni?: string;
  confianza?: number;  // manually entered confidence value — no AI computation
  fuente: string;      // 'manual' by default
  createdAt: string;   // created_at
}

export interface IdentificationCreatePayload {
  evidenceId: number;  // evidencia_id
  nombre?: string;
  apellido?: string;
  dni?: string;
  confianza?: number;
  fuente?: string;     // defaults to 'manual'
}

export interface IdentificationUpdatePayload {
  nombre?: string;
  apellido?: string;
  dni?: string;
  confianza?: number;
  fuente?: string;
}
