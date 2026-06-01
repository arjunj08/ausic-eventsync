import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import EventCard from '../components/EventCard';
import EventDiscussion from '../components/EventDiscussion';
import EventGallery from '../components/EventGallery';
import EventGoals from '../components/EventGoals';
import { Plus, X, Calendar, Users, CheckSquare, Loader2, ArrowLeft, MessageSquare, Image, ClipboardList, Target } from 'lucide-react';

export default function Events() {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  
  // Category & filtering states
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Detail page tabs state
  const [activeDetailTab, setActiveDetailTab] = useState('details');
  const [rsvps, setRsvps] = useState([]);
  const [rsvpsLoading, setRsvpsLoading] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('draft');
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [category, setCategory] = useState('Technical');
  const [tagsInput, setTagsInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/events');
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await axios.get('/api/teams');
      setTeams(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedEventId && activeDetailTab === 'rsvps' && isAdmin) {
      const fetchRsvps = async () => {
        try {
          setRsvpsLoading(true);
          const res = await axios.get(`/api/events/${selectedEventId}/rsvps`);
          setRsvps(res.data);
        } catch (err) {
          console.error(err);
        } finally {
          setRsvpsLoading(false);
        }
      };
      fetchRsvps();
    }
  }, [selectedEventId, activeDetailTab, isAdmin]);

  useEffect(() => {
    if (socket && selectedEventId && activeDetailTab === 'rsvps' && isAdmin) {
      const rsvpChannel = `event_${selectedEventId}_new_rsvp`;
      socket.on(rsvpChannel, (data) => {
        setRsvps(prev => [data.rsvp, ...prev]);
      });
      return () => {
        socket.off(rsvpChannel);
      };
    }
  }, [socket, selectedEventId, activeDetailTab, isAdmin]);

  const handleOpenDetails = async (id) => {
    try {
      setSelectedEventId(id);
      const res = await axios.get(`/api/events/${id}`);
      setSelectedEventDetails(res.data);
    } catch (err) {
      console.error(err);
      setSelectedEventId(null);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setDate('');
    setStatus('draft');
    setSelectedTeams([]);
    setCategory('Technical');
    setTagsInput('');
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description);
    // Format date string for datetime-local input (YYYY-MM-DDTHH:MM)
    const d = new Date(event.date);
    const pad = (n) => String(n).padStart(2, '0');
    const formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setDate(formattedDate);
    setStatus(event.status);
    setSelectedTeams(event.teamIds ? event.teamIds.map(t => t._id || t) : []);
    setCategory(event.category || 'Technical');
    setTagsInput(event.tags ? event.tags.join(', ') : '');
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleToggleTeamCheckbox = (teamId) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId) 
        : [...prev, teamId]
    );
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setModalLoading(true);

    const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('date', date);
    formData.append('status', status);
    formData.append('teamIds', JSON.stringify(selectedTeams));
    formData.append('category', category);
    formData.append('tags', JSON.stringify(tagsArray));
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (editingEvent) {
        await axios.put(`/api/events/${editingEvent._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('/api/events', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setIsModalOpen(false);
      fetchEvents();
      // If we are currently looking at details, refresh
      if (selectedEventId) {
        handleOpenDetails(selectedEventId);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to save event');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await axios.delete(`/api/events/${id}`);
      if (selectedEventId === id) {
        setSelectedEventId(null);
        setSelectedEventDetails(null);
      }
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublishEvent = async (id) => {
    try {
      await axios.put(`/api/events/${id}`, { status: 'published' });
      fetchEvents();
      if (selectedEventId === id) {
        handleOpenDetails(id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (selectedEventId && selectedEventDetails) {
    const { event, teams: assignedTeams } = selectedEventDetails;
    return (
      <div className="pb-24 px-6 max-w-5xl mx-auto pt-20">
        
        {/* Back Button */}
        <button 
          onClick={() => { setSelectedEventId(null); setSelectedEventDetails(null); setActiveDetailTab('details'); }}
          className="flex items-center text-gray-400 hover:text-white mb-6 text-sm font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to list
        </button>

        {/* Detailed Layout */}
        <div className="bg-[#111111] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="h-64 md:h-80 w-full relative">
            <img 
              src={event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'} 
              alt={event.title} 
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent"></div>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-850 pb-6 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                    event.status === 'published' 
                      ? 'bg-green-500/10 border-green-500/30 text-green-500' 
                      : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                  }`}>
                    {event.status}
                  </span>
                  {event.category && (
                    <span className="px-3 py-1 bg-[#00BFFF]/10 border border-[#00BFFF]/20 text-[#00BFFF] rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {event.category}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-3">{event.title}</h1>
                <div className="flex items-center text-[#00BFFF] text-sm font-semibold mt-2 space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>

              {/* Admin Actions in Details */}
              {isAdmin && (
                <div className="flex space-x-3">
                  {event.status === 'draft' && (
                    <button
                      onClick={() => handlePublishEvent(event._id)}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                    >
                      Publish Now
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEditModal(event)}
                    className="bg-[#1a1a1a] hover:bg-[#252525] text-[#00BFFF] border border-gray-800 hover:border-gray-700 font-bold px-4 py-2 rounded-lg text-sm transition-all cursor-pointer"
                  >
                    Edit Event
                  </button>
                </div>
              )}
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-gray-850 mb-6 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveDetailTab('details')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeDetailTab === 'details'
                    ? 'border-[#00BFFF] text-[#00BFFF]'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                Details & Squads
              </button>
              <button
                onClick={() => setActiveDetailTab('discussion')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeDetailTab === 'discussion'
                    ? 'border-[#00BFFF] text-[#00BFFF]'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Discussion
              </button>
              <button
                onClick={() => setActiveDetailTab('gallery')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeDetailTab === 'gallery'
                    ? 'border-[#00BFFF] text-[#00BFFF]'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <Image className="h-4 w-4" />
                Gallery
              </button>
              <button
                onClick={() => setActiveDetailTab('goals')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeDetailTab === 'goals'
                    ? 'border-[#00BFFF] text-[#00BFFF]'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <Target className="h-4 w-4" />
                Goals
              </button>
              {isAdmin && (
                <button
                  onClick={() => setActiveDetailTab('rsvps')}
                  className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeDetailTab === 'rsvps'
                      ? 'border-[#00BFFF] text-[#00BFFF]'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <ClipboardList className="h-4 w-4" />
                  RSVPs
                </button>
              )}
            </div>

            {activeDetailTab === 'details' && (
              <>
                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">About the Event</h3>
                  <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap">{event.description}</p>
                </div>

                {/* Assigned Teams Section */}
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Assigned Squads</h3>
                  {assignedTeams.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No squads assigned to this event yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {assignedTeams.map(team => (
                        <div key={team._id} className="bg-[#1a1a1a] border border-gray-850 rounded-xl p-5 flex flex-col justify-between text-left">
                          <div className="flex items-center space-x-3 mb-3">
                            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: team.color }}></span>
                            <h4 className="font-bold text-white text-base">{team.name}</h4>
                          </div>

                          {/* Member list */}
                          <div className="mt-2 border-t border-gray-800/50 pt-3">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Squad Members</span>
                            <div className="flex flex-wrap gap-2">
                              {team.memberIds.map(member => (
                                <div key={member._id} className="flex items-center space-x-1.5 bg-[#202020] border border-gray-850 px-2.5 py-1 rounded-full text-xs text-gray-300">
                                  <img 
                                    src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`} 
                                    alt={member.name}
                                    className="h-4.5 w-4.5 rounded-full"
                                  />
                                  <span>{member.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeDetailTab === 'discussion' && (
              <EventDiscussion eventId={event._id} user={user} />
            )}

            {activeDetailTab === 'gallery' && (
              <EventGallery eventId={event._id} user={user} />
            )}

            {activeDetailTab === 'goals' && (
              <EventGoals eventId={event._id} user={user} />
            )}

            {activeDetailTab === 'rsvps' && isAdmin && (
              <div className="space-y-4 text-left">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Public Guestlist RSVPs ({rsvps.length})</h3>
                {rsvpsLoading ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="h-6 w-6 text-[#00BFFF] animate-spin" />
                  </div>
                ) : rsvps.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-4">No guests have RSVPed for this event yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-850 bg-[#161616]">
                    <table className="w-full text-xs text-gray-300 text-left border-collapse">
                      <thead>
                        <tr className="bg-[#1D1D1D] text-gray-400 uppercase font-bold text-[10px] tracking-wider border-b border-gray-850">
                          <th className="px-4 py-3">Guest Name</th>
                          <th className="px-4 py-3">Email Address</th>
                          <th className="px-4 py-3">RSVP Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-850">
                        {rsvps.map((rsvp) => (
                          <tr key={rsvp._id} className="hover:bg-[#1A1A1A]">
                            <td className="px-4 py-3 font-semibold text-white">{rsvp.name}</td>
                            <td className="px-4 py-3">{rsvp.email}</td>
                            <td className="px-4 py-3 text-gray-500">
                              {new Date(rsvp.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  const filteredEvents = selectedCategory === 'All'
    ? events
    : events.filter(e => e.category === selectedCategory);

  return (
    <div className="pb-24 px-6 max-w-7xl mx-auto pt-20">
      
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Events</h1>
          <p className="text-gray-400 text-sm mt-1">Discover published events</p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center bg-[#00BFFF] hover:bg-[#00D4FF] text-black font-bold px-4 py-2.5 rounded-lg text-sm transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="h-5 w-5 mr-1.5" />
            New Event
          </button>
        )}
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {['All', 'Technical', 'Cultural', 'Sports', 'Workshop'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#00BFFF] border-[#00BFFF] text-black shadow-lg shadow-[#00BFFF]/20'
                : 'bg-[#111111] border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-[#00BFFF] animate-spin" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-[#111111] border border-gray-800 rounded-2xl p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Events Found</h3>
          <p className="text-gray-400 text-sm">Check back later or register an event as Admin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <EventCard
              key={event._id}
              event={event}
              isAdmin={isAdmin}
              onOpenDetails={handleOpenDetails}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteEvent}
              onPublish={handlePublishEvent}
            />
          ))}
        </div>
      )}

      {/* Event Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative">
            {/* Header */}
            <div className="h-14 bg-[#1a1a1a] px-6 border-b border-gray-850 flex items-center justify-between">
              <h3 className="font-bold text-white text-lg">
                {editingEvent ? 'Edit Event Details' : 'Create New Event'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-850"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEvent} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. Hackathon 3.0"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-[#1a1a1a] text-white placeholder-gray-600 border border-gray-800 focus:border-[#00BFFF] outline-none px-4 py-2.5 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  placeholder="Details of the event schedules, topics, venue..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="w-full bg-[#1a1a1a] text-white placeholder-gray-600 border border-gray-800 focus:border-[#00BFFF] outline-none p-4 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Event Date & Time</label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-[#1a1a1a] text-white border border-gray-800 focus:border-[#00BFFF] outline-none px-4 py-2.5 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white border border-gray-800 focus:border-[#00BFFF] outline-none px-4 py-2.5 rounded-lg text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Banner Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="w-full bg-[#1a1a1a] text-gray-400 border border-gray-800 file:bg-gray-850 file:border-none file:text-white file:text-xs file:font-semibold file:px-3 file:py-1 file:rounded-md text-xs cursor-pointer h-[38px] flex items-center px-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white border border-gray-800 focus:border-[#00BFFF] outline-none px-4 py-2.5 rounded-lg text-sm"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Design, Dev, Media"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white placeholder-gray-600 border border-gray-800 focus:border-[#00BFFF] outline-none px-4 py-2.5 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Team Assign Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Assign Squads</label>
                <div className="bg-[#1a1a1a] border border-gray-850 rounded-xl p-4 max-h-36 overflow-y-auto no-scrollbar space-y-2">
                  {teams.map(team => (
                    <label key={team._id} className="flex items-center space-x-3 cursor-pointer text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={selectedTeams.includes(team._id)}
                        onChange={() => handleToggleTeamCheckbox(team._id)}
                        className="rounded text-[#00BFFF] focus:ring-0 outline-none bg-black border-gray-850 h-4 w-4"
                      />
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: team.color }}></span>
                      <span>{team.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-gray-850 pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-transparent hover:bg-gray-850 text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="bg-[#00BFFF] hover:bg-[#00D4FF] text-black font-bold px-5 py-2 rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-center"
                >
                  {modalLoading ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
