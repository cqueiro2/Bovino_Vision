import React, { useEffect, useState, useCallback } from 'react';
import { getQueue, removeFromQueue, updateQueueStatus, QueuedAnalysis } from '../services/offlineQueue';
import { analyzeBovineImage } from '../services/gemini';
import { saveAnalysis } from '../services/db';
import { Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SyncManager() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<QueuedAnalysis[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshQueue = useCallback(async () => {
    const items = await getQueue();
    setQueue(items);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleQueueUpdate = () => refreshQueue();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-queue-updated', handleQueueUpdate);

    refreshQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-updated', handleQueueUpdate);
    };
  }, [refreshQueue]);

  const syncItem = async (item: QueuedAnalysis) => {
    try {
      await updateQueueStatus(item.id, 'syncing');
      
      // 1. Analyze
      const base64Data = item.imageData.split(',')[1];
      const analysisResult = await analyzeBovineImage(base64Data);
      
      // 2. Save
      const uniqueId = `bov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const finalResult = {
        ...analysisResult,
        id: uniqueId
      };
      await saveAnalysis(finalResult, item.imageData);
      
      // 3. Remove from queue
      await removeFromQueue(item.id);
      
      // Dispatch event to refresh history
      window.dispatchEvent(new CustomEvent('analysis-saved'));
      
      return true;
    } catch (error) {
      console.error(`Failed to sync item ${item.id}:`, error);
      await updateQueueStatus(item.id, 'failed', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const syncAll = useCallback(async () => {
    if (!isOnline || isSyncing || queue.length === 0) return;
    
    setIsSyncing(true);
    const pendingItems = queue.filter(item => item.status !== 'syncing');
    
    for (const item of pendingItems) {
      await syncItem(item);
    }
    
    setIsSyncing(false);
    refreshQueue();
  }, [isOnline, isSyncing, queue, refreshQueue]);

  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      const timer = setTimeout(() => {
        syncAll();
      }, 5000); // Wait 5 seconds after coming online
      return () => clearTimeout(timer);
    }
  }, [isOnline, queue.length, isSyncing, syncAll]);

  if (queue.length === 0 && isOnline) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
      {queue.length > 0 && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-72 pointer-events-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-gray-900 flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
              Fila de Espera
            </h4>
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full">
              {queue.length} PENDENTE{queue.length > 1 ? 'S' : ''}
            </span>
          </div>
          
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {queue.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
                <img 
                  src={item.imageData} 
                  alt="Pending" 
                  className="w-10 h-10 rounded-lg object-cover grayscale" 
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-gray-500 uppercase truncate">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </p>
                  <div className="flex items-center gap-1">
                    {item.status === 'syncing' ? (
                      <span className="text-[10px] text-blue-600 font-bold animate-pulse">Sincronizando...</span>
                    ) : item.status === 'failed' ? (
                      <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Erro
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-bold">Aguardando conexão</span>
                    )}
                  </div>
                </div>
                {item.status === 'failed' && (
                  <button 
                    onClick={() => syncItem(item)}
                    className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {!isOnline && (
            <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-xl text-[10px] font-bold">
              <CloudOff className="w-3 h-3" />
              VOCÊ ESTÁ OFFLINE
            </div>
          )}
          
          {isOnline && !isSyncing && queue.length > 0 && (
            <button 
              onClick={syncAll}
              className="mt-3 w-full py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Sincronizar Agora
            </button>
          )}
        </div>
      )}

      {/* Connection Status Mini Badge */}
      <div className={`px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border pointer-events-auto ${
        isOnline ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
      }`}>
        {isOnline ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
        <span className="text-[10px] font-black uppercase tracking-widest">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>
  );
}
