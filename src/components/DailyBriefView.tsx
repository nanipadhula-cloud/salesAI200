import React, { useState, useEffect } from 'react';
import { Target, Sparkles, Brain, AlertTriangle, CheckCircle, RefreshCw, Star, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface DailyBriefViewProps {
  apiBaseUrl: string;
  token: string;
}

export default function DailyBriefView({ apiBaseUrl, token }: DailyBriefViewProps) {
  const [brief, setBrief] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchBrief = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/ai/daily-briefing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setBrief(data.briefing);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrief();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-mono text-xs">Sifting through CRM state to compile briefing...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center bg-slate-900/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="text-cyan-400 w-5 h-5" />
            Strategic Morning Briefing
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Dynamic, data-driven daily briefing compiled by Gemini from current pipeline telemetry.
          </p>
        </div>
        <button
          onClick={fetchBrief}
          className="p-2.5 bg-slate-950/40 hover:bg-slate-950/60 border border-slate-850 rounded-xl text-slate-400 transition-all cursor-pointer"
          title="Rebuild briefing"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {brief ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Motivation Quote & Priorities Outline */}
          <div className="md:col-span-2 space-y-6">
            {/* Mindset block */}
            <div className="bg-gradient-to-r from-cyan-500/10 via-violet-500/5 to-transparent border border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute right-4 top-4 text-cyan-400 opacity-10 font-mono text-7xl select-none">
                🧠
              </div>
              <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest font-bold">EXECUTIVE MINDSET</span>
              <p className="text-slate-200 italic text-sm mt-2 leading-relaxed">
                "{brief.mindset}"
              </p>
              <span className="text-[10px] text-slate-500 font-mono block mt-2">— SalesgenieAI Motivation Engine</span>
            </div>

            {/* Key Action Priorities list */}
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                Critical Action Items List
              </h3>

              <div className="space-y-3">
                {brief.actions && brief.actions.map((act: string, i: number) => (
                  <div key={i} className="flex gap-3.5 items-start p-3 bg-slate-950/20 border border-slate-900 rounded-xl">
                    <span className="w-5 h-5 rounded-md bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {act}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Deal Alerts side column */}
          <div className="space-y-6">
            <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-red-400" />
                At-Risk Pipelines Alerts
              </h3>

              <div className="space-y-3">
                {brief.dealAlerts && brief.dealAlerts.map((alert: string, i: number) => (
                  <div key={i} className="p-3.5 bg-slate-950/40 border border-red-500/10 rounded-xl">
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {alert}
                    </p>
                  </div>
                ))}

                {(!brief.dealAlerts || brief.dealAlerts.length === 0) && (
                  <div className="text-center py-6 text-slate-500 font-mono text-xs">
                    No pipeline anomalies identified!
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations card */}
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5 font-mono uppercase tracking-wider text-xs">
                <Brain className="w-4 h-4 text-violet-400" />
                Tactical Insights
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Gemini evaluated transaction logs and customer size pools to optimize outbound operations. Focus followups before 11:00 AM for maximum conversion chances.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-slate-950/30 border border-slate-850 rounded-2xl text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-500/40 mx-auto" />
          <h3 className="text-xs font-semibold text-white">No active data pool found.</h3>
          <p className="text-slate-500 text-[11px]">Ensure pipeline leads and opportunities exist before compiling briefing summaries.</p>
        </div>
      )}
    </div>
  );
}
