import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Building2, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Users, 
  FileText, 
  DollarSign, 
  Loader2,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function FacultyDashboard() {
  const [data, setData] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({}); // eventId -> commentText
  const [activeSubTab, setActiveSubTab] = useState('events'); // events, teams, finances, audit

  const fetchData = async () => {
    try {
      const [dashRes, pendingRes] = await Promise.all([
        axios.get('/api/faculty/dashboard'),
        axios.get('/api/faculty/pending-events')
      ]);
      setData(dashRes.data);
      setPendingEvents(pendingRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load faculty portal data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (eventId) => {
    const comment = comments[eventId] || '';
    const loadingToast = toast.loading('Publishing approved event...');
    try {
      await axios.patch(`/api/faculty/events/${eventId}/approve`, { comment });
      toast.success('Event approved and published! 🎉', { id: loadingToast });
      setComments(prev => ({ ...prev, [eventId]: '' }));
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve event.', { id: loadingToast });
    }
  };

  const handleRequestChanges = async (eventId) => {
    const comment = comments[eventId] || '';
    if (!comment.trim()) {
      toast.error('Please enter a feedback comment to request changes.');
      return;
    }
    const loadingToast = toast.loading('Submitting changes request...');
    try {
      await axios.patch(`/api/faculty/events/${eventId}/request-changes`, { comment });
      toast.success('Changes request submitted to team coordinators.', { id: loadingToast });
      setComments(prev => ({ ...prev, [eventId]: '' }));
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit changes request.', { id: loadingToast });
    }
  };

  if (loading) {
    return (
      <div className="pt-24 flex flex-col justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 text-[#00BFFF] animate-spin mb-4" />
        <span className="text-gray-400 text-sm tracking-wider uppercase font-semibold">Loading Advisor Portal...</span>
      </div>
    );
  }

  const { stats, recentActivity, events, teams, expenses, attendance, meetings } = data;

  return (
    <div className="pt-20 pb-24 px-4 md:px-8 max-w-6xl mx-auto space-y-8">
      
      {/* Advisor Welcome Header */}
      <div className="border-b border-gray-850 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-wider text-white">
            <span className="text-[#00BFFF]">FACULTY ADVISOR</span> PORTAL
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Read-only overview and governance approval dashboard for Anurag University ISC events.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#111111] border border-gray-800 rounded-xl px-4 py-2 text-[#00BFFF] text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="h-4.5 w-4.5" />
          <span>Advisor Account Verified</span>
        </div>
      </div>

      {/* Stats Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 flex items-center justify-between">
          <div>
            <span className="text-gray-450 text-xs font-bold uppercase tracking-wider">Total Members</span>
            <div className="text-3xl font-black text-white mt-1">{stats.totalMembers}</div>
          </div>
          <div className="h-12 w-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[#00BFFF]">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 flex items-center justify-between">
          <div>
            <span className="text-gray-450 text-xs font-bold uppercase tracking-wider">Active Teams</span>
            <div className="text-3xl font-black text-white mt-1">{stats.activeTeams}</div>
          </div>
          <div className="h-12 w-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 flex items-center justify-between">
          <div>
            <span className="text-gray-450 text-xs font-bold uppercase tracking-wider">Upcoming Events</span>
            <div className="text-3xl font-black text-white mt-1">{stats.upcomingEvents}</div>
          </div>
          <div className="h-12 w-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Calendar className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Pending Approval Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          Awaiting Approval ({pendingEvents.length})
        </h2>

        {pendingEvents.length === 0 ? (
          <div className="bg-[#111111] border border-dashed border-gray-850 rounded-xl p-8 text-center text-gray-500 text-sm">
            🎉 No events currently awaiting approval. All clean!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingEvents.map(event => (
              <div key={event._id} className="bg-[#111111] border border-gray-850 rounded-xl p-6 flex flex-col justify-between space-y-4 shadow-xl">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-[#00BFFF] bg-[#00BFFF]/10 border border-[#00BFFF]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {event.category || 'Other'}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{event.title}</h3>
                  <p className="text-gray-400 text-xs mt-2 line-clamp-3 leading-relaxed">{event.description}</p>
                  
                  {/* Assigned teams */}
                  {event.teamIds && event.teamIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {event.teamIds.map(t => (
                        <span 
                          key={t._id} 
                          className="px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider"
                          style={{ backgroundColor: t.color || '#333' }}
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-[11px] text-gray-500 mt-4 italic">
                    Submitted by Coordinator: <span className="text-gray-300 font-semibold">{event.createdBy?.name || 'Admin'}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-gray-850">
                  <textarea
                    placeholder="Enter review feedback, notes, or change requests..."
                    value={comments[event._id] || ''}
                    onChange={(e) => setComments(prev => ({ ...prev, [event._id]: e.target.value }))}
                    className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-2.5 text-xs text-white placeholder-gray-555 focus:outline-none focus:border-[#00BFFF] h-16 resize-none"
                  />
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRequestChanges(event._id)}
                      className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <XCircle className="h-4.5 w-4.5" />
                      Request Changes
                    </button>
                    <button
                      onClick={() => handleApprove(event._id)}
                      className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <CheckCircle className="h-4.5 w-4.5" />
                      Approve & Publish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Browse Lists (Sub tabs) */}
      <div className="space-y-4 pt-4 border-t border-gray-850">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-850 gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveSubTab('events')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
              activeSubTab === 'events' ? 'border-[#00BFFF] text-[#00BFFF]' : 'border-transparent text-gray-550 hover:text-white'
            }`}
          >
            All Events ({events.length})
          </button>
          <button
            onClick={() => setActiveSubTab('teams')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
              activeSubTab === 'teams' ? 'border-[#00BFFF] text-[#00BFFF]' : 'border-transparent text-gray-550 hover:text-white'
            }`}
          >
            Teams & Rosters ({teams.length})
          </button>
          <button
            onClick={() => setActiveSubTab('finances')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
              activeSubTab === 'finances' ? 'border-[#00BFFF] text-[#00BFFF]' : 'border-transparent text-gray-550 hover:text-white'
            }`}
          >
            Finances ({expenses.length})
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
              activeSubTab === 'audit' ? 'border-[#00BFFF] text-[#00BFFF]' : 'border-transparent text-gray-550 hover:text-white'
            }`}
          >
            Activity Audit Log
          </button>
        </div>

        {/* Tab Contents */}
        <div className="bg-[#111111] rounded-xl border border-gray-850 overflow-hidden">
          
          {/* Events subtab */}
          {activeSubTab === 'events' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-850 text-gray-450 text-xs font-bold uppercase tracking-wider bg-[#161616]">
                    <th className="px-6 py-4">Event Name</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-600">No events found.</td></tr>
                  ) : (
                    events.map(ev => (
                      <tr key={ev._id} className="border-b border-gray-850/50 hover:bg-[#1A1A1A]/30">
                        <td className="px-6 py-4 font-semibold text-white">{ev.title}</td>
                        <td className="px-6 py-4 text-gray-400">{new Date(ev.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-gray-800 uppercase">
                            {ev.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            ev.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' :
                            ev.status === 'pending_approval' ? 'bg-amber-500/10 text-amber-400 animate-pulse' :
                            ev.status === 'changes_requested' ? 'bg-red-500/10 text-red-400' :
                            'bg-gray-800 text-gray-400'
                          }`}>
                            {ev.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Teams subtab */}
          {activeSubTab === 'teams' && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map(team => (
                <div key={team._id} className="border border-gray-850 rounded-lg p-5 bg-[#161616]/30">
                  <div className="flex items-center justify-between border-b border-gray-850 pb-3">
                    <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: team.color }}></span>
                      {team.name}
                    </h3>
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-bold">
                      {team.memberIds.length} Members
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                    {team.memberIds.length === 0 ? (
                      <div className="text-xs text-gray-500 italic">No coordinators assigned to this squad.</div>
                    ) : (
                      team.memberIds.map(m => (
                        <div key={m._id} className="flex items-center justify-between text-xs py-1">
                          <div className="flex items-center gap-2">
                            <img src={m.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${m.name}`} alt={m.name} className="h-6 w-6 rounded-full" />
                            <span className="text-gray-300 font-semibold">{m.name}</span>
                          </div>
                          <span className="text-[10px] text-gray-500 uppercase font-medium">{m.subRole.replace('_', ' ')}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Finances subtab */}
          {activeSubTab === 'finances' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-850 text-gray-450 text-xs font-bold uppercase tracking-wider bg-[#161616]">
                    <th className="px-6 py-4">Item Description</th>
                    <th className="px-6 py-4">Event Context</th>
                    <th className="px-6 py-4">Submitted By</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Approval Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-600">No expense slips submitted.</td></tr>
                  ) : (
                    expenses.map(exp => (
                      <tr key={exp._id} className="border-b border-gray-850/50 hover:bg-[#1A1A1A]/30">
                        <td className="px-6 py-4 text-white font-medium">{exp.itemDescription}</td>
                        <td className="px-6 py-4 text-gray-400">{exp.eventId?.title || 'General'}</td>
                        <td className="px-6 py-4 text-gray-400">{exp.submittedBy?.name || 'Coordinator'}</td>
                        <td className="px-6 py-4 text-[#22C55E] font-bold">₹{exp.amount}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            exp.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                            exp.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                            'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}>
                            {exp.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Audit Activity subtab */}
          {activeSubTab === 'audit' && (
            <div className="p-4 space-y-3">
              <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Recent System & Admin Logs</h4>
              <div className="space-y-2.5 max-h-80 overflow-y-auto no-scrollbar">
                {recentActivity.map(log => (
                  <div key={log._id} className="text-xs p-3 rounded-lg border border-gray-850/50 bg-[#161616]/30 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] px-2 py-0.2 rounded font-bold text-white uppercase mr-2" style={{
                        backgroundColor: log.module === 'user' ? '#A78BFA' :
                                        log.module === 'event' ? '#3B82F6' :
                                        log.module === 'task' ? '#06B6D4' :
                                        log.module === 'expense' ? '#10B981' :
                                        log.module === 'meeting' ? '#F59E0B' : '#4B5563'
                      }}>
                        {log.module}
                      </span>
                      <span className="text-gray-300 font-semibold">{log.userName}</span>
                      <span className="text-gray-500 mx-1">—</span>
                      <span className="text-gray-400">{log.description}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 shrink-0 font-medium">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
