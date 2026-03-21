/**
 * Service to manage the offline queue of bovine analyses.
 * Uses IndexedDB to store images and metadata when the user is offline.
 */

export interface QueuedAnalysis {
  id: string;
  imageData: string;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

const DB_NAME = 'BovinoVisionOffline';
const STORE_NAME = 'pending_analyses';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addToQueue(imageData: string): Promise<string> {
  const db = await openDB();
  const id = `queued-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const item: QueuedAnalysis = {
    id,
    imageData,
    timestamp: Date.now(),
    status: 'pending'
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(item);
    request.onsuccess = () => {
      window.dispatchEvent(new CustomEvent('offline-queue-updated'));
      resolve(id);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getQueue(): Promise<QueuedAnalysis[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removeFromQueue(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => {
      window.dispatchEvent(new CustomEvent('offline-queue-updated'));
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function updateQueueStatus(id: string, status: QueuedAnalysis['status'], error?: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const item = getRequest.result as QueuedAnalysis;
      if (item) {
        item.status = status;
        if (error) item.error = error;
        store.put(item).onsuccess = () => {
          window.dispatchEvent(new CustomEvent('offline-queue-updated'));
          resolve();
        };
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}
