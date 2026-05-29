import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CloudOff, Cloud, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { onSnapshotsInSync } from 'firebase/firestore';

export function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for sync status
    const unsubscribeSync = onSnapshotsInSync(db, () => {
      // This is called when all snapshots are in sync with the server
      setIsSyncing(false);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeSync();
    };
  }, []);

  return (
    <AnimatePresence>
      {(showStatus || !isOnline || isSyncing) && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
            isOnline 
              ? 'bg-emerald-500/90 border-emerald-400 text-white' 
              : 'bg-zinc-900/90 border-zinc-700 text-zinc-100'
          }`}
        >
          {isOnline ? (
            <>
              {isSyncing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-bold">Məlumatlar sinxronizasiya edilir...</span>
                </>
              ) : (
                <>
                  <Wifi className="w-5 h-5" />
                  <span className="text-sm font-bold">İnternet bərpa olundu</span>
                </>
              )}
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-amber-500" />
              <div className="flex flex-col">
                <span className="text-sm font-bold">Oflayn rejim</span>
                <span className="text-[10px] opacity-70">Məlumatlar yerli yaddaşda saxlanılır</span>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
