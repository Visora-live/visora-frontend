// Backend-aligned evidence model (file/metadata records stored by backend).
// Note: event.model.ts defines a separate display-only Evidence interface
// used for rendering thumbnails in event-detail — these are distinct types.

export type EvidenceStorageTipo = 'snapshot' | 'video' | 'image' | 'document';
export type EvidenceStorageProvider = 'local' | 's3' | 'gcs';

export interface EvidenceRecord {
  id: string;
  eventId: string;           // evento_id
  tipo: string;              // snapshot / video / image / document
  storagePath: string;       // storage_path
  storageProvider: string;   // storage_provider
  storageBucket?: string;    // storage_bucket
  filename?: string;         // filename
  contentType?: string;      // content_type
  aiProcessed: boolean;      // ai_processed — read-only flag, no AI logic triggered in frontend
  createdAt: string;         // created_at
}

export interface EvidenceCreatePayload {
  eventId: number;           // maps to evento_id
  tipo?: string;             // defaults to 'snapshot'
  storagePath: string;       // storage_path
  storageProvider?: string;  // defaults to 'local'
  storageBucket?: string;
  filename?: string;
  contentType?: string;
}

export interface EvidenceUpdatePayload {
  tipo?: string;
  storagePath?: string;
  storageProvider?: string;
  storageBucket?: string;
  filename?: string;
  contentType?: string;
}
