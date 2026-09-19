import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  FileText,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { IngestionResult } from '../types';

interface PlainLanguageSummaryCardProps {
  result: IngestionResult;
  onToggleRawDoc: () => void;
  showRawDoc: boolean;
}

export const PlainLanguageSummaryCard: React.FC<PlainLanguageSummaryCardProps> = ({
  result,
  onToggleRawDoc,
  showRawDoc
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Audio read-aloud is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const textToRead = `${result.title}. ${result.plainLanguageSummary}. Key Takeaways: ${result.keyTakeaways.join('. ')}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleCopySummary = () => {
    const text = `${result.title}\n\nSummary:\n${result.plainLanguageSummary}\n\nKey Takeaways:\n${result.keyTakeaways.map((t) => `• ${t}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const paragraphs = result.plainLanguageSummary.split('\n\n').filter((p) => p.trim());

  return (
    <section className="bg-[#1B1B1E] border border-white/10 p-6 sm:p-8">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="mono text-xs text-[#FF4D00] font-bold">
            // SUMMARY
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-tts-summary"
            onClick={handleToggleSpeech}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer border ${
              isSpeaking
                ? 'bg-[#FF4D00] text-black border-[#FF4D00] animate-pulse font-bold'
                : 'bg-transparent hover:bg-white/10 text-white/80 border-white/20'
            }`}
            title="Listen to this summary read out loud"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#FF4D00]" />}
            <span>{isSpeaking ? '[STOP AUDIO]' : '[LISTEN AUDIO]'}</span>
          </button>

          <button
            id="btn-copy-summary"
            onClick={handleCopySummary}
            className="px-3 py-1.5 bg-transparent hover:bg-white/10 text-white/80 border border-white/20 text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Copy this explanation to clipboard"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-[#FF4D00]" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
            <span>{isCopied ? '[COPIED]' : '[COPY]'}</span>
          </button>

          <button
            id="btn-toggle-raw-source"
            onClick={onToggleRawDoc}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer border ${
              showRawDoc
                ? 'bg-white/20 text-white border-white/40 font-bold'
                : 'bg-transparent hover:bg-white/10 text-white/70 border-white/20'
            }`}
            title="Show the original unsimplified doctor document"
          >
            <FileText className="w-3.5 h-3.5 text-white/50" />
            <span>{showRawDoc ? '[HIDE NOTE]' : '[VIEW NOTE]'}</span>
          </button>
        </div>
      </div>

      {/* Main Title & Document Name */}
      <div className="mt-5 mb-4">
        <h2 className="display text-2xl sm:text-3xl font-bold text-white tracking-tight">
          What Your Medical Record Means
        </h2>
        <p className="mono text-xs text-white/50 mt-1">
          RECORD: <span className="text-white font-medium">{result.title}</span>
        </p>
      </div>

      {/* Plain Language Body Text */}
      <div className="text-sm sm:text-base leading-relaxed text-white/80 space-y-3.5 max-w-3xl font-sans">
        {paragraphs.map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}
      </div>

      {/* Key Takeaways Box */}
      {result.keyTakeaways && result.keyTakeaways.length > 0 && (
        <div className="mt-6 bg-black/40 border border-white/10 p-5">
          <h3 className="mono text-xs font-bold uppercase tracking-wider text-[#FF4D00] mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#FF4D00]"></span>
            <span>KEY CLINICAL TAKEAWAYS:</span>
          </h3>
          <ul className="space-y-2.5">
            {result.keyTakeaways.map((takeaway, idx) => (
              <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-white/90 leading-relaxed font-sans">
                <span className="mono text-[#FF4D00] font-bold shrink-0">{`[0${idx + 1}]`}</span>
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Collapsible Raw Original Document */}
      {showRawDoc && (
        <div className="mt-6 pt-5 border-t border-white/10 animate-in fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="mono text-xs font-bold uppercase tracking-wider text-white/50">
              // RAW CLINICAL RECORD SOURCE
            </span>
            <span className="mono text-[10px] text-white/40">
              UNMODIFIED SOURCE TEXT
            </span>
          </div>
          <pre className="p-4 bg-black/60 text-white/80 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-72 border border-white/10 leading-relaxed">
            {result.rawText}
          </pre>
        </div>
      )}
    </section>
  );
};
