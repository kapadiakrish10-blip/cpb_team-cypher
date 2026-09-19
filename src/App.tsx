import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DocumentIngestionStage } from './components/DocumentIngestionStage';
import { PlainLanguageSummaryCard } from './components/PlainLanguageSummaryCard';
import { FlaggedItemsTable } from './components/FlaggedItemsTable';
import { SpecialistRecommendationsView } from './components/SpecialistRecommendationsView';
import { MedicalGlossaryView } from './components/MedicalGlossaryView';
import { HealthCompanionChat } from './components/HealthCompanionChat';
import { ToolAuditInspectorModal } from './components/ToolAuditInspectorModal';
import { PrintableSummaryModal } from './components/PrintableSummaryModal';
import { IngestionResult, ChatMessage, DocumentType } from './types';
import { Loader2, MessageSquare, Sparkles, Printer, HeartHandshake } from 'lucide-react';

export default function App() {
  const [samples, setSamples] = useState<any[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>('sample-lab-report');
  const [currentResult, setCurrentResult] = useState<IngestionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [showRawDoc, setShowRawDoc] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Load Samples & Ingest initial sample on boot
  useEffect(() => {
    async function loadSamplesAndInit() {
      try {
        const res = await fetch('/api/samples');
        if (res.ok) {
          const data = await res.json();
          setSamples(data.samples || []);
        }
      } catch (err) {
        console.error('Failed to load sample documents metadata:', err);
      }

      // Automatically ingest first sample to demonstrate instant on-ingestion behavior
      handleSelectSample('sample-lab-report');
    }
    loadSamplesAndInit();
  }, []);

  // Handle Sample Selection
  const handleSelectSample = async (sampleId: string) => {
    setSelectedSampleId(sampleId);
    setIsLoading(true);
    setLoadingStage('Loading medical document...');
    setChatMessages([]);

    try {
      setTimeout(() => setLoadingStage('Translating medical terms into plain English...'), 200);
      setTimeout(() => setLoadingStage('Checking lab values against normal healthy ranges...'), 500);
      setTimeout(() => setLoadingStage('Preparing doctor recommendations and questions...'), 800);

      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleId })
      });

      if (!res.ok) {
        throw new Error(`Ingestion failed with status ${res.status}`);
      }

      const data: IngestionResult = await res.json();
      setCurrentResult(data);
    } catch (err) {
      console.error('Failed to ingest sample document:', err);
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  // Handle Custom Text Submission
  const handleCustomTextSubmit = async (
    text: string,
    title: string,
    docType: DocumentType
  ) => {
    setSelectedSampleId(null);
    setIsLoading(true);
    setLoadingStage('Processing your medical text...');
    setChatMessages([]);

    try {
      const docId = `custom-${Date.now()}`;
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: docId,
          title,
          rawText: text,
          documentType: docType
        })
      });

      if (!res.ok) {
        throw new Error(`Ingestion failed with status ${res.status}`);
      }

      const data: IngestionResult = await res.json();
      setCurrentResult(data);
    } catch (err) {
      console.error('Failed to ingest custom text:', err);
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  // Handle File Upload (PDF, TXT, CSV, MD)
  const handleUploadFile = async (file: File) => {
    setSelectedSampleId(null);
    setIsLoading(true);
    setLoadingStage(`Reading ${file.name}...`);
    setChatMessages([]);

    try {
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        setLoadingStage('Extracting text from PDF report...');
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = (reader.result as string).split(',')[1];
            const res = await fetch('/api/upload-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                base64Data,
                fileName: file.name
              })
            });

            if (!res.ok) {
              throw new Error(`PDF upload failed with status ${res.status}`);
            }

            const data: IngestionResult = await res.json();
            setCurrentResult(data);
          } catch (pdfErr) {
            console.error('Error processing PDF:', pdfErr);
            alert('Failed to process uploaded PDF. Please ensure it contains readable text.');
          } finally {
            setIsLoading(false);
            setLoadingStage('');
          }
        };
        reader.readAsDataURL(file);
      } else {
        const text = await file.text();
        const docType: DocumentType = file.name.toLowerCase().includes('discharge')
          ? 'discharge_summary'
          : file.name.toLowerCase().includes('prescription')
          ? 'prescription'
          : 'lab_report';

        handleCustomTextSubmit(text, file.name.replace(/\.[^/.]+$/, ''), docType);
      }
    } catch (err) {
      console.error('Failed to upload file:', err);
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  // Handle Follow-up Chat Message
  const handleSendMessage = async (question: string) => {
    if (!currentResult) return;

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date().toISOString()
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setIsChatLoading(true);
    setIsChatOpen(true);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: currentResult.documentId,
          question
        })
      });

      if (!res.ok) {
        throw new Error(`Query failed with status ${res.status}`);
      }

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: `msg-assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        timestamp: new Date().toISOString(),
        retrievedChunks: data.retrievedChunks
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error answering question:', err);
      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content:
          'Sorry, I encountered an issue retrieving answers from this document. Please try asking again.',
        timestamp: new Date().toISOString()
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111113] text-white flex flex-col">
      {/* Top Header */}
      <Header
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        hasDocument={!!currentResult}
        documentTitle={currentResult?.title}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
      />

      {/* Variation 1: 2-Column Grid Container Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] border-b border-white/10">
        {/* Left Sidebar / Aside */}
        <aside className="border-r border-white/10 p-6 lg:p-8 flex flex-col gap-6 bg-[#111113]">
          <div>
            <div className="display font-bold text-2xl tracking-tighter leading-tight text-white">
              HEALTH<br />COMPANION
            </div>
            <div className="mono text-[10px] text-white/40 mt-1 tracking-widest">
              AGENT PIPELINE v.2026.08
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="mono text-[11px] text-[#FF4D00] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#FF4D00]"></span>
              <span>[01] INGEST & EXTRACT</span>
            </div>
            <div className="mono text-[11px] text-white/70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white/40"></span>
              <span>[02] EVALUATE RANGES</span>
            </div>
            <div className="mono text-[11px] text-white/70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white/40"></span>
              <span>[03] TRANSLATE JARGON</span>
            </div>
            <div className="mono text-[11px] text-white/70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white/40"></span>
              <span>[04] SPECIALIST QUESTIONS</span>
            </div>
          </div>

          {/* Quick Metrics Glance */}
          {currentResult && (
            <div className="border border-white/10 p-4 bg-[#1B1B1E] space-y-3">
              <div className="mono text-[10px] text-white/50 tracking-wider">
                // ACTIVE RECORD
              </div>
              <div className="text-xs font-medium text-white truncate">
                {currentResult.title}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-center">
                <div className="p-2 bg-black/40 border border-white/5">
                  <div className="display text-lg font-bold text-[#FF4D00]">
                    {currentResult.flaggedItems.length}
                  </div>
                  <div className="mono text-[9px] text-white/50">OUT OF RANGE</div>
                </div>
                <div className="p-2 bg-black/40 border border-white/5">
                  <div className="display text-lg font-bold text-white">
                    {currentResult.simplifiedTerms.length}
                  </div>
                  <div className="mono text-[9px] text-white/50">TERMS PARSED</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-auto pt-6 border-t border-white/10 text-[10px] mono text-white/40 space-y-1">
            <div>STATUS: DETERMINISTIC ENGINE ACTIVE</div>
            <div>GEMINI 3.6 FLASH: ENABLED</div>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <main className="p-4 sm:p-6 lg:p-10 overflow-y-auto bg-[#111113]">
          {/* Hero Header */}
          <div className="mb-8">
            <h1 className="display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Patient Record<br />Simplifier
            </h1>
            <p className="text-sm sm:text-base text-white/70 mt-3 max-w-2xl font-sans leading-relaxed">
              An intelligent clinical record simplifier that automatically parses documents and translates medical jargon into plain language.
            </p>
          </div>

          {/* Top Selector: Choose or Upload Record */}
          <div className="mb-8">
            <DocumentIngestionStage
              samples={samples}
              selectedSampleId={selectedSampleId}
              onSelectSample={handleSelectSample}
              onUploadFile={handleUploadFile}
              onCustomTextSubmit={handleCustomTextSubmit}
              isLoading={isLoading}
              loadingStage={loadingStage}
            />
          </div>

          {isLoading && !currentResult && (
            <div className="border border-white/10 bg-[#1B1B1E] p-12 text-center my-8">
              <Loader2 className="w-8 h-8 text-[#FF4D00] animate-spin mx-auto mb-4" />
              <h3 className="display text-xl font-bold text-white">
                {loadingStage || 'ANALYZING MEDICAL RECORD...'}
              </h3>
              <p className="mono text-xs text-white/50 mt-2 max-w-md mx-auto">
                Running deterministic reference evaluations and neural translation...
              </p>
            </div>
          )}

          {currentResult && (
            <div className="space-y-8 animate-in fade-in pb-16">
              {/* Variation 1 Hero Metrics Grid */}
              {currentResult.flaggedItems.length > 0 && (
                <div>
                  <div className="mono text-[11px] text-white/50 mb-3 tracking-wider">
                    // CRITICAL BIOMARKERS & LAB METRICS
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentResult.flaggedItems.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="bg-[#1B1B1E] border border-white/10 p-6 flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                          <span className="mono text-[10px] text-white/50 uppercase">{item.category}</span>
                          <span className="mono text-[10px] font-bold px-1.5 py-0.5 bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/40">
                            {item.status}
                          </span>
                        </div>
                        <div className="my-4">
                          <div className="display text-3xl sm:text-4xl font-bold text-[#FF4D00]">
                            {item.value} <span className="text-xs font-mono text-white/40">{item.unit}</span>
                          </div>
                          <div className="display text-base font-semibold text-white mt-1">
                            {item.name}
                          </div>
                        </div>
                        <div className="mono text-[10px] text-white/40 border-t border-white/10 pt-2">
                          REF: {item.referenceRange}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 1. Plain English Summary & Key Takeaways */}
              <PlainLanguageSummaryCard
                result={currentResult}
                onToggleRawDoc={() => setShowRawDoc(!showRawDoc)}
                showRawDoc={showRawDoc}
              />

              {/* 2. Flagged Items Table */}
              <FlaggedItemsTable flaggedItems={currentResult.flaggedItems} />

              {/* 3. Recommended Specialists */}
              <SpecialistRecommendationsView
                recommendations={currentResult.specialistRecommendations}
              />

              {/* 4. Medical Dictionary */}
              <MedicalGlossaryView terms={currentResult.simplifiedTerms} />

              {/* Bottom Interactive Bar */}
              <div className="bg-[#1B1B1E] border border-white/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border border-[#FF4D00] bg-[#FF4D00]/10 text-[#FF4D00] flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="display font-bold text-base text-white">
                      HAVE QUESTIONS ABOUT THIS MEDICAL RECORD?
                    </h4>
                    <p className="text-xs text-white/60 mt-0.5">
                      Ask our AI companion anything about your results, medications, or doctor discussions.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-[#FF4D00] hover:bg-[#ff6a26] text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    [ASK QUESTION]
                  </button>
                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-transparent hover:bg-white/10 text-white border border-white/30 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    [PRINT SHEET]
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Grounded Health Companion Chat (Friendly floating or docked helper) */}
      {currentResult && (
        <HealthCompanionChat
          documentId={currentResult.documentId}
          documentTitle={currentResult.title}
          documentType={currentResult.documentType}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          isLoading={isChatLoading}
          onClearChat={() => setChatMessages([])}
          isOpen={isChatOpen}
          onToggleOpen={() => setIsChatOpen(!isChatOpen)}
        />
      )}

      {/* Tool Audit / Telemetry Modal (Cleanly accessible from "How it works") */}
      {currentResult && (
        <ToolAuditInspectorModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          toolLogs={currentResult.toolExecutionLogs}
          chunks={currentResult.chunks}
          currentDocText={currentResult.rawText}
        />
      )}

      {/* Printable Doctor Prep Sheet Modal */}
      {currentResult && (
        <PrintableSummaryModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          result={currentResult}
        />
      )}
    </div>
  );
}
