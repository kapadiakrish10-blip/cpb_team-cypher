import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Info,
  SlidersHorizontal,
  LayoutGrid,
  ListFilter,
  CheckCircle2
} from 'lucide-react';
import { FlaggedItem, FlagStatus } from '../types';

interface FlaggedItemsTableProps {
  flaggedItems: FlaggedItem[];
}

export const FlaggedItemsTable: React.FC<FlaggedItemsTableProps> = ({ flaggedItems }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  if (!flaggedItems || flaggedItems.length === 0) {
    return (
      <section className="bg-[#1B1B1E] border border-white/10 p-8 text-center">
        <div className="w-10 h-10 border border-[#FF4D00] text-[#FF4D00] flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h3 className="display font-bold text-lg text-white">ALL METRICS WITHIN STANDARD RANGE</h3>
        <p className="mono text-xs text-white/50 mt-1 max-w-md mx-auto">
          No abnormal test values or red flags were identified in this clinical record.
        </p>
      </section>
    );
  }

  const categories = ['all', ...Array.from(new Set(flaggedItems.map((f) => f.category)))];

  const filteredItems =
    activeCategory === 'all'
      ? flaggedItems
      : flaggedItems.filter((f) => f.category === activeCategory);

  const getSeverityStyle = (status: FlagStatus) => {
    switch (status) {
      case 'CRITICAL':
      case 'HIGH':
        return {
          badgeClass: 'bg-[#FF4D00]/20 text-[#FF4D00] border-[#FF4D00]/40',
          borderClass: 'border-[#FF4D00]/40 bg-[#FF4D00]/5',
          labelText: status === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          icon: <TrendingUp className="w-3.5 h-3.5 text-[#FF4D00]" />
        };
      case 'LOW':
        return {
          badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
          borderClass: 'border-cyan-500/30 bg-cyan-500/5',
          labelText: 'LOW',
          icon: <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />
        };
      case 'WARNING':
        return {
          badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          borderClass: 'border-amber-500/30 bg-amber-500/5',
          labelText: 'ATTENTION',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        };
      default:
        return {
          badgeClass: 'bg-white/10 text-white/80 border-white/20',
          borderClass: 'border-white/10 bg-white/5',
          labelText: 'NORMAL',
          icon: <Info className="w-3.5 h-3.5 text-white/70" />
        };
    }
  };

  return (
    <section className="bg-[#1B1B1E] border border-white/10 p-6 sm:p-8">
      {/* Header with Title & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="display font-bold text-xl sm:text-2xl text-white">
              Results That Need Attention
            </h3>
            <span className="mono text-xs font-bold px-2 py-0.5 bg-[#FF4D00] text-black">
              {flaggedItems.length} FLAGGED
            </span>
          </div>
          <p className="mono text-xs text-white/50 mt-1">
            LAB METRICS OUTSIDE STANDARD REFERENCE RANGES
          </p>
        </div>

        {/* View toggles & Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {categories.length > 2 && (
            <div className="flex items-center gap-1 border border-white/10 p-1 bg-black/40">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 text-xs mono uppercase transition-colors cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-white text-black font-bold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center border border-white/10 bg-black/40">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 cursor-pointer transition-colors ${
                viewMode === 'grid' ? 'bg-white text-black' : 'text-white/50 hover:text-white'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 cursor-pointer transition-colors ${
                viewMode === 'table' ? 'bg-white text-black' : 'text-white/50 hover:text-white'
              }`}
              title="Table View"
            >
              <ListFilter className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const style = getSeverityStyle(item.status);
            return (
              <div
                key={item.id}
                className={`p-5 border transition-all flex flex-col justify-between ${style.borderClass}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="mono text-[10px] text-white/50 uppercase tracking-wide">
                      {item.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 mono text-[10px] font-bold px-2 py-0.5 border ${style.badgeClass}`}
                    >
                      {style.icon}
                      <span>{style.labelText}</span>
                    </span>
                  </div>

                  <h4 className="display font-semibold text-base text-white leading-snug">
                    {item.name}
                  </h4>

                  <div className="my-3 flex items-baseline gap-2">
                    <span className="display text-2xl font-bold text-[#FF4D00]">
                      {item.value} <span className="mono text-xs text-white/50">{item.unit}</span>
                    </span>
                    <span className="mono text-xs text-white/40">
                      (REF: {item.referenceRange})
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 mt-2">
                  <p className="text-xs text-white/70 leading-relaxed font-sans">
                    {item.plainExplanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Mode */
        <div className="border border-white/10 overflow-hidden bg-black/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111113] border-b border-white/10 mono text-[10px] text-white/60 uppercase">
                <tr>
                  <th className="p-3">TEST METRIC</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">YOUR RESULT</th>
                  <th className="p-3">NORMAL RANGE</th>
                  <th className="p-3">EXPLANATION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {filteredItems.map((item) => {
                  const style = getSeverityStyle(item.status);
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-semibold text-white">
                        <div className="display text-sm">{item.name}</div>
                        <span className="mono text-[10px] text-white/40 uppercase">{item.category}</span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 mono text-[10px] font-bold px-2 py-0.5 border ${style.badgeClass}`}>
                          {style.icon}
                          <span>{style.labelText}</span>
                        </span>
                      </td>
                      <td className="p-3 display font-bold text-base text-[#FF4D00]">
                        {item.value} <span className="mono text-xs text-white/50">{item.unit}</span>
                      </td>
                      <td className="p-3 mono text-xs text-white/60">
                        {item.referenceRange}
                      </td>
                      <td className="p-3 text-xs text-white/80 max-w-sm leading-relaxed">
                        {item.plainExplanation}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
