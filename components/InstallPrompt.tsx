import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const handler = () => setVisible(false);
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">R</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-50">Install RAPS</p>
          <p className="text-xs text-slate-400 truncate">Akses lebih cepat dari homescreen</p>
        </div>
        <button
          onClick={handleInstall}
          className="flex-shrink-0 flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          <Download size={13} />
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Tutup"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
