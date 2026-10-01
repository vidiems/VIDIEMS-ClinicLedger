import React, { useState } from 'react';
import { ARCHITECTURAL_REPORT } from '../data/architecturalReport';
import { ShieldCheck, BookOpen, CheckCircle2, ChevronRight, Terminal, ArrowRight } from 'lucide-react';

export const ArchitectReportView: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState<string>(ARCHITECTURAL_REPORT[0].id);

  const activeSection = ARCHITECTURAL_REPORT.find(s => s.id === activeSectionId) || ARCHITECTURAL_REPORT[0];

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
          <span>Enterprise Database Architecture Brief</span>
          <span>·</span>
          <span>Lead Systems Architect Whitepaper</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white">
          VIDIEMS ClinicLedger Database Architecture & Rationale
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Comprehensive technical defense of normalization boundaries, multi-channel payment logging safeguards, automated ledger reconciliation triggers, and HMO claim state machines.
        </p>
      </div>

      {/* Main Layout: Navigation + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Section Selector */}
        <div className="space-y-2">
          {ARCHITECTURAL_REPORT.map((section) => {
            const isActive = section.id === activeSectionId;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-cyan-400">{section.badge}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-sm font-semibold text-slate-100 leading-snug">
                  {section.title}
                </div>
              </button>
            );
          })}

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-2 text-slate-400">
            <div className="text-slate-300 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Standard Compliance
            </div>
            <div>· ANSI SQL-92 / ISO 9075</div>
            <div>· HIPAA Audit Log Retention</div>
            <div>· PCI-DSS Masked PAN Logs</div>
            <div>· GAAP Double-Entry Alignment</div>
          </div>
        </div>

        {/* Right Column: Detailed Section Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                <span>{activeSection.badge}</span>
                <span>·</span>
                <span>Architectural Specification</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                {activeSection.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {activeSection.summary}
              </p>
            </div>

            {/* Narrative Prose */}
            <div className="space-y-3 border-t border-slate-800 pt-4 text-sm text-slate-300 leading-relaxed">
              {activeSection.content.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            {/* Architectural Decisions & Invariant Defense */}
            <div className="space-y-4 border-t border-slate-800 pt-6">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
                Architectural Decisions & Anomaly Prevention Analysis
              </h4>

              <div className="space-y-3">
                {activeSection.keyDesignDecisions.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded border border-slate-800 bg-slate-950/60 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center text-xs font-mono shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="text-sm font-semibold text-slate-100">
                        {item.decision}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-7 text-xs">
                      <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800/80">
                        <div className="font-mono text-slate-400 font-semibold mb-1">Engineering Rationale</div>
                        <div className="text-slate-300 leading-relaxed">{item.rationale}</div>
                      </div>

                      <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-800/40">
                        <div className="font-mono text-emerald-400 font-semibold mb-1">Relational Anomaly Prevented</div>
                        <div className="text-emerald-200/90 leading-relaxed">{item.anomalyPrevented}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
