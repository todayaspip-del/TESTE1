/**
 * Client-side High-Capacity Binary Storage (IndexedDB).
 * Capable of storing large files (100MB+) with 0 network latency,
 * zero Firestore quota consumption, and instant retrieval.
 */

const DB_NAME = 'VulcanLmsMaterialsDb';
const DB_VERSION = 1;
const STORE_NAME = 'materials';

interface StoredFileRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  createdAt: number;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB não suportado neste navegador.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Erro ao abrir IndexedDB'));
  });
}

/**
 * Saves a file directly to the client IndexedDB store
 */
export async function saveFileToIndexedDb(file: File | Blob, fileId: string, fileName: string, fileType: string): Promise<string> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const record: StoredFileRecord = {
        id: fileId,
        name: fileName,
        type: fileType || file.type || 'application/octet-stream',
        size: file.size,
        blob: file,
        createdAt: Date.now(),
      };

      const putRequest = store.put(record);

      putRequest.onsuccess = () => {
        resolve(`idb://materials/${fileId}`);
      };

      putRequest.onerror = () => {
        reject(putRequest.error || new Error('Erro ao salvar no IndexedDB'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    } catch (err) {
      db.close();
      reject(err);
    }
  });
}

/**
 * Gets a file Blob from IndexedDB by fileId
 */
export async function getFileFromIndexedDb(fileId: string): Promise<{ blob: Blob; name: string; type: string } | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(fileId);

      getRequest.onsuccess = () => {
        const record = getRequest.result as StoredFileRecord | undefined;
        if (record && record.blob) {
          resolve({
            blob: record.blob,
            name: record.name,
            type: record.type,
          });
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error || new Error('Erro ao ler do IndexedDB'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    } catch (err) {
      db.close();
      reject(err);
    }
  });
}
