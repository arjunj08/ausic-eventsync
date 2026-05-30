import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      // Check if user dismissed it recently (within 24 hours)
      const dismissedTime = localStorage.getItem('pwa_install_dismissed_at');
      const now = Date.now();
      if (!dismissedTime || now - Number(dismissedTime) > 24 * 60 * 60 * 1000) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('Thank you for installing AUISC EventSync!');
    }
    
    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_dismissed_at', String(Date.now()));
    setShowBanner(false);
  };

  if (!showBanner || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 bg-[#111111] border border-[#00BFFF]/30 rounded-xl p-4 shadow-[0_-10px_30px_rgba(0,191,255,0.1)] flex items-center justify-between gap-3 max-w-md mx-auto pointer-events-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#00BFFF]/10 border border-[#00BFFF]/20 text-[#00BFFF] rounded-lg">
          <Download className="h-5 w-5" />
        </div>
        <div className="text-left">
          <span className="font-extrabold text-xs text-white uppercase tracking-wider block">
            Install EventSync App
          </span>
          <span className="text-[11px] text-gray-400">
            Access workspace updates instantly, offline, and right from your homescreen.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="bg-[#00BFFF] hover:bg-[#00D4FF] text-black font-extrabold text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
