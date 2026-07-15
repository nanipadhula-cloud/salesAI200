import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, FileSpreadsheet, Sparkles, Phone, Mail, Clock, Brain, Compass, CheckCircle, ChevronRight, X, AlertCircle } from 'lucide-react';
import { Lead } from '../types';

interface LeadsViewProps {
  apiBaseUrl: string;
  token: string;
  user: any;
}

export default function LeadsView({ apiBaseUrl, token, user }: LeadsViewProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // New Lead Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [size, setSize] = useState('11-50');
  const [budget, setBudget] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [source, setSource] = useState('Web Search');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [notes, setNotes] = useState('');

  // Bulk Upload state
  const [bulkRawJson, setBulkRawJson] = useState('');
  const [aiScoringLeadId, setAiScoringLeadId] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/leads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [token]);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBaseUrl}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name, email, phone, company, industry, size,
          budget: Number(budget) || 0,
          jobTitle, source, priority, notes, tags: [industry.toLowerCase()]
        })
      });
      if (res.ok) {
        setIsAddOpen(false);
        // Reset form
        setName(''); setEmail(''); setPhone(''); setCompany(''); setJobTitle(''); setBudget(''); setNotes('');
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let parsed = [];
      try {
        parsed = JSON.parse(bulkRawJson);
        if (!Array.isArray(parsed)) parsed = [parsed];
      } catch {
        // Fallback simple comma parser if user pastes csv text
        const lines = bulkRawJson.trim().split('\n');
        if (lines.length > 1) {
          const headers = lines[0].split(',');
          parsed = lines.slice(1).map(line => {
            const cols = line.split(',');
            return {
              name: cols[0]?.trim(),
              email: cols[1]?.trim(),
              company: cols[2]?.trim(),
              budget: Number(cols[3]) || 15000,
              jobTitle: cols[4]?.trim()
            };
          });
        }
      }

      const res = await fetch(`${apiBaseUrl}/api/leads/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ leads: parsed })
      });
      if (res.ok) {
        setIsBulkOpen(false);
        setBulkRawJson('');
        fetchLeads();
      }
    } catch (err) {
      alert('Failed to import leads. Ensure JSON or CSV format is valid.');
    }
  };

  const triggerAIScoring = async (leadId: string) => {
    setAiScoringLeadId(leadId);
    try {
      const res = await fetch(`${apiBaseUrl}/api/leads/${leadId}/ai-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (res.ok) {
        // Update local lists
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...data.lead } : l));
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead({ ...selectedLead, ...data.lead });
        }
      }
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setAiScoringLeadId(null);
    }
  };

  // Filter implementation
  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || l.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6 relative">
      {/* Search and Filters Header bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search leads name, company, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/40 border border-slate-800 focus:border-cyan-500/50 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950/40 border border-slate-800 focus:border-cyan-500/40 rounded-xl text-xs text-slate-300 outline-none transition-all"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Lost">Lost</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950/40 border border-slate-800 focus:border-cyan-500/40 rounded-xl text-xs text-slate-300 outline-none transition-all"
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          {/* Buttons */}
          <button
            onClick={() => setIsBulkOpen(true)}
            className="px-3 py-2 bg-slate-950/40 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-300 cursor-pointer transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Bulk Import
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium rounded-xl text-xs cursor-pointer transition-all flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Main Table view & Scorecard columns layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Table list column */}
        <div className="xl:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/30 border-b border-slate-850/70 text-slate-400 text-[11px] font-mono uppercase tracking-wider">
                  <th className="py-4 px-5">Lead</th>
                  <th className="py-4 px-4">Company / Title</th>
                  <th className="py-4 px-4">Priority</th>
                  <th className="py-4 px-4 text-center">AI Score</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-300 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Loading lead directory...
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No active leads match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    // Score style helper
                    const getScoreColor = (sc: number) => {
                      if (sc === 0) return 'text-slate-500 bg-slate-950/40 border-slate-900';
                      if (sc < 40) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                      if (sc < 75) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                      return 'text-green-400 bg-green-500/10 border-green-500/20';
                    };

                    const getPriorityColor = (pr: string) => {
                      if (pr === 'Low') return 'text-slate-400 bg-slate-950/40';
                      if (pr === 'Medium') return 'text-cyan-400 bg-cyan-500/10';
                      if (pr === 'High') return 'text-amber-400 bg-amber-500/10';
                      return 'text-red-400 bg-red-500/10';
                    };

                    const getStatusColor = (st: string) => {
                      if (st === 'New') return 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/10';
                      if (st === 'Contacted') return 'text-violet-400 bg-violet-500/10 border border-violet-500/10';
                      if (st === 'Qualified') return 'text-green-400 bg-green-500/10 border border-green-500/10';
                      return 'text-slate-500 bg-slate-950/50 border border-slate-900';
                    };

                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`hover:bg-slate-950/20 cursor-pointer transition-all ${
                          selectedLead?.id === lead.id ? 'bg-slate-950/30 border-l-2 border-l-cyan-500' : ''
                        }`}
                      >
                        <td className="py-4 px-5">
                          <div className="font-semibold text-white">{lead.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{lead.email}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-slate-200">{lead.company}</div>
                          <div className="text-[10px] text-slate-400">{lead.jobTitle}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-medium ${getPriorityColor(lead.priority)}`}>
                            {lead.priority}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex justify-center">
                            {lead.score > 0 ? (
                              <span className={`px-2 py-0.5 rounded-lg border font-bold font-mono text-[11px] ${getScoreColor(lead.score)}`}>
                                {lead.score}
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerAIScoring(lead.id);
                                }}
                                disabled={aiScoringLeadId === lead.id}
                                className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-[10px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
                              >
                                {aiScoringLeadId === lead.id ? (
                                  <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3 animate-pulse" />
                                    Score
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed AI Lead Qualify scorecard details sidebar */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 min-h-[400px] flex flex-col justify-between">
          {selectedLead ? (
            <div className="space-y-5 animate-fade-in">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Lead Intelligence Scorecard</span>
                  <h3 className="text-lg font-bold text-white mt-1">{selectedLead.name}</h3>
                  <p className="text-xs text-cyan-400 mt-0.5">{selectedLead.jobTitle} at {selectedLead.company}</p>
                </div>
                {selectedLead.score > 0 && (
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-cyan-500/40 flex items-center justify-center text-cyan-400 text-lg font-bold font-mono shadow-md shadow-cyan-500/10">
                      {selectedLead.score}
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono block mt-1 uppercase font-semibold">AI SCORE</span>
                  </div>
                )}
              </div>

              {/* Engagement statistics */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/30 border border-slate-850/80 rounded-xl p-3 text-center">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Opens</span>
                  <div className="text-xs text-white font-bold font-mono mt-0.5 flex items-center justify-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-cyan-400" /> {selectedLead.engagement?.emailOpens || 0}
                  </div>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Visits</span>
                  <div className="text-xs text-white font-bold font-mono mt-0.5 flex items-center justify-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-violet-400" /> {selectedLead.engagement?.websiteVisits || 1}
                  </div>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Talk-time</span>
                  <div className="text-xs text-white font-bold font-mono mt-0.5 flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> {Math.round((selectedLead.engagement?.callDuration || 0) / 60)}m
                  </div>
                </div>
              </div>

              {/* AI scoring outputs section */}
              {selectedLead.score > 0 ? (
                <div className="space-y-4">
                  {/* Category outputs */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-950/25 border border-slate-850/50 rounded-xl">
                      <span className="text-[10px] text-slate-500 font-mono block">Intent Level</span>
                      <strong className="text-cyan-400 font-semibold">{selectedLead.buyingIntent}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-950/25 border border-slate-850/50 rounded-xl">
                      <span className="text-[10px] text-slate-500 font-mono block">Urgency Temp</span>
                      <strong className="text-amber-400 font-semibold">{selectedLead.urgency}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-950/25 border border-slate-850/50 rounded-xl">
                      <span className="text-[10px] text-slate-500 font-mono block">Budget Rating</span>
                      <strong className="text-violet-400 font-semibold">{selectedLead.budgetLevel} (${selectedLead.budget.toLocaleString()})</strong>
                    </div>
                    <div className="p-2.5 bg-slate-950/25 border border-slate-850/50 rounded-xl">
                      <span className="text-[10px] text-slate-500 font-mono block">Lead Source</span>
                      <strong className="text-slate-300 font-semibold">{selectedLead.source}</strong>
                    </div>
                  </div>

                  {/* Narrative details */}
                  <div className="space-y-3 bg-slate-950/15 border border-slate-850 rounded-xl p-3.5">
                    <div>
                      <h4 className="text-[10px] text-slate-400 font-mono uppercase font-bold flex items-center gap-1">
                        <Brain className="w-3.5 h-3.5 text-cyan-400" /> Why this score was assigned:
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedLead.scoreExplanation}</p>
                    </div>

                    <div>
                      <h4 className="text-[10px] text-slate-400 font-mono uppercase font-bold">🎯 Pain Points detected:</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedLead.painPoints}</p>
                    </div>

                    <div>
                      <h4 className="text-[10px] text-slate-400 font-mono uppercase font-bold text-violet-400">💡 Dynamic Tactics Recommendation:</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedLead.recommendation}</p>
                    </div>

                    <div>
                      <h4 className="text-[10px] text-slate-400 font-mono uppercase font-bold text-green-400">⚡ Immediate Next Action:</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed font-semibold">{selectedLead.nextAction}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-950/30 border border-slate-850 rounded-2xl text-center space-y-4">
                  <Brain className="w-8 h-8 text-cyan-500/40 mx-auto animate-pulse" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">AI Qualification Pending</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Gemini has not evaluated this lead yet. Trigger pipeline qualification now to calculate scores and recommendations.
                    </p>
                  </div>
                  <button
                    onClick={() => triggerAIScoring(selectedLead.id)}
                    disabled={aiScoringLeadId === selectedLead.id}
                    className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-cyan-500/10 active:scale-[0.98]"
                  >
                    {aiScoringLeadId === selectedLead.id ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        AI Score & Qualify
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center text-slate-500 py-12">
              <Brain className="w-12 h-12 mb-3 text-slate-700" />
              <p className="text-xs font-mono">Select a lead from directory to audit qualification card.</p>
            </div>
          )}

          {selectedLead && (
            <div className="mt-6 flex justify-between gap-2 border-t border-slate-850/80 pt-4 text-xs font-medium">
              <span className="text-slate-500">Owner ID: {selectedLead.ownerId}</span>
              <button
                onClick={() => {
                  if (confirm('Delete lead permanently from workspace pipeline?')) {
                    fetch(`${apiBaseUrl}/api/leads/${selectedLead.id}`, {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${token}` }
                    }).then(() => {
                      setSelectedLead(null);
                      fetchLeads();
                    });
                  }
                }}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                Delete Lead
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Lead modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                <Plus className="w-5 h-5 text-cyan-400" />
                Add Pipeline Lead
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text" required placeholder="Diana Prince" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email" required placeholder="diana@museum.org" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Company</label>
                  <input
                    type="text" required placeholder="Themyscira Cultural Corp" value={company} onChange={(e) => setCompany(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Job Title</label>
                  <input
                    type="text" required placeholder="Executive Director" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Industry</label>
                  <select
                    value={industry} onChange={(e) => setIndustry(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Aerospace & Defense">Aerospace & Defense</option>
                    <option value="Healthcare & Biotech">Healthcare & Biotech</option>
                    <option value="Education & Non-Profit">Education & Non-Profit</option>
                    <option value="FinTech">FinTech</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Estimated Budget ($)</label>
                  <input
                    type="number" required placeholder="35000" value={budget} onChange={(e) => setBudget(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Priority</label>
                  <select
                    value={priority} onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Contact Phone</label>
                  <input
                    type="text" placeholder="+1-202-555-0188" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Discovery Notes / Context</label>
                <textarea
                  rows={3} placeholder="Provide initial contact details, pain points mentioned, etc..." value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer active:scale-[0.99]"
              >
                Register Pipeline Lead
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                CSV / JSON Leads Importer
              </h3>
              <button onClick={() => setIsBulkOpen(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkUpload} className="space-y-4 text-xs">
              <div>
                <p className="text-slate-400 mb-3 leading-relaxed">
                  Paste comma-separated text (CSV format) starting with headers: <code className="text-cyan-400 font-mono">name,email,company,budget,jobTitle</code>. Alternatively, paste standard JSON array.
                </p>
                <textarea
                  rows={8}
                  placeholder={`name,email,company,budget,jobTitle\nArthur Curry,arthur@aquafarm.com,Atlantis Aquaculture,12000,General Manager\nBruce Wayne,bruce@waynecorp.com,Wayne Enterprises,450000,CTO`}
                  value={bulkRawJson}
                  onChange={(e) => setBulkRawJson(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50 font-mono resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer active:scale-[0.99]"
              >
                Execute Bulk Import Sync
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
