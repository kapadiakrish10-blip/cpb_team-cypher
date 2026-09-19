import React from 'react';
import { HeartPulse, Printer, MessageSquare, Info, ShieldAlert, Terminal } from 'lucide-react';

interface HeaderProps {
  onOpenAuditModal: () => void;
  onOpenPrintModal: () => void;
  hasDocument: boolean;
  documentTitle?: string;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuditModal,
  onOpenPrintModal,
  hasDocument,
  documentTitle,
  isChatOpen,
  onToggleChat
}) => {
  return (
    <header className="bg-[#1B1B1E] border-b border-white/10 sticky top-0 z-30">
      <div className="w-full px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Brand & Subtitle in Space Grotesk / JetBrains Mono */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border border-white/20 bg-black/40 text-[#FF4D00] flex items-center justify-center shrink-0">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="display font-bold text-lg text-white tracking-tight uppercase">
                Health Companion
              </h1>
              <span className="mono text-[10px] bg-[#FF4D00]/15 text-[#FF4D00] border border-[#FF4D00]/30 px-1.5 py-0.5 font-bold">
                SIMPLIFIER
              </span>
            </div>
            <p className="mono text-[11px] text-white/50 tracking-wider">
              PLAIN LANGUAGE CLINICAL COMPANION & AGENT
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasDocument && (
            <button
              id="btn-print-summary"
              onClick={onOpenPrintModal}
              className="px-3.5 py-2 bg-transparent hover:bg-white/10 text-white border border-white/30 text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
              title="Print a clear summary sheet to bring to your doctor appointment"
            >
              <Printer className="w-3.5 h-3.5 text-[#FF4D00]" />
              <span>Print Doctor Sheet</span>
            </button>
          )}

          {onToggleChat && (
            <button
              id="btn-toggle-chat"
              onClick={onToggleChat}
              className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider border transition-colors flex items-center gap-2 cursor-pointer ${
                isChatOpen
                  ? 'bg-[#FF4D00] text-black font-bold border-[#FF4D00]'
                  : 'bg-transparent hover:bg-white/10 text-white border-white/30'
              }`}
              title="Ask questions about your health record"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isChatOpen ? '[Hide Assistant]' : '[Ask Question]'}</span>
            </button>
          )}

          <button
            id="btn-open-audit-tools"
            onClick={onOpenAuditModal}
            className="px-3 py-2 bg-transparent hover:bg-white/10 text-white/70 hover:text-white border border-white/20 text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
            title="View clinical tool execution and laboratory reference checks"
          >
            <Terminal className="w-3.5 h-3.5 text-[#FF4D00]" />
            <span>Tools Audit</span>
          </button>
        </div>
      </div>

      {/* Reassuring Medical Disclaimer Banner */}
      <div className="bg-black/50 border-t border-white/10 px-6 py-2 text-[11px] text-white/70 flex items-center justify-between gap-2 mono">
        <div className="flex items-center gap-2 w-full">
          <ShieldAlert className="w-3.5 h-3.5 text-[#FF4D00] shrink-0" />
          <span className="leading-tight">
            <strong className="text-white">// CLINICAL NOTICE:</strong> Educational summaries and doctor preparation guidance. Not a medical diagnosis or medical advice.
          </span>
          {documentTitle && (
            <span className="hidden md:inline-block ml-auto text-white/50 text-[11px] truncate max-w-sm">
              DOCUMENT: <span className="text-white font-semibold">{documentTitle}</span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
