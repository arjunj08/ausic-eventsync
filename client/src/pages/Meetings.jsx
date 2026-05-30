import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { 
  Calendar, 
  Video, 
  Users, 
  Plus, 
  Clock, 
  Link, 
  BookOpen, 
  ArrowUpRight, 
  Check, 
  X, 
  Sparkles, 
  Save, 
  FileText, 
  Lock, 
  User, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Meetings() {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const [meetings, setMeetings] = useState([]);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);

  // Detail View State
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  // Modal States
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState(60);
  const [meetingLink, setMeetingLink] = useState('');
  const [platform, setPlatform] = useState('gmeet');
  const [minutesWriterId, setMinutesWriterId] = useState('');
  const [attendeeIds, setAttendeeIds] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');

  // Attendance Checklist State
  const [attendanceStates, setAttendanceStates] = useState({}); // userId -> boolean

  // Minutes & AI Summary inputs
  const [minutesInput, setMinutesInput] = useState('');
  const [transcriptInput, setTranscriptInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null); // { summary, actionItems, keyDecisions, nextSteps }

  // Load datasets
  const fetchMeetings = async () => {
    try {
      const res = await axios.get('/api/meetings');
      setMeetings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFormDetails = async () => {
    try {
      const [eventsRes, membersRes] = await Promise.all([
        axios.get('/api/events'),
        axios.get('/api/auth/members')
      ]);
      setEvents(eventsRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchFormDetails();
  }, []);

  // Listen to Socket.io for meeting start alerts
  useEffect(() => {
    if (socket) {
      socket.on('meeting_started_alert', (data) => {
        toast((t) => (
          <div className="flex flex-col gap-2.5">
            <span className="text-white font-bold text-sm">🎯 Meeting Started!</span>
            <span className="text-gray-400 text-xs">"${data.title}" has begun. Join the call now.</span>
            <div className="flex justify-end gap-2 mt-1">
              <button 
                onClick={() => { window.open(data.meetingLink, '_blank'); toast.dismiss(t.id); }}
                className="bg-emerald-500 hover:bg-emerald-600 text-[#0b0c10] text-[11px] font-extrabold px-3 py-1.5 rounded"
              >
                Join Now
              </button>
              <button 
                onClick={() => toast.dismiss(t.id)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] px-3 py-1.5 rounded"
              >
                Dismiss
              </button>
            </div>
          </div>
        ), {
          duration: 10000,
          position: 'top-right',
          style: {
            background: '#111111',
            border: '1px solid #1f1f1f',
            padding: '14px',
            color: '#fff',
            borderRadius: '10px'
          }
        });

        // Refresh lists
        fetchMeetings();
      });

      return () => {
        socket.off('meeting_started_alert');
      };
    }
  }, [socket]);

  // Load details of single meeting
  const handleSelectMeeting = async (meetingId) => {
    try {
      const res = await axios.get(`/api/meetings/${meetingId}`);
      setSelectedMeeting(res.data);
      setTranscriptInput('');
      setAiSummary(null);

      // Initialize attendance checklists
      const states = {};
      res.data.attendees.forEach(att => {
        states[att.userId._id || att.userId] = att.status === 'present';
      });
      setAttendanceStates(states);
    } catch (err) {
      console.error(err);
    }
  };

  // Schedule meeting submit
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !scheduledAt) return;

    try {
      await axios.post('/api/meetings', {
        title,
        description,
        scheduledAt,
        duration,
        meetingLink,
        platform,
        minutesWriterId: minutesWriterId || null,
        attendees: attendeeIds,
        eventId: selectedEventId || null
      });

      setShowScheduleModal(false);
      // Reset inputs
      setTitle('');
      setDescription('');
      setScheduledAt('');
      setMeetingLink('');
      setMinutesWriterId('');
      setAttendeeIds([]);
      setSelectedEventId('');
      
      toast.success('Meeting scheduled successfully!');
      fetchMeetings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to schedule meeting.');
    }
  };

  // Start Meeting (Ongoing)
  const handleStartMeeting = async (meetingId) => {
    try {
      await axios.patch(`/api/meetings/${meetingId}/start`);
      toast.success('Meeting started! Alert notifications dispatched.');
      fetchMeetings();
      if (selectedMeeting && selectedMeeting._id === meetingId) {
        handleSelectMeeting(meetingId);
      }
    } catch (err) {
      toast.error('Failed to start meeting.');
    }
  };

  // Save Attendance
  const handleSaveAttendance = async () => {
    const records = Object.keys(attendanceStates).map(userId => ({
      userId,
      status: attendanceStates[userId] ? 'present' : 'absent'
    }));

    try {
      await axios.patch(`/api/meetings/${selectedMeeting._id}/attendance`, {
        attendees: records
      });
      toast.success('Attendance saved.');
      handleSelectMeeting(selectedMeeting._id);
    } catch (err) {
      toast.error('Failed to save attendance checklist.');
    }
  };

  // Append Minutes
  const handleAppendMinutes = async () => {
    if (!minutesInput.trim()) return;

    try {
      await axios.patch(`/api/meetings/${selectedMeeting._id}/minutes`, {
        minutesContent: minutesInput
      });
      setMinutesInput('');
      toast.success('Minutes appended successfully.');
      handleSelectMeeting(selectedMeeting._id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save minutes.');
    }
  };

  // Lock Meeting (Completed)
  const handleCompleteMeeting = async () => {
    try {
      await axios.patch(`/api/meetings/${selectedMeeting._id}/status`, {
        status: 'completed'
      });
      toast.success('Meeting completed and minutes locked!');
      fetchMeetings();
      handleSelectMeeting(selectedMeeting._id);
    } catch (err) {
      toast.error('Failed to lock meeting.');
    }
  };

  // AI Summarize Minutes / Transcripts
  const handleAISummarize = async () => {
    const textToSummarize = transcriptInput.trim() || selectedMeeting.minutes;
    if (!textToSummarize) {
      toast.error('Paste transcript or write minutes first.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/ai/summarize-meeting', {
        transcript: textToSummarize,
        meetingId: selectedMeeting._id
      });
      setAiSummary(res.data);
      toast.success('AI summary successfully generated!');
    } catch (err) {
      toast.error('AI summarization failed.');
    } finally {
      setLoading(false);
    }
  };

  // Save AI Summary to DB
  const handleSaveAISummary = async () => {
    if (!aiSummary) return;

    try {
      await axios.patch(`/api/meetings/${selectedMeeting._id}/status`, {
        summary: aiSummary.summary.join('\n'),
        actionItems: aiSummary.actionItems,
        nextSteps: aiSummary.nextSteps
      });
      toast.success('AI summary saved onto meeting document.');
      handleSelectMeeting(selectedMeeting._id);
    } catch (err) {
      toast.error('Failed to save summary.');
    }
  };

  // Select attendee helper (multi-select)
  const toggleAttendeeSelection = (id) => {
    setAttendeeIds(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const getPlatformIconColor = (plt) => {
    if (plt === 'zoom') return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (plt === 'gmeet') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (plt === 'teams') return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    return 'text-gray-400 bg-gray-500/10 border-gray-550';
  };

  const isOrganizerOrAdmin = selectedMeeting && (
    user.role === 'admin' || String(selectedMeeting.organizer?._id || selectedMeeting.organizer) === String(user.id)
  );

  const isDesignatedMinutesWriter = selectedMeeting && selectedMeeting.minutesWriterId && (
    String(selectedMeeting.minutesWriterId._id || selectedMeeting.minutesWriterId) === String(user.id)
  );

  return (
    <div className="pt-20 pb-24 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
      <Toaster />
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-wider text-white">
            <span className="text-[#00BFFF]">MEETING</span> CONSOLE
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Schedule briefs, record minutes, check attendance, and summarize transcript details.
          </p>
        </div>

        {(user.role === 'admin' || user.subRole === 'coordinator') && (
          <button
            onClick={() => { fetchFormDetails(); setShowScheduleModal(true); }}
            className="bg-gradient-to-r from-[#00BFFF] to-[#8F5CFF] text-white font-extrabold px-5 py-3 rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="h-5 w-5" />
            <span>Schedule Meeting</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Meetings list */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#00BFFF]" />
            Club Schedule
          </h2>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {meetings.length === 0 ? (
              <div className="bg-[#111111] p-12 text-center rounded-xl border border-gray-850 text-gray-500 text-xs">
                No meetings scheduled or saved.
              </div>
            ) : (
              meetings.map((meet) => (
                <div
                  key={meet._id}
                  onClick={() => handleSelectMeeting(meet._id)}
                  className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-4 hover:border-gray-700 ${
                    selectedMeeting && selectedMeeting._id === meet._id
                      ? 'bg-[#181818] border-[#00BFFF]/45 shadow-lg shadow-[#00BFFF]/5'
                      : 'bg-[#111111] border-gray-850'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-extrabold text-white text-sm tracking-wide">{meet.title}</h4>
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{meet.description || 'No agenda notes.'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getPlatformIconColor(meet.platform)}`}>
                      {meet.platform}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-gray-850/60 pt-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(meet.scheduledAt).toLocaleString()} ({meet.duration}m)</span>
                    </span>
                    <span className={`font-extrabold uppercase ${
                      meet.status === 'ongoing' ? 'text-red-400 animate-pulse' : meet.status === 'completed' ? 'text-emerald-400' : 'text-gray-450'
                    }`}>{meet.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Meeting Details / Minutes / Attendance Checklist / AI Summarizer */}
        <div className="lg:col-span-2">
          {selectedMeeting ? (
            <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 space-y-8">
              
              {/* Card Header details */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-850 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white uppercase ${
                      selectedMeeting.status === 'ongoing' ? 'bg-red-500 animate-pulse' : selectedMeeting.status === 'completed' ? 'bg-emerald-500' : 'bg-gray-800'
                    }`}>
                      {selectedMeeting.status}
                    </span>
                    {selectedMeeting.eventId && (
                      <span className="text-xs text-gray-450">Linked to: {selectedMeeting.eventId.title}</span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white mt-2">{selectedMeeting.title}</h2>
                  <p className="text-xs text-gray-400 mt-1">Scheduled by Coordinator {selectedMeeting.organizer?.name}</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Start Meeting Button */}
                  {isOrganizerOrAdmin && selectedMeeting.status === 'scheduled' && (
                    <button
                      onClick={() => handleStartMeeting(selectedMeeting._id)}
                      className="bg-red-650 hover:bg-red-650 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg transition-all"
                    >
                      Start Meeting
                    </button>
                  )}

                  {/* Join Link */}
                  {selectedMeeting.meetingLink && (
                    <a
                      href={selectedMeeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#22C55E] hover:bg-[#22C55E]/80 text-[#0b0c10] font-black text-xs px-4 py-2.5 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <span>Join Meeting</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  )}

                  {/* Lock minutes button */}
                  {isOrganizerOrAdmin && selectedMeeting.status === 'ongoing' && (
                    <button
                      onClick={handleCompleteMeeting}
                      className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-[#0b0c10] border border-emerald-500/30 font-extrabold text-xs px-4 py-2.5 rounded-lg transition-all"
                    >
                      Complete & Lock
                    </button>
                  )}
                </div>
              </div>

              {/* Attendance checklist (Admin only) or attendee own state */}
              {user.role === 'admin' ? (
                <div className="bg-[#161616] p-4 rounded-xl border border-gray-850 space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-850 pb-2">
                    <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="h-4.5 w-4.5 text-[#00BFFF]" />
                      Mark Attendance Checklist
                    </h3>
                    <button
                      onClick={handleSaveAttendance}
                      className="bg-[#00BFFF]/10 border border-[#00BFFF]/20 text-[#00BFFF] hover:bg-[#00BFFF] hover:text-[#0b0c10] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Attendance</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedMeeting.attendees.map(att => {
                      const uId = att.userId._id || att.userId;
                      const present = attendanceStates[uId];
                      return (
                        <div key={uId} className="flex items-center justify-between bg-[#1A1A1A] p-2.5 rounded border border-gray-850 text-xs">
                          <span className="text-gray-300 font-semibold">{att.userName}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={present || false}
                              onChange={(e) => setAttendanceStates(prev => ({ ...prev, [uId]: e.target.checked }))}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-gray-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-350 after:border-gray-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00BFFF]"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // Display user's own status
                <div className="bg-[#161616] p-4 rounded-xl border border-gray-850 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-semibold">Your Attendance State:</span>
                  {(() => {
                    const mine = selectedMeeting.attendees.find(att => String(att.userId._id || att.userId) === String(user.id));
                    if (mine) {
                      return (
                        <span className={`px-3 py-1 rounded-full font-bold uppercase ${
                          mine.status === 'present' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>{mine.status}</span>
                      );
                    }
                    return <span className="text-gray-500 italic">Not Invited</span>;
                  })()}
                </div>
              )}

              {/* Minutes of Meeting Editor */}
              <div className="space-y-4">
                <h3 className="text-md font-bold text-white flex items-center gap-1.5 border-b border-gray-850 pb-2">
                  <BookOpen className="h-5 w-5 text-[#00BFFF]" />
                  Minutes of Meeting
                </h3>

                {/* History display */}
                <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-850 font-mono text-xs text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedMeeting.minutes || 'No minutes entries recorded yet.'}
                </div>

                {/* Writer Panel */}
                {(isOrganizerOrAdmin || isDesignatedMinutesWriter) && selectedMeeting.status !== 'completed' ? (
                  <div className="space-y-2">
                    <textarea
                      placeholder="Write or append minutes here..."
                      value={minutesInput}
                      onChange={(e) => setMinutesInput(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00BFFF] h-20 text-xs resize-none"
                    ></textarea>
                    <button
                      onClick={handleAppendMinutes}
                      className="bg-gradient-to-r from-[#00BFFF] to-[#8F5CFF] text-white font-bold px-4 py-2.5 rounded-lg text-xs hover:opacity-90 transition-all flex items-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Append Minutes</span>
                    </button>
                  </div>
                ) : selectedMeeting.status === 'completed' && (
                  <div className="text-xs text-gray-500 italic flex items-center gap-1 bg-[#1A1A1A] p-3 rounded border border-gray-850">
                    <Lock className="h-4 w-4 text-gray-650" />
                    <span>Meeting is completed. Minutes have been locked and compiled.</span>
                  </div>
                )}
              </div>

              {/* AI Transcript Summarizer Section */}
              <div className="bg-[#161616] p-5 rounded-xl border border-gray-850 space-y-4">
                <h3 className="text-md font-bold text-white flex items-center justify-between border-b border-gray-850 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-5 w-5 text-[#00BFFF]" />
                    AI Minutes & Transcript Summarizer
                  </span>
                  {aiSummary && (
                    <button
                      onClick={handleSaveAISummary}
                      className="bg-[#2ECC71]/10 border border-[#2ECC71]/20 text-[#2ECC71] hover:bg-[#2ECC71] hover:text-[#0b0c10] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Summary to Meeting</span>
                    </button>
                  )}
                </h3>

                {/* Paste Transcript Textarea */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase">Paste Audio/Chat Transcript (Optional)</label>
                  <textarea
                    placeholder="Paste the audio transcription, Zoom chat log, or write meeting bullet points here..."
                    value={transcriptInput}
                    onChange={(e) => setTranscriptInput(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00BFFF] h-24 text-xs resize-none"
                  ></textarea>

                  <button
                    onClick={handleAISummarize}
                    disabled={loading}
                    className="bg-[#00BFFF] hover:bg-[#00BFFF]/80 text-[#0b0c10] font-black px-4 py-2.5 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-[#00BFFF]/5"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 fill-[#0b0c10]" />}
                    <span>Summarize Transcript</span>
                  </button>
                </div>

                {/* AI Summary Output Panels */}
                {aiSummary && (
                  <div className="bg-[#1C1C1C] p-4 rounded-lg border border-gray-850 space-y-4 text-xs">
                    {/* Summary */}
                    <div>
                      <h4 className="font-bold text-white mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wider text-[#00BFFF]">
                        <FileText className="h-3.5 w-3.5" /> Summary
                      </h4>
                      <ul className="list-disc pl-4 text-gray-300 space-y-1">
                        {aiSummary.summary.map((pt, idx) => <li key={idx}>{pt}</li>)}
                      </ul>
                    </div>

                    {/* Action items */}
                    {aiSummary.actionItems && aiSummary.actionItems.length > 0 && (
                      <div>
                        <h4 className="font-bold text-white mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wider text-purple-400">
                          <Check className="h-3.5 w-3.5" /> Action Items
                        </h4>
                        <div className="space-y-1">
                          {aiSummary.actionItems.map((item, idx) => (
                            <div key={idx} className="bg-[#242424] p-2 rounded flex justify-between gap-2 border border-gray-800">
                              <span className="text-gray-300 font-semibold">{item.task}</span>
                              <span className="text-[10px] text-gray-400">{item.assignedTo} (Due: {item.dueDate})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-[#111111] py-32 text-center rounded-xl border border-gray-850 text-gray-500 text-sm">
              Select a meeting schedule card from the left panel to review agendas, join links, attendance checks, and minutes summaries.
            </div>
          )}
        </div>

      </div>

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-[#0a0a0ade]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-gray-850 max-w-xl w-full rounded-xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-850 pb-3">
              <h3 className="font-extrabold text-white text-lg">Schedule Club Meeting</h3>
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-gray-850 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Meeting Title</label>
                <input
                  type="text"
                  placeholder="e.g. Squad Code review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00BFFF]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description / Agenda</label>
                <textarea
                  placeholder="Review deliverables, timeline setups..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00BFFF] h-16 resize-none text-sm"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-3 focus:outline-none focus:border-[#00BFFF] text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Duration (minutes)</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-3.5 focus:outline-none focus:border-[#00BFFF] text-xs cursor-pointer"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={60}>1 Hour</option>
                    <option value={120}>2 Hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Meeting Link</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-3 focus:outline-none focus:border-[#00BFFF] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-3.5 focus:outline-none focus:border-[#00BFFF] text-xs cursor-pointer"
                  >
                    <option value="gmeet">Google Meet</option>
                    <option value="zoom">Zoom</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Minutes Writer</label>
                  <select
                    value={minutesWriterId}
                    onChange={(e) => setMinutesWriterId(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-3 focus:outline-none focus:border-[#00BFFF] text-xs cursor-pointer"
                  >
                    <option value="">-- Choose Writer --</option>
                    {members.map(m => (
                      <option key={m._id || m.id} value={m._id || m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Link Event (Optional)</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-3 focus:outline-none focus:border-[#00BFFF] text-xs cursor-pointer"
                  >
                    <option value="">-- Select Event --</option>
                    {events.map(ev => (
                      <option key={ev._id} value={ev._id}>{ev.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi select attendees checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Invite Attendees</label>
                <div className="bg-[#1A1A1A] p-3 rounded-lg border border-gray-800 max-h-36 overflow-y-auto grid grid-cols-2 gap-2 text-xs">
                  {members.map(m => {
                    const checked = attendeeIds.includes(m._id || m.id);
                    return (
                      <label key={m._id || m.id} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-850 text-gray-300">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAttendeeSelection(m._id || m.id)}
                          className="rounded text-[#00BFFF] border-gray-800 focus:ring-0 cursor-pointer"
                        />
                        <span>{m.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#00BFFF] to-[#8F5CFF] text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1.5 text-sm"
              >
                <Calendar className="h-5 w-5" />
                <span>Publish Schedule</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
