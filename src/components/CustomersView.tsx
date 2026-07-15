import React, { useState, useEffect } from 'react';
import { Search, Plus, Sparkles, Phone, Mail, Building2, ShoppingBag, Globe, Brain, User, AlertCircle, Trash2, Calendar } from 'lucide-react';
import { Customer } from '../types';

interface CustomersViewProps {
  apiBaseUrl: string;
  token: string;
  user: any;
}

export default function CustomersView({ apiBaseUrl, token, user }: CustomersViewProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);

  // Modal forms
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [size, setSize] = useState('11-50');
  const [budget, setBudget] = useState('');
  const [country, setCountry] = useState('United States');
  const [source, setSource] = useState('Direct Web');

  // AI Upsell Recommendation States
  const [recommendingId, setRecommendingId] = useState<string | null>(null);
  const [aiRecommend, setAiRecommend] = useState<any>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [token]);

  const handleAddCust = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBaseUrl}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name, email, phone, company, industry, size,
          budget: Number(budget) || 10000, country, source
        })
      });
      if (res.ok) {
        setIsAddOpen(false);
        setName(''); setEmail(''); setPhone(''); setCompany(''); setBudget('');
        fetchCustomers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerUpsellRecommendation = async (custId: string) => {
    setRecommendingId(custId);
    setAiRecommend(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/customers/${custId}/ai-recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setAiRecommend(data.recommendation);
      }
    } catch (err) {
      console.error('Upsell advice failed:', err);
    } finally {
      setRecommendingId(null);
    }
  };

  const handleDeleteCust = async (id: string) => {
    if (!confirm('Delete customer permanently? This clears all pipeline and purchase transactions.')) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/customers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedCust(null);
        setAiRecommend(null);
        fetchCustomers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search customers by company or contact..."
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
          Onboard Customer
        </button>
      </div>

      {/* Grid splits */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Customer list table card */}
        <div className="xl:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/30 border-b border-slate-850/70 text-slate-400 text-[11px] font-mono uppercase tracking-wider">
                  <th className="py-4 px-5">Contact</th>
                  <th className="py-4 px-4">Company</th>
                  <th className="py-4 px-4">Industry</th>
                  <th className="py-4 px-4">Budget Scope</th>
                  <th className="py-4 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-300 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      Loading customer lifecycle data...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No on-boarded customers found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr
                      key={cust.id}
                      onClick={() => {
                        setSelectedCust(cust);
                        setAiRecommend(null);
                      }}
                      className={`hover:bg-slate-950/20 cursor-pointer transition-all ${
                        selectedCust?.id === cust.id ? 'bg-slate-950/30 border-l-2 border-l-cyan-500' : ''
                      }`}
                    >
                      <td className="py-4 px-5">
                        <div className="font-semibold text-white">{cust.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{cust.email}</div>
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-200">
                        {cust.company}
                      </td>
                      <td className="py-4 px-4 text-slate-400">
                        {cust.industry}
                      </td>
                      <td className="py-4 px-4 font-mono font-medium text-slate-300">
                        ${cust.budget.toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          cust.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-slate-950/50 text-slate-500'
                        }`}>
                          {cust.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed customer workspace + AI product recommender tab sidebar */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 min-h-[400px] flex flex-col justify-between">
          {selectedCust ? (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Lifecycle Profile Card</span>
                  <h3 className="text-lg font-bold text-white mt-1">{selectedCust.name}</h3>
                  <p className="text-xs text-cyan-400">{selectedCust.company}</p>
                </div>
                <button
                  onClick={() => handleDeleteCust(selectedCust.id)}
                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg cursor-pointer transition-all"
                  title="Offboard Customer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Core client profile specifications */}
              <div className="space-y-2.5 bg-slate-950/20 border border-slate-850/70 rounded-xl p-4 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Industry</span>
                  <span className="font-semibold">{selectedCust.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Scale / Country</span>
                  <span className="font-semibold">{selectedCust.size} / {selectedCust.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Address</span>
                  <span className="font-mono">{selectedCust.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</span>
                  <span className="font-mono">{selectedCust.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Onboarded At</span>
                  <span className="font-mono">{new Date(selectedCust.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Purchase history list section */}
              <div>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  SaaS Sales History
                </h4>
                {selectedCust.purchaseHistory && selectedCust.purchaseHistory.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedCust.purchaseHistory.map((ph: any) => (
                      <div key={ph.id} className="p-2.5 bg-slate-950/40 border border-slate-850 rounded-lg flex justify-between items-center text-xs">
                        <div>
                          <span className="text-slate-200 font-semibold block">{ph.items}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{new Date(ph.date).toLocaleDateString()}</span>
                        </div>
                        <span className="text-green-400 font-bold font-mono">${ph.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950/20 border border-slate-850 text-center rounded-xl text-slate-500 text-[11px] font-mono">
                    No historic orders recorded.
                  </div>
                )}
              </div>

              {/* AI Upsell engine recommendation card */}
              <div className="border-t border-slate-850/80 pt-4">
                {aiRecommend ? (
                  <div className="bg-gradient-to-br from-cyan-500/5 to-violet-500/5 border border-cyan-500/10 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h5 className="text-xs font-bold text-cyan-400 flex items-center gap-1 font-mono uppercase">
                        <Brain className="w-4 h-4" /> AI Upsell Recommendation
                      </h5>
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded-md text-[10px] font-bold font-mono">
                        {aiRecommend.upsellChance}% Chance
                      </span>
                    </div>

                    <div className="text-xs">
                      <div className="text-slate-200 font-bold text-sm">{aiRecommend.suggestedProduct}</div>
                      <p className="text-slate-400 mt-1.5 leading-relaxed text-[11px]">{aiRecommend.explanation}</p>
                    </div>

                    <button
                      onClick={() => triggerUpsellRecommendation(selectedCust.id)}
                      className="w-full py-1.5 bg-slate-950/50 hover:bg-slate-950 border border-slate-800 text-slate-300 text-[10px] rounded-lg transition-all cursor-pointer"
                    >
                      Recalculate Upsell Analysis
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => triggerUpsellRecommendation(selectedCust.id)}
                    disabled={recommendingId === selectedCust.id}
                    className="w-full py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    {recommendingId === selectedCust.id ? (
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        AI Upsell Product Recommender
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center text-slate-500 py-12">
              <Building2 className="w-12 h-12 mb-3 text-slate-700" />
              <p className="text-xs font-mono">Select a settled client to review lifetime profiles and AI recommendations.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                <Plus className="w-5 h-5 text-cyan-400" />
                Onboard Settled Customer
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400">
                <Globe className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCust} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Contact Full Name</label>
                  <input
                    type="text" required placeholder="Marcus Vance" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Contact Email</label>
                  <input
                    type="email" required placeholder="m.vance@vanguard.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Company / Organization</label>
                  <input
                    type="text" required placeholder="Vanguard Logistics" value={company} onChange={(e) => setCompany(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Industry Tier</label>
                  <select
                    value={industry} onChange={(e) => setIndustry(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Transportation">Transportation</option>
                    <option value="FinTech">FinTech</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Aerospace & Defense">Aerospace & Defense</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Company Size (Scale)</label>
                  <select
                    value={size} onChange={(e) => setSize(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Estimated Budget Scope ($)</label>
                  <input
                    type="number" required placeholder="75000" value={budget} onChange={(e) => setBudget(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Operating Country</label>
                  <input
                    type="text" placeholder="United States" value={country} onChange={(e) => setCountry(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Onboarding Source</label>
                  <select
                    value={source} onChange={(e) => setSource(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  >
                    <option value="Direct Web">Direct Web</option>
                    <option value="LinkedIn Outbound">LinkedIn Outbound</option>
                    <option value="Inbound Request">Inbound Request</option>
                    <option value="Webinar Attendee">Webinar Attendee</option>
                    <option value="Google Search">Google Search</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer active:scale-[0.99]"
              >
                Onboard Client Database
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
