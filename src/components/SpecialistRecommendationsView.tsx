import React, { useState } from 'react';
import {
  Stethoscope,
  Building2,
  Copy,
  Check,
  CalendarClock,
  HelpCircle,
  Clock
} from 'lucide-react';
import { SpecialistRecommendation, UrgencyLevel } from '../types';

interface SpecialistRecommendationsViewProps {
  recommendations: SpecialistRecommendation[];
}

export const SpecialistRecommendationsView: React.FC<SpecialistRecommendationsViewProps> = ({
  recommendations
}) => {
  const [copiedQuestion, setCopiedQuestion] = useState<string | null>(null);

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const handleCopy = (question: string) => {
    navigator.clipboard.writeText(question);
    setCopiedQuestion(question);
    setTimeout(() => setCopiedQuestion(null), 2000);
  };

  const getUrgencyBadge = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'immediate':
        return { text: 'IMMEDIATE / EMERGENCY', className: 'bg-[#FF4D00] text-black border-[#FF4D00] font-bold' };
      case 'urgent':
        return { text: 'WITHIN 24–48 HOURS', className: 'bg-[#FF4D00]/20 text-[#FF4D00] border-[#FF4D00]/40' };
      case 'soon':
        return { text: 'WITHIN 1–2 WEEKS', className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' };
      default:
        return { text: 'NEXT ROUTINE VISIT', className: 'bg-white/10 text-white/70 border-white/20' };
    }
  };

  return (
    <section className="bg-[#1B1B1E] border border-white/10 p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-white/10">
        <div>
          <h3 className="display font-bold text-xl sm:text-2xl text-white">
            Recommended Doctors & What to Ask
          </h3>
          <p className="mono text-xs text-white/50 mt-1">
            SPECIALISTS TRAINED IN THESE CLINICAL FINDINGS
          </p>
        </div>
        <span className="mono text-xs px-2.5 py-1 border border-white/20 bg-black/40 text-white self-start sm:self-auto">
          [{recommendations.length} SPECIALIST PATHS]
        </span>
      </div>

      {/* Specialist Entries */}
      <div className="space-y-4">
        {recommendations.map((rec) => {
          const urgency = getUrgencyBadge(rec.urgency);

          return (
            <div
              key={rec.id}
              className="p-5 border border-white/10 bg-black/30 hover:bg-black/50 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border border-white/20 bg-black/60 text-[#FF4D00] flex items-center justify-center shrink-0">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="display font-bold text-base text-white">
                      {rec.specialistType}
                    </h4>
                    <span className="mono text-xs text-white/50">
                      DEPARTMENT: {rec.department}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="mono text-xs text-white/40">SCHEDULE:</span>
                  <span className={`mono text-xs px-2.5 py-0.5 border ${urgency.className}`}>
                    {urgency.text}
                  </span>
                </div>
              </div>

              {/* Rationale */}
              <div className="mt-3">
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans">
                  <strong className="text-white">Why see this specialist:</strong> {rec.rationale}
                </p>

                {rec.matchedFlags && rec.matchedFlags.length > 0 && (
                  <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                    <span className="mono text-[10px] text-white/40">TRIGGERED BY:</span>
                    {rec.matchedFlags.map((flag, idx) => (
                      <span
                        key={idx}
                        className="mono text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 text-white/80"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Questions To Ask */}
              {rec.suggestedQuestionsToAsk && rec.suggestedQuestionsToAsk.length > 0 && (
                <div className="mt-4 bg-[#111113] p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                    <span className="mono text-xs font-bold text-[#FF4D00] flex items-center gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>RECOMMENDED DOCTOR QUESTIONS:</span>
                    </span>
                    <span className="mono text-[10px] text-white/40">[CLICK TO COPY]</span>
                  </div>

                  <ul className="space-y-2 pt-1">
                    {rec.suggestedQuestionsToAsk.map((q, idx) => (
                      <li
                        key={idx}
                        className="flex items-start justify-between gap-3 text-xs sm:text-sm text-white/90 p-2 bg-black/40 border border-white/5 hover:border-white/20 transition-colors"
                      >
                        <div className="flex items-start gap-2 font-sans">
                          <span className="mono text-[#FF4D00] font-bold select-none">{`[Q${idx + 1}]`}</span>
                          <span className="leading-snug">"{q}"</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(q)}
                          className="text-white/40 hover:text-[#FF4D00] transition-colors p-1 cursor-pointer shrink-0"
                          title="Copy question"
                        >
                          {copiedQuestion === q ? (
                            <Check className="w-3.5 h-3.5 text-[#FF4D00]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
