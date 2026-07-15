import React, { useState, useEffect } from 'react';
import { Calendar as CalIcon, CheckSquare, Plus, Clock, FileText, Brain, Sparkles, Smile, MessageSquare, AlertCircle, Trash2 } from 'lucide-react';
import { Meeting, Task } from '../types';

interface CalendarTasksViewProps {
  apiBaseUrl: string;
  token: string;
  user: any;
}

export default function CalendarTasksView({ apiBaseUrl, token, user }: CalendarTasksViewProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Modals
  const [isMeetOpen, setIsMeetOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [selectedMeet, setSelectedMeet] = useState<Meeting | null>(null);

  // Add Meeting Form
  const [meetTitle, setMeetTitle] = useState('');
  const [meetDesc, setMeetDesc] = useState('');
  const [meetDate, setMeetDate] = useState('');
  const [meetDuration, setMeetDuration] = useState('30');
  const [meetAttendees, setMeetAttendees] = useState('');

  // Add Task Form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [taskType, setTaskType] = useState<'Call' | 'Email' | 'Meeting' | 'Follow-up'>('Follow-up');

  // Transcription states
  const [transcript, setTranscript] = useState('');
  const [analyzingMeetId, setAnalyzingMeetId] = useState<string | null>(null);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const meetRes = await fetch(`${apiBaseUrl}/api/meetings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const taskRes = await fetch(`${apiBaseUrl}/api/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMeetings(await meetRes.json());
      setTasks(await taskRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [token]);

  const handleAddMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBaseUrl}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: meetTitle,
          description: meetDesc,
          date: meetDate,
          duration: Number(meetDuration),
          attendees: meetAttendees.split(',').map(a => a.trim()).filter(Boolean)
        })
      });
      if (res.ok) {
        setIsMeetOpen(false);
        setMeetTitle(''); setMeetDesc(''); setMeetDate(''); setMeetAttendees('');
        fetchCalendar();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBaseUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          dueDate: taskDueDate,
          priority: taskPriority,
          type: taskType
        })
      });
      if (res.ok) {
        setIsTaskOpen(false);
        setTaskTitle(''); setTaskDesc(''); setTaskDueDate('');
        fetchCalendar();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Pending' ? 'Completed' : 'Pending';
    try {
      await fetch(`${apiBaseUrl}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      fetchCalendar();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMeeting = async (id: string) => {
    if (!confirm('Cancel this scheduled meeting?')) return;
    try {
      await fetch(`${apiBaseUrl}/api/meetings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSelectedMeet(null);
      fetchCalendar();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Remove this task from board?')) return;
    try {
      await fetch(`${apiBaseUrl}/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCalendar();
    } catch (err) {
      console.error(err);
    }
  };

  const triggerCallAnalysis = async (meetId: string) => {
    if (!transcript.trim()) {
      alert('Please paste a raw meeting transcript or call log first!');
      return;
    }
    setAnalyzingMeetId(meetId);
    try {
      const res = await fetch(`${apiBaseUrl}/api/meetings/${meetId}/ai-summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transcript })
      });
      const data = await res.json();
      if (res.ok) {
        setMeetings(prev => prev.map(m => m.id === meetId ? { ...m, ...data.meeting } : m));
        if (selectedMeet && selectedMeet.id === meetId) {
          setSelectedMeet({ ...selectedMeet, ...data.meeting });
        }
        setTranscript('');
        fetchCalendar();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingMeetId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      {/* Grid structure splitting Calendar events and Task list */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Scheduled Meetings Column */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CalIcon className="w-4.5 h-4.5 text-cyan-400" />
              Calendar Events
            </h3>
            <button
              onClick={() => setIsMeetOpen(true)}
              className="px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-[10px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
            >
              <Plus className="w-3 h-3" />
              Event
            </button>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto">
            {meetings.map((meet) => (
              <div
                key={meet.id}
                onClick={() => setSelectedMeet(meet)}
                className={`p-3.5 bg-slate-950/20 border hover:border-slate-800 rounded-xl cursor-pointer transition-all ${
                  selectedMeet?.id === meet.id ? 'border-cyan-500 bg-slate-950/35' : 'border-slate-900'
                }`}
              >
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                  <span>{new Date(meet.date).toLocaleDateString()} at {new Date(meet.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="flex items-center gap-1 text-slate-400 font-semibold"><Clock className="w-3 h-3" /> {meet.duration}m</span>
                </div>
                <h4 className="text-xs font-semibold text-white truncate">{meet.title}</h4>
                <p className="text-slate-400 text-[11px] mt-1 line-clamp-1">{meet.description}</p>

                {meet.summary && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/10 px-2 py-0.5 rounded-md font-mono font-bold tracking-wider uppercase w-max">
                    <Brain className="w-3 h-3 animate-pulse" /> Summarized
                  </div>
                )}
              </div>
            ))}

            {meetings.length === 0 && (
              <div className="text-center py-12 text-slate-600 font-mono text-[10px]">
                No events scheduled.
              </div>
            )}
          </div>
        </div>

        {/* Action Tasks Column */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckSquare className="w-4.5 h-4.5 text-violet-400" />
              Pipeline Tasks
            </h3>
            <button
              onClick={() => setIsTaskOpen(true)}
              className="px-2.5 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20 text-[10px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
            >
              <Plus className="w-3 h-3" />
              Task
            </button>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3.5 bg-slate-950/20 border border-slate-900 rounded-xl hover:border-slate-850 transition-all flex items-start gap-3.5 ${
                  task.status === 'Completed' ? 'opacity-55' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={task.status === 'Completed'}
                  onChange={() => toggleTaskStatus(task.id, task.status)}
                  className="mt-0.5 w-4 h-4 rounded-md border-slate-800 text-violet-600 focus:ring-violet-500 focus:ring-offset-0 bg-slate-950/50 cursor-pointer"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    <span className={`px-1.5 rounded-md font-medium text-[9px] uppercase ${
                      task.priority === 'High' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 bg-slate-950/40'
                    }`}>{task.priority}</span>
                  </div>

                  <h4 className={`text-xs font-semibold mt-1 ${task.status === 'Completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                    {task.title}
                  </h4>
                  <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1">{task.description}</p>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1 hover:bg-slate-950 rounded-md text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="text-center py-12 text-slate-600 font-mono text-[10px]">
                No action tasks registered.
              </div>
            )}
          </div>
        </div>

        {/* Meeting summary + Call transcription sidebar */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 min-h-[400px] flex flex-col justify-between">
          {selectedMeet ? (
            <div className="space-y-5 animate-fade-in">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Interactive Event Analyzer</span>
                  <h3 className="text-sm font-bold text-white mt-1">{selectedMeet.title}</h3>
                  <p className="text-[11px] text-cyan-400 mt-0.5">Duration: {selectedMeet.duration}m | {new Date(selectedMeet.date).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => deleteMeeting(selectedMeet.id)}
                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg cursor-pointer transition-all"
                  title="Cancel Meeting"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Renders summary if summarized */}
              {selectedMeet.summary ? (
                <div className="space-y-4">
                  {/* Analysis headers */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-slate-950/25 border border-slate-850/50 rounded-xl">
                      <span className="text-[10px] text-slate-500 font-mono block">Client Mood</span>
                      <strong className="text-cyan-400 font-semibold flex items-center justify-center gap-1 mt-0.5">
                        <Smile className="w-3.5 h-3.5" /> {selectedMeet.mood}
                      </strong>
                    </div>
                    <div className="p-2.5 bg-slate-950/25 border border-slate-850/50 rounded-xl">
                      <span className="text-[10px] text-slate-500 font-mono block">Interest Temp</span>
                      <strong className="text-amber-400 font-semibold flex items-center justify-center gap-1 mt-0.5">
                        <CalIcon className="w-3.5 h-3.5 animate-pulse" /> {selectedMeet.interestLevel}
                      </strong>
                    </div>
                  </div>

                  {/* Summary copy */}
                  <div className="bg-slate-950/25 border border-slate-850 rounded-xl p-3.5 space-y-3">
                    <div>
                      <h4 className="text-[10px] text-cyan-400 font-mono uppercase font-bold">📝 Key Summary points:</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedMeet.summary}</p>
                    </div>

                    <div>
                      <h4 className="text-[10px] text-amber-400 font-mono uppercase font-bold">⚡ Generated Action Items:</h4>
                      <ul className="list-disc pl-4 mt-1 text-slate-300 space-y-1">
                        {selectedMeet.actionItems && selectedMeet.actionItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {selectedMeet.suggestedOffer && (
                      <div>
                        <h4 className="text-[10px] text-violet-400 font-mono uppercase font-bold">💡 Suggested SaaS Suite:</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed font-semibold">{selectedMeet.suggestedOffer}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/30 border border-slate-850 rounded-2xl text-center space-y-3">
                    <FileText className="w-8 h-8 text-cyan-500/40 mx-auto" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">Call Transcript Analyzer</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Paste the raw phone transcript or meeting notes below. Gemini will automatically extract customer moods, action item bullets, and recommended support suites.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <textarea
                      rows={5}
                      required
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      placeholder="e.g. Sales Executive: Hi Bruce! Bruce Wayne: Yes, we want to roll out the CRM cloud suite for 150 developers next week. Price is fine. Follow up with a secure contract draft..."
                      className="w-full p-2.5 bg-slate-950 border border-slate-850 focus:border-cyan-500/40 rounded-xl text-slate-200 outline-none resize-none leading-relaxed font-sans"
                    />
                    <button
                      onClick={() => triggerCallAnalysis(selectedMeet.id)}
                      disabled={analyzingMeetId === selectedMeet.id || !transcript.trim()}
                      className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      {analyzingMeetId === selectedMeet.id ? (
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          Summarize & Generate Action Items
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center text-slate-500 py-12">
              <CalIcon className="w-12 h-12 mb-3 text-slate-700" />
              <p className="text-xs font-mono">Select a scheduled calendar event to analyze transcripts and extract action deliverables.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Meeting Modal */}
      {isMeetOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-xs">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <CalIcon className="w-5 h-5 text-cyan-400" />
                Schedule CRM Calendar Event
              </h3>
              <button onClick={() => setIsMeetOpen(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400">
                <CalIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMeeting} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">Event Title</label>
                <input
                  type="text" required placeholder="SaaS Cloud Suite Contract Recap" value={meetTitle} onChange={(e) => setMeetTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Attendees (comma separated emails)</label>
                <input
                  type="text" placeholder="bruce@waynecorp.com, diana@museum.org" value={meetAttendees} onChange={(e) => setMeetAttendees(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Date & Time</label>
                  <input
                    type="datetime-local" required value={meetDate} onChange={(e) => setMeetDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Duration (minutes)</label>
                  <select
                    value={meetDuration} onChange={(e) => setMeetDuration(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Brief Description / Objectives</label>
                <textarea
                  rows={2} placeholder="Recap contract scopes, delivery timelines, etc..." value={meetDesc} onChange={(e) => setMeetDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer active:scale-95"
              >
                Schedule Event
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isTaskOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-xs">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <CheckSquare className="w-5 h-5 text-violet-400" />
                Create Pipeline Action Task
              </h3>
              <button onClick={() => setIsTaskOpen(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400">
                <CheckSquare className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">Task Title</label>
                <input
                  type="text" required placeholder="Outbound pricing proposal followup" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Task Priority</label>
                  <select
                    value={taskPriority} onChange={(e: any) => setTaskPriority(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Task Type</label>
                  <select
                    value={taskType} onChange={(e: any) => setTaskType(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50"
                  >
                    <option value="Call">Call</option>
                    <option value="Email">Email</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Due Date</label>
                <input
                  type="date" required value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Task Deliverables Description</label>
                <textarea
                  rows={2} placeholder="Explain exactly what needs to be done..." value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all cursor-pointer active:scale-95"
              >
                Register Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
