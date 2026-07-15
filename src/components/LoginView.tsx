import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Shield, ArrowRight, Sparkles } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (token: string, user: any) => void;
  apiBaseUrl: string;
}

export default function LoginView({ onLoginSuccess, apiBaseUrl }: LoginViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Sales Manager' | 'Sales Executive'>('Sales Executive');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await fetch(`${apiBaseUrl}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to sign up.');
        onLoginSuccess(data.token, data.user);
      } else {
        const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to log in.');
        onLoginSuccess(data.token, data.user);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email to recover your password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setMessage(data.message);
    } catch (err: any) {
      setError('Failed to trigger recovery.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="w-full max-w-md">
        {/* Brand logo & tagline */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-4 tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            ENTERPRISE AI CRM
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white font-sans bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
            SalesgenieAI
          </h1>
          <p className="text-slate-400 mt-2 text-sm max-w-xs mx-auto">
            Automating pipeline operations, smart leads qualification, and sales forecasting.
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative">
          <h2 className="text-xl font-semibold text-white mb-6">
            {isSignUp ? 'Create sales workspace' : 'Welcome back, executive'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Diana Prince"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10.5 pr-4 py-2.5 bg-slate-950/40 border border-slate-800 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 rounded-xl text-white placeholder-slate-500 text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">CRM Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Sales Executive', 'Sales Manager', 'Admin'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2 px-1 text-xs font-medium rounded-lg border transition-all ${
                          role === r
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-xs'
                            : 'bg-slate-950/20 text-slate-400 border-slate-800 hover:bg-slate-950/40'
                        }`}
                      >
                        {r === 'Admin' ? 'Admin' : r === 'Sales Manager' ? 'Manager' : 'Executive'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10.5 pr-4 py-2.5 bg-slate-950/40 border border-slate-800 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 rounded-xl text-white placeholder-slate-500 text-sm outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline outline-none"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10.5 pr-4 py-2.5 bg-slate-950/40 border border-slate-800 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 rounded-xl text-white placeholder-slate-500 text-sm outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/25 rounded-xl text-cyan-400 text-xs text-center">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 active:scale-[0.99]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isSignUp ? 'Initialize Account' : 'Authenticate Pipeline'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Seed accounts notice */}
          {!isSignUp && (
            <div className="mt-4 p-2.5 bg-slate-950/30 border border-slate-800/50 rounded-xl text-center">
              <span className="text-[11px] text-slate-500 block">
                Demo Access: <strong className="text-slate-400">nanipadhula@gmail.com</strong> / <strong className="text-slate-400">admin123</strong>
              </span>
            </div>
          )}

          {/* View switcher */}
          <div className="mt-6 text-center text-xs text-slate-400">
            {isSignUp ? 'Already have an workspace?' : 'Deploy a new CRM environment?'}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setMessage('');
              }}
              className="text-cyan-400 hover:text-cyan-300 font-medium ml-1.5 hover:underline outline-none"
            >
              {isSignUp ? 'Sign In' : 'Sign Up Free'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
