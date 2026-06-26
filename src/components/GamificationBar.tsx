import React from 'react';
import { Award, Shield, CheckCircle, Zap, TrendingUp } from 'lucide-react';

interface GamificationBarProps {
  xp: number;
  badges: string[];
}

const ALL_BADGES: { name: string; label: string; desc: string; color: string; icon: any }[] = [
  {
    name: 'First Responder',
    label: 'First Responder',
    desc: 'Reported your first civic issue ever.',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100',
    icon: Shield,
  },
  {
    name: 'Truth Teller',
    label: 'Truth Teller',
    desc: 'Verified 10 other citizens\' issues.',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
    icon: CheckCircle,
  },
  {
    name: 'Problem Solver',
    label: 'Problem Solver',
    desc: 'Had 5 of your reported issues successfully resolved.',
    color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
    icon: Award,
  },
  {
    name: 'Ward Guardian',
    label: 'Ward Guardian',
    desc: 'Top citizen reporter in your local ward.',
    color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
    icon: Zap,
  },
  {
    name: 'Streak Hero',
    label: 'Streak Hero',
    desc: 'Maintained a 7-day civic reporting streak.',
    color: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100',
    icon: TrendingUp,
  },
];

export default function GamificationBar({ xp = 0, badges = [] }: GamificationBarProps) {
  const level = Math.floor(xp / 100) + 1;
  const currentXpInLevel = xp % 100;
  const progressPercent = Math.min(100, Math.max(0, currentXpInLevel));

  return (
    <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-4">
      {/* Level Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-indigo-100">
            Lvl {level}
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Community Hero Status</h4>
            <p className="text-xs text-slate-500">{xp} Total XP earned</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-indigo-600 font-mono bg-indigo-50 px-2 py-1 rounded">
            {currentXpInLevel}/100 XP to Lvl {level + 1}
          </span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Badges Container Section */}
      <div className="pt-3 border-t border-slate-100">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-500" />
          Earned Badges ({badges.length}/{ALL_BADGES.length})
        </p>

        {badges.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No badges earned yet. Report or verify issues to start unlocking achievements!</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {ALL_BADGES.map((badge) => {
              const hasBadge = badges.includes(badge.name);
              const IconComponent = badge.icon;

              return (
                <div
                  key={badge.name}
                  title={`${badge.label}: ${badge.desc}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-help transition-all duration-300 ${
                    hasBadge
                      ? badge.color + ' opacity-100 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-40 hover:opacity-60'
                  }`}
                >
                  <IconComponent className={`w-3.5 h-3.5 ${hasBadge ? '' : 'text-slate-300'}`} />
                  <span>{badge.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
