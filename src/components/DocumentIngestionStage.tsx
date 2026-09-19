import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  FileCheck2,
  ClipboardPaste,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  FlaskConical,
  Building2,
  Pill,
  CheckCircle
} from 'lucide-react';
import { DocumentType } from '../types';

interface SampleDocMeta {
  id: string;
  title: string;
  documentType: DocumentType;
  encounterDate?: string;
  preview: string;
}

interface DocumentIngestionStageProps {
  samples: SampleDocMeta[];
  selectedSampleId: string | null;
  onSelectSample: (sampleId: string) => void;
  onUploadFile: (file: File) => void;
  onCustomTextSubmit: (text: string, title: string, docType: DocumentType) => void;
  isLoading: boolean;
  loadingStage: string;
}

export const DocumentIngestionStage: React.FC<DocumentIngestionStageProps> = ({
  samples,
  selectedSampleId,
  onSelectSample,
  onUploadFile,
  onCustomTextSubmit,
  isLoading,
  loadingStage
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [customText, setCustomText] = useState('');
  const [customTitle, setCustomTitle] = useState('My Medical Note');
  const [customDocType, setCustomDocType] = useState<DocumentType>('lab_report');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onUploadFile(file);
      setShowUploadArea(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onUploadFile(file);
      setShowUploadArea(false);
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    onCustomTextSubmit(customText, customTitle, customDocType);
    setShowPasteArea(false);
  };

  const getSampleCardInfo = (sampleId: string) => {
    if (sampleId === 'sample-lab-report') {
      return {
        icon: <FlaskConical className="w-4 h-4 text-[#FF4D00]" />,
        friendlyName: 'Blood Test & Metabolism',
        badge: 'LAB REPORT',
        simpleSummary: 'Blood sugar, kidney numbers, liver enzymes & cholesterol levels.'
      };
    }
    if (sampleId === 'sample-discharge-summary') {
      return {
        icon: <Building2 className="w-4 h-4 text-cyan-400" />,
        friendlyName: 'Hospital Surgery Discharge',
        badge: 'HOSPITAL NOTE',
        simpleSummary: 'Recovery plan after gallbladder surgery, activity limits & signs of infection.'
      };
    }
    return {
      icon: <Pill className="w-4 h-4 text-amber-400" />,
      friendlyName: 'Prescription & Medication Plan',
      badge: 'PRESCRIPTIONS',
      simpleSummary: 'Blood pressure, diabetes & pain medicines with safe timing instructions.'
    };
  };

  return (
    <div className="bg-[#1B1B1E] border border-white/10 p-5 sm:p-6">
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
          <div>
            <h2 className="display text-base font-bold text-white flex items-center gap-2 tracking-tight">
              <span>STEP 1: SELECT CLINICAL SAMPLE OR INGEST RECORD</span>
            </h2>
            <p className="mono text-xs text-white/50 mt-0.5">
              CHOOSE A CLINICAL BENCHMARK OR IMPORT PATIENT ARTIFACT
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowUploadArea(!showUploadArea);
                setShowPasteArea(false);
              }}
              className="px-3.5 py-1.5 bg-transparent hover:bg-white/10 text-white border border-white/30 text-xs mono uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#FF4D00]" />
              <span>[UPLOAD FILE]</span>
            </button>
            <button
              onClick={() => {
                setShowPasteArea(!showPasteArea);
                setShowUploadArea(false);
              }}
              className="px-3.5 py-1.5 bg-transparent hover:bg-white/10 text-white/80 border border-white/20 text-xs mono uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-white/50" />
              <span>[PASTE TEXT]</span>
            </button>
          </div>
        </div>

        {/* Loading Progress Notification */}
        {isLoading && (
          <div className="mb-4 p-3 bg-black/60 border border-[#FF4D00]/50 flex items-center gap-3 text-white text-xs mono animate-pulse">
            <Loader2 className="w-4 h-4 text-[#FF4D00] animate-spin shrink-0" />
            <div>
              <span className="font-bold text-[#FF4D00]">{loadingStage || 'PROCESSING CLINICAL DOCUMENT...'}</span>
              <p className="text-[11px] text-white/60 mt-0.5">
                Parsing lab test values against standard biological ranges.
              </p>
            </div>
          </div>
        )}

        {/* Sample Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {samples.map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            const info = getSampleCardInfo(sample.id);

            return (
              <button
                key={sample.id}
                onClick={() => onSelectSample(sample.id)}
                disabled={isLoading}
                className={`text-left p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#FF4D00] bg-[#FF4D00]/10 ring-1 ring-[#FF4D00]'
                    : 'border-white/10 bg-black/30 hover:border-white/30 hover:bg-black/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 border border-white/10 bg-black/40">
                        {info.icon}
                      </div>
                      <span className="mono text-[10px] text-white/50 tracking-wider uppercase">
                        {info.badge}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="mono text-[9px] font-bold text-black bg-[#FF4D00] px-1.5 py-0.5 uppercase">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <h3 className="display font-semibold text-sm text-white leading-snug">
                    {info.friendlyName}
                  </h3>
                  <p className="text-xs text-white/60 mt-1.5 leading-relaxed font-sans">
                    {info.simpleSummary}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dropzone Upload Area (Expandable) */}
        {showUploadArea && (
          <div className="mt-4 p-6 border border-dashed border-[#FF4D00]/60 bg-black/50 text-center animate-in fade-in">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center cursor-pointer py-3"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-10 h-10 border border-[#FF4D00] text-[#FF4D00] flex items-center justify-center mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <h4 className="display font-bold text-sm text-white">
                DRAG AND DROP CLINICAL RECORD HERE
              </h4>
              <p className="mono text-xs text-white/50 mt-1 max-w-sm">
                PDF, TXT, CSV, OR CLINICAL SUMMARIES
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.csv,.md"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="mt-4 inline-block px-4 py-2 bg-[#FF4D00] text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#ff6a26] transition-colors">
                [SELECT LOCAL FILE]
              </span>
            </div>
          </div>
        )}

        {/* Custom Text Paste Area (Expandable) */}
        {showPasteArea && (
          <form onSubmit={handlePasteSubmit} className="mt-4 p-4 border border-white/10 bg-black/50 animate-in fade-in space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block mono text-[11px] text-white/70 mb-1">
                  RECORD TITLE / IDENTIFIER:
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 px-3 py-1.5 mono text-xs text-white focus:border-[#FF4D00] outline-none"
                  placeholder="e.g. Lab Specimen Panel - Aug 2026"
                />
              </div>
              <div className="sm:w-48">
                <label className="block mono text-[11px] text-white/70 mb-1">
                  RECORD CLASSIFICATION:
                </label>
                <select
                  value={customDocType}
                  onChange={(e) => setCustomDocType(e.target.value as DocumentType)}
                  className="w-full bg-[#1B1B1E] border border-white/20 px-3 py-1.5 mono text-xs text-white focus:border-[#FF4D00] outline-none"
                >
                  <option value="lab_report">Lab / Blood Report</option>
                  <option value="discharge_summary">Discharge Summary</option>
                  <option value="prescription">Prescription / Rx</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mono text-[11px] text-white/70 mb-1">
                PASTE UNFORMATTED CLINICAL TEXT:
              </label>
              <textarea
                rows={4}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Glucose: 195 mg/dL, Creatinine: 2.1 mg/dL, Blood Pressure: 155/90..."
                className="w-full bg-black/60 border border-white/20 p-3 mono text-xs text-white focus:border-[#FF4D00] outline-none font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPasteArea(false)}
                className="px-3 py-1.5 mono text-xs text-white/50 hover:text-white"
              >
                [CANCEL]
              </button>
              <button
                type="submit"
                disabled={!customText.trim() || isLoading}
                className="px-4 py-2 bg-[#FF4D00] hover:bg-[#ff6a26] disabled:opacity-50 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                [SIMPLIFY PASTED TEXT]
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
