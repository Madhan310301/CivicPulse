import React from 'react';
import { Issue } from '../types';
import SeverityBadge from './SeverityBadge';
import { ThumbsUp, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

interface IssueCardProps {
  issue: Issue;
  onClick: (id: string) => void;
  key?: any;
}

export default function IssueCard({ issue, onClick }: IssueCardProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'assigned':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'verified':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getSlaStatus = () => {
    const deadline = new Date(issue.slaDeadline).getTime();
    const now = Date.now();
    if (issue.status === 'resolved') {
      return { label: 'SLA Compliant', style: 'text-emerald-600 bg-emerald-50' };
    }
    if (now > deadline) {
      return { label: 'SLA Overdue', style: 'text-red-600 bg-red-50' };
    }
    const hoursLeft = Math.round((deadline - now) / (1000 * 60 * 60));
    return { label: `SLA: ${hoursLeft}h left`, style: 'text-slate-600 bg-slate-100' };
  };

  const sla = getSlaStatus();

  return (
    <div
      onClick={() => issue.id && onClick(issue.id)}
      className="group bg-white rounded-xl border border-slate-150 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      {/* Photo with overlay details */}
      <div className="relative h-48 bg-slate-100 overflow-hidden">
        <img
          src={issue.imageUrl || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80'}
          alt={issue.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <SeverityBadge severity={issue.severity} />
        </div>
        <div className="absolute top-3 right-3 z-10">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getStatusStyle(issue.status)}`}>
            {issue.status}
          </span>
        </div>
      </div>

      {/* Card Content Details */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1 text-slate-400 text-xs font-mono mb-1.5 uppercase">
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm font-semibold tracking-wide text-[10px]">
            {issue.category}
          </span>
          <span className="mx-1">•</span>
          <span className="truncate flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Ward: {issue.ward || 'Central'}
          </span>
        </div>

        <h3 className="font-semibold text-slate-900 leading-snug text-base mb-1.5 group-hover:text-blue-600 transition-colors line-clamp-1">
          {issue.title}
        </h3>

        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
          {issue.description}
        </p>

        {/* Card Footer Interactions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <ThumbsUp className={`w-4 h-4 ${issue.verificationCount > 0 ? 'text-blue-500 fill-blue-50' : 'text-slate-400'}`} />
              {issue.verificationCount}
            </span>
            {issue.isDuplicate && (
              <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-semibold uppercase">
                Duplicate
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium font-mono ${sla.style}`}>
              {sla.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
