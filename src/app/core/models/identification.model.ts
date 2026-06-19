export interface Identification {
  id: string;
  eventoImagenId: string;
  nombre?: string;
  apellido?: string;
  dni?: string;
  confianzaIdentificacion: number;
  fuente: string;
  createdAt: string;
}

export interface IdentificationCreatePayload {
  eventoImagenId: number;
  nombre?: string;
  apellido?: string;
  dni?: string;
  confianzaIdentificacion?: number;
  fuente?: string;
}

export interface IdentificationUpdatePayload {
  nombre?: string;
  apellido?: string;
  dni?: string;
  confianzaIdentificacion?: number;
  fuente?: string;
}
