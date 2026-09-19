import React, { useState } from 'react';
import { X, Terminal, CheckCircle2, Play, BookOpen, Layers, ShieldCheck, Cpu } from 'lucide-react';
import { ToolExecutionLog } from '../types';

interface ToolAuditInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolLogs?: ToolExecutionLog[];
  logs?: ToolExecutionLog[];
  chunks?: any[];
  currentDocText?: string;
}

export const ToolAuditInspectorModal: React.FC<ToolAuditInspectorModalProps> = ({
  isOpen,
  onClose,
  toolLogs,
  logs
}) => {
  const activeLogs = toolLogs || logs || [];
  const [activeTab, setActiveTab] = useState<'logs' | 'tester' | 'rules'>('logs');
  const [testInput, setTestInput] = useState(
    'Fasting Blood Glucose 195 mg/dL, Serum Creatinine 2.1 mg/dL, eGFR 34 mL/min/1.73m2, Blood Pressure 158/92 mmHg'
  );
  const [testOutput, setTestOutput] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleRunTest = async () => {
    setIsTesting(true);
    try {
      const res = await fetch('/api/tools/simplify-and-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordText: testInput,
          documentTitle: 'Interactive Test Probe',
          documentType: 'lab_report'
        })
      });
      const data = await res.json();
      setTestOutput(data);
    } catch (e: any) {
      setTestOutput({ error: e.message || 'Failed to run tool' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#111113] border border-white/20 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-white shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#1B1B1E]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 border border-[#FF4D00] bg-[#FF4D00]/10 text-[#FF4D00]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="display text-sm font-bold text-white tracking-wide">
                CLINICAL TOOL AUDIT & RULE ENGINE
              </h3>
              <p className="mono text-[11px] text-white/50">
                DETERMINISTIC LAB REFERENCE THRESHOLDS & PARSING PROBES
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer font-mono"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-6 bg-[#111113] gap-6 text-xs mono">
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 border-b-2 transition-colors cursor-pointer uppercase ${
              activeTab === 'logs'
                ? 'border-[#FF4D00] text-[#FF4D00] font-bold'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            [AUDIT LOGS: {activeLogs.length}]
          </button>
          <button
            onClick={() => setActiveTab('tester')}
            className={`py-3 border-b-2 transition-colors cursor-pointer uppercase ${
              activeTab === 'tester'
                ? 'border-[#FF4D00] text-[#FF4D00] font-bold'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            [TEST INPUT PROBE]
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 border-b-2 transition-colors cursor-pointer uppercase ${
              activeTab === 'rules'
                ? 'border-[#FF4D00] text-[#FF4D00] font-bold'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            [REFERENCE METRICS]
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#111113]">
          {activeTab === 'logs' && (
            <div className="space-y-3">
              {activeLogs.length === 0 ? (
                <p className="mono text-xs text-white/50 text-center py-8">
                  NO TOOL RUNS LOGGED IN THIS SESSION YET.
                </p>
              ) : (
                activeLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 border border-white/10 bg-[#1B1B1E] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="mono font-bold text-[#FF4D00]">
                        {log.toolName}
                      </span>
                      <span className="mono text-[10px] text-white/40">
                        {new Date(log.timestamp).toLocaleTimeString()} ({log.durationMs}ms)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] mono">
                      <div>
                        <span className="text-white/40">STATUS: </span>
                        <span className="font-bold text-white">{log.status.toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-white/40">FLAGGED: </span>
                        <span className="font-bold text-[#FF4D00]">
                          {log.outputSummary?.flaggedCount ?? log.outputSummary?.itemsCount ?? 0}
                        </span>
                      </div>
                    </div>

                    {log.outputSummary && (
                      <details className="mt-2 text-[11px]">
                        <summary className="mono text-white/70 cursor-pointer hover:text-[#FF4D00]">
                          [VIEW RAW JSON PAYLOAD]
                        </summary>
                        <pre className="mt-2 p-3 bg-black border border-white/10 text-white/90 overflow-x-auto text-[10px] font-mono leading-relaxed">
                          {JSON.stringify(log.outputSummary, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'tester' && (
            <div className="space-y-3 bg-[#1B1B1E] p-5 border border-white/10">
              <p className="mono text-xs text-white/60">
                PROVIDE CLINICAL RECORD TEXT FOR DETERMINISTIC LAB THRESHOLD PARSING:
              </p>
              <textarea
                rows={3}
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="w-full bg-black/60 border border-white/20 p-3 mono text-xs text-white outline-none focus:border-[#FF4D00]"
              />
              <button
                onClick={handleRunTest}
                disabled={isTesting || !testInput.trim()}
                className="px-4 py-2 bg-[#FF4D00] hover:bg-[#ff6a26] disabled:opacity-50 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>{isTesting ? '[ANALYZING...]' : '[EXECUTE PROBE]'}</span>
              </button>

              {testOutput && (
                <div className="mt-3">
                  <span className="mono text-[10px] text-white/50 uppercase">ANALYSIS PAYLOAD:</span>
                  <pre className="mt-1 p-3 bg-black border border-white/10 text-[#FF4D00] overflow-x-auto text-[10px] font-mono leading-relaxed max-h-56">
                    {JSON.stringify(testOutput, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="border border-white/10 overflow-hidden bg-[#1B1B1E]">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/60 border-b border-white/10 mono text-white/60 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">METRIC</th>
                    <th className="p-3">STANDARD RANGE</th>
                    <th className="p-3">CLINICAL ALERT TRIGGER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 mono text-xs">
                  <tr>
                    <td className="p-3 font-semibold text-white">Fasting Glucose</td>
                    <td className="p-3 text-white/60">70 - 99 mg/dL</td>
                    <td className="p-3 text-[#FF4D00]">&lt; 70 or &gt; 125 mg/dL</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Serum Creatinine</td>
                    <td className="p-3 text-white/60">0.7 - 1.3 mg/dL</td>
                    <td className="p-3 text-[#FF4D00]">&gt; 1.3 mg/dL (Kidney warning)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">eGFR</td>
                    <td className="p-3 text-white/60">&gt; 60 mL/min/1.73m²</td>
                    <td className="p-3 text-[#FF4D00]">&lt; 60 mL/min (Reduced filtration)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Blood Pressure</td>
                    <td className="p-3 text-white/60">&lt; 120 / &lt; 80 mmHg</td>
                    <td className="p-3 text-[#FF4D00]">&gt; 140/90 mmHg (Hypertension)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">LDL Cholesterol</td>
                    <td className="p-3 text-white/60">&lt; 100 mg/dL</td>
                    <td className="p-3 text-[#FF4D00]">&gt; 160 mg/dL (High risk)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
