import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, Users, CheckSquare, ArrowRight, ArrowLeft, Loader2, Info, X } from 'lucide-react';

export default function Map() {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const eventsRes = await axios.get('/api/events');
      const tasksRes = await axios.get('/api/tasks');
      setEvents(eventsRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getEventStats = (eventId) => {
    const eventTasks = tasks.filter(t => {
      const eId = t.eventId?._id || t.eventId;
      return String(eId) === String(eventId);
    });
    
    const total = eventTasks.length;
    const completed = eventTasks.filter(t => t.status === 'done').length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      total,
      completed,
      pct
    };
  };

  const handleOpenDetails = async (id) => {
    try {
      const res = await axios.get(`/api/events/${id}`);
      setSelectedEventDetails(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 text-[#00BFFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24 px-6 max-w-7xl mx-auto pt-20">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">Event Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Timeline & Task Completion Analytics</p>
      </div>

      {events.length === 0 ? (
        <div className="bg-[#111111] border border-gray-800 rounded-2xl p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Active Events</h3>
          <p className="text-gray-400 text-sm font-medium">Create and publish an event to see timelines and progress details.</p>
        </div>
      ) : (
        <>
          {/* Horizontal Scrollable Timeline */}
          <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 md:p-8 mb-8 overflow-hidden">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">Schedules Timeline</h3>
            
            <div className="overflow-x-auto no-scrollbar pb-4">
              <div className="flex items-center min-w-[800px] relative px-4">
                {/* Connecting Line */}
                <div className="absolute top-[26px] left-8 right-8 h-1.5 bg-gray-850 rounded-full z-0"></div>

                {events.map((event, idx) => {
                  const stats = getEventStats(event._id);
                  const isFuture = new Date(event.date) > new Date();
                  
                  return (
                    <div key={event._id} className="flex-1 flex flex-col items-center text-center relative z-10">
                      {/* Timeline Dot */}
                      <button
                        onClick={() => handleOpenDetails(event._id)}
                        className={`h-12 w-12 rounded-full flex items-center justify-center transition-all cursor-pointer border-4 ${
                          isFuture 
                            ? 'bg-[#1a1a1a] border-gray-800 text-gray-400 hover:border-gray-500' 
                            : 'bg-[#00BFFF]/10 border-[#00BFFF] text-[#00BFFF] hover:scale-105 hover:bg-[#00BFFF]/20'
                        }`}
                      >
                        <span className="text-xs font-bold">{idx + 1}</span>
                      </button>

                      {/* Info Panel Below Dot */}
                      <div className="mt-4 max-w-[150px]">
                        <h4 className="text-sm font-bold text-white truncate">{event.title}</h4>
                        <span className="text-[10px] font-semibold text-gray-500 block mt-1">
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        
                        {/* Summary Badges */}
                        <div className="flex items-center justify-center space-x-2 mt-2">
                          <span className="text-[10px] text-gray-400 flex items-center">
                            <Users className="h-3 w-3 mr-0.5" />
                            {event.teamIds?.length || 0}
                          </span>
                          <span className="text-[10px] text-gray-400 flex items-center">
                            <CheckSquare className="h-3 w-3 mr-0.5" />
                            {stats.pct}%
                          </span>
                        </div>

                        {/* Dot Mini Progress Bar */}
                        <div className="w-16 h-1 bg-gray-800 rounded-full mx-auto mt-2 overflow-hidden">
                          <div 
                            className="h-full bg-[#00BFFF] rounded-full" 
                            style={{ width: `${stats.pct}%` }}
                          ></div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Upcoming Event Analytics (2-Column Grid) */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Upcoming Analytics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map(event => {
                const stats = getEventStats(event._id);
                return (
                  <div 
                    key={event._id}
                    className="bg-[#111111] border border-gray-800 rounded-2xl p-6 hover:bg-[#141414] hover:border-gray-700 transition-all shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-[#00BFFF] uppercase tracking-wider bg-[#00BFFF]/10 border border-[#00BFFF]/25 px-2.5 py-1 rounded-md">
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-xs text-gray-500 font-medium flex items-center">
                          <Users className="h-3.5 w-3.5 mr-1" />
                          {event.teamIds?.length || 0} Squads
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2">{event.title}</h3>
                      
                      {/* Description preview */}
                      <p className="text-gray-400 text-xs leading-normal line-clamp-2 mb-6">
                        {event.description}
                      </p>
                    </div>

                    {/* Progress Bar Info */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
                        <span>Task Completion</span>
                        <span className="text-[#00BFFF]">{stats.pct}% ({stats.completed}/{stats.total} Tasks)</span>
                      </div>
                      
                      {/* Big Blue Progress Bar */}
                      <div className="w-full h-2.5 bg-gray-850 rounded-full overflow-hidden mb-4 border border-gray-800">
                        <div 
                          className="h-full bg-[#00BFFF] rounded-full transition-all duration-500" 
                          style={{ width: `${stats.pct}%` }}
                        ></div>
                      </div>

                      <button
                        onClick={() => handleOpenDetails(event._id)}
                        className="w-full h-10 bg-[#161616] hover:bg-[#202020] border border-gray-800 hover:border-gray-700 text-xs font-semibold text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                      >
                        Open Breakdown
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Details Breakdown Drawer / Modal */}
      {selectedEventDetails && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Header */}
            <div className="h-14 bg-[#1a1a1a] px-6 border-b border-gray-850 flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center">
                <Info className="h-5 w-5 text-[#00BFFF] mr-2" />
                Event Breakdown: {selectedEventDetails.event.title}
              </h3>
              <button 
                onClick={() => setSelectedEventDetails(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-850"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
              
              {/* Squad breakdowns */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Assigned Squads</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedEventDetails.teams.length === 0 ? (
                    <p className="text-gray-500 text-xs italic col-span-2">No squads assigned.</p>
                  ) : (
                    selectedEventDetails.teams.map(team => (
                      <div key={team._id} className="bg-[#1a1a1a] border border-gray-850 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: team.color }}></span>
                          <span className="font-bold text-white text-sm">{team.name}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {team.memberIds.map(m => (
                            <span key={m._id} className="text-[10px] bg-[#222] border border-gray-850 text-gray-300 px-2 py-0.5 rounded-full">
                              {m.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Tasks Summary */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Task Lists</h4>
                {tasks.filter(t => {
                  const eId = t.eventId?._id || t.eventId;
                  return String(eId) === String(selectedEventDetails.event._id);
                }).length === 0 ? (
                  <p className="text-gray-500 text-xs italic">No tasks created for this event yet.</p>
                ) : (
                  <div className="space-y-2">
                    {tasks
                      .filter(t => {
                        const eId = t.eventId?._id || t.eventId;
                        return String(eId) === String(selectedEventDetails.event._id);
                      })
                      .map(t => (
                        <div 
                          key={t._id}
                          className="bg-[#1a1a1a] border border-gray-850 rounded-xl p-3 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className={`font-bold text-white ${t.status === 'done' ? 'line-through text-gray-600' : ''}`}>{t.title}</span>
                            <span className="block text-[10px] text-gray-500 mt-0.5">{t.teamId?.name}</span>
                          </div>
                          
                          <span className={`font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider text-[9px] ${
                            t.status === 'done' 
                              ? 'bg-green-500/10 text-green-500 border border-green-500/30' 
                              : t.status === 'in_progress'
                              ? 'bg-cyan-500/10 text-[#00BFFF] border border-cyan-500/30'
                              : 'bg-gray-800 text-gray-400 border border-gray-700'
                          }`}>
                            {t.status}
                          </span>

                        </div>
                      ))}
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="h-14 bg-[#1a1a1a] border-t border-gray-850 px-6 flex items-center justify-end">
              <button
                onClick={() => setSelectedEventDetails(null)}
                className="bg-transparent hover:bg-gray-850 text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
