import React, { useState } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { SimplifiedTerm } from '../types';

interface MedicalGlossaryViewProps {
  terms: SimplifiedTerm[];
}

export const MedicalGlossaryView: React.FC<MedicalGlossaryViewProps> = ({ terms }) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!terms || terms.length === 0) {
    return null;
  }

  const filteredTerms = terms.filter(
    (t) =>
      t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.plainDefinition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="bg-[#1B1B1E] border border-white/10 p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="display font-bold text-xl sm:text-2xl text-white">
              Medical Terms Made Simple
            </h3>
          </div>
          <p className="mono text-xs text-white/50 mt-1">
            CLINICAL JARGON TRANSLATED TO EVERYDAY CONCEPTS
          </p>
        </div>

        {/* Search */}
        {terms.length > 3 && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH TERMS..."
              className="w-full bg-black/40 border border-white/20 focus:border-[#FF4D00] pl-9 pr-3 py-1.5 mono text-xs text-white outline-none transition-colors uppercase placeholder:text-white/30"
            />
          </div>
        )}
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTerms.map((t, idx) => (
          <div
            key={idx}
            className="p-4 bg-black/30 border border-white/10 hover:border-white/30 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="display font-bold text-sm text-white">
                {t.term}
              </span>
              {t.category && (
                <span className="mono text-[9px] font-bold text-[#FF4D00] bg-[#FF4D00]/10 border border-[#FF4D00]/30 px-1.5 py-0.5">
                  {t.category}
                </span>
              )}
            </div>
            <p className="text-xs text-white/70 leading-relaxed font-sans">
              {t.plainDefinition}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
