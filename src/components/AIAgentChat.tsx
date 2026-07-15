import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Brain, ArrowDown, Bot, RefreshCw, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAgentChatProps {
  apiBaseUrl: string;
  token: string;
  user: any;
}

export default function AIAgentChat({ apiBaseUrl, token, user }: AIAgentChatProps) {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; time: string }>>([
    {
      sender: 'assistant',
      text: "Hello! I am your **SalesgenieAI Copilot**. I have parsed the real-time pipeline, lead pools, active deals, and customers. \n\nHow can I help you automate your sales tasks today? You can ask me to: \n- *'Draft an outbound email for Victor Stone'*\n- *'Analyze deal bottlenecks on my pipeline'*\n- *'Write a call script addressing price objections'*",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    if (!textToSend) setInputText('');

    // Append User Message
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { sender: 'user', text, time: timestamp }]);
    setLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/ai/agent-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to query copilot.');

      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: data.response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: `⚠️ **System Error:** ${err.message || 'I ran into a problem fetching context.'}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Identify deals with highest close risks",
    "Draft a follow-up email to Diana Prince",
    "Write Sandler-style phone objection scripts",
    "Review active lead scoring summaries"
  ];

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col h-[650px] relative">
      {/* Copilot Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-800/80 mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-500 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/10 animate-pulse">
            <Brain className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-sans">
              Salesgenie Copilot Agent
              <span className="text-[9px] bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/20 px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider">Stateful AI</span>
            </h3>
            <p className="text-[10px] text-slate-400">Contextually reads active CRM data to formulate pipeline advice</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm('Reset chat history?')) {
              setMessages([messages[0]]);
            }
          }}
          className="p-2 bg-slate-950/40 hover:bg-slate-950/70 border border-slate-850 rounded-lg text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          title="Reset thread"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages Bubbles stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-7.5 h-7.5 rounded-lg shrink-0 flex items-center justify-center text-xs font-semibold ${
              msg.sender === 'user' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-slate-950/60 text-violet-400 border border-slate-800'
            }`}>
              {msg.sender === 'user' ? 'ME' : '🤖'}
            </div>

            <div className="space-y-1">
              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-cyan-500 text-slate-950 font-medium'
                  : 'bg-slate-950/40 border border-slate-850/60 text-slate-300'
              }`}>
                {msg.sender === 'assistant' ? (
                  <div className="markdown-body prose prose-invert max-w-none text-slate-300 prose-xs">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
              <span className={`text-[9px] text-slate-500 font-mono block ${msg.sender === 'user' ? 'text-right' : ''}`}>
                {msg.time}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-7.5 h-7.5 rounded-lg bg-slate-950/60 text-violet-400 border border-slate-800 shrink-0 flex items-center justify-center text-xs animate-pulse">
              🤖
            </div>
            <div className="p-3.5 bg-slate-950/20 border border-slate-850/50 rounded-2xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion prompt seeds */}
      {messages.length === 1 && !loading && (
        <div className="grid grid-cols-2 gap-2 mb-4 shrink-0">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="p-2.5 bg-slate-950/30 hover:bg-slate-950/60 border border-slate-850/80 hover:border-slate-800 text-slate-400 hover:text-slate-200 text-[10px] text-left font-medium rounded-xl transition-all cursor-pointer truncate"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Inputs box */}
      <div className="relative shrink-0">
        <input
          type="text"
          placeholder="Ask Salesgenie Copilot anything..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="w-full pl-4 pr-12 py-3.5 bg-slate-950 border border-slate-850 focus:border-cyan-500/50 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !inputText.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-850 text-slate-950 disabled:text-slate-600 rounded-lg cursor-pointer transition-all active:scale-95"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
