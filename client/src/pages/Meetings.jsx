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
  Loader2,
  ArrowUp,
  ArrowDown,
  Play,
  Trash
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Countdown Timer Component for active agenda items
function AgendaCountdown({ item, isOrganizer }) {
  const [timeLeft, setTimeLeft] = useState(item.duration * 60);

  useEffect(() => {
    setTimeLeft(item.duration * 60);
  }, [item._id || item.id]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progress = (timeLeft / (item.duration * 60)) * 100;

  return (
    <div className="bg-[#1A1A1A] border border-gray-850 p-4 rounded-xl space-y-2.5 text-left mb-4">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-white flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00BFFF] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00BFFF]"></span>
          </span>
          Discussing: "{item.title}"
        </span>
        <span className={`font-mono font-bold ${timeLeft <= 60 ? 'text-red-500 animate-pulse' : 'text-[#00BFFF]'}`}>
          {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')} remaining
        </span>
      </div>
      <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-300 ${timeLeft <= 60 ? 'bg-red-500' : 'bg-[#00BFFF]'}`} 
          style={{ width: `${progress}%` }}
        />
      </div>
      {timeLeft <= 0 && isOrganizer && (
        <div className="text-[10px] text-red-400 font-semibold uppercase tracking-wider animate-bounce">
          ⚠️ Agenda Time Limit Expired! Wrap up and mark as finished.
        </div>
      )}
    </div>
  );
}

export default function Meetings() {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const [meetings, setMeetings] = useState([]);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);

  // Detail View State
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedSubTab, setSelectedSubTab] = useState('details');

  // Agenda Form States
  const [agendaTitle, setAgendaTitle] = useState('');
  const [agendaDesc, setAgendaDesc] = useState('');
  const [agendaDuration, setAgendaDuration] = useState(10);
  const [agendaPresenter, setAgendaPresenter] = useState('');

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

  // Listen to Socket.io for meeting start alerts and agenda updates
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

  // Real-time synchronization of agenda lists
  useEffect(() => {
    if (socket && selectedMeeting) {
      const updateChannel = `meeting_${selectedMeeting._id}_agenda_update`;
      const changeChannel = `meeting_${selectedMeeting._id}_agenda_status_change`;

      const handleUpdate = (updatedAgenda) => {
        setSelectedMeeting(prev => {
          if (!prev || prev._id !== selectedMeeting._id) return prev;
          return { ...prev, agenda: updatedAgenda };
        });
      };

      socket.on(updateChannel, handleUpdate);
      socket.on(changeChannel, () => {
        handleSelectMeeting(selectedMeeting._id);
      });

      return () => {
        socket.off(updateChannel, handleUpdate);
        socket.off(changeChannel);
      };
    }
  }, [socket, selectedMeeting?._id]);

  // Load details of single meeting
  const handleSelectMeeting = async (meetingId) => {
    try {
      const res = await axios.get(`/api/meetings/${meetingId}`);
      setSelectedMeeting(res.data);
      setSelectedSubTab('details');
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

  // Add Item to Agenda Builder
  const handleAddAgendaItem = async (e) => {
    e.preventDefault();
    if (!agendaTitle.trim()) return;

    const newItem = {
      title: agendaTitle,
      description: agendaDesc,
      duration: agendaDuration,
      presenter: agendaPresenter,
      status: 'pending',
      order: selectedMeeting.agenda?.length || 0
    };

    const updatedAgenda = [...(selectedMeeting.agenda || []), newItem];

    try {
      const res = await axios.patch(`/api/meetings/${selectedMeeting._id}/agenda`, {
        agenda: updatedAgenda
      });
      toast.success('Agenda item added.');
      setSelectedMeeting(prev => ({
        ...prev,
        agenda: res.data.agenda || updatedAgenda
      }));
      setAgendaTitle('');
      setAgendaDesc('');
      setAgendaDuration(10);
      setAgendaPresenter('');
      
      handleSelectMeeting(selectedMeeting._id);
    } catch (err) {
      toast.error('Failed to add agenda item.');
    }
  };

  // Delete Agenda Item
  const handleDeleteAgendaItem = async (itemId) => {
    const updatedAgenda = selectedMeeting.agenda.filter(i => (i._id || i.id) !== itemId);
    updatedAgenda.forEach((i, idx) => { i.order = idx; });

    try {
      const res = await axios.patch(`/api/meetings/${selectedMeeting._id}/agenda`, {
        agenda: updatedAgenda
      });
      toast.success('Agenda item deleted.');
      setSelectedMeeting(prev => ({
        ...prev,
        agenda: res.data.agenda || updatedAgenda
      }));
    } catch (err) {
      toast.error('Failed to delete agenda item.');
    }
  };

  // Reorder Agenda Items using Arrows
  const handleMoveAgendaItem = async (index, direction) => {
    const items = [...selectedMeeting.agenda];
    if (direction === 'up' && index > 0) {
      const temp = items[index];
      items[index] = items[index - 1];
      items[index - 1] = temp;
    } else if (direction === 'down' && index < items.length - 1) {
      const temp = items[index];
      items[index] = items[index + 1];
      items[index + 1] = temp;
    }

    items.forEach((item, idx) => {
      item.order = idx;
    });

    try {
      const res = await axios.patch(`/api/meetings/${selectedMeeting._id}/agenda`, {
        agenda: items
      });
      setSelectedMeeting(prev => ({
        ...prev,
        agenda: res.data.agenda || items
      }));
      toast.success('Agenda order updated.');
    } catch (err) {
      toast.error('Failed to update agenda order.');
    }
  };

  // Update specific agenda status
  const handleUpdateAgendaItemStatus = async (itemId, newStatus) => {
    try {
      const res = await axios.patch(`/api/meetings/${selectedMeeting._id}/agenda/${itemId}/status`, {
        status: newStatus
      });
      setSelectedMeeting(prev => ({
        ...prev,
        agenda: res.data.agenda
      }));
      toast.success(`Agenda item status updated to ${newStatus}.`);
    } catch (err) {
      toast.error('Failed to update status.');
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

              {/* Sub-tabs selector */}
              <div className="flex bg-[#161616] p-1 rounded-lg border border-gray-850">
                <button
                  type="button"
                  onClick={() => setSelectedSubTab('details')}
                  className={`flex-1 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    selectedSubTab === 'details'
                      ? 'bg-[#00BFFF]/10 border border-[#00BFFF]/30 text-[#00BFFF]'
                      : 'text-gray-400 border border-transparent hover:text-white'
                  }`}
                >
                  Brief Details &amp; Minutes
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubTab('agenda')}
                  className={`flex-1 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    selectedSubTab === 'agenda'
                      ? 'bg-[#00BFFF]/10 border border-[#00BFFF]/30 text-[#00BFFF]'
                      : 'text-gray-400 border border-transparent hover:text-white'
                  }`}
                >
                  Meeting Agenda
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubTab('attendance')}
                  className={`flex-1 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    selectedSubTab === 'attendance'
                      ? 'bg-[#00BFFF]/10 border border-[#00BFFF]/30 text-[#00BFFF]'
                      : 'text-gray-400 border border-transparent hover:text-white'
                  }`}
                >
                  Attendees Checklist
                </button>
              </div>

              {/* Tab Content Panels */}
              {selectedSubTab === 'details' && (
                <div className="space-y-6">
                  {/* Description / Goals */}
                  <div className="text-left bg-[#161616] p-4.5 rounded-xl border border-gray-850">
                    <h3 className="text-xs font-bold text-[#00BFFF] uppercase tracking-wider mb-2">Brief Agenda Notes</h3>
                    <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedMeeting.description || 'No detailed meeting agenda notes have been recorded.'}
                    </p>
                  </div>

                  {/* Minutes of Meeting Editor */}
                  <div className="space-y-4 text-left">
                    <h3 className="text-md font-bold text-white flex items-center gap-1.5 border-b border-gray-850 pb-2">
                      <BookOpen className="h-5 w-5 text-[#00BFFF]" />
                      Minutes of Meeting
                    </h3>

                    {/* History display */}
                    <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-850 font-mono text-xs text-gray-350 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
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
                          className="bg-gradient-to-r from-[#00BFFF] to-[#8F5CFF] text-white font-bold px-4 py-2.5 rounded-lg text-xs hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Append Minutes</span>
                        </button>
                      </div>
                    ) : selectedMeeting.status === 'completed' && (
                      <div className="text-xs text-gray-500 italic flex items-center gap-1 bg-[#1A1A1A] p-3 rounded border border-gray-850 justify-center">
                        <Lock className="h-4 w-4 text-gray-650" />
                        <span>Meeting is completed. Minutes have been locked and compiled.</span>
                      </div>
                    )}
                  </div>

                  {/* AI Transcript Summarizer Section */}
                  <div className="bg-[#161616] p-5 rounded-xl border border-gray-850 space-y-4 text-left">
                    <h3 className="text-md font-bold text-white flex items-center justify-between border-b border-gray-850 pb-2">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-5 w-5 text-[#00BFFF]" />
                        AI Minutes &amp; Transcript Summarizer
                      </span>
                      {aiSummary && (
                        <button
                          onClick={handleSaveAISummary}
                          className="bg-[#2ECC71]/10 border border-[#2ECC71]/20 text-[#2ECC71] hover:bg-[#2ECC71] hover:text-[#0b0c10] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
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
                        className="bg-[#00BFFF] hover:bg-[#00D4FF] text-black font-black px-4 py-2.5 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-[#00BFFF]/5 cursor-pointer"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 fill-black" />}
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
              )}

              {/* Tab Panel: Attendance */}
              {selectedSubTab === 'attendance' && (
                <div>
                  {user.role === 'admin' ? (
                    <div className="bg-[#161616] p-4 rounded-xl border border-gray-850 space-y-4 text-left">
                      <div className="flex justify-between items-center border-b border-gray-850 pb-2">
                        <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="h-4.5 w-4.5 text-[#00BFFF]" />
                          Mark Attendance Checklist
                        </h3>
                        <button
                          onClick={handleSaveAttendance}
                          className="bg-[#00BFFF]/10 border border-[#00BFFF]/20 text-[#00BFFF] hover:bg-[#00BFFF] hover:text-[#0b0c10] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
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
                    <div className="bg-[#161616] p-4 rounded-xl border border-gray-850 flex items-center justify-between text-xs text-left">
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
                </div>
              )}

              {/* Tab Panel: Agenda Builder */}
              {selectedSubTab === 'agenda' && (
                <div className="space-y-6">
                  {/* Active Agenda Countdown Clock */}
                  {(() => {
                    const currentItem = selectedMeeting.agenda?.find(item => item.status === 'current');
                    if (currentItem) {
                      return (
                        <AgendaCountdown 
                          item={currentItem} 
                          isOrganizer={isOrganizerOrAdmin}
                        />
                      );
                    }
                    return null;
                  })()}

                  {/* Agenda items list */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-850 pb-2">
                      <h3 className="font-extrabold text-white text-xs uppercase tracking-wider">Agenda Checklist</h3>
                      {isOrganizerOrAdmin && selectedMeeting.status !== 'completed' && (
                        <span className="text-[10px] text-gray-450 font-semibold italic">Reorder list using arrows</span>
                      )}
                    </div>

                    {(!selectedMeeting.agenda || selectedMeeting.agenda.length === 0) ? (
                      <p className="text-xs text-gray-500 italic py-4 text-center">No agenda items created for this brief.</p>
                    ) : (
                      [...selectedMeeting.agenda]
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((item, idx, sortedArr) => {
                          let statusBadge = (
                            <span className="px-2 py-0.5 bg-gray-850 text-gray-450 rounded text-[9px] font-bold uppercase">
                              Pending
                            </span>
                          );
                          if (item.status === 'current') {
                            statusBadge = (
                              <span className="px-2 py-0.5 bg-[#00BFFF]/10 border border-[#00BFFF]/20 text-[#00BFFF] rounded text-[9px] font-bold uppercase animate-pulse flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#00BFFF] inline-block animate-ping" />
                                Discussing
                              </span>
                            );
                          } else if (item.status === 'done') {
                            statusBadge = (
                              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold uppercase">
                                Done
                              </span>
                            );
                          }

                          return (
                            <div key={item._id || item.id || idx} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                              item.status === 'current' ? 'bg-[#00BFFF]/5 border-[#00BFFF]/30' : 'bg-[#161616] border-gray-850'
                            }`}>
                              <div className="text-left space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm text-white">{item.title}</h4>
                                  {statusBadge}
                                </div>
                                {item.description && <p className="text-xs text-gray-400 leading-normal">{item.description}</p>}
                                <div className="text-[10px] text-gray-500 flex flex-wrap gap-x-3">
                                  <span>⏱️ Duration: <strong>{item.duration} mins</strong></span>
                                  {item.presenter && <span>🎙️ Presenter: <strong>{item.presenter}</strong></span>}
                                </div>
                              </div>

                              {/* Controls */}
                              {isOrganizerOrAdmin && selectedMeeting.status !== 'completed' && (
                                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                  {/* Move Up */}
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveAgendaItem(idx, 'up')}
                                    className="p-1.5 rounded bg-[#202020] border border-gray-800 text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer"
                                    title="Move Up"
                                  >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                  </button>
                                  {/* Move Down */}
                                  <button
                                    type="button"
                                    disabled={idx === sortedArr.length - 1}
                                    onClick={() => handleMoveAgendaItem(idx, 'down')}
                                    className="p-1.5 rounded bg-[#202020] border border-gray-800 text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer"
                                    title="Move Down"
                                  >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                  </button>
                                  {/* Action buttons */}
                                  {item.status === 'pending' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateAgendaItemStatus(item._id || item.id, 'current')}
                                      className="px-2.5 py-1 bg-[#00BFFF] hover:bg-[#00D4FF] text-black font-extrabold text-[10px] rounded uppercase transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      <Play className="h-3 w-3 fill-black animate-pulse" />
                                      Start
                                    </button>
                                  )}
                                  {item.status === 'current' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateAgendaItemStatus(item._id || item.id, 'done')}
                                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-[10px] rounded uppercase transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      <Check className="h-3 w-3" />
                                      Finish
                                    </button>
                                  )}
                                  {/* Delete item */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAgendaItem(item._id || item.id)}
                                    className="p-1.5 rounded bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                                    title="Delete Item"
                                  >
                                    <Trash className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* Add Agenda Item Form (Organizer only) */}
                  {isOrganizerOrAdmin && selectedMeeting.status !== 'completed' && (
                    <form onSubmit={handleAddAgendaItem} className="bg-[#161616] p-4 rounded-xl border border-gray-850 space-y-4 text-left">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#00BFFF]">Add Agenda Item</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Item Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Discuss Venue Logistics"
                            value={agendaTitle}
                            onChange={(e) => setAgendaTitle(e.target.value)}
                            required
                            className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-[#00BFFF]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Presenter Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Sarah Chen"
                            value={agendaPresenter}
                            onChange={(e) => setAgendaPresenter(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-[#00BFFF]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Description (Optional)</label>
                          <input
                            type="text"
                            placeholder="Brief bullet overview..."
                            value={agendaDesc}
                            onChange={(e) => setAgendaDesc(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-[#00BFFF]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Duration (mins)</label>
                          <input
                            type="number"
                            min="1"
                            value={agendaDuration}
                            onChange={(e) => setAgendaDuration(Number(e.target.value))}
                            required
                            className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-[#00BFFF]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="bg-[#00BFFF]/10 hover:bg-[#00BFFF] border border-[#00BFFF]/20 text-[#00BFFF] hover:text-black font-extrabold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Item to Agenda</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

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
