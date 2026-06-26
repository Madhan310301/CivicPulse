import React from 'react';
import { AlertOctagon, TrendingUp, HelpCircle, ArrowRight } from 'lucide-react';

interface Prediction {
  category: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictedLocation: string;
  reasoning: string;
  recommendedAction: string;
}

interface PredictiveAlertProps {
  prediction: Prediction;
  key?: any;
}

export default function PredictiveAlert({ prediction }: PredictiveAlertProps) {
  const getRiskStyle = (level: string) => {
    switch (level) {
      case 'critical':
        return {
          bg: 'bg-rose-50 border-rose-200',
          text: 'text-rose-700',
          badge: 'bg-rose-600 text-white',
          pulse: 'animate-ping bg-rose-400',
        };
      case 'high':
        return {
          bg: 'bg-orange-50 border-orange-200',
          text: 'text-orange-700',
          badge: 'bg-orange-600 text-white',
          pulse: 'animate-pulse bg-orange-400',
        };
      case 'medium':
        return {
          bg: 'bg-amber-50 border-amber-200',
          text: 'text-amber-700',
          badge: 'bg-amber-500 text-white',
          pulse: '',
        };
      case 'low':
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-700',
          badge: 'bg-blue-500 text-white',
          pulse: '',
        };
    }
  };

  const style = getRiskStyle(prediction.riskLevel);

  return (
    <div className={`p-4 rounded-xl border ${style.bg} flex flex-col md:flex-row gap-4 items-start md:items-center justify-between`}>
      <div className="flex gap-3 items-start flex-1">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-100 flex-shrink-0">
          <AlertOctagon className={`h-4.5 w-4.5 ${style.text}`} />
          {style.pulse && (
            <span className={`absolute -top-1 -right-1 flex h-2 w-2 rounded-full ${style.pulse}`} />
          )}
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${style.badge}`}>
              {prediction.riskLevel} Risk
            </span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide font-mono bg-white/70 px-2 py-0.5 rounded border border-slate-100">
              {prediction.category}
            </span>
          </div>
          <h4 className="font-bold text-slate-800 text-sm">
            Predicted Hotspot Zone: <span className="text-slate-900 font-extrabold underline decoration-amber-500/50">{prediction.predictedLocation}</span>
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            <strong>AI Analysis:</strong> {prediction.reasoning}
          </p>
        </div>
      </div>

      <div className="w-full md:w-auto flex-shrink-0 bg-white/85 backdrop-blur-sm p-3 rounded-lg border border-slate-150 text-xs text-slate-700 max-w-sm">
        <p className="font-semibold text-slate-900 uppercase tracking-wider text-[9px] mb-1 text-slate-400">Recommended Prevention</p>
        <p className="leading-relaxed font-mono text-[11px] text-slate-800 flex items-start gap-1.5">
          <ArrowRight className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
          {prediction.recommendedAction}
        </p>
      </div>
    </div>
  );
}
