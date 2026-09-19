import { GoogleGenAI } from '@google/genai';
import {
  IngestionResult,
  DocumentType,
  ToolExecutionLog,
  RetrievalResult
} from '../src/types';
import { recordSimplificationAndFlagger } from './tools/simplifierAndFlagger';
import { specialistDepartmentFinder } from './tools/specialistFinder';
import { SessionVectorStore } from './rag/vectorStore';

// In-memory document session registry: maps documentId -> { vectorStore, ingestionResult }
export interface SessionRecord {
  vectorStore: SessionVectorStore;
  ingestionResult: IngestionResult;
}

export const activeSessions: Map<string, SessionRecord> = new Map();

// Lazy initialization for Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return geminiClient;
}

/**
 * Resilient Gemini generation with modern model fallbacks:
 * Primary: 'gemini-3.8-flash' (standard for basic text tasks)
 * Secondary: 'gemini-3.1-flash-lite'
 * Tertiary: 'gemini-flash-latest'
 */
async function generateContentWithFallback(prompt: string): Promise<string | null> {
  const ai = getGemini();
  if (!ai) return null;

  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });
      if (response.text) {
        return response.text.trim();
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isQuotaOrNotFound =
        err?.status === 429 ||
        errMsg.includes('quota') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        err?.status === 404 ||
        errMsg.includes('NOT_FOUND');

      if (isQuotaOrNotFound) {
        console.warn(`Model ${model} unavailable (quota/not found), attempting fallback model...`);
        continue;
      }
      console.warn(`Gemini generation error with ${model}:`, errMsg);
    }
  }

  return null;
}

const MANDATORY_DISCLAIMER =
  'Disclaimer: This AI Health Companion provides educational summaries and navigation guidance only. It is not a clinical diagnosis or individualized medical treatment plan. Always consult a licensed healthcare professional for medical advice, prescription changes, or acute symptoms.';

/**
 * Executes the complete ingestion pipeline automatically the moment the document is received.
 */
export async function ingestPatientDocument(
  documentId: string,
  title: string,
  rawText: string,
  documentType: DocumentType = 'lab_report'
): Promise<IngestionResult> {
  const toolLogs: ToolExecutionLog[] = [];

  // Step 1: Text splitting and Vector Store indexing
  const vectorStore = new SessionVectorStore();
  const chunks = vectorStore.chunkDocument(rawText);

  // Step 2: Automatically invoke Tool 1: Record Simplification & Flagging
  const t1Start = Date.now();
  const simplificationResult = recordSimplificationAndFlagger(rawText, documentType);
  const t1Duration = Date.now() - t1Start;

  toolLogs.push({
    id: `call-tool-1-${Date.now()}`,
    toolName: 'record_simplification_and_flagger',
    docstring:
      'Evaluates document text against verified medical reference ranges and clinical dictionaries, flagging out-of-range metrics and translating medical jargon.',
    timestamp: new Date().toISOString(),
    durationMs: t1Duration,
    inputSummary: {
      documentLengthChars: rawText.length,
      documentType
    },
    outputSummary: {
      flagsFoundCount: simplificationResult.flaggedItems.length,
      simplifiedTermsCount: simplificationResult.simplifiedTerms.length,
      metricsEvaluatedCount: simplificationResult.metricsEvaluatedCount
    },
    status: 'success'
  });

  // Step 3: Automatically invoke Tool 2: Specialist & Department Finder
  const t2Start = Date.now();
  const specialistRecommendations = specialistDepartmentFinder(simplificationResult.flaggedItems);
  const t2Duration = Date.now() - t2Start;

  toolLogs.push({
    id: `call-tool-2-${Date.now()}`,
    toolName: 'specialist_department_finder',
    docstring:
      'Maps flagged clinical metrics, abnormal lab values, and red flags to appropriate medical specialists and departments using a deterministic clinical lookup table.',
    timestamp: new Date().toISOString(),
    durationMs: t2Duration,
    inputSummary: {
      flaggedItemsInputCount: simplificationResult.flaggedItems.length,
      categories: Array.from(new Set(simplificationResult.flaggedItems.map((f) => f.category)))
    },
    outputSummary: {
      recommendationsCount: specialistRecommendations.length,
      specialists: specialistRecommendations.map((r) => r.specialistType)
    },
    status: 'success'
  });

  // Step 4: Synthesize Plain-Language Narrative Summary
  // Uses Gemini if available, or deterministic clinical narrative template
  let plainLanguageSummary = '';

  const prompt = `You are an empathetic, clear, and reassuring Patient Health Companion Agent.
A patient has just handed you their personal medical document (${documentType.replace('_', ' ')}).
Your job is to rewrite this document into warm, plain English (at an 8th-grade reading level) and explain what was flagged and who to see, before the patient asks a single question.

Document Title: ${title}
Document Text (first 2500 chars):
${rawText.slice(0, 2500)}

Deterministic Tool Findings:
- Flagged abnormal items (${simplificationResult.flaggedItems.length}):
${simplificationResult.flaggedItems
  .map(
    (f) =>
      `* ${f.name}: Value=${f.value} ${f.unit || ''} (Normal: ${f.referenceRange}) [${f.status}] - ${f.plainExplanation}`
  )
  .join('\n')}

- Recommended Specialists:
${specialistRecommendations
  .map(
    (s) =>
      `* ${s.specialistType} (${s.department}) [Urgency: ${s.urgency}]: ${s.rationale}`
  )
  .join('\n')}

REQUIREMENTS:
1. Write 2 to 3 concise, comforting, and structured paragraphs.
2. Clearly explain what this document is in plain everyday words.
3. Call out the most important findings that need follow-up without causing panic.
4. Mention the doctors/specialists recommended and why.
5. End with a reminder that this is an educational summary and never a diagnosis.
6. Do NOT include markdown code blocks.`;

  const aiText = await generateContentWithFallback(prompt);
  if (aiText) {
    plainLanguageSummary = aiText;
  }

  // Deterministic fallback summary if Gemini is offline or unconfigured
  if (!plainLanguageSummary) {
    const flagNames = simplificationResult.flaggedItems.map((f) => f.name).slice(0, 4);
    const specialistNames = specialistRecommendations.map((s) => s.specialistType).slice(0, 2);

    plainLanguageSummary = `We have reviewed your ${documentType.replace('_', ' ')} immediately upon ingestion. This document details your clinical findings, lab results, and care instructions.

Key Findings: ${
      simplificationResult.flaggedItems.length > 0
        ? `Our analysis flagged ${simplificationResult.flaggedItems.length} item(s) that are outside standard ranges or require follow-up, notably: ${flagNames.join(', ')}. These indicate values that differ from typical healthy baselines and should be discussed with your care team.`
        : 'All core indicators evaluated are within expected reference ranges.'
    }

Recommended Care Navigation: ${
      specialistRecommendations.length > 0
        ? `Based on these findings, we recommend consulting a ${specialistNames.join(' or ')} to coordinate personalized next steps and repeat testing.`
        : 'Continue routine follow-up with your primary care physician.'
    }`;
  }

  const result: IngestionResult = {
    documentId,
    title,
    documentType,
    rawText,
    plainLanguageSummary,
    keyTakeaways: simplificationResult.summaryTakeaways,
    flaggedItems: simplificationResult.flaggedItems,
    specialistRecommendations,
    simplifiedTerms: simplificationResult.simplifiedTerms,
    chunks,
    toolExecutionLogs: toolLogs,
    ingestedAt: new Date().toISOString(),
    disclaimer: MANDATORY_DISCLAIMER
  };

  // Register in memory session
  activeSessions.set(documentId, {
    vectorStore,
    ingestionResult: result
  });

  return result;
}

/**
 * Answers a patient follow-up question grounded strictly in their uploaded document.
 */
export async function answerPatientQuery(
  documentId: string,
  userQuestion: string
): Promise<{
  answer: string;
  retrievedChunks: RetrievalResult[];
  disclaimer: string;
}> {
  const session = activeSessions.get(documentId);
  if (!session) {
    throw new Error(`Document session '${documentId}' not found. Please re-upload your document.`);
  }

  // Retrieve top-3 chunks
  const retrievedChunks = session.vectorStore.retrieve(userQuestion, 3);
  const contextText = retrievedChunks
    .map((c, i) => `[EXCERPT ${i + 1} - ${c.section}]\n${c.snippet}`)
    .join('\n\n---\n\n');

  let answer = '';

  const prompt = `You are the Patient Health Companion Agent.
A patient is asking a follow-up question about the medical document they previously uploaded.

Patient Question: "${userQuestion}"

Document Context Retrieved from Patient's Personal Record (k=3):
${contextText}

Document Flagged Abnormal Items:
${session.ingestionResult.flaggedItems.map((f) => `- ${f.name}: ${f.value} ${f.unit || ''} (Normal: ${f.referenceRange})`).join('\n')}

Specialist Recommendations:
${session.ingestionResult.specialistRecommendations.map((s) => `- ${s.specialistType} (${s.department}): ${s.rationale}`).join('\n')}

CRITICAL INSTRUCTIONS:
1. Ground your answer directly in the patient's specific document excerpts above.
2. Cite the relevant section (e.g. "[Metabolic Panel]" or "[Discharge Instructions]") where appropriate.
3. Translate all medical jargon into clear, comforting, 8th-grade level English.
4. NEVER provide a definitive medical diagnosis. Speak in terms of "your report shows", "this indicator reflects", and "you should ask your physician".
5. Be concise, direct, empathetic, and actionable.`;

  const aiText = await generateContentWithFallback(prompt);
  if (aiText) {
    answer = aiText;
  }

  if (!answer) {
    // Grounded deterministic fallback answer
    const relevantExcerpt = retrievedChunks[0]?.snippet || 'relevant sections of your document';
    answer = `Based on your specific record (${retrievedChunks[0]?.section || 'Document Findings'}):\n\n${relevantExcerpt.slice(0, 300)}...\n\nRegarding your question "${userQuestion}", this section outlines your specific medical measurements. Please review these exact values with your doctor to decide if further evaluation is warranted.`;
  }

  return {
    answer,
    retrievedChunks,
    disclaimer: MANDATORY_DISCLAIMER
  };
}
