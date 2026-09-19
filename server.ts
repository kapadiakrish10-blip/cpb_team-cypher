import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { SAMPLE_DOCUMENTS } from './server/samples';
import {
  ingestPatientDocument,
  answerPatientQuery,
  activeSessions
} from './server/agent';
import { recordSimplificationAndFlagger } from './server/tools/simplifierAndFlagger';
import { specialistDepartmentFinder } from './server/tools/specialistFinder';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded body parsers with generous limits for file uploads
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Pre-seed sample documents into active sessions in background
  setTimeout(async () => {
    for (const sample of SAMPLE_DOCUMENTS) {
      try {
        await ingestPatientDocument(
          sample.id,
          sample.title,
          sample.rawText,
          sample.documentType
        );
      } catch (e) {
        console.error(`Failed to pre-seed sample ${sample.id}:`, e);
      }
    }
  }, 100);

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      activeSessionCount: activeSessions.size,
      hasGeminiApiKey: !!process.env.GEMINI_API_KEY
    });
  });

  // Get Sample Documents
  app.get('/api/samples', (req, res) => {
    res.json({
      samples: SAMPLE_DOCUMENTS.map((s) => ({
        id: s.id,
        title: s.title,
        documentType: s.documentType,
        encounterDate: s.encounterDate,
        preview: s.rawText.slice(0, 220) + '...'
      }))
    });
  });

  // Ingest Document (The Core Automatic Pipeline)
  app.post('/api/ingest', async (req, res) => {
    try {
      const { documentId, title, rawText, documentType, sampleId } = req.body;

      let docId = documentId || `doc-${Date.now()}`;
      let docTitle = title || 'Patient Uploaded Medical Record';
      let docContent = rawText || '';
      let docType = documentType || 'lab_report';

      // If sampleId is provided
      if (sampleId) {
        const sample = SAMPLE_DOCUMENTS.find((s) => s.id === sampleId);
        if (sample) {
          docId = sample.id;
          docTitle = sample.title;
          docContent = sample.rawText;
          docType = sample.documentType;
        }
      }

      if (!docContent || docContent.trim().length === 0) {
        return res.status(400).json({ error: 'Document content is empty.' });
      }

      const result = await ingestPatientDocument(docId, docTitle, docContent, docType);
      return res.json(result);
    } catch (error: any) {
      console.error('Error in /api/ingest:', error);
      return res.status(500).json({
        error: error.message || 'Failed to ingest patient record.'
      });
    }
  });

  // PDF Document Ingestion (Parses binary PDF buffer & ingests immediately)
  app.post('/api/upload-pdf', async (req, res) => {
    try {
      const { base64Data, fileName } = req.body;
      if (!base64Data) {
        return res.status(400).json({ error: 'Missing base64Data in request.' });
      }

      const buffer = Buffer.from(base64Data, 'base64');
      const pdfData = await pdfParse(buffer);
      const rawText = pdfData.text || '';

      if (!rawText.trim()) {
        return res.status(400).json({ error: 'Could not extract text from the provided PDF.' });
      }

      const docId = `pdf-${Date.now()}`;
      const docTitle = fileName ? `Uploaded: ${fileName}` : 'Uploaded Patient PDF Record';

      // Auto-detect document type from keywords
      let docType: 'lab_report' | 'discharge_summary' | 'prescription' = 'lab_report';
      const lower = rawText.toLowerCase();
      if (lower.includes('discharge') || lower.includes('hospital course') || lower.includes('incision')) {
        docType = 'discharge_summary';
      } else if (lower.includes('prescription') || lower.includes('pharmacy') || lower.includes('refill')) {
        docType = 'prescription';
      }

      const result = await ingestPatientDocument(docId, docTitle, rawText, docType);
      return res.json(result);
    } catch (error: any) {
      console.error('Error in /api/upload-pdf:', error);
      return res.status(500).json({
        error: error.message || 'Failed to process PDF document.'
      });
    }
  });

  // Interactive Follow-up Query grounded in the uploaded document
  app.post('/api/query', async (req, res) => {
    try {
      const { documentId, question } = req.body;
      if (!documentId || !question) {
        return res.status(400).json({ error: 'documentId and question are required.' });
      }

      const result = await answerPatientQuery(documentId, question);
      return res.json(result);
    } catch (error: any) {
      console.error('Error in /api/query:', error);
      return res.status(500).json({
        error: error.message || 'Failed to answer question.'
      });
    }
  });

  // Standalone Tool Testing Endpoint: Tool 1 (Record Simplification & Flagging)
  app.post('/api/tool/record-simplification-flagger', (req, res) => {
    try {
      const { documentContent, documentType } = req.body;
      if (!documentContent) {
        return res.status(400).json({ error: 'documentContent parameter required.' });
      }
      const output = recordSimplificationAndFlagger(documentContent, documentType);
      return res.json({
        toolName: 'record_simplification_and_flagger',
        executedAt: new Date().toISOString(),
        output
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // Standalone Tool Testing Endpoint: Tool 2 (Specialist & Department Finder)
  app.post('/api/tool/specialist-finder', (req, res) => {
    try {
      const { flaggedItems } = req.body;
      if (!flaggedItems || !Array.isArray(flaggedItems)) {
        return res.status(400).json({ error: 'flaggedItems array parameter required.' });
      }
      const output = specialistDepartmentFinder(flaggedItems);
      return res.json({
        toolName: 'specialist_department_finder',
        executedAt: new Date().toISOString(),
        output
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message, stack: error.stack });
    }
  });

  // FastMCP Server Manifest / Tool Inspection Endpoint (Bonus feature demonstration)
  app.get('/api/mcp/manifest', (req, res) => {
    res.json({
      serverName: 'health-companion-tools-server',
      version: '1.2.0',
      description: 'Deterministic Medical Record Simplification & Specialist Routing Tools',
      protocolVersion: '2024-11-05',
      tools: [
        {
          name: 'record_simplification_and_flagger',
          description:
            'Evaluates patient record metrics against medical reference ranges, flags abnormal values, and maps jargon to plain language.',
          parameters: {
            type: 'object',
            properties: {
              documentContent: { type: 'string', description: 'Raw patient clinical text' },
              documentType: { type: 'string', enum: ['lab_report', 'discharge_summary', 'prescription'] }
            },
            required: ['documentContent']
          }
        },
        {
          name: 'specialist_department_finder',
          description:
            'Maps surfaced clinical flags and out-of-range metrics to medical specialists and hospital departments using deterministic routing.',
          parameters: {
            type: 'object',
            properties: {
              flaggedItems: {
                type: 'array',
                items: { type: 'object' },
                description: 'List of flagged items surfaced by record_simplification_and_flagger'
              }
            },
            required: ['flaggedItems']
          }
        }
      ]
    });
  });

  // ==========================================
  // VITE / STATIC SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
