import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Status } from '../types';

interface TimelineStep {
  status: Status;
  label: string;
  subLabel: string;
}

const STAGES: TimelineStep[] = [
  { status: 'ASSIGNED', label: 'ASSIGNED', subLabel: 'Received by Department' },
  { status: 'ACCEPTED', label: 'ACCEPTED', subLabel: 'Inspected by Field Engineer' },
  { status: 'IN_PROGRESS', label: 'IN_PROGRESS', subLabel: 'Repair Crew Dispatched' },
  { status: 'RESOLVED', label: 'RESOLVED', subLabel: 'Work Completed & Verified' },
];

export default function Timeline({ currentStatus }: { currentStatus: Status }) {
  const isTerminalResolved = currentStatus === 'RESOLVED' || currentStatus === 'CLOSED';

  const getStepState = (stepStatus: Status) => {
    if (isTerminalResolved) {
      return 'completed';
    }

    const statusOrder: Status[] = ['NEW', 'AI_PROCESSING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepStatus);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
      {STAGES.map((step, idx) => {
        const state = getStepState(step.status);
        const isStepCompleted = state === 'completed';

        return (
          <div key={step.status} className="relative flex items-start gap-4">
            {/* Step Icon */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 font-bold transition-colors ${
                isStepCompleted
                  ? 'bg-emerald-600 text-white shadow-md'
                  : state === 'current'
                  ? 'bg-gov-navy text-white ring-4 ring-blue-100 shadow-md animate-pulse'
                  : 'bg-slate-100 text-slate-400 border border-slate-300'
              }`}
            >
              {isStepCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <span className="text-xs">{idx + 1}</span>
              )}
            </div>

            {/* Step Content */}
            <div
              className={`flex-1 p-4 rounded-xl border transition-colors ${
                isStepCompleted && step.status === 'RESOLVED'
                  ? 'bg-emerald-50/80 border-emerald-300'
                  : isStepCompleted
                  ? 'bg-slate-50 border-slate-200'
                  : state === 'current'
                  ? 'bg-blue-50/60 border-blue-200'
                  : 'bg-slate-50/50 border-slate-200'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <h4
                  className={`font-bold text-sm ${
                    isStepCompleted && step.status === 'RESOLVED'
                      ? 'text-emerald-950 font-extrabold'
                      : isStepCompleted
                      ? 'text-slate-900'
                      : state === 'current'
                      ? 'text-gov-navy'
                      : 'text-slate-700'
                  }`}
                >
                  {step.label}
                  {isStepCompleted && <span className="ml-1.5 text-emerald-600 font-bold">✓</span>}
                </h4>

                {isTerminalResolved && step.status === 'RESOLVED' ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                  </span>
                ) : state === 'current' ? (
                  <span className="bg-blue-100 text-gov-navy text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Active State
                  </span>
                ) : isStepCompleted ? (
                  <span className="text-emerald-700 text-[11px] font-bold flex items-center gap-0.5">
                    ✓
                  </span>
                ) : null}
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">{step.subLabel}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
