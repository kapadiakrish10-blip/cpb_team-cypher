import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Minimize2,
  Maximize2,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { ChatMessage, DocumentType } from '../types';

interface HealthCompanionChatProps {
  documentId: string;
  documentTitle: string;
  documentType: DocumentType;
  messages: ChatMessage[];
  onSendMessage: (question: string) => Promise<void>;
  isLoading: boolean;
  onClearChat: () => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
}

export const HealthCompanionChat: React.FC<HealthCompanionChatProps> = ({
  documentId,
  documentTitle,
  documentType,
  messages,
  onSendMessage,
  isLoading,
  onClearChat,
  isOpen = true,
  onToggleOpen
}) => {
  const [inputQuestion, setInputQuestion] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isLoading) return;
    const q = inputQuestion.trim();
    setInputQuestion('');
    await onSendMessage(q);
  };

  const toggleSource = (msgId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const getStarterQuestions = () => {
    switch (documentType) {
      case 'lab_report':
        return [
          'What do my elevated kidney numbers (creatinine & eGFR) mean?',
          'What is a healthy target for my blood sugar?'
        ];
      case 'discharge_summary':
        return [
          'What warning signs mean I should call the doctor or go to the ER?',
          'When can I shower and what are my lifting limits?'
        ];
      case 'prescription':
        return [
          'Can I take over-the-counter painkillers like Advil or Tylenol?',
          'Why should I take Metformin with food?'
        ];
      default:
        return [
          'Are any of these results urgent?',
          'What questions should I ask my doctor?'
        ];
    }
  };

  // If closed from header button
  if (isOpen === false) {
    return (
      <button
        onClick={onToggleOpen}
        className="fixed bottom-5 right-5 z-40 px-4 py-3 bg-[#FF4D00] hover:bg-[#ff6a26] text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer shadow-2xl"
        title="Open Question Assistant"
      >
        <MessageSquare className="w-4 h-4 text-black" />
        <span>[ASK COMPANION]</span>
      </button>
    );
  }

  // If minimized state
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-40 bg-[#1B1B1E] border border-white/20 p-3 flex items-center gap-3 shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#FF4D00] animate-pulse" />
          <span className="mono text-xs font-bold text-white">
            COMPANION ACTIVE
          </span>
        </div>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          title="Expand"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 w-[92vw] sm:w-[440px] h-[540px] max-h-[85vh] bg-[#111113] border border-white/20 flex flex-col shadow-2xl overflow-hidden font-sans">
      {/* Friendly Chat Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#1B1B1E] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 border border-[#FF4D00] bg-[#FF4D00]/10 text-[#FF4D00] flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="display text-xs font-bold text-white leading-none">
              HEALTH COMPANION AGENT
            </h4>
            <p className="mono text-[10px] text-white/50 mt-0.5">
              GROUNDED PATIENT INQUIRY CONVERSATION
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={onClearChat}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Clear conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          {onToggleOpen && (
            <button
              onClick={onToggleOpen}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs font-mono font-bold"
              title="Close"
            >
              [✕]
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col bg-[#111113]">
        {messages.length === 0 ? (
          <div className="my-auto text-center space-y-3 p-2">
            <div className="w-10 h-10 border border-[#FF4D00] text-[#FF4D00] flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="mono text-xs text-white/70">
              INQUIRE ABOUT <span className="text-white font-bold">{documentTitle}</span>:
            </p>
            <div className="space-y-2 text-left">
              {getStarterQuestions().map((sq, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(sq)}
                  className="w-full text-left p-2.5 bg-[#1B1B1E] border border-white/10 hover:border-[#FF4D00] text-xs text-white/90 hover:text-white transition-colors cursor-pointer leading-snug font-sans"
                >
                  <span className="mono text-[#FF4D00] text-[10px] mr-1">{`[0${i+1}]`}</span> "{sq}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isSourceOpen = expandedSources[msg.id];

            return (
              <div
                key={msg.id}
                className={`max-w-[85%] p-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-[#FF4D00] text-black font-semibold self-end'
                    : 'bg-[#1B1B1E] text-white border border-white/10 self-start'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Grounded Document Sources Toggle */}
                {!isUser && msg.retrievedChunks && msg.retrievedChunks.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => toggleSource(msg.id)}
                      className="mono text-[10px] text-[#FF4D00] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FileCheck className="w-3 h-3 text-[#FF4D00]" />
                      <span>[{msg.retrievedChunks.length} CITATIONS VERIFIED]</span>
                      {isSourceOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {isSourceOpen && (
                      <div className="mt-2 space-y-1.5">
                        {msg.retrievedChunks.map((c) => (
                          <div
                            key={c.chunkId}
                            className="bg-black/60 p-2 border border-white/10 mono text-[10px] text-white/70"
                          >
                            <div className="font-bold text-[#FF4D00] mb-0.5">
                              SECTION: {c.section}
                            </div>
                            <p className="line-clamp-2 text-white/80 font-sans">
                              "{c.snippet}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="self-start bg-[#1B1B1E] border border-[#FF4D00]/40 text-[#FF4D00] p-3 text-xs mono flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>EXTRACTING ANSWER FROM RECORD...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-[#1B1B1E] flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="TYPE INQUIRY (E.G. WHAT DOES GLUCOSE 195 MEAN?)..."
          disabled={isLoading}
          className="flex-1 bg-black/60 border border-white/20 focus:border-[#FF4D00] p-2.5 mono text-xs text-white outline-none placeholder:text-white/30 uppercase"
        />
        <button
          type="submit"
          disabled={!inputQuestion.trim() || isLoading}
          className="p-2.5 bg-[#FF4D00] hover:bg-[#ff6a26] disabled:opacity-40 text-black transition-colors cursor-pointer shrink-0 font-bold"
          title="Send question"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
