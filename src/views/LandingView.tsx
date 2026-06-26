import React from 'react';
import { Shield, Sparkles, Map, Users, ArrowRight, Activity, Target } from 'lucide-react';
import { loginWithGoogle, auth } from '../lib/firebase';

interface LandingViewProps {
  onNavigate: (view: string) => void;
  user: any;
  onLoginSuccess: (user: any) => void;
}

export default function LandingView({ onNavigate, user, onLoginSuccess }: LandingViewProps) {
  const handleLogin = async () => {
    try {
      const loggedUser = await loginWithGoogle();
      onLoginSuccess(loggedUser);
      onNavigate('feed');
    } catch (err) {
      console.error('Google login error:', err);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      
      {/* 1. Visually Stunning Hero Card */}
      <div className="relative rounded-3xl bg-slate-900 overflow-hidden text-white p-8 md:p-12 shadow-xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900/20 to-slate-900 opacity-80" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
            <Sparkles className="w-3.5 h-3.5" /> Hackathon Submission Deployed
          </span>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight font-sans">
            CivicPulse — <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Community Hero</span>
          </h1>

          <p className="text-slate-300 text-base md:text-lg leading-relaxed font-normal">
            "Citizens report. AI triages. Community verifies. Government acts." <br />
            A hyperlocal, zero-cost civic accountability engine powered by Google Gemini AI and Firebase.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            {user ? (
              <button
                onClick={() => onNavigate('report')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20 transition cursor-pointer"
              >
                File a Report <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20 transition cursor-pointer"
              >
                Get Started with Google <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => onNavigate('feed')}
              className="bg-slate-850 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-xl border border-slate-700 transition cursor-pointer"
            >
              Explore Map Feed
            </button>
          </div>
        </div>
      </div>

      {/* 2. Platform Status Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Reports', val: '437', labelSub: 'Verified in Central Ward', icon: Activity, color: 'text-blue-500 bg-blue-50' },
          { label: 'Resolved Tickets', val: '281', labelSub: 'Under SLA compliance', icon: Shield, color: 'text-emerald-500 bg-emerald-50' },
          { label: 'Community Verifiers', val: '1,048', labelSub: 'Citizens upvoting', icon: Users, color: 'text-indigo-500 bg-indigo-50' },
          { label: 'AI Accuracy Rating', val: '98.2%', labelSub: 'Gemini 3.5 Triage', icon: Target, color: 'text-purple-500 bg-purple-50' }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white border border-slate-150 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-none">{stat.val}</h3>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{stat.labelSub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Core Mechanics Breakdown */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 text-center">How the Hyperlocal Pipeline Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: '1. Autonomous AI Triage',
              desc: 'Upload a simple photo. Gemini Vision auto-detects issues, labels the category, scores severity, and routes it to the specific local department within seconds.',
              icon: Sparkles,
              color: 'text-blue-600 bg-blue-50'
            },
            {
              title: '2. Community Crowdsourced Trust',
              desc: 'Neighbors upvote or click "I see this too" to verify reports. High verification levels accelerate governmental SLAs, rewarding you with XP and badges.',
              icon: Users,
              color: 'text-emerald-600 bg-emerald-50'
            },
            {
              title: '3. Predictive AI Hotspots',
              desc: 'Gemini analyzes historical clustering and predicts infrastructure vulnerabilities before complaints can cascade, creating proactive prevention models.',
              icon: Map,
              color: 'text-purple-600 bg-purple-50'
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white border border-slate-150 rounded-xl p-6 shadow-sm space-y-3 hover:border-slate-300 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base leading-tight">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-normal">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
