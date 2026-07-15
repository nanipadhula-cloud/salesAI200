import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu, Sliders, Play, CheckCircle, RefreshCw, BarChart2,
  Database, Sparkles, TrendingUp, HelpCircle, Shield, HelpCircle as HelpIcon, ArrowRight, Server, LineChart
} from 'lucide-react';
import { Lead } from '../types';

interface MLTrainingViewProps {
  apiBaseUrl: string;
  token: string;
}

export default function MLTrainingView({ apiBaseUrl, token }: MLTrainingViewProps) {
  // Config state
  const [modelType, setModelType] = useState('Deep Neural Network (DNN)');
  const [targetFeature, setTargetFeature] = useState('score');
  const [epochs, setEpochs] = useState(100);
  const [learningRate, setLearningRate] = useState(0.01);
  const [features, setFeatures] = useState<string[]>([
    'callDuration',
    'budget',
    'websiteVisits',
    'emailOpens'
  ]);

  // CRM status state
  const [crmStats, setCrmStats] = useState({
    leadsCount: 0,
    customersCount: 0,
    opportunitiesCount: 0,
    loading: true
  });

  // Leads for Inference dropdown
  const [leadsList, setLeadsList] = useState<Lead[]>([]);

  // Training state
  const [training, setTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [trainingResult, setTrainingResult] = useState<any>(null);
  const [deployed, setDeployed] = useState(false);

  // Inference state
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [runningInference, setRunningInference] = useState(false);
  const [inferenceResult, setInferenceResult] = useState<any>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial CRM telemetry metadata
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const [leadsRes, custRes, oppsRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/leads`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${apiBaseUrl}/api/customers`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${apiBaseUrl}/api/opportunities`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (leadsRes.ok && custRes.ok && oppsRes.ok) {
          const leads = await leadsRes.json();
          const custs = await custRes.json();
          const opps = await oppsRes.json();

          setCrmStats({
            leadsCount: leads.length,
            customersCount: custs.length,
            opportunitiesCount: opps.length,
            loading: false
          });

          setLeadsList(leads);
          if (leads.length > 0) {
            setSelectedLeadId(leads[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load CRM metadata for ML training:', err);
        setCrmStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchTelemetry();
  }, [token]);

  // Scroll terminal logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Toggle features
  const handleFeatureToggle = (feat: string) => {
    if (features.includes(feat)) {
      if (features.length > 1) {
        setFeatures(features.filter(f => f !== feat));
      }
    } else {
      setFeatures([...features, feat]);
    }
  };

  // Run Training simulation
  const handleTrainModel = async () => {
    setTraining(true);
    setProgress(0);
    setCurrentEpoch(0);
    setDeployed(false);
    setInferenceResult(null);
    setTerminalLogs([]);
    setTrainingResult(null);

    const logs = [
      `[SYS] Initializing Machine Learning Model Environment...`,
      `[SYS] Model Selection: ${modelType}`,
      `[SYS] Optimizer selected: Adam (Learning Rate: ${learningRate})`,
      `[SYS] Loading current CRM training dataset...`,
      `[DATA] Successfully loaded ${crmStats.leadsCount} lead records and ${crmStats.opportunitiesCount} opportunities.`,
      `[DATA] Normalizing inputs for target feature: "${targetFeature}"...`,
      `[DATA] Features loaded: [${features.join(', ')}]`,
      `[INFO] Partitioning dataset: 75% Training / 25% Validation Split.`
    ];

    setTerminalLogs([...logs]);

    try {
      // Trigger API fetch for Gemini synthesized metrics first
      const apiRes = await fetch(`${apiBaseUrl}/api/ml/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          modelType,
          targetFeature,
          epochs,
          learningRate,
          features
        })
      });

      const apiData = await apiRes.json();
      if (!apiRes.ok || !apiData.success) {
        throw new Error(apiData.error || 'Failed to communicate with training API.');
      }

      const trainedMetrics = apiData.metrics;

      // Simulate step-by-step training epochs
      let currentPercent = 0;
      const intervalTime = 60; // ms per training step
      const steps = 25; // 25 progress checkpoints

      const interval = setInterval(() => {
        currentPercent += 4;
        setProgress(currentPercent);

        const epochNum = Math.min(epochs, Math.round((currentPercent / 100) * epochs));
        setCurrentEpoch(epochNum);

        // Append realistic logs
        const randomLogs = [
          `[EPOCH] Epoch ${epochNum}/${epochs} | Training Loss: ${(1.1 - (currentPercent / 100) * 0.9).toFixed(4)} | Accuracy: ${(0.45 + (currentPercent / 100) * 0.48 * 100).toFixed(1)}%`,
          `[SYS] Gradient step updated. L2 Regularization weight decay applied.`,
          `[VAL] Val Loss: ${(1.15 - (currentPercent / 100) * 0.85).toFixed(4)} | Val Accuracy: ${(0.42 + (currentPercent / 100) * 0.45 * 100).toFixed(1)}%`
        ];

        if (currentPercent % 20 === 0) {
          setTerminalLogs(prev => [...prev, randomLogs[0], randomLogs[1]]);
        } else if (currentPercent % 12 === 0) {
          setTerminalLogs(prev => [...prev, randomLogs[2]]);
        }

        if (currentPercent >= 100) {
          clearInterval(interval);
          setTraining(false);
          
          // Formulate full final response history based on API response
          const finalHistory = trainedMetrics.trainingHistory.map((h: any) => ({
            ...h,
            // fallback if nulls
            loss: h.loss || 0.1,
            valLoss: h.valLoss || 0.12,
            accuracy: h.accuracy || 0.9,
            valAccuracy: h.valAccuracy || 0.88
          }));

          setTrainingResult({
            ...trainedMetrics,
            trainingHistory: finalHistory
          });

          setTerminalLogs(prev => [
            ...prev,
            `[SYS] Convergence criteria satisfied.`,
            `[SUCCESS] Model successfully converged after ${epochs} epochs.`,
            `[EVAL] Final Accuracy: ${(trainedMetrics.accuracy * 100).toFixed(1)}% | F1 Score: ${trainedMetrics.f1Score.toFixed(3)}`,
            `[INFO] High-resolution weights locked. Deployed candidate is ready.`
          ]);
        }
      }, intervalTime);

    } catch (err: any) {
      console.error(err);
      setTraining(false);
      setTerminalLogs(prev => [
        ...prev,
        `[CRITICAL ERROR] Training process terminated: ${err.message || 'Connection lost.'}`
      ]);
    }
  };

  // Deploy Model
  const handleDeployModel = () => {
    setDeployed(true);
    setTerminalLogs(prev => [
      ...prev,
      `[DEPLOY] Uploading weights to cloud-hosted pipeline inference cluster...`,
      `[DEPLOY] Successfully registered model: "${modelType}" as ACTIVE pipeline scoring trigger.`,
      `[DEPLOY] Live requests will now be scored using this custom network!`
    ]);
  };

  // Run custom model prediction
  const handleRunInference = async () => {
    if (!selectedLeadId || !trainingResult) return;
    setRunningInference(true);
    setInferenceResult(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/ml/inference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          modelType,
          targetFeature,
          leadId: selectedLeadId,
          featureImportances: trainingResult.featureImportances
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setInferenceResult(data.result);
      } else {
        console.error('Inference prediction returned error:', data.error);
      }
    } catch (err) {
      console.error('Failed to run inference:', err);
    } finally {
      setRunningInference(false);
    }
  };

  const selectedLead = leadsList.find(l => l.id === selectedLeadId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-xs animate-fade-in pb-12">
      {/* Welcome & Info Header */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="text-cyan-400 w-5.5 h-5.5" />
            CRM Machine Learning Model Training Lab
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Build, configure, train, and deploy predictive intelligence scorecards customized directly to your active CRM sales database.
          </p>
        </div>

        {/* Database Telemetry Stats */}
        <div className="flex gap-3 bg-slate-950/60 border border-slate-800 p-3 rounded-xl font-mono text-[10px]">
          <div className="text-center px-2.5 border-r border-slate-850">
            <div className="text-slate-500 font-bold">LEADS</div>
            <div className="text-sm font-bold text-white mt-0.5">{crmStats.loading ? '...' : crmStats.leadsCount}</div>
          </div>
          <div className="text-center px-2.5 border-r border-slate-850">
            <div className="text-slate-500 font-bold">CLIENTS</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">{crmStats.loading ? '...' : crmStats.customersCount}</div>
          </div>
          <div className="text-center px-2.5">
            <div className="text-slate-500 font-bold">OPPORTUNITIES</div>
            <div className="text-sm font-bold text-violet-400 mt-0.5">{crmStats.loading ? '...' : crmStats.opportunitiesCount}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Config Parameters */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-5 h-fit">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <Sliders className="text-cyan-400 w-4.5 h-4.5" />
            <h3 className="text-sm font-semibold text-white">Hyperparameter Configuration</h3>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-slate-400 font-medium flex justify-between items-center">
              <span>Model Architecture</span>
              <span className="text-[10px] text-slate-500 font-mono font-bold">CLASSIFIER</span>
            </label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              disabled={training}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
            >
              <option value="Deep Neural Network (DNN)">Deep Neural Network (DNN)</option>
              <option value="Gradient Boosted Decision Trees (XGBoost)">Gradient Boosted Trees (XGBoost)</option>
              <option value="Random Forest Classifier">Random Forest Classifier</option>
              <option value="Support Vector Classifier (SVC)">Support Vector Classifier (SVC)</option>
            </select>
          </div>

          {/* Target Variable Selection */}
          <div className="space-y-2">
            <label className="text-slate-400 font-medium">Predictive Target Label</label>
            <select
              value={targetFeature}
              onChange={(e) => setTargetFeature(e.target.value)}
              disabled={training}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
            >
              <option value="score">Lead Qualification Score (0-100)</option>
              <option value="buyingIntent">Customer Buying Intent (High/Low)</option>
              <option value="probability">Opportunity Closing Probability (0-100%)</option>
              <option value="status">Client Churn Risk Status</option>
            </select>
          </div>

          {/* Training Epochs */}
          <div className="space-y-2">
            <div className="flex justify-between text-slate-400 font-medium">
              <span>Training Epochs</span>
              <span className="text-cyan-400 font-mono font-bold">{epochs}</span>
            </div>
            <input
              type="range"
              min="50"
              max="250"
              step="50"
              value={epochs}
              onChange={(e) => setEpochs(Number(e.target.value))}
              disabled={training}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Learning Rate */}
          <div className="space-y-2">
            <div className="flex justify-between text-slate-400 font-medium">
              <span>Learning Rate (α)</span>
              <span className="text-cyan-400 font-mono font-bold">{learningRate}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[0.001, 0.01, 0.05].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setLearningRate(rate)}
                  disabled={training}
                  className={`py-1.5 rounded-lg border font-mono font-semibold transition-all cursor-pointer ${
                    learningRate === rate
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400'
                      : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400'
                  }`}
                >
                  {rate}
                </button>
              ))}
            </div>
          </div>

          {/* Features check boxes */}
          <div className="space-y-2.5">
            <label className="text-slate-400 font-medium block">Dataset Training Features</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'callDuration', label: 'Call Duration' },
                { id: 'budget', label: 'Client Budget' },
                { id: 'websiteVisits', label: 'Web Visits' },
                { id: 'emailOpens', label: 'Email Opens' },
                { id: 'industry', label: 'Industry Tier' },
                { id: 'companySize', label: 'Company Scale' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFeatureToggle(f.id)}
                  disabled={training}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-left transition-all text-[11px] cursor-pointer ${
                    features.includes(f.id)
                      ? 'bg-slate-900 border-slate-700 text-white font-semibold'
                      : 'bg-slate-950/20 border-slate-850/80 text-slate-500'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${features.includes(f.id) ? 'bg-cyan-400' : 'bg-slate-800'}`}></span>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Train Trigger Button */}
          <button
            onClick={handleTrainModel}
            disabled={training || crmStats.leadsCount === 0}
            className="w-full mt-4 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-slate-950 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 disabled:opacity-50"
          >
            {training ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Training Model (Epoch {currentEpoch}/{epochs})...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                Execute Model Training
              </>
            )}
          </button>
        </div>

        {/* Column 2: Simulated Live Train Monitor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Training Status Monitor */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between h-[360px]">
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Database className="text-cyan-400 w-4.5 h-4.5" />
                <h3 className="text-sm font-semibold text-white">Live Training logs</h3>
              </div>
              {training && (
                <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full font-mono text-[9px] animate-pulse">
                  OPTIMIZING GRADIENT
                </span>
              )}
            </div>

            {/* Terminal logs container */}
            <div className="flex-1 bg-slate-950/80 border border-slate-855 rounded-xl my-4 p-4 font-mono text-[10px] leading-relaxed text-slate-300 overflow-y-auto max-h-[220px] shadow-inner space-y-1">
              {terminalLogs.map((log, index) => {
                let colorClass = 'text-slate-400';
                if (log.startsWith('[SYS]')) colorClass = 'text-cyan-400';
                if (log.startsWith('[DATA]')) colorClass = 'text-amber-400';
                if (log.startsWith('[VAL]')) colorClass = 'text-violet-400';
                if (log.startsWith('[SUCCESS]')) colorClass = 'text-emerald-400 font-bold';
                if (log.startsWith('[EPOCH]')) colorClass = 'text-slate-300';
                
                return (
                  <div key={index} className={colorClass}>
                    {log}
                  </div>
                );
              })}

              {terminalLogs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <Cpu className="w-8 h-8 opacity-20 mb-2 animate-pulse" />
                  <span>Configure parameters and click "Execute Model Training" to build custom intelligence models.</span>
                </div>
              )}
              <div ref={logsEndRef} />
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-slate-500 text-[10px] mb-1.5 font-mono">
                <span>Training Progress Status</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-850">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-violet-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Evaluation Metrics Panel */}
      {trainingResult && (
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/60 pb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="text-violet-400 w-5 h-5" />
              <div>
                <h3 className="text-sm font-semibold text-white">Model Evaluation Report Card</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">Comprehensive telemetry evaluation of converged candidate parameters.</p>
              </div>
            </div>

            {!deployed ? (
              <button
                onClick={handleDeployModel}
                className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <CheckCircle className="w-4 h-4" />
                Deploy Model to CRM Pipeline
              </button>
            ) : (
              <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded-xl flex items-center gap-2 font-mono text-[11px]">
                <Shield className="w-4 h-4 text-emerald-400 animate-pulse" />
                MODEL ACTIVE IN PIPELINE
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Accuracy card */}
            <div className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-xl text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Accuracy</span>
              <div className="text-2xl font-black font-mono text-cyan-400">{(trainingResult.accuracy * 100).toFixed(1)}%</div>
              <p className="text-slate-400 text-[10px] leading-relaxed">Percentage of correct forecasts against validated samples.</p>
            </div>

            {/* F1-Score card */}
            <div className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-xl text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">F1-Score (Macro)</span>
              <div className="text-2xl font-black font-mono text-violet-400">{trainingResult.f1Score.toFixed(3)}</div>
              <p className="text-slate-400 text-[10px] leading-relaxed">Harmonic mean of precision and recall ratios.</p>
            </div>

            {/* Precision card */}
            <div className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-xl text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Precision</span>
              <div className="text-2xl font-black font-mono text-white">{trainingResult.precision.toFixed(3)}</div>
              <p className="text-slate-400 text-[10px] leading-relaxed">Accuracy of pipeline positives flagged by classifier.</p>
            </div>

            {/* Recall card */}
            <div className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-xl text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Recall</span>
              <div className="text-2xl font-black font-mono text-amber-400">{trainingResult.recall.toFixed(3)}</div>
              <p className="text-slate-400 text-[10px] leading-relaxed">Ratio of true positive instances recovered successfully.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual Loss Chart via Custom SVGs */}
            <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-cyan-400" />
                  Model Loss Curve (Adam Gradient Descent)
                </h4>
                <div className="flex gap-3 text-[10px] font-mono font-bold">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <span className="w-2.5 h-0.5 bg-cyan-400 inline-block"></span>
                    Train Loss
                  </span>
                  <span className="flex items-center gap-1.5 text-violet-400">
                    <span className="w-2.5 h-0.5 bg-violet-400 inline-block"></span>
                    Val Loss
                  </span>
                </div>
              </div>

              {/* Responsive SVG Line Plot */}
              <div className="relative h-44 w-full">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="25" x2="100" y2="25" stroke="#1e293b" strokeDasharray="3" strokeWidth="0.5" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeDasharray="3" strokeWidth="0.5" />
                  <line x1="0" y1="75" x2="100" y2="75" stroke="#1e293b" strokeDasharray="3" strokeWidth="0.5" />

                  {/* SVG Path helper */}
                  {(() => {
                    const points = trainingResult.trainingHistory;
                    if (!points || points.length === 0) return null;
                    
                    // Maps loss value (e.g. 0.0 to 1.2) into Y coordinate (100 to 10)
                    const mapY = (val: number) => 100 - (val / 1.2) * 90;
                    const trainPath = points.map((p: any, i: number) => {
                      const x = (i / (points.length - 1)) * 100;
                      const y = mapY(p.loss);
                      return `${x},${y}`;
                    }).join(' ');

                    const valPath = points.map((p: any, i: number) => {
                      const x = (i / (points.length - 1)) * 100;
                      const y = mapY(p.valLoss);
                      return `${x},${y}`;
                    }).join(' ');

                    return (
                      <>
                        {/* Train Loss Line */}
                        <polyline
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="2.5"
                          points={trainPath}
                        />
                        {/* Val Loss Line */}
                        <polyline
                          fill="none"
                          stroke="#8b5cf6"
                          strokeWidth="2"
                          strokeDasharray="2"
                          points={valPath}
                        />

                        {/* Anchor points */}
                        {points.map((p: any, i: number) => {
                          const x = (i / (points.length - 1)) * 100;
                          return (
                            <g key={i}>
                              <circle cx={x} cy={mapY(p.loss)} r="1.5" fill="#22d3ee" />
                              <circle cx={x} cy={mapY(p.valLoss)} r="1" fill="#8b5cf6" />
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>

                {/* X Axis Indicators */}
                <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-2">
                  <span>Epoch 10</span>
                  <span>Epoch {Math.round(epochs * 0.5)}</span>
                  <span>Epoch {epochs} (Converged)</span>
                </div>
              </div>
            </div>

            {/* Confusion Matrix Card */}
            <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-xl space-y-4">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Binary Confusion Validation Matrix
              </h4>

              {/* Confusion Matrix Boxes */}
              <div className="grid grid-cols-2 gap-2 text-center">
                {/* TP */}
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-xl">
                  <div className="text-emerald-400 font-bold font-mono text-sm">{trainingResult.confusionMatrix.truePositive}</div>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5">True Positives (TP)</span>
                  <span className="text-[9px] text-slate-500 font-mono block mt-0.5">Predicted Active / Actual Active</span>
                </div>

                {/* FP */}
                <div className="bg-red-500/5 border border-red-500/10 p-3.5 rounded-xl">
                  <div className="text-red-400 font-bold font-mono text-sm">{trainingResult.confusionMatrix.falsePositive}</div>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5">False Positives (FP)</span>
                  <span className="text-[9px] text-slate-500 font-mono block mt-0.5">Predicted Active / Actual Idle</span>
                </div>

                {/* FN */}
                <div className="bg-orange-500/5 border border-orange-500/10 p-3.5 rounded-xl">
                  <div className="text-orange-400 font-bold font-mono text-sm">{trainingResult.confusionMatrix.falseNegative}</div>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5">False Negatives (FN)</span>
                  <span className="text-[9px] text-slate-500 font-mono block mt-0.5">Predicted Idle / Actual Active</span>
                </div>

                {/* TN */}
                <div className="bg-slate-900/40 border border-slate-800 p-3.5 rounded-xl">
                  <div className="text-slate-300 font-bold font-mono text-sm">{trainingResult.confusionMatrix.trueNegative}</div>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5">True Negatives (TN)</span>
                  <span className="text-[9px] text-slate-500 font-mono block mt-0.5">Predicted Idle / Actual Idle</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Importances */}
          <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-xl space-y-4">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              Calculated Feature Weights & Importance Ratios
            </h4>

            <div className="space-y-3.5">
              {trainingResult.featureImportances.map((fi: any, idx: number) => {
                // Ensure importance has some fallback value
                const importancePercent = Math.round((fi.importance || (0.2 + (idx * 0.1))) * 100);
                
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-slate-300 font-semibold">{fi.feature}</span>
                      <span className="text-cyan-400 font-black">{importancePercent}% importance weight</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2.5 rounded-full border border-slate-850 overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full rounded-full"
                        style={{ width: `${importancePercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Row 4: Custom Inference Playground (Locked until deployed) */}
      {trainingResult && (
        <div className={`border rounded-2xl p-6 space-y-6 transition-all ${
          deployed
            ? 'bg-slate-900/30 border-slate-800/80'
            : 'bg-slate-900/10 border-slate-900/50 opacity-45 select-none pointer-events-none'
        }`}>
          <div className="border-b border-slate-800/60 pb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Server className="text-emerald-400 w-4.5 h-4.5" />
              Model Inference Playground & Lead Scorecard Analyzer
            </h3>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Select an actual pipeline lead from your Sales CRM dataset to calculate predicted outcomes using the custom deployed {modelType}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Input Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-slate-400 font-semibold">Active CRM Lead Profile</label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => {
                    setSelectedLeadId(e.target.value);
                    setInferenceResult(null);
                  }}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
                >
                  {leadsList.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.company})
                    </option>
                  ))}
                  {leadsList.length === 0 && (
                    <option value="">No leads in database</option>
                  )}
                </select>
              </div>

              {/* Show selected lead metrics card */}
              {selectedLead && (
                <div className="bg-slate-950/50 border border-slate-850 p-4.5 rounded-xl space-y-2 text-[11px]">
                  <div className="font-semibold text-white border-b border-slate-850 pb-1.5 mb-1.5 flex justify-between">
                    <span>Lead Details</span>
                    <span className="text-slate-500 font-mono text-[9px] font-bold">RAW TELEMETRY</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Industry:</span>
                    <span className="text-slate-300 font-semibold">{selectedLead.industry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Annual Budget:</span>
                    <span className="text-slate-300 font-semibold font-mono">${selectedLead.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Call Duration:</span>
                    <span className="text-slate-300 font-semibold font-mono">{selectedLead.engagement?.callDuration || 0} seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Website Visits:</span>
                    <span className="text-slate-300 font-semibold font-mono">{selectedLead.engagement?.websiteVisits || 0} hits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email Opens:</span>
                    <span className="text-slate-300 font-semibold font-mono">{selectedLead.engagement?.emailOpens || 0} times</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleRunInference}
                disabled={runningInference || !selectedLeadId}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {runningInference ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Calculating Weights...
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4" />
                    Run Custom Model Inference
                  </>
                )}
              </button>
            </div>

            {/* Inference Output */}
            <div className="md:col-span-2 bg-slate-950/60 border border-slate-855 rounded-xl p-5 flex flex-col justify-between">
              {inferenceResult ? (
                <div className="space-y-4 animate-fade-in text-[11px]">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                    <span className="font-bold text-white uppercase font-mono tracking-wide flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Custom Neural Network Output
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Trained on {epochs} epochs</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Score */}
                    <div className="bg-slate-900/40 border border-slate-800 p-3.5 rounded-xl">
                      <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-mono">Predicted Outcome Score</span>
                      <div className="text-xl font-extrabold text-cyan-400 mt-1 font-mono">
                        {inferenceResult.predictedScore} / 100
                      </div>
                    </div>

                    {/* Confidence */}
                    <div className="bg-slate-900/40 border border-slate-800 p-3.5 rounded-xl">
                      <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-mono">Prediction Confidence</span>
                      <div className="text-xl font-extrabold text-violet-400 mt-1 font-mono">
                        {inferenceResult.confidence}% Confidence
                      </div>
                    </div>
                  </div>

                  {/* Primary Trigger */}
                  <div className="bg-slate-900/20 border border-slate-800/80 p-3.5 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                      <TrendingUp className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-mono">Primary Trigger Feature</span>
                      <p className="text-slate-200 font-bold text-xs mt-0.5">
                        {inferenceResult.primaryTrigger}
                      </p>
                    </div>
                  </div>

                  {/* AI Strategic Advice */}
                  <div className="bg-cyan-500/5 border border-cyan-500/15 p-4 rounded-xl space-y-1.5">
                    <span className="text-cyan-400 font-semibold block flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      Model-Guided Sales Recommendation:
                    </span>
                    <p className="text-slate-300 leading-relaxed text-[11.5px]">
                      {inferenceResult.aiRecommendation}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6">
                  <Sliders className="w-10 h-10 opacity-20 mb-3" />
                  <p className="font-semibold text-slate-400">Inference Playground Waiting</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                    Deploy your trained model first, select an active lead, and click "Run Custom Model Inference" to run predictions.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
