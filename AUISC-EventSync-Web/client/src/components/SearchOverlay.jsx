import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Search, 
  Calendar, 
  CheckSquare, 
  User, 
  Video, 
  DollarSign, 
  X, 
  Clock, 
  History 
} from 'lucide-react';

export default function SearchOverlay({ isOpen, onClose, setActiveTab }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ events: [], tasks: [], members: [], meetings: [], expenses: [] });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  
  const inputRef = useRef(null);

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {}
    }
  }, [isOpen]);

  // Handle Ctrl+K shortcut and ESC keys
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  // Debounced search logic (300ms)
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({ events: [], tasks: [], members: [], meetings: [], expenses: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  // Add a search phrase to recent searches
  const saveRecentSearch = (term) => {
    if (!term.trim()) return;
    const updated = [term.trim(), ...recentSearches.filter(s => s !== term.trim())].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  // Handle clicking a search result item
  const handleItemClick = (tabId, term = '') => {
    if (term) saveRecentSearch(term);
    setActiveTab(tabId);
    onClose();
  };

  const hasResults = 
    results.events.length > 0 || 
    results.tasks.length > 0 || 
    results.members.length > 0 || 
    results.meetings.length > 0 || 
    results.expenses.length > 0;

  return (
    <div className="fixed inset-0 bg-[#0a0a0ade]/95 backdrop-blur-md z-50 flex items-start justify-center pt-24 px-4">
      {/* Click Outside to Close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose}></div>

      {/* Main Spotlight Container */}
      <div className="bg-[#111111] border border-gray-850 w-full max-w-2xl rounded-xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[70vh]">
        
        {/* Input area */}
        <div className="p-4 border-b border-gray-850 flex items-center gap-3">
          <Search className="h-5 w-5 text-gray-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search events, tasks, members, meetings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-white text-md border-0 focus:ring-0 focus:outline-none placeholder-gray-600"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 text-gray-500 hover:text-white rounded-full hover:bg-gray-850"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <span className="text-[10px] bg-gray-850 text-gray-450 border border-gray-800 px-2 py-1 rounded font-mono shrink-0">
            ESC
          </span>
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {loading && (
            <div className="py-12 flex justify-center items-center">
              <span className="h-6 w-6 border-2 border-[#00BFFF] border-t-transparent rounded-full animate-spin"></span>
            </div>
          )}

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-gray-550 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Recent Queries
              </h4>
              <div className="space-y-1">
                {recentSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(term)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-gray-850/50 text-xs font-semibold text-gray-300 flex items-center gap-2 transition-all"
                  >
                    <History className="h-4 w-4 text-gray-500" />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestive state (initial open) */}
          {!query && recentSearches.length === 0 && (
            <div className="py-12 text-center text-gray-500 text-xs">
              <Search className="h-8 w-8 text-gray-650 mx-auto mb-2" />
              Start typing to search EventSync workspace resources...
            </div>
          )}

          {/* Grouped Query Results */}
          {query && !loading && (
            <>
              {/* Event Matches */}
              {results.events.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-[#00BFFF] uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Event Matches
                  </h4>
                  <div className="space-y-1">
                    {results.events.map(ev => (
                      <button
                        key={ev._id}
                        onClick={() => handleItemClick('events', query)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-850 text-sm font-semibold text-white flex justify-between items-center transition-all border border-transparent hover:border-gray-800"
                      >
                        <span className="truncate">{ev.title}</span>
                        <span className="text-[10px] text-gray-500 shrink-0">{new Date(ev.date).toLocaleDateString()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Task Matches */}
              {results.tasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckSquare className="h-3.5 w-3.5" />
                    Task Matches
                  </h4>
                  <div className="space-y-1">
                    {results.tasks.map(t => (
                      <button
                        key={t._id}
                        onClick={() => handleItemClick('kanban', query)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-850 text-sm font-semibold text-white flex justify-between items-center transition-all border border-transparent hover:border-gray-800"
                      >
                        <div className="truncate">
                          <div>{t.title}</div>
                          <span className="text-[10px] text-gray-500 font-normal truncate block mt-0.5">{t.description}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold shrink-0 text-white" style={{ backgroundColor: t.teamId?.color || '#333' }}>
                          {t.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Member Matches */}
              {results.members.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Squad Members
                  </h4>
                  <div className="space-y-1">
                    {results.members.map(m => (
                      <button
                        key={m._id || m.id}
                        onClick={() => handleItemClick('profile', query)}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-gray-850 text-sm font-semibold text-white flex items-center justify-between transition-all border border-transparent hover:border-gray-800"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <img 
                            src={m.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${m.name}`}
                            alt="avatar"
                            className="h-6 w-6 rounded-full shrink-0"
                          />
                          <span className="truncate">{m.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-normal shrink-0">{m.role.toUpperCase()} / {m.subRole.toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Meeting Matches */}
              {results.meetings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5" />
                    Meetings
                  </h4>
                  <div className="space-y-1">
                    {results.meetings.map(meet => (
                      <button
                        key={meet._id}
                        onClick={() => handleItemClick('meetings', query)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-850 text-sm font-semibold text-white flex justify-between items-center transition-all border border-transparent hover:border-gray-800"
                      >
                        <div className="truncate">
                          <div>{meet.title}</div>
                          <span className="text-[10px] text-gray-500 font-normal shrink-0 uppercase">{meet.platform} • {meet.status}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 shrink-0">{new Date(meet.scheduledAt).toLocaleDateString()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Expense Matches */}
              {results.expenses.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" />
                    Expenses
                  </h4>
                  <div className="space-y-1">
                    {results.expenses.map(exp => (
                      <button
                        key={exp._id}
                        onClick={() => handleItemClick('expenses', query)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-850 text-sm font-semibold text-white flex justify-between items-center transition-all border border-transparent hover:border-gray-800"
                      >
                        <div className="truncate">
                          <div>{exp.itemDescription}</div>
                          <span className="text-[10px] text-gray-500 font-normal shrink-0">By {exp.submittedBy?.name || 'Unknown'}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-white text-xs font-bold">₹{exp.amount}</div>
                          <span className={`text-[9px] font-bold uppercase ${
                            exp.status === 'approved' ? 'text-emerald-400' : exp.status === 'rejected' ? 'text-red-400' : 'text-gray-400'
                          }`}>{exp.status}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!hasResults && (
                <div className="py-12 text-center text-gray-650 text-xs">
                  No matching records found. Try another query.
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
