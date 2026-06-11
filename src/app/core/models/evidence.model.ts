export type EvidenceType = 'image' | 'video' | 'recognition_result';

export interface Evidence {
  id: string;
  eventId: string;
  type: EvidenceType;
  url: string;
  capturedAt: string;
  metadata?: Record<string, unknown>;
}

export interface RecognitionResult {
  evidenceId: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  attributes: Record<string, unknown>;
}
