import React, { useState } from 'react';
import { Search, Sparkles, Shield, AlertTriangle, CheckCircle, RefreshCw, Compass, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface CompetitorViewProps {
  apiBaseUrl: string;
  token: string;
}

export default function CompetitorView({ apiBaseUrl, token }: CompetitorViewProps) {
  const [competitorName, setCompetitorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [battlecard, setBattlecard] = useState<any>(null);

  const fetchCompetitorData = async (e?: React.FormEvent, directName?: string) => {
    if (e) e.preventDefault();
    const target = directName || competitorName;
    if (!target.trim() || loading) return;

    setLoading(true);
    setBattlecard(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/ai/competitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ competitor: target })
      });
      const data = await res.json();
      setBattlecard(data.battlecard);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const seedCompetitors = [
    'Salesforce Cloud',
    'HubSpot Enterprise',
    'Pipedrive Suite',
    'Monday CRM'
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in text-xs">
      {/* Header Panel */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="text-cyan-400 w-5 h-5" />
          Rival Competitor Battlecards
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Generate SWOT maps, price vulnerabilities, and tactical positioning scripts against standard market rivals.
        </p>
      </div>

      {/* Input row */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={(e) => fetchCompetitorData(e)} className="relative w-full md:w-96 flex">
          <input
            type="text"
            required
            placeholder="e.g. HubSpot Enterprise, Pipedrive..."
            value={competitorName}
            onChange={(e) => setCompetitorName(e.target.value)}
            className="w-full pl-4 pr-24 py-2.5 bg-slate-950 border border-slate-850 focus:border-cyan-500/50 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading || !competitorName.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-bold rounded-lg cursor-pointer transition-all text-[11px] active:scale-95"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Battlecard'
            )}
          </button>
        </form>

        {/* Suggestion buttons */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto justify-end">
          {seedCompetitors.map((seed) => (
            <button
              key={seed}
              type="button"
              onClick={() => {
                setCompetitorName(seed);
                fetchCompetitorData(undefined, seed);
              }}
              className="px-2.5 py-1.5 bg-slate-950/40 hover:bg-slate-950/70 border border-slate-850 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {seed}
            </button>
          ))}
        </div>
      </div>

      {/* Battlecard output results */}
      {battlecard ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {/* Swot matrix list column */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5 border-b border-slate-800 pb-3 font-mono uppercase tracking-wider text-xs">
                <Compass className="w-4 h-4 text-cyan-400" /> Competitor Positioning SWOT
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Strengths */}
                <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl space-y-1">
                  <h4 className="text-[10px] text-green-400 font-bold uppercase font-mono">💪 Rival Strengths:</h4>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">
                    {battlecard.strengths && battlecard.strengths.map((str: string, i: number) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl space-y-1">
                  <h4 className="text-[10px] text-red-400 font-bold uppercase font-mono">⚠️ Rival Weaknesses:</h4>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">
                    {battlecard.weaknesses && battlecard.weaknesses.map((weak: string, i: number) => (
                      <li key={i}>{weak}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Battle tactics and reframing pitches */}
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5 border-b border-slate-800 pb-3 font-mono uppercase tracking-wider text-xs">
                ⚔️ Competitor Kill-Triggers
              </h3>
              <div className="markdown-body text-slate-300 leading-relaxed font-sans text-xs">
                <ReactMarkdown>{battlecard.battleStrategy}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Quick Pitch script side card */}
          <div className="bg-gradient-to-br from-cyan-500/5 to-violet-500/5 border border-cyan-500/10 rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-[10px] text-cyan-400 font-bold font-mono uppercase tracking-wider">Verbal Script Pitch</span>
                <span className="text-[9px] text-slate-500 font-mono">Copy Script</span>
              </div>

              <div>
                <h4 className="text-white font-semibold text-xs">"Hub-And-Spoke" Battle Script:</h4>
                <p className="text-slate-400 mt-2 text-[11px] leading-relaxed">
                  How to counter when client says: <code className="text-violet-400">"But Salesforce already handles our records..."</code>
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl text-white font-mono leading-relaxed text-[11px] select-all italic">
                "{battlecard.battleStrategy.substring(0, 240)}..."
              </div>
            </div>

            <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl text-[10px] text-slate-400 mt-4 leading-relaxed flex items-center gap-2">
              <Brain className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>Use this pitch to reframe pricing constraints immediately.</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-950/20 border border-slate-900 rounded-2xl text-slate-500">
          <Brain className="w-12 h-12 mb-3 text-slate-700 animate-pulse" />
          <p className="text-xs font-mono">Input a rival platform (e.g. HubSpot, Pipedrive) to unlock battlecard scripts.</p>
        </div>
      )}
    </div>
  );
}
