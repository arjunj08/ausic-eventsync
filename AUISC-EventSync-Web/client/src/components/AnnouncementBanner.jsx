import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function AnnouncementBanner() {
  const [banners, setBanners] = useState([]);

  const fetchBanners = async () => {
    try {
      const res = await axios.get('/api/announcements/active');
      setBanners(res.data);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    }
  };

  useEffect(() => {
    fetchBanners();

    // Check periodically for new announcements every 2 minutes
    const interval = setInterval(fetchBanners, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = async (id) => {
    try {
      await axios.patch(`/api/announcements/${id}/dismiss`);
      setBanners(banners.filter(b => b._id !== id));
    } catch (err) {
      console.error('Dismiss announcement error:', err);
    }
  };

  if (banners.length === 0) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-35 flex flex-col gap-2 p-2 max-w-4xl mx-auto pointer-events-none">
      {banners.map((banner) => {
        let typeStyles = 'bg-blue-900/90 border-blue-500/50 text-blue-200';
        let Icon = Info;

        if (banner.type === 'warning') {
          typeStyles = 'bg-amber-950/90 border-amber-500/50 text-amber-200';
          Icon = AlertTriangle;
        } else if (banner.type === 'urgent') {
          typeStyles = 'bg-red-950/90 border-red-500/50 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse';
          Icon = AlertCircle;
        }

        return (
          <div
            key={banner._id}
            className={`pointer-events-auto flex items-center justify-between px-4 py-3 rounded-xl border backdrop-blur-md transition-all duration-300 ${typeStyles}`}
          >
            <div className="flex items-center gap-3 pr-4">
              <Icon className="h-5 w-5 flex-shrink-0" />
              <div className="text-left">
                <span className="font-extrabold text-xs uppercase tracking-wider block mb-0.5">
                  {banner.title}
                </span>
                <span className="text-xs leading-normal font-medium">
                  {banner.message}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => handleDismiss(banner._id)}
              className="p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-current/70 hover:text-current"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
