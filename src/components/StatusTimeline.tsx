import React from 'react';
import { IssueStatus } from '../types';
import { Check, Clock, AlertTriangle, Hammer, CheckCircle } from 'lucide-react';

interface StatusTimelineProps {
  status: IssueStatus;
  updatedAt: string;
}

const STAGES: { value: IssueStatus; label: string; description: string; icon: any }[] = [
  { value: 'reported', label: 'Reported', description: 'Submitted by citizen', icon: Clock },
  { value: 'verified', label: 'Verified', description: 'Community approved', icon: AlertTriangle },
  { value: 'assigned', label: 'Assigned', description: 'Routed to agency', icon: Hammer },
  { value: 'in_progress', label: 'In Progress', description: 'Under active repair', icon: Hammer },
  { value: 'resolved', label: 'Resolved', description: 'Issue fully resolved', icon: CheckCircle },
];

export default function StatusTimeline({ status, updatedAt }: StatusTimelineProps) {
  const currentStageIndex = STAGES.findIndex((stage) => stage.value === status);

  return (
    <div className="w-full py-4">
      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-0">
        {/* Progress Line for Large Screens */}
        <div className="absolute hidden md:block left-0 right-0 top-1/2 h-1 bg-gray-200 -translate-y-1/2 z-0" />
        <div
          className="absolute hidden md:block left-0 top-1/2 h-1 bg-emerald-500 -translate-y-1/2 transition-all duration-500 z-0"
          style={{
            width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%`,
          }}
        />

        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          const IconComponent = stage.icon;

          return (
            <div
              key={stage.value}
              className="relative flex md:flex-col items-center gap-4 md:gap-2 z-10 flex-1 w-full md:w-auto"
            >
              {/* Dot Icon Indicator */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-600 text-white shadow-md shadow-emerald-100'
                    : isCurrent
                    ? 'bg-amber-500 border-amber-600 text-white shadow-md shadow-amber-100 animate-pulse'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[3]" />
                ) : (
                  <IconComponent className="w-5 h-5" />
                )}
              </div>

              {/* Label and description details */}
              <div className="text-left md:text-center">
                <p
                  className={`text-sm font-semibold transition-colors duration-300 ${
                    isCurrent ? 'text-amber-600' : isCompleted ? 'text-emerald-600' : 'text-gray-500'
                  }`}
                >
                  {stage.label}
                </p>
                <p className="text-xs text-gray-400">{stage.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center bg-gray-50 p-3 rounded-lg">
        <span>Current Phase: <strong className="text-gray-700 capitalize">{status}</strong></span>
        <span>Last updated: {new Date(updatedAt).toLocaleString()}</span>
      </div>
    </div>
  );
}
