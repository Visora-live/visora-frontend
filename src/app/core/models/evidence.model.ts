export type EvidenceStorageProvider = 'local' | 's3' | 'gcs';

export interface EvidenceRecord {
  id: string;
  eventId: string;
  storageRef: string;
  storageProvider: string;
  filename?: string;
  contentType?: string;
  esFrameRepresentativo: boolean;
  confianzaArma: number;
  confianzaRostro: number;
  createdAt: string;
}

export interface EvidenceCreatePayload {
  eventId: number;
  storageRef: string;
  storageProvider?: string;
  filename?: string;
  contentType?: string;
  esFrameRepresentativo?: boolean;
  confianzaArma?: number;
  confianzaRostro?: number;
}

export interface EvidenceUpdatePayload {
  storageRef?: string;
  storageProvider?: string;
  filename?: string;
  contentType?: string;
  esFrameRepresentativo?: boolean;
  confianzaArma?: number;
  confianzaRostro?: number;
}
