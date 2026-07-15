import React, { useState, useEffect } from 'react';
import { DollarSign, Percent, TrendingUp, Users, Target, RefreshCw, AlertCircle, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { Customer, Lead, Opportunity } from '../types';

interface DashboardViewProps {
  apiBaseUrl: string;
  token: string;
  user: any;
  onNavigate: (view: string) => void;
}

export default function DashboardView({ apiBaseUrl, token, user, onNavigate }: DashboardViewProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch(`${apiBaseUrl}/api/analytics/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const stats = await statsRes.json();

      // Fetch recent activities
      const actRes = await fetch(`${apiBaseUrl}/api/customers`, { // Let's check customers and get dynamic feeds
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const customers = await actRes.json();

      setData(stats);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-mono text-sm">Aggregating CRM telemetry...</p>
      </div>
    );
  }

  const m = data.metrics;

  // Static/dynamic calculations
  const mockActivities = [
    { id: 1, type: 'lead_qualified', desc: 'Diana Prince from Themyscira was qualified with Score 88/100 by Gemini.', time: '2 hours ago', icon: '🔥' },
    { id: 2, type: 'opportunity_forecasted', desc: 'Cyberdyne Advanced Labs predicted win chance adjusted to 85%.', time: '5 hours ago', icon: '📈' },
    { id: 3, type: 'email_sent', desc: 'Proposal recap sent to Victor Stone (VP Cyberdyne).', time: '1 day ago', icon: '✉️' },
    { id: 4, type: 'deal_closed', desc: 'Stark Industries purchased CRM Cloud Suite ($18,000).', time: '2 days ago', icon: '🎉' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-sans tracking-tight">
            Hello, {user.name} ☀️
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Role: <span className="text-cyan-400 font-mono font-semibold">{user.role}</span>. Here is your enterprise pipeline overview.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate('daily-brief')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-slate-950 text-xs font-semibold rounded-xl cursor-pointer transition-all active:scale-[0.98]"
          >
            <Target className="w-4 h-4" />
            Morning AI Briefing
          </button>
          <button
            onClick={fetchDashboardData}
            className="p-2.5 bg-slate-950/40 hover:bg-slate-950/60 border border-slate-800 rounded-xl text-slate-400 cursor-pointer transition-all"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary KPI Scorecard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900/30 backdrop-blur-xs border border-slate-800/70 rounded-2xl p-5 hover:border-slate-700/60 transition-all group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Revenue Settled</span>
            <span className="p-2 bg-green-500/10 text-green-400 rounded-lg group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white font-mono">
              ${m.totalRevenue.toLocaleString()}
            </h3>
            <span className="text-xs text-green-400 flex items-center gap-1 mt-1.5 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> +14.2% month-over-month
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/30 backdrop-blur-xs border border-slate-800/70 rounded-2xl p-5 hover:border-slate-700/60 transition-all group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Open Pipeline Target</span>
            <span className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white font-mono">
              ${m.pipelineValue.toLocaleString()}
            </h3>
            <span className="text-xs text-cyan-400 flex items-center gap-1 mt-1.5 font-medium">
              <Target className="w-3.5 h-3.5" /> Open deal forecast
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/30 backdrop-blur-xs border border-slate-800/70 rounded-2xl p-5 hover:border-slate-700/60 transition-all group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Deals Close Rate</span>
            <span className="p-2 bg-violet-500/10 text-violet-400 rounded-lg group-hover:scale-110 transition-transform">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white font-mono">
              {m.winRate}%
            </h3>
            <span className="text-xs text-violet-400 flex items-center gap-1 mt-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Industry high benchmark
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/30 backdrop-blur-xs border border-slate-800/70 rounded-2xl p-5 hover:border-slate-700/60 transition-all group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Customers</span>
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white font-mono">
              {m.customersCount}
            </h3>
            <span className="text-xs text-amber-400 flex items-center gap-1 mt-1.5 font-medium">
              <Users className="w-3.5 h-3.5" /> {m.activeLeads} raw leads in pool
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Revenue Progress (Line Chart) */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Monthly Sales Pipeline</h3>
              <p className="text-xs text-slate-400">Comparing pipeline value vs closed won targets ($)</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-medium uppercase font-mono">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>Pipeline</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-400"></span>Revenue</div>
            </div>
          </div>

          {/* Elegant Custom SVG Chart */}
          <div className="w-full h-64 relative">
            <svg viewBox="0 0 500 220" className="w-full h-full overflow-visible">
              {/* Horizontal Grid lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#1e293b" strokeDasharray="3,3" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="#1e293b" strokeDasharray="3,3" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="#1e293b" strokeDasharray="3,3" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="#1e293b" strokeDasharray="3,3" />

              {/* Chart labels (Y Axis) */}
              <text x="30" y="24" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">120K</text>
              <text x="30" y="74" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">80K</text>
              <text x="30" y="124" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">40K</text>
              <text x="30" y="174" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">0K</text>

              {/* Area Under Line (Pipeline) */}
              <path
                d="M 40,170 Q 113,150 186,130 T 332,95 T 480,40 L 480,170 L 40,170 Z"
                fill="url(#pipeline-grad)"
                opacity="0.15"
              />

              {/* Area Under Line (Revenue) */}
              <path
                d="M 40,170 Q 113,160 186,145 T 332,105 T 480,60 L 480,170 L 40,170 Z"
                fill="url(#revenue-grad)"
                opacity="0.15"
              />

              {/* Lines */}
              <path
                d="M 40,170 Q 113,150 186,130 T 332,95 T 480,40"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M 40,170 Q 113,160 186,145 T 332,105 T 480,60"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Interactive Dots */}
              <circle cx="186" cy="130" r="4.5" fill="#22d3ee" stroke="#0f172a" strokeWidth="1.5" />
              <circle cx="332" cy="95" r="4.5" fill="#22d3ee" stroke="#0f172a" strokeWidth="1.5" />
              <circle cx="480" cy="40" r="4.5" fill="#22d3ee" stroke="#0f172a" strokeWidth="1.5" />

              <circle cx="186" cy="145" r="4.5" fill="#a78bfa" stroke="#0f172a" strokeWidth="1.5" />
              <circle cx="332" cy="105" r="4.5" fill="#a78bfa" stroke="#0f172a" strokeWidth="1.5" />
              <circle cx="480" cy="60" r="4.5" fill="#a78bfa" stroke="#0f172a" strokeWidth="1.5" />

              {/* X Axis Labels */}
              <text x="40" y="195" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="sans-serif">Jan</text>
              <text x="113" y="195" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="sans-serif">Mar</text>
              <text x="186" y="195" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="sans-serif">May</text>
              <text x="259" y="195" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="sans-serif">Jul</text>
              <text x="332" y="195" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="sans-serif">Sep</text>
              <text x="406" y="195" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="sans-serif">Nov</text>
              <text x="480" y="195" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="sans-serif">Dec</text>

              {/* Gradients */}
              <defs>
                <linearGradient id="pipeline-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="revenue-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Chart 2: Lead Funnel Breakdown */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Conversion Funnel</h3>
            <p className="text-xs text-slate-400 mb-6">CRM lead progression efficiency stages</p>
          </div>

          <div className="space-y-4">
            {/* Stage 1 */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">1. Raw Leads Pool</span>
                <span className="text-white font-bold">{data.funnel.new + data.funnel.contacted + data.funnel.qualified} count</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full transition-all" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Stage 2 */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">2. Contacted Chapter</span>
                <span className="text-white font-bold">{data.funnel.contacted + data.funnel.qualified} count</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full transition-all" style={{ width: '75%' }}></div>
              </div>
            </div>

            {/* Stage 3 */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">3. AI Qualified Leads</span>
                <span className="text-white font-bold">{data.funnel.qualified} count</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                <div className="bg-indigo-400 h-full rounded-full transition-all" style={{ width: '55%' }}></div>
              </div>
            </div>

            {/* Stage 4 */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">4. Created Deals</span>
                <span className="text-white font-bold">{data.funnel.opportunities} deals</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                <div className="bg-violet-400 h-full rounded-full transition-all" style={{ width: '40%' }}></div>
              </div>
            </div>

            {/* Stage 5 */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">5. Closed Won Revenue</span>
                <span className="text-green-400 font-bold">{data.funnel.closedWon} deals</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                <div className="bg-green-400 h-full rounded-full transition-all" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl text-[11px] text-slate-400 leading-relaxed">
            💡 <strong>AI Insights:</strong> Lead progression is highly active. Focusing more engagement on <strong>"Contacted"</strong> will increase closed won chances by <strong>+18%</strong>.
          </div>
        </div>
      </div>

      {/* Feed & Tasks columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Stream */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Pipeline Activities</h3>
          <div className="space-y-4">
            {mockActivities.map((act) => (
              <div key={act.id} className="flex gap-4 p-3 bg-slate-950/20 border border-slate-900 rounded-xl hover:border-slate-800 transition-all">
                <div className="w-9 h-9 shrink-0 flex items-center justify-center bg-slate-900 border border-slate-800 text-lg rounded-xl">
                  {act.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-300 text-xs font-medium leading-relaxed">
                    {act.desc}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hot Leads list summary widget */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Hot Targets</h3>
            <p className="text-xs text-slate-400 mb-4">Leads most likely to convert</p>

            <div className="space-y-3">
              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-semibold text-white">Victor Stone</h4>
                  <span className="text-[10px] text-slate-400 block font-mono">Cyberdyne Advanced</span>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold font-mono text-green-400 bg-green-500/10 rounded-lg">95/100</span>
              </div>

              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-semibold text-white">Diana Prince</h4>
                  <span className="text-[10px] text-slate-400 block font-mono">Themyscira Cultural</span>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold font-mono text-cyan-400 bg-cyan-500/10 rounded-lg">88/100</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('leads')}
            className="w-full py-2.5 bg-slate-950/50 border border-slate-800 hover:bg-slate-950 hover:border-slate-700 text-slate-300 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-all mt-4 cursor-pointer"
          >
            Review all active leads
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
