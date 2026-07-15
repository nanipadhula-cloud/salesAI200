import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Target, BarChart2, Calendar, Brain, Shield,
  LogOut, Bell, Sparkles, Sun, Moon, CheckCircle, Menu, X, ArrowRight, BookOpen, Cpu
} from 'lucide-react';

// Components
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import LeadsView from './components/LeadsView';
import CustomersView from './components/CustomersView';
import OpportunitiesView from './components/OpportunitiesView';
import AIAgentChat from './components/AIAgentChat';
import DailyBriefView from './components/DailyBriefView';
import SalesCoachView from './components/SalesCoachView';
import CompetitorView from './components/CompetitorView';
import CalendarTasksView from './components/CalendarTasksView';
import ReportsView from './components/ReportsView';
import MLTrainingView from './components/MLTrainingView';

const API_BASE_URL = ''; // Serve from relative path (Vite proxies or same origin Express port)

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Notification center states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifCenter, setShowNotifCenter] = useState(false);

  const fetchCurrentUser = async (jwtToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user || data);
      } else {
        handleLogout();
      }
    } catch {
      handleLogout();
    }
  };

  const fetchNotifications = async (jwtToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
      fetchNotifications(token);

      // Periodically refresh notifications
      const interval = setInterval(() => fetchNotifications(token), 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const handleLoginSuccess = (newToken: string, loggedUser: any) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(loggedUser);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/notifications/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (!token || !user) {
    return <LoginView apiBaseUrl={API_BASE_URL} onLoginSuccess={handleLoginSuccess} />;
  }

  // Render Sub views
  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView apiBaseUrl={API_BASE_URL} token={token} user={user} onNavigate={setCurrentView} />;
      case 'leads':
        return <LeadsView apiBaseUrl={API_BASE_URL} token={token} user={user} />;
      case 'customers':
        return <CustomersView apiBaseUrl={API_BASE_URL} token={token} user={user} />;
      case 'opportunities':
        return <OpportunitiesView apiBaseUrl={API_BASE_URL} token={token} user={user} />;
      case 'ai-chat':
        return <AIAgentChat apiBaseUrl={API_BASE_URL} token={token} user={user} />;
      case 'daily-brief':
        return <DailyBriefView apiBaseUrl={API_BASE_URL} token={token} />;
      case 'sales-coach':
        return <SalesCoachView apiBaseUrl={API_BASE_URL} token={token} />;
      case 'competitor':
        return <CompetitorView apiBaseUrl={API_BASE_URL} token={token} />;
      case 'calendar-tasks':
        return <CalendarTasksView apiBaseUrl={API_BASE_URL} token={token} user={user} />;
      case 'reports':
        return <ReportsView apiBaseUrl={API_BASE_URL} token={token} />;
      case 'ml-lab':
        return <MLTrainingView apiBaseUrl={API_BASE_URL} token={token} />;
      default:
        return <DashboardView apiBaseUrl={API_BASE_URL} token={token} user={user} onNavigate={setCurrentView} />;
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'CRM Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Pipeline Leads', icon: Users },
    { id: 'customers', label: 'Onboarded Clients', icon: Shield },
    { id: 'opportunities', label: 'Opportunities Board', icon: Target },
    { id: 'calendar-tasks', label: 'Meetings & Tasks', icon: Calendar },
    { id: 'reports', label: 'Reporting Workbook', icon: BarChart2 },
  ];

  const aiMenuItems = [
    { id: 'ai-chat', label: 'Copilot Chatbot', icon: Brain },
    { id: 'daily-brief', label: 'Daily Briefing', icon: CheckCircle },
    { id: 'sales-coach', label: 'Sandler Coach', icon: BookOpen },
    { id: 'competitor', label: 'Rival Battlecards', icon: Shield },
    { id: 'ml-lab', label: 'ML Training Lab', icon: Cpu },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen font-sans ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'}`}>
      {/* Top Navbar */}
      <header className={`sticky top-0 z-40 border-b flex items-center justify-between px-6 py-3 backdrop-blur-md ${
        darkMode ? 'bg-slate-950/80 border-slate-900' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 hover:bg-slate-800/10 rounded-lg text-slate-400 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-500 flex items-center justify-center text-slate-950 text-base font-bold animate-pulse">
              🧞
            </span>
            <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
              SalesgenieAI
            </span>
          </div>
        </div>

        {/* Global Nav Widgets */}
        <div className="flex items-center gap-4 relative">
          {/* Dark / Light toggle widget */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              darkMode ? 'bg-slate-900 border-slate-850 text-amber-400' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title={darkMode ? 'Toggle light canvas' : 'Toggle dark canvas'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifCenter(!showNotifCenter);
                if (!showNotifCenter && unreadCount > 0) markAllAsRead();
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer relative ${
                darkMode ? 'bg-slate-900 border-slate-850 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-bold font-mono text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification drop down */}
            {showNotifCenter && (
              <div className={`absolute right-0 mt-2.5 w-80 rounded-2xl border p-4 shadow-2xl z-50 animate-fade-in ${
                darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/60 mb-2.5">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider">Telemetry Alerts</h4>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-[10px] text-cyan-400 hover:underline">
                      Read all
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-2.5 rounded-xl text-[11px] leading-relaxed border transition-colors ${
                      n.read ? 'bg-slate-950/20 border-slate-900 text-slate-400' : 'bg-cyan-500/5 border-cyan-500/10 text-white'
                    }`}>
                      <div className="font-semibold">{n.title}</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{n.message}</p>
                    </div>
                  ))}

                  {notifications.length === 0 && (
                    <div className="text-center py-6 text-slate-500 font-mono text-[10px]">
                      No notification logs registered.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User badge */}
          <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-800">
            <div className="w-7.5 h-7.5 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-500 flex items-center justify-center text-slate-950 font-bold text-xs">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left leading-none">
              <div className="text-xs font-semibold text-white">{user.name}</div>
              <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider mt-0.5 block">{user.role}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main viewport shell */}
      <div className="flex">
        {/* Left Sidebar (Desktop persistent, Mobile overlay) */}
        <aside className={`fixed inset-y-0 left-0 transform md:relative md:translate-x-0 transition-transform duration-300 z-30 shrink-0 w-64 border-r p-5 flex flex-col justify-between ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${darkMode ? 'bg-slate-950 border-slate-900 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
          <div className="space-y-6">
            {/* Sidebar toggle for mobile */}
            <div className="md:hidden flex justify-end">
              <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Core Views Directory */}
            <div className="space-y-1.5">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold block px-2.5 mb-2">Workspace CRM</span>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      currentView === item.id
                        ? 'bg-cyan-500/10 text-cyan-400 shadow-xs'
                        : 'hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* AI Specialized Modules */}
            <div className="space-y-1.5">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold block px-2.5 mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                Gemini Pipeline AI
              </span>
              {aiMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      currentView === item.id
                        ? 'bg-violet-500/10 text-violet-400 shadow-xs'
                        : 'hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom user profile logout triggers */}
          <div className="space-y-2 border-t border-slate-900 pt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-xs font-medium text-slate-400 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Terminate Session
            </button>
          </div>
        </aside>

        {/* Dynamic content viewport */}
        <main className="flex-1 min-w-0 p-6 md:p-8 max-h-[calc(100vh-64px)] overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}
