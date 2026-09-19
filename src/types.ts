export type DocumentType = 'lab_report' | 'discharge_summary' | 'prescription';

export type FlagStatus = 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'WARNING';
export type SeverityLevel = 'low' | 'moderate' | 'high' | 'critical';
export type UrgencyLevel = 'routine' | 'soon' | 'urgent' | 'immediate';

export interface FlaggedItem {
  id: string;
  name: string;
  value: string;
  unit?: string;
  referenceRange: string;
  status: FlagStatus;
  severity: SeverityLevel;
  category: string;
  plainExplanation: string;
  potentialConcern?: string;
}

export interface SpecialistRecommendation {
  id: string;
  specialistType: string;
  department: string;
  urgency: UrgencyLevel;
  matchedFlags: string[];
  rationale: string;
  suggestedQuestionsToAsk: string[];
}

export interface SimplifiedTerm {
  term: string;
  plainDefinition: string;
  category?: string;
}

export interface DocumentChunk {
  id: string;
  section: string;
  content: string;
  startLine?: number;
  endLine?: number;
}

export interface ToolExecutionLog {
  id: string;
  toolName: string;
  docstring: string;
  timestamp: string;
  durationMs: number;
  inputSummary: Record<string, any>;
  outputSummary: Record<string, any>;
  status: 'success' | 'error';
}

export interface MedicalDocument {
  id: string;
  title: string;
  documentType: DocumentType;
  rawText: string;
  fileName?: string;
  patientNamePlaceholder?: string;
  encounterDate?: string;
}

export interface IngestionResult {
  documentId: string;
  title: string;
  documentType: DocumentType;
  rawText: string;
  plainLanguageSummary: string;
  keyTakeaways: string[];
  flaggedItems: FlaggedItem[];
  specialistRecommendations: SpecialistRecommendation[];
  simplifiedTerms: SimplifiedTerm[];
  chunks: DocumentChunk[];
  toolExecutionLogs: ToolExecutionLog[];
  ingestedAt: string;
  disclaimer: string;
}

export interface RetrievalResult {
  chunkId: string;
  section: string;
  snippet: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  retrievedChunks?: RetrievalResult[];
  suggestedFollowUps?: string[];
}
