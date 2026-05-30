import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Calendar, 
  MapPin, 
  Share2, 
  Check, 
  Loader2, 
  AlertCircle,
  Clock,
  Tag,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PublicEvent() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // RSVP Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submittingRsvp, setSubmittingRsvp] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  useEffect(() => {
    const fetchPublicEvent = async () => {
      try {
        setLoading(true);
        // Note: Call public endpoint (No credentials or auth headers needed)
        const res = await axios.get(`/api/events/public/${eventId}`);
        setEvent(res.data.event);
        setRsvpCount(res.data.rsvpCount);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch event details.');
      } finally {
        setLoading(false);
      }
    };
    fetchPublicEvent();
  }, [eventId]);

  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Please enter both name and email.');
      return;
    }

    setSubmittingRsvp(true);
    try {
      const res = await axios.post(`/api/events/${event._id}/rsvp`, { name, email });
      setRsvpSuccess(true);
      setRsvpCount(res.data.rsvpCount);
      toast.success('RSVP submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit RSVP.');
    } finally {
      setSubmittingRsvp(false);
    }
  };

  const handleShare = (platform) => {
    const shareUrl = window.location.href;
    const text = `Join us at "${event?.title}"! Details: `;
    
    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + shareUrl)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Event link copied to clipboard!');
    } else if (platform === 'instagram') {
      // Instagram doesn't support direct link sharing API, but we can instruct the user
      toast.info('Share the copied link on your Instagram Story!');
      navigator.clipboard.writeText(shareUrl);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#00BFFF] animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="bg-[#111111] border border-gray-850 p-8 rounded-2xl max-w-md w-full text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Event Not Found</h2>
          <p className="text-gray-400 text-sm">{error || 'This event may be draft, deleted, or does not exist.'}</p>
        </div>
      </div>
    );
  }

  // Formatting date
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Standalone Brand Header */}
      <header className="border-b border-gray-850 bg-[#111111] py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-[#00BFFF] font-extrabold text-xl tracking-wider">⚡ AUISC</span>
          <span className="text-gray-300 font-medium text-sm border-l border-gray-800 pl-2">EventSync</span>
        </div>
        <a 
          href="/login" 
          className="text-xs font-semibold text-gray-400 hover:text-white bg-[#1A1A1A] border border-gray-800 px-3 py-1.5 rounded-lg transition-all"
        >
          Sign In
        </a>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left/Middle: Event Info Panel */}
        <div className="md:col-span-2 space-y-6">
          {/* Banner Container */}
          <div className="relative h-64 md:h-80 bg-gradient-to-br from-purple-900/40 via-black to-[#00BFFF]/10 border border-gray-850 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"></div>
            <div className="relative text-center p-6 space-y-3 z-10">
              <span className="px-3.5 py-1 bg-[#00BFFF]/10 border border-[#00BFFF]/30 text-[#00BFFF] text-xs font-extrabold rounded-full uppercase tracking-wider">
                {event.category || 'Event'}
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
                {event.title}
              </h1>
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-300">
                <Users className="h-4.5 w-4.5 text-[#00BFFF]" />
                <span>{rsvpCount} People attending</span>
              </div>
            </div>
            {/* Glowing accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00BFFF]/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
          </div>

          {/* Details Card */}
          <div className="bg-[#111111] p-6 rounded-2xl border border-gray-850 space-y-5">
            <h2 className="text-lg font-bold text-white border-b border-gray-850 pb-3">Event Details</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-[#00BFFF] mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Date</span>
                  <span>{formattedDate}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-purple-400 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Time</span>
                  <span>{formattedTime}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-emerald-400 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Venue</span>
                  <span>{event.location || 'Anurag University Campus'}</span>
                </div>
              </div>

              {event.tags && event.tags.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Tags</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {event.tags.map((tag, idx) => (
                        <span key={idx} className="bg-gray-850 text-gray-300 text-[10px] px-2 py-0.5 rounded-md font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="border-t border-gray-850 pt-5">
              <h3 className="font-bold text-white mb-2">Description</h3>
              <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                {event.description || 'No detailed description provided for this event.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: RSVP Form & Share Options */}
        <div className="space-y-6">
          {/* RSVP Card */}
          <div className="bg-[#111111] p-6 rounded-2xl border border-gray-850 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00BFFF] to-transparent"></div>
            
            {rsvpSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="inline-flex h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 items-center justify-center mx-auto">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">You're Registered!</h3>
                <p className="text-xs text-gray-400 leading-normal">
                  Your RSVP has been confirmed. We've added you to the list! Get ready for an amazing experience.
                </p>
                <button
                  onClick={() => setRsvpSuccess(false)}
                  className="text-xs text-[#00BFFF] hover:underline transition-all cursor-pointer font-bold"
                >
                  Change RSVP name/email
                </button>
              </div>
            ) : (
              <form onSubmit={handleRsvpSubmit} className="space-y-4">
                <h3 className="text-base font-bold text-white">Join the Guestlist</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                  Submit your details below to RSVP instantly. Open to all students.
                </p>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-[#00BFFF] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="student@anurag.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-[#00BFFF] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingRsvp}
                  className="w-full bg-[#00BFFF] hover:bg-[#00D4FF] disabled:bg-gray-800 text-black text-xs font-extrabold py-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {submittingRsvp ? (
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                  ) : (
                    'Claim My RSVP Pass'
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Social Share Card */}
          <div className="bg-[#111111] p-6 rounded-2xl border border-gray-850 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Share2 className="h-4 w-4 text-purple-400" />
              Spread the word
            </h4>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => handleShare('whatsapp')}
                className="bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-black border border-[#25D366]/20 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Share on WhatsApp
              </button>
              <button
                onClick={() => handleShare('instagram')}
                className="bg-[#E1306C]/10 hover:bg-[#E1306C] text-[#E1306C] hover:text-black border border-[#E1306C]/20 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Copy Link for Instagram
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="bg-[#2A2A2A] hover:bg-gray-750 text-gray-300 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Copy URL Link
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* Public Footer */}
      <footer className="border-t border-gray-850 py-6 text-center text-xs text-gray-500 mt-12 bg-[#0a0a0a]">
        &copy; {new Date().getFullYear()} Anurag University Indian Society Cell. Powered by EventSync.
      </footer>
    </div>
  );
}
