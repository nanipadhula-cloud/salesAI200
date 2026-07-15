import React, { useState, useEffect } from 'react';
import { Search, Plus, Sparkles, TrendingUp, AlertTriangle, ShieldAlert, Calendar, DollarSign, Brain, CheckCircle, X, Percent, Target } from 'lucide-react';
import { Opportunity } from '../types';

interface OpportunitiesViewProps {
  apiBaseUrl: string;
  token: string;
  user: any;
}

export default function OpportunitiesView({ apiBaseUrl, token, user }: OpportunitiesViewProps) {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

  // Form parameters
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [revenue, setRevenue] = useState('');
  const [stage, setStage] = useState<'Discovery' | 'Proposal' | 'Negotiation' | 'Contracting' | 'Closed Won' | 'Closed Lost'>('Discovery');
  const [expectedClosingDate, setExpectedClosingDate] = useState('');

  // Forecasting status
  const [forecastingId, setForecastingId] = useState<string | null>(null);

  const fetchOpps = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/opportunities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setOpps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpps();
  }, [token]);

  const handleAddOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBaseUrl}/api/opportunities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name, company, revenue: Number(revenue), stage, expectedClosingDate
        })
      });
      if (res.ok) {
        setIsAddOpen(false);
        setName(''); setCompany(''); setRevenue(''); setExpectedClosingDate('');
        fetchOpps();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerAIForecast = async (oppId: string) => {
    setForecastingId(oppId);
    try {
      const res = await fetch(`${apiBaseUrl}/api/opportunities/${oppId}/ai-forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (res.ok) {
        setOpps(prev => prev.map(o => o.id === oppId ? { ...o, ...data.opportunity } : o));
        if (selectedOpp && selectedOpp.id === oppId) {
          setSelectedOpp({ ...selectedOpp, ...data.opportunity });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setForecastingId(null);
    }
  };

  const updateStage = async (oppId: string, newStage: any) => {
    try {
      const defaultProbabilities = {
        'Discovery': 15,
        'Proposal': 40,
        'Negotiation': 65,
        'Contracting': 85,
        'Closed Won': 100,
        'Closed Lost': 0
      };

      await fetch(`${apiBaseUrl}/api/opportunities/${oppId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stage: newStage,
          probability: defaultProbabilities[newStage as keyof typeof defaultProbabilities] || 30
        })
      });
      fetchOpps();
      if (selectedOpp && selectedOpp.id === oppId) {
        setSelectedOpp(prev => prev ? { ...prev, stage: newStage, probability: defaultProbabilities[newStage as keyof typeof defaultProbabilities] || 30 } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOpps = opps.filter(o =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by stages for visual board
  const columns = {
    'Pipeline': filteredOpps.filter(o => ['Discovery', 'Proposal'].includes(o.stage)),
    'Under Review': filteredOpps.filter(o => ['Negotiation', 'Contracting'].includes(o.stage)),
    'Settled': filteredOpps.filter(o => ['Closed Won', 'Closed Lost'].includes(o.stage))
  };

  return (
    <div className="space-y-6 relative animate-fade-in">
      {/* Search and control banner */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search deals name, organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/40 border border-slate-800 focus:border-cyan-500/50 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
          />
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium rounded-xl text-xs cursor-pointer transition-all flex items-center gap-1.5 active:scale-[0.98] w-full md:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Create Deal Opportunity
        </button>
      </div>

      {/* Main pipeline splits */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* Stages columns layout */}
        <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(columns).map(([colName, list]) => (
            <div key={colName} className="bg-slate-950/20 border border-slate-900 rounded-2xl p-4 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{colName}</h3>
                <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md text-slate-300 font-mono">
                  {list.length} deals
                </span>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {list.map((opp) => (
                  <div
                    key={opp.id}
                    onClick={() => setSelectedOpp(opp)}
                    className={`p-4 bg-slate-900/50 hover:bg-slate-900/80 border rounded-xl cursor-pointer transition-all ${
                      selectedOpp?.id === opp.id ? 'border-cyan-500/80 shadow-md shadow-cyan-500/5' : 'border-slate-850'
                    }`}
                  >
                    <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                      <span>{opp.company}</span>
                      <span className="text-slate-400 font-semibold">{opp.probability}% win</span>
                    </div>
                    <h4 className="text-xs font-semibold text-white mt-1 leading-snug">{opp.name}</h4>

                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-cyan-400 font-bold font-mono text-[11px]">${opp.revenue.toLocaleString()}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium uppercase font-mono ${
                        opp.stage === 'Closed Won' ? 'bg-green-500/15 text-green-400' :
                        opp.stage === 'Closed Lost' ? 'bg-red-500/15 text-red-400' :
                        'bg-slate-950/60 text-slate-400'
                      }`}>
                        {opp.stage}
                      </span>
                    </div>
                  </div>
                ))}

                {list.length === 0 && (
                  <div className="py-12 text-center text-slate-600 font-mono text-[10px]">
                    Empty stage pool
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Detailed AI Forecaster & Predictive sidebar */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 min-h-[400px] flex flex-col justify-between">
          {selectedOpp ? (
            <div className="space-y-5 animate-fade-in text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">AI Predictive Pipeline</span>
                <h3 className="text-lg font-bold text-white mt-1">{selectedOpp.name}</h3>
                <p className="text-xs text-slate-400">Targeting {selectedOpp.company}</p>
              </div>

              {/* Modify deal stage quick selectors */}
              <div className="space-y-1.5 p-3 bg-slate-950/20 border border-slate-850 rounded-xl">
                <label className="text-[10px] text-slate-500 uppercase font-mono block">Action Stage Controls</label>
                <div className="flex gap-1.5 flex-wrap">
                  {(['Discovery', 'Proposal', 'Negotiation', 'Contracting', 'Closed Won', 'Closed Lost'] as const).map((stg) => (
                    <button
                      key={stg}
                      onClick={() => updateStage(selectedOpp.id, stg)}
                      className={`px-2 py-1 text-[9px] rounded-md border font-medium transition-all ${
                        selectedOpp.stage === stg
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          : 'bg-slate-950/30 text-slate-400 border-slate-850 hover:bg-slate-950/50'
                      }`}
                    >
                      {stg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Revenue & expected date logs */}
              <div className="grid grid-cols-2 gap-2 text-center bg-slate-950/10 border border-slate-850 rounded-xl p-3">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Revenue Pool</span>
                  <div className="text-sm text-cyan-400 font-bold font-mono mt-0.5">${selectedOpp.revenue.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Close Date</span>
                  <div className="text-xs text-white font-mono mt-1">{new Date(selectedOpp.expectedClosingDate).toLocaleDateString()}</div>
                </div>
              </div>

              {/* AI forecast indicators */}
              {selectedOpp.predictedStrategy !== 'Awaiting AI Forecasting evaluation.' ? (
                <div className="space-y-4">
                  {/* Categorical details */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-slate-950/25 border border-slate-850/50 rounded-xl">
                      <span className="text-[10px] text-slate-500 font-mono block">Win Chance</span>
                      <strong className="text-green-400 font-semibold text-sm font-mono flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5" /> {selectedOpp.probability}%
                      </strong>
                    </div>
                    <div className="p-2.5 bg-slate-950/25 border border-slate-850/50 rounded-xl">
                      <span className="text-[10px] text-slate-500 font-mono block">Risk Rating</span>
                      <strong className={`font-semibold flex items-center gap-1 ${
                        selectedOpp.riskLevel === 'Low' ? 'text-green-400' :
                        selectedOpp.riskLevel === 'Medium' ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {selectedOpp.riskLevel === 'High' ? <ShieldAlert className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        {selectedOpp.riskLevel}
                      </strong>
                    </div>
                  </div>

                  {/* Strategic narrative close actions */}
                  <div className="bg-slate-950/25 border border-slate-850 rounded-xl p-3.5">
                    <h4 className="text-[10px] text-cyan-400 font-mono uppercase font-bold flex items-center gap-1.5 mb-2">
                      <Brain className="w-4 h-4" /> AI Closing Strategy suggestion:
                    </h4>
                    <p className="text-slate-300 leading-relaxed text-[11px]">{selectedOpp.predictedStrategy}</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-950/30 border border-slate-850 rounded-2xl text-center space-y-4">
                  <TrendingUp className="w-8 h-8 text-cyan-500/40 mx-auto animate-pulse" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Deal Forecast Uncalculated</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Predict Win Probabilities, risk levels, and mitigate contract risk instantly with Gemini.
                    </p>
                  </div>
                  <button
                    onClick={() => triggerAIForecast(selectedOpp.id)}
                    disabled={forecastingId === selectedOpp.id}
                    className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-cyan-500/10 active:scale-[0.98]"
                  >
                    {forecastingId === selectedOpp.id ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        Trigger Deal Forecast
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center text-slate-500 py-12">
              <Brain className="w-12 h-12 mb-3 text-slate-700" />
              <p className="text-xs font-mono">Select an opportunity from board to forecast win chance and mitigating closing risks.</p>
            </div>
          )}

          {selectedOpp && (
            <div className="mt-6 flex justify-between border-t border-slate-850/80 pt-4 text-xs font-medium">
              <span className="text-slate-500">ID: {selectedOpp.id}</span>
              <button
                onClick={() => {
                  if (confirm('Delete opportunity permanently from board?')) {
                    fetch(`${apiBaseUrl}/api/opportunities/${selectedOpp.id}`, {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${token}` }
                    }).then(() => {
                      setSelectedOpp(null);
                      fetchOpps();
                    });
                  }
                }}
                className="text-red-400 hover:text-red-300"
              >
                Delete Deal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Opp Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                <Plus className="w-5 h-5 text-cyan-400" />
                Initialize Sales Deal
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddOpp} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Deal Title</label>
                <input
                  type="text" required placeholder="Enterprise Software Rollout" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Client Organization / Company</label>
                <input
                  type="text" required placeholder="Cyberdyne Advanced Labs" value={company} onChange={(e) => setCompany(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Expected Revenue ($)</label>
                  <input
                    type="number" required placeholder="180000" value={revenue} onChange={(e) => setRevenue(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Initial Stage</label>
                  <select
                    value={stage} onChange={(e: any) => setStage(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  >
                    <option value="Discovery">Discovery</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Contracting">Contracting</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Expected Closing Date</label>
                <input
                  type="date" required value={expectedClosingDate} onChange={(e) => setExpectedClosingDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer active:scale-[0.99]"
              >
                Onboard Deal to Board
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
