import React, { useState } from 'react';
import { Brain, Star, ShieldAlert, Play, MessageSquare, ChevronRight, RefreshCw, Send, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface SalesCoachViewProps {
  apiBaseUrl: string;
  token: string;
}

export default function SalesCoachView({ apiBaseUrl, token }: SalesCoachViewProps) {
  const [objection, setObjection] = useState('');
  const [category, setCategory] = useState<'Price' | 'Timing' | 'Competitor' | 'Authority' | 'Feature'>('Price');
  const [loading, setLoading] = useState(false);
  const [coaching, setCoaching] = useState<any>(null);

  const triggerCoaching = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objection.trim() || loading) return;

    setLoading(true);
    setCoaching(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/ai/sales-coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ objection, category })
      });
      const data = await res.json();
      setCoaching(data.coaching);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const objectionSeeds = [
    { text: "Your SaaS license is double the cost of Monday.com.", cat: 'Price' },
    { text: "We are currently locked into an annual contract with HubSpot.", cat: 'Competitor' },
    { text: "We like it, but we can only evaluate budget allocations next fiscal quarter.", cat: 'Timing' },
    { text: "I need to review this with our procurement team and board.", cat: 'Authority' }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Brain className="text-violet-400 w-5 h-5 animate-pulse" />
          AI Sandler Sales Coach
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Objection handling simulator. Paste buyer hurdles or rival comparisons to formulate high-impact Sandler responses.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
        {/* Objection input forms */}
        <div className="md:col-span-2 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-5 text-xs">
          <form onSubmit={triggerCoaching} className="space-y-4">
            <div>
              <label className="block text-slate-400 mb-1.5 uppercase font-mono tracking-wider text-[10px]">OBJECTION CATEGORY</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Price', 'Timing', 'Competitor', 'Authority', 'Feature'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-1 text-[10px] font-medium rounded-lg border transition-all ${
                      category === cat
                        ? 'bg-violet-500/10 text-violet-400 border-violet-500/30 font-bold'
                        : 'bg-slate-950/20 text-slate-400 border-slate-850 hover:bg-slate-950/40'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5 uppercase font-mono tracking-wider text-[10px]">ENTER BUYER OBJECTION</label>
              <textarea
                rows={4}
                required
                value={objection}
                onChange={(e) => setObjection(e.target.value)}
                placeholder="e.g. We love the features, but we don't have the budget allocated until next fiscal quarter..."
                className="w-full p-3 bg-slate-950 border border-slate-850 focus:border-violet-500/50 rounded-xl text-xs text-white outline-none resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !objection.trim()}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md shadow-violet-500/15 cursor-pointer active:scale-[0.99] flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Analyze & Formulate Playbook
                </>
              )}
            </button>
          </form>

          {/* Objection seed templates */}
          <div className="space-y-2 border-t border-slate-850 pt-4">
            <h4 className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-semibold flex items-center gap-1.5 mb-2">
              <HelpCircle className="w-3.5 h-3.5" /> Quick Seeds Objections
            </h4>
            {objectionSeeds.map((seed, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setObjection(seed.text);
                  setCategory(seed.cat as any);
                }}
                className="w-full text-left p-2 bg-slate-950/30 hover:bg-slate-950/60 border border-slate-850 hover:border-slate-800 rounded-lg text-slate-400 hover:text-slate-300 transition-all truncate"
              >
                [{seed.cat}] "{seed.text}"
              </button>
            ))}
          </div>
        </div>

        {/* Tactical outputs block */}
        <div className="md:col-span-3 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 min-h-[420px] flex flex-col justify-between">
          {coaching ? (
            <div className="space-y-5 animate-fade-in text-xs leading-relaxed">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-[10px] text-slate-500 uppercase font-mono tracking-widest">Sandler Tactical Playbook</span>
                <span className="px-2.5 py-1 text-[10px] font-bold font-mono text-violet-400 bg-violet-500/10 rounded-lg">
                  {category} OBJECTION SOLVED
                </span>
              </div>

              <div className="space-y-4">
                {/* Tactical Response narrative */}
                <div className="p-4 bg-slate-950/25 border border-slate-850 rounded-xl space-y-1.5">
                  <h4 className="text-[10px] text-cyan-400 font-mono uppercase font-bold flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-cyan-400 animate-pulse" />
                    Recommended Reframing Script
                  </h4>
                  <div className="markdown-body text-slate-300">
                    <ReactMarkdown>{coaching.strategy}</ReactMarkdown>
                  </div>
                </div>

                {/* Verbal templates */}
                <div className="p-4 bg-slate-950/25 border border-slate-850 rounded-xl space-y-1.5">
                  <h4 className="text-[10px] text-violet-400 font-mono uppercase font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-violet-400" />
                    Pitch-Back Phone Script Template
                  </h4>
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white font-mono leading-relaxed select-all">
                    {coaching.response}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center text-slate-500 py-12">
              <Brain className="w-12 h-12 mb-3 text-slate-700" />
              <p className="text-xs font-mono">Submit a buyer objection on the left to output real-time psychological Sandler coaching playbooks.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
