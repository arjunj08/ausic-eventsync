import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { 
  CalendarRange, 
  Copy, 
  HelpCircle, 
  Loader2, 
  Sparkles, 
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
// Time slots from 8 AM to 10 PM in 2-hour blocks
const TIME_SLOTS = [
  { label: '08:00 AM - 10:00 AM', start: '08:00', end: '10:00' },
  { label: '10:00 AM - 12:00 PM', start: '10:00', end: '12:00' },
  { label: '12:00 PM - 02:00 PM', start: '12:00', end: '14:00' },
  { label: '02:00 PM - 04:00 PM', start: '14:00', end: '16:00' },
  { label: '04:00 PM - 06:00 PM', start: '16:00', end: '18:00' },
  { label: '06:00 PM - 08:00 PM', start: '18:00', end: '20:00' },
  { label: '08:00 PM - 10:00 PM', start: '20:00', end: '22:00' }
];

export default function AvailabilityPlanner() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [weekOf, setWeekOf] = useState('');
  const [availabilitySlots, setAvailabilitySlots] = useState([]); // Array of client-normalized slots
  const [suggestions, setSuggestions] = useState([]);
  
  // Normalized Monday of the current week
  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  useEffect(() => {
    const monday = getMonday(new Date());
    setWeekOf(monday.toISOString().split('T')[0]);
  }, []);

  const fetchPlannerData = async () => {
    if (!weekOf || !user) return;
    setLoading(true);
    try {
      // 1. Fetch current logged-in user availability
      // Check if user is in a team to fetch overlap suggestions
      let teamId = user.teamId;
      if (typeof teamId === 'object' && teamId !== null) {
        teamId = teamId._id || teamId.id;
      }

      const teamQuery = teamId 
        ? axios.get(`/api/availability/team/${teamId}/week/${weekOf}`)
        : Promise.resolve({ data: [] });

      const suggestionsQuery = teamId
        ? axios.get(`/api/availability/best-times/${teamId}`)
        : Promise.resolve({ data: { suggestions: [] } });

      const [teamRes, suggestionsRes] = await Promise.all([
        teamQuery,
        suggestionsQuery
      ]);

      setSuggestions(suggestionsRes.data.suggestions || []);

      // Pull current user's availability out of team list
      const myAvail = teamRes.data.find(av => {
        const avUserId = av.userId._id || av.userId.id || av.userId;
        return String(avUserId) === String(user.id);
      });

      if (myAvail && myAvail.slots) {
        setAvailabilitySlots(myAvail.slots);
      } else {
        // Initialize clean grid if none exists in DB
        const freshSlots = [];
        const currentMonday = getMonday(new Date(weekOf));
        
        DAYS.forEach((day, dIdx) => {
          const date = new Date(currentMonday);
          date.setDate(currentMonday.getDate() + dIdx);
          
          TIME_SLOTS.forEach(time => {
            freshSlots.push({
              date: date.toISOString(),
              startTime: time.start,
              endTime: time.end,
              isAvailable: false
            });
          });
        });
        setAvailabilitySlots(freshSlots);
      }

    } catch (err) {
      console.error(err);
      toast.error('Failed to load availability schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlannerData();
  }, [weekOf, user]);

  // Click slot to toggle availability state and save
  const handleToggleSlot = async (slotIdx) => {
    const updatedSlots = [...availabilitySlots];
    updatedSlots[slotIdx].isAvailable = !updatedSlots[slotIdx].isAvailable;
    setAvailabilitySlots(updatedSlots);

    // Auto save changes instantly
    try {
      await axios.post('/api/availability', {
        weekOf,
        slots: updatedSlots
      });
      // Re-fetch suggestions since stats changed!
      let teamId = user.teamId;
      if (typeof teamId === 'object' && teamId !== null) {
        teamId = teamId._id || teamId.id;
      }
      if (teamId) {
        const suggestionsRes = await axios.get(`/api/availability/best-times/${teamId}`);
        setSuggestions(suggestionsRes.data.suggestions || []);
      }
    } catch (err) {
      console.error('Failed to save slot state:', err);
      toast.error('Connection error. Failed to save availability.');
    }
  };

  const handleCopyLastWeek = async () => {
    const loadingToast = toast.loading('Duplicating last week scheduler...');
    try {
      const prevMonday = new Date(weekOf);
      prevMonday.setDate(prevMonday.getDate() - 7);
      
      let teamId = user.teamId;
      if (typeof teamId === 'object' && teamId !== null) {
        teamId = teamId._id || teamId.id;
      }

      if (!teamId) {
        toast.error('You must belong to a team to copy rosters.', { id: loadingToast });
        return;
      }

      const prevRes = await axios.get(`/api/availability/team/${teamId}/week/${prevMonday.toISOString().split('T')[0]}`);
      const myPrev = prevRes.data.find(av => {
        const avUserId = av.userId._id || av.userId.id || av.userId;
        return String(avUserId) === String(user.id);
      });

      if (!myPrev || !myPrev.slots) {
        toast.error('No previous weekly availability found to copy.', { id: loadingToast });
        return;
      }

      // Map old slots to new week's dates
      const currentMonday = getMonday(new Date(weekOf));
      const copiedSlots = myPrev.slots.map(s => {
        const oldDate = new Date(s.date);
        const dayIdx = (oldDate.getDay() + 6) % 7; // monday is 0
        const newDate = new Date(currentMonday);
        newDate.setDate(currentMonday.getDate() + dayIdx);
        return {
          ...s,
          date: newDate.toISOString(),
          _id: undefined
        };
      });

      setAvailabilitySlots(copiedSlots);
      await axios.post('/api/availability', {
        weekOf,
        slots: copiedSlots
      });
      
      toast.success('Availability template copied successfully! 🎉', { id: loadingToast });
      fetchPlannerData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to duplicate previous planner grid.', { id: loadingToast });
    }
  };

  // Maps slots list into a matrix structure [dayIdx][timeIdx]
  const renderMatrix = () => {
    const matrix = Array(7).fill(null).map(() => Array(TIME_SLOTS.length).fill(null));
    
    availabilitySlots.forEach((slot, idx) => {
      const sDate = new Date(slot.date);
      // Normalized Monday-based index
      const dayIdx = (sDate.getDay() + 6) % 7;
      
      const timeIdx = TIME_SLOTS.findIndex(t => t.start === slot.startTime);
      if (dayIdx >= 0 && dayIdx < 7 && timeIdx >= 0 && timeIdx < TIME_SLOTS.length) {
        matrix[dayIdx][timeIdx] = { ...slot, originalIndex: idx };
      }
    });

    return matrix;
  };

  if (loading && availabilitySlots.length === 0) {
    return (
      <div className="pt-24 flex flex-col justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 text-[#00BFFF] animate-spin mb-4" />
        <span className="text-gray-400 text-sm tracking-wider uppercase font-semibold">Syncing Scheduler...</span>
      </div>
    );
  }

  const matrix = renderMatrix();

  return (
    <div className="pt-20 pb-24 px-4 md:px-8 max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="border-b border-gray-850 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-wider text-white">
            <span className="text-[#00BFFF]">AVAILABILITY</span> PLANNER
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Click time blocks to flag your available coordinates. Green slots indicate availability.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCopyLastWeek}
            className="bg-[#111111] hover:bg-gray-800 text-white font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-xl border border-gray-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Copy className="h-4 w-4" />
            Copy Last Week
          </button>
          
          <input
            type="date"
            value={weekOf}
            onChange={(e) => setWeekOf(e.target.value)}
            className="bg-[#111111] border border-gray-800 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#00BFFF] cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Suggestion Sidebar panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 space-y-4">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Optimal Meeting Windows
            </h2>
            <p className="text-gray-400 text-xs leading-relaxed">
              Based on team schedules submitted, here are the best times when everyone is free:
            </p>

            <div className="space-y-3 mt-4">
              {suggestions.length === 0 ? (
                <div className="text-xs text-gray-500 italic text-center py-6 border border-dashed border-gray-850 rounded-lg">
                  No suggestions calculated yet. Make sure members input schedules!
                </div>
              ) : (
                suggestions.map((sug, idx) => (
                  <div key={idx} className="bg-[#161616] p-4 rounded-xl border border-gray-850 space-y-2 relative overflow-hidden">
                    <span className="absolute top-0 right-0 bg-amber-500/10 border-l border-b border-amber-500/20 text-amber-500 font-black text-[9px] px-2 py-0.5 rounded-bl">
                      Option #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Clock className="h-4 w-4 text-[#00BFFF]" />
                      <span>{sug.label}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium pl-6">{sug.subLabel}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Weekly matrix planner grid */}
        <div className="lg:col-span-2 bg-[#111111] border border-gray-850 rounded-xl p-6 overflow-x-auto">
          
          <div className="min-w-[650px] space-y-4">
            
            {/* Header row */}
            <div className="grid grid-cols-8 gap-2 border-b border-gray-850 pb-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <div>Time Blocks</div>
              {DAYS.map(day => (
                <div key={day}>{day.substring(0, 3)}</div>
              ))}
            </div>

            {/* Time slot grids */}
            {TIME_SLOTS.map((slot, tIdx) => (
              <div key={tIdx} className="grid grid-cols-8 gap-2 items-center">
                
                {/* Time Label column */}
                <div className="text-left text-[10px] font-semibold text-gray-400 py-2 border-r border-gray-850/30 pr-2 leading-tight">
                  {slot.label}
                </div>

                {/* Day grid boxes */}
                {DAYS.map((_, dIdx) => {
                  const item = matrix[dIdx][tIdx];
                  if (!item) return <div key={dIdx} className="h-10 bg-gray-900/10 border border-gray-900 rounded-lg"></div>;

                  return (
                    <button
                      key={dIdx}
                      onClick={() => handleToggleSlot(item.originalIndex)}
                      className={`h-10 border rounded-lg cursor-pointer transition-all flex flex-col justify-center items-center text-[10px] font-bold ${
                        item.isAvailable 
                          ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E] scale-102 hover:bg-[#22C55E]/20 shadow-md shadow-[#22C55E]/5' 
                          : 'bg-[#161616] border-gray-850 text-gray-600 hover:border-gray-700 hover:text-gray-400'
                      }`}
                    >
                      {item.isAvailable ? <CheckCircle className="h-4.5 w-4.5" /> : 'Free'}
                    </button>
                  );
                })}

              </div>
            ))}

          </div>
        </div>

      </div>

    </div>
  );
}
