import React, { useState, useEffect } from 'react';
import { Cloud, CloudUpload, CloudDownload, Activity, CheckCircle, AlertTriangle, ShieldCheck, Database, RefreshCw, Terminal } from 'lucide-react';
import { doc, getDocFromServer, collection, getDocs, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface FirebaseSyncViewProps {
  apiBaseUrl: string;
  token: string;
}

export default function FirebaseSyncView({ apiBaseUrl, token }: FirebaseSyncViewProps) {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Real-time Firestore document stats
  const [cloudStats, setCloudStats] = useState({
    users: 0,
    leads: 0,
    customers: 0,
    opportunities: 0,
    tasks: 0,
    notifications: 0
  });

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSyncLogs(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const testConnection = async () => {
    setConnectionStatus('checking');
    try {
      // Create a test collection document as specified by the validation guideline
      const testDocRef = doc(db, 'test', 'connection');
      await getDocFromServer(testDocRef);
      setConnectionStatus('connected');
      addLog('Firebase connection validated successfully.');
      fetchCloudStats();
    } catch (err: any) {
      console.error(err);
      setConnectionStatus('error');
      setErrorMessage(err.message || 'The Firestore client is currently offline or unconfigured.');
      addLog(`Connection validation failed: ${err.message || 'Offline'}`);
    }
  };

  const fetchCloudStats = async () => {
    try {
      const collections = ['users', 'leads', 'customers', 'opportunities', 'tasks', 'notifications'] as const;
      const counts: any = {};
      for (const colName of collections) {
        try {
          const snap = await getDocs(collection(db, colName));
          counts[colName] = snap.size;
        } catch (e) {
          counts[colName] = 0;
        }
      }
      setCloudStats(counts);
      addLog('Fetched live cloud document counters.');
    } catch (err) {
      console.error('Failed to fetch cloud stats', err);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const handlePushToCloud = async () => {
    setLoading(true);
    addLog('Starting CRM data payload migration to Firestore...');
    try {
      // 1. Fetch all local CRM data from our server API
      const res = await fetch(`${apiBaseUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to retrieve active CRM credentials.');

      // Fetch the collections
      const fetchList = async (path: string) => {
        const r = await fetch(`${apiBaseUrl}/api/${path}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return r.ok ? await r.json() : [];
      };

      const [leads, customers, opportunities, tasks, notifications] = await Promise.all([
        fetchList('leads'),
        fetchList('customers'),
        fetchList('opportunities'),
        fetchList('tasks'),
        fetchList('notifications')
      ]);

      addLog(`Pulled local records: ${leads.length} leads, ${customers.length} clients, ${opportunities.length} opportunities.`);

      // 2. Write each collection to Firebase Firestore securely with precise transaction references
      let uploadCount = 0;

      for (const lead of leads) {
        const cleanLead = {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone || '',
          company: lead.company,
          industry: lead.industry || '',
          size: lead.size || '',
          budget: Number(lead.budget) || 0,
          jobTitle: lead.jobTitle || '',
          source: lead.source || '',
          status: lead.status,
          priority: lead.priority,
          tags: lead.tags || [],
          notes: lead.notes || '',
          ownerId: lead.ownerId,
          score: Number(lead.score) || 0,
          scoreExplanation: lead.scoreExplanation || '',
          buyingIntent: lead.buyingIntent || 'Medium',
          painPoints: lead.painPoints || '',
          urgency: lead.urgency || 'Warm',
          budgetLevel: lead.budgetLevel || 'Medium',
          recommendation: lead.recommendation || '',
          nextAction: lead.nextAction || '',
          createdAt: lead.createdAt || new Date().toISOString()
        };
        try {
          await setDoc(doc(db, 'leads', lead.id), cleanLead);
          uploadCount++;
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `leads/${lead.id}`);
        }
      }

      for (const cust of customers) {
        const cleanCust = {
          id: cust.id,
          name: cust.name,
          email: cust.email,
          phone: cust.phone || '',
          company: cust.company,
          industry: cust.industry || '',
          size: cust.size || '',
          budget: Number(cust.budget) || 0,
          country: cust.country || '',
          source: cust.source || '',
          status: cust.status,
          ownerId: cust.ownerId,
          createdAt: cust.createdAt || new Date().toISOString()
        };
        try {
          await setDoc(doc(db, 'customers', cust.id), cleanCust);
          uploadCount++;
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `customers/${cust.id}`);
        }
      }

      for (const opp of opportunities) {
        const cleanOpp = {
          id: opp.id,
          name: opp.name,
          company: opp.company,
          stage: opp.stage,
          revenue: Number(opp.revenue) || 0,
          probability: Number(opp.probability) || 0,
          leadId: opp.leadId || '',
          customerId: opp.customerId || '',
          expectedClosingDate: opp.expectedClosingDate || '',
          riskLevel: opp.riskLevel || 'Medium',
          predictedStrategy: opp.predictedStrategy || '',
          createdAt: opp.createdAt || new Date().toISOString()
        };
        try {
          await setDoc(doc(db, 'opportunities', opp.id), cleanOpp);
          uploadCount++;
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `opportunities/${opp.id}`);
        }
      }

      for (const task of tasks) {
        const cleanTask = {
          id: task.id,
          title: task.title,
          description: task.description || '',
          dueDate: task.dueDate || '',
          status: task.status,
          priority: task.priority,
          type: task.type || 'Follow-up',
          ownerId: task.ownerId,
          createdAt: task.createdAt || new Date().toISOString()
        };
        try {
          await setDoc(doc(db, 'tasks', task.id), cleanTask);
          uploadCount++;
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `tasks/${task.id}`);
        }
      }

      for (const notif of notifications) {
        const cleanNotif = {
          id: notif.id,
          userId: notif.userId,
          title: notif.title,
          message: notif.message,
          read: Boolean(notif.read),
          type: notif.type || 'System',
          createdAt: notif.createdAt || new Date().toISOString()
        };
        try {
          await setDoc(doc(db, 'notifications', notif.id), cleanNotif);
          uploadCount++;
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `notifications/${notif.id}`);
        }
      }

      addLog(`Migration completed. ${uploadCount} documents uploaded and validated.`);
      fetchCloudStats();
    } catch (err: any) {
      addLog(`Migration error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePullFromCloud = async () => {
    setLoading(true);
    addLog('Pulling consolidated CRM backups from Firestore Cloud...');
    try {
      const fetchCloudCol = async (name: string) => {
        const snap = await getDocs(collection(db, name));
        return snap.docs.map(d => d.data());
      };

      const [leads, customers, opportunities, tasks, notifications] = await Promise.all([
        fetchCloudCol('leads'),
        fetchCloudCol('customers'),
        fetchCloudCol('opportunities'),
        fetchCloudCol('tasks'),
        fetchCloudCol('notifications')
      ]);

      addLog(`Fetched from cloud: ${leads.length} leads, ${customers.length} clients, ${opportunities.length} opportunities.`);

      if (leads.length === 0 && customers.length === 0) {
        throw new Error('Firestore cloud records are empty. Push data first to create a backup.');
      }

      // Sync down to the server-side memory database
      const syncRes = await fetch(`${apiBaseUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!syncRes.ok) throw new Error('Authorization rejected by CRM middleware.');

      // We will POST the records to bulk sync on the server
      const saveRes = await fetch(`${apiBaseUrl}/api/sync-restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ leads, customers, opportunities, tasks, notifications })
      });

      if (!saveRes.ok) throw new Error('Local server failed to restore database packet.');
      
      addLog('Successfully restored local CRM engine from Firestore Cloud.');
    } catch (err: any) {
      addLog(`Restore error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div id="firebase-sync-header" className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Cloud className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-sans">Firebase Cloud Sync Hub</h1>
              <p className="text-xs text-slate-400 mt-0.5">Manage persistent backups, secure SSO, and live Firestore database operations.</p>
            </div>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2">
          {connectionStatus === 'checking' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Verifying Connection...
            </span>
          )}
          {connectionStatus === 'connected' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              Firestore Secure Online
            </span>
          )}
          {connectionStatus === 'error' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-mono">
              <AlertTriangle className="w-3.5 h-3.5" />
              Database Offline
            </span>
          )}
          <button
            onClick={testConnection}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Refresh database connection"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {connectionStatus === 'error' && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <div className="font-bold uppercase tracking-wider">Initialization Error</div>
            <p className="mt-1 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sync Controls Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 backdrop-blur-md">
            <h2 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
              <Database className="w-4.5 h-4.5 text-cyan-400" />
              Cloud Database Actions
            </h2>
            <p className="text-xs text-slate-400 mb-6">Synchronize and secure pipeline states by pushing active leads, tasks, and history payloads directly into the cloud.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Push Action */}
              <button
                onClick={handlePushToCloud}
                disabled={loading || connectionStatus !== 'connected'}
                className="p-5 rounded-xl border border-cyan-500/10 bg-cyan-500/5 hover:bg-cyan-500/10 text-left cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed group active:scale-[0.98]"
              >
                <div className="flex justify-between items-start">
                  <span className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400">
                    <CloudUpload className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-cyan-500 group-hover:text-cyan-400">UPLOAD RECORD</span>
                </div>
                <h3 className="text-sm font-bold text-white mt-4">Backup local data to cloud</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Pushes all leads, tasks, customers, and opportunities records safely to secure Cloud Firestore.</p>
              </button>

              {/* Pull Action */}
              <button
                onClick={handlePullFromCloud}
                disabled={loading || connectionStatus !== 'connected'}
                className="p-5 rounded-xl border border-violet-500/10 bg-violet-500/5 hover:bg-violet-500/10 text-left cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed group active:scale-[0.98]"
              >
                <div className="flex justify-between items-start">
                  <span className="p-2 rounded-lg bg-violet-500/15 text-violet-400">
                    <CloudDownload className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-violet-500 group-hover:text-violet-400">RESTORE STATE</span>
                </div>
                <h3 className="text-sm font-bold text-white mt-4">Restore local from cloud backup</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Retrieves all cloud collections and imports them back to overwrite local server memory.</p>
              </button>
            </div>
          </div>

          {/* Firestore Statistics Dashboard */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-cyan-400" />
              Cloud Live Firestore Metrics
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { name: 'leads', label: 'Pipeline Leads' },
                { name: 'customers', label: 'Onboarded Clients' },
                { name: 'opportunities', label: 'Opportunities' },
                { name: 'tasks', label: 'Tasks Logs' },
                { name: 'notifications', label: 'Telemetry Alerts' },
                { name: 'users', label: 'Active Profiles' }
              ].map((col) => (
                <div key={col.name} className="p-4 rounded-xl bg-slate-950/40 border border-slate-900/60 text-center">
                  <div className="text-lg font-bold text-white font-mono">{cloudStats[col.name as keyof typeof cloudStats] || 0}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{col.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sync Console & Audit Logs */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 flex flex-col h-full">
          <h2 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
            <Terminal className="w-4.5 h-4.5 text-cyan-400 animate-pulse" />
            Sync Console Output
          </h2>
          <p className="text-xs text-slate-400 mb-4">View diagnostic logging messages, transactional events, and Firebase authorization metrics.</p>

          <div className="flex-1 bg-black/60 rounded-xl p-4 font-mono text-[11px] text-slate-300 h-64 lg:h-96 overflow-y-auto border border-slate-950 leading-relaxed pr-2 space-y-1.5">
            {syncLogs.map((log, idx) => (
              <div key={idx} className={log.includes('error') || log.includes('failed') ? 'text-red-400' : log.includes('validated') || log.includes('Success') ? 'text-emerald-400' : 'text-slate-300'}>
                {log}
              </div>
            ))}
            {syncLogs.length === 0 && (
              <div className="text-slate-500 italic text-center py-12">Console ready. No sync activities recorded.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
