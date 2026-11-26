const DB_NAME = 'samadhan_setu_offline_v1';
const STORE_NAME = 'pending_complaints';

export interface OfflineComplaintFile {
  name: string;
  type: string;
  blob: Blob;
}

export interface OfflineComplaintItem {
  localId: string;
  createdAt: string;
  fields: Record<string, string>;
  files: OfflineComplaintFile[];
}

function openOfflineDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'localId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueOfflineComplaint(item: OfflineComplaintItem): Promise<void> {
  const db = await openOfflineDb().catch(() => null);
  if (!db) return;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getPendingComplaints(): Promise<OfflineComplaintItem[]> {
  const db = await openOfflineDb().catch(() => null);
  if (!db) return [];

  const items = await new Promise<OfflineComplaintItem[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve((req.result as OfflineComplaintItem[]) || []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return items;
}

export async function getPendingCount(): Promise<number> {
  const db = await openOfflineDb().catch(() => null);
  if (!db) return 0;

  const count = await new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).count();
    req.onsuccess = () => resolve(req.result || 0);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return count;
}

export async function removePendingComplaint(localId: string): Promise<void> {
  const db = await openOfflineDb().catch(() => null);
  if (!db) return;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(localId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function flushOfflineQueue(): Promise<{
  synced: Array<{ localId: string; publicReference: string }>;
  failed: number;
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: [], failed: 0 };
  }

  const pending = await getPendingComplaints();
  if (pending.length === 0) {
    return { synced: [], failed: 0 };
  }

  const synced: Array<{ localId: string; publicReference: string }> = [];
  let failed = 0;

  for (const item of pending) {
    try {
      const formData = new FormData();
      for (const [k, v] of Object.entries(item.fields)) {
        if (v !== undefined && v !== null && v !== '') {
          formData.append(k, v);
        }
      }
      for (const f of item.files) {
        formData.append('evidence', f.blob, f.name);
      }

      const res = await fetch('/api/public/complaints', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        failed += 1;
        continue;
      }

      const data = await res.json().catch(() => ({}));
      const publicReference = data.publicReference || data.ticket?.publicReference || item.localId;
      await removePendingComplaint(item.localId);
      synced.push({ localId: item.localId, publicReference });
    } catch {
      failed += 1;
    }
  }

  return { synced, failed };
}
