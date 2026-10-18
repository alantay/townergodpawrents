// Keeps the draft's shrunk photos in IndexedDB, so a reload or iOS killing
// the tab doesn't lose them. Words live in localStorage; blobs are too big.
// Every call fails quietly: no IndexedDB just means photos don't come back.
const DB = "tgp-admin";
const STORE = "photos";
const KEY = "draft";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest): Promise<unknown> {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const req = work(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function savePhotos(photos: Blob[]): Promise<void> {
  try {
    await run("readwrite", (s) => (photos.length ? s.put(photos, KEY) : s.delete(KEY)));
  } catch {}
}

export async function loadPhotos(): Promise<Blob[]> {
  try {
    const found = await run("readonly", (s) => s.get(KEY));
    return Array.isArray(found) ? found.filter((b): b is Blob => b instanceof Blob) : [];
  } catch {
    return [];
  }
}
