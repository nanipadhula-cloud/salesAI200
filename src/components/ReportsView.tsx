import React, { useState } from 'react';
import { FileSpreadsheet, Download, RefreshCw, BarChart2, ShieldCheck, Database, FileText } from 'lucide-react';

interface ReportsViewProps {
  apiBaseUrl: string;
  token: string;
}

export default function ReportsView({ apiBaseUrl, token }: ReportsViewProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadReport = async (type: 'leads' | 'customers' | 'opportunities') => {
    setDownloading(type);
    try {
      const res = await fetch(`${apiBaseUrl}/api/${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      // Simple JSON to CSV Converter
      let csvContent = '';
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        csvContent += headers.join(',') + '\n';

        data.forEach(item => {
          const row = headers.map(header => {
            const val = item[header];
            if (typeof val === 'object') {
              return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            }
            return `"${String(val).replace(/"/g, '""')}"`;
          });
          csvContent += row.join(',') + '\n';
        });
      } else {
        csvContent = 'No telemetry datasets registered.';
      }

      // Download trigger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `salesgenie_${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in text-xs">
      {/* Header Panel */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart2 className="text-cyan-400 w-5 h-5" />
          Enterprise CSV Sales Reporting
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Export pipeline databases instantly to Excel/CSV worksheets for regional management audits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-750 transition-all">
          <div className="space-y-2">
            <span className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg inline-block">
              <Database className="w-5 h-5" />
            </span>
            <h3 className="text-sm font-semibold text-white">Leads Directory Workbook</h3>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Extracts email directories, calculated lead intelligence scores, pain points, and next action recommendations.
            </p>
          </div>

          <button
            onClick={() => downloadReport('leads')}
            disabled={downloading !== null}
            className="w-full mt-5 py-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl transition-all font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            {downloading === 'leads' ? (
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download CSV Workbook
              </>
            )}
          </button>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-750 transition-all">
          <div className="space-y-2">
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg inline-block">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h3 className="text-sm font-semibold text-white">Onboarded Customer Accounts</h3>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Extracts settled client logs, countries, budgets, SaaS transaction values, and previous ordering dates.
            </p>
          </div>

          <button
            onClick={() => downloadReport('customers')}
            disabled={downloading !== null}
            className="w-full mt-5 py-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl transition-all font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            {downloading === 'customers' ? (
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download CSV Workbook
              </>
            )}
          </button>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-750 transition-all">
          <div className="space-y-2">
            <span className="p-2 bg-violet-500/10 text-violet-400 rounded-lg inline-block">
              <FileText className="w-5 h-5" />
            </span>
            <h3 className="text-sm font-semibold text-white">Deals Opportunity Pipeline</h3>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Extracts deal names, column categories, forecast closing dates, win probabilities, and calculated AI strategy texts.
            </p>
          </div>

          <button
            onClick={() => downloadReport('opportunities')}
            disabled={downloading !== null}
            className="w-full mt-5 py-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl transition-all font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            {downloading === 'opportunities' ? (
              <RefreshCw className="w-4 h-4 animate-spin text-violet-400" />
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download CSV Workbook
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
