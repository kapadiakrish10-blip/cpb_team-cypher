import React from 'react';
import { X, Printer, ShieldAlert, CheckCircle2, Stethoscope, AlertTriangle } from 'lucide-react';
import { IngestionResult } from '../types';

interface PrintableSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: IngestionResult;
}

export const PrintableSummaryModal: React.FC<PrintableSummaryModalProps> = ({
  isOpen,
  onClose,
  result
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden print:border-none print:shadow-none print:max-h-full print:w-full print:bg-white text-slate-900">
        {/* Modal Controls (Hidden in Print) */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Printer className="w-4 h-4 text-teal-600" />
            <span>Doctor Appointment Preparation Sheet</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 print:p-0 print:overflow-visible bg-white">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-3">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Patient Health Summary — Appointment Briefing
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prepared for consultation with your primary care provider or specialist.
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>Date: {new Date().toLocaleDateString()}</div>
                <div className="font-semibold text-teal-700 capitalize">
                  {result.documentType.replace('_', ' ')}
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-800">
              Document: {result.title}
            </div>
          </div>

          {/* Medical Notice */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2 print:border-gray-300">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Note for Healthcare Providers:</strong> This summary was prepared with AI translation tools to help the patient articulate their questions clearly. Please refer to laboratory certified originals for diagnostic decisions.
            </span>
          </div>

          {/* Section 1: Plain Language Summary */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
              1. Summary in Plain English
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">
              {result.plainLanguageSummary}
            </p>
          </div>

          {/* Section 2: Key Takeaways */}
          {result.keyTakeaways && result.keyTakeaways.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1.5">
                2. Key Takeaways & Things to Watch
              </h2>
              <ul className="list-disc list-inside text-xs text-slate-800 space-y-1">
                {result.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx}>{takeaway}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 3: Flagged Metrics Table */}
          {result.flaggedItems && result.flaggedItems.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1.5">
                3. Flagged Out-of-Range Results
              </h2>
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-50 text-[10px] text-slate-700 font-semibold uppercase">
                  <tr>
                    <th className="p-2 border-b border-slate-200">Test / Metric</th>
                    <th className="p-2 border-b border-slate-200">Patient Result</th>
                    <th className="p-2 border-b border-slate-200">Standard Range</th>
                    <th className="p-2 border-b border-slate-200">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.flaggedItems.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2 font-medium text-slate-900">{item.name}</td>
                      <td className="p-2 font-bold text-slate-900">
                        {item.value} {item.unit}
                      </td>
                      <td className="p-2 text-slate-600">{item.referenceRange}</td>
                      <td className="p-2 font-semibold text-rose-700">
                        {item.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Section 4: Recommended Questions for Appointment */}
          {result.specialistRecommendations && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1.5">
                4. Questions to Discuss with Doctor
              </h2>
              <div className="space-y-2">
                {result.specialistRecommendations.map((rec) => (
                  <div key={rec.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                    <div className="font-bold text-slate-900 flex items-center justify-between mb-1">
                      <span>{rec.specialistType} ({rec.department})</span>
                      <span className="text-[11px] text-teal-700 font-medium capitalize">
                        Timing: {rec.urgency}
                      </span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {rec.suggestedQuestionsToAsk.map((q, idx) => (
                        <li key={idx}>"{q}"</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patient Signature Line */}
          <div className="pt-6 border-t border-slate-300 flex justify-between text-xs text-slate-500">
            <div>Patient Signature: _______________________</div>
            <div>Doctor / Clinician Reviewer: _______________________</div>
          </div>
        </div>
      </div>
    </div>
  );
};
