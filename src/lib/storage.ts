/**
 * Storage management — real uploads/downloads via Firebase Storage.
 */

import { storage } from '../firebase';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  type UploadTaskSnapshot,
} from 'firebase/storage';

/**
 * Uploads the real File selected by the admin/instructor to Firebase Storage
 * and resolves with its public download URL. This is what fixes the
 * "file arrives corrupted / truncated" bug: previously the app never sent
 * the actual bytes anywhere — it only remembered the file's name/size and,
 * at download time, generated a small fake placeholder file instead of the
 * original. Now the original bytes are stored and served back untouched.
 */
export function uploadMaterialFile(
  file: File,
  storageKey: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileRef = ref(storage, storageKey);
    const task = uploadBytesResumable(fileRef, file, {
      contentType: file.type || undefined,
    });

    task.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        if (onProgress) {
          const percent = snapshot.totalBytes
            ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            : 0;
          onProgress(percent);
        }
      },
      (error) => reject(error),
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

export function triggerMaterialDownload(material: {
  id?: string;
  title: string;
  fileType?: string;
  storageKey?: string;
  courseTitle?: string;
  lessonTitle?: string;
}): void {
  const type = (material.fileType || 'pdf').toLowerCase();
  const cleanTitle = material.title.replace(/[/\\?%*:|"<>]/g, '_').trim();
  const fileName = `${cleanTitle}.${type}`;

  // Real uploaded files (Firebase Storage URLs) and external links both use
  // a direct HTTP/HTTPS link — fetch the actual bytes and save them as-is,
  // so the downloaded file is byte-for-byte identical to what was uploaded.
  if (material.storageKey && (material.storageKey.startsWith('http://') || material.storageKey.startsWith('https://'))) {
    fetch(material.storageKey)
      .then((res) => {
        if (!res.ok) throw new Error(`Falha ao baixar arquivo (status ${res.status})`);
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      })
      .catch(() => {
        // Fallback: if the fetch fails (e.g. CORS on an external link that
        // isn't ours), just open it in a new tab so the user can still get it.
        window.open(material.storageKey, '_blank', 'noopener,noreferrer');
      });
    return;
  }

  // Legacy fallback: materials created before this fix (or with no real file
  // attached) don't have actual stored bytes. Warn instead of silently
  // handing out a fake/corrupted file.
  alert(
    `Não foi possível localizar o arquivo original de "${material.title}". Peça ao instrutor para reenviar este material.`
  );
}

export function formatFileSize(bytesOrStr?: string | number): string {
  if (!bytesOrStr) return '1.2 MB';
  if (typeof bytesOrStr === 'string') return bytesOrStr;
  const i = Math.floor(Math.log(bytesOrStr) / Math.log(1024));
  return `${(bytesOrStr / Math.pow(1024, i)).toFixed(1)} ${['B', 'KB', 'MB', 'GB', 'TB'][i]}`;
}

export function getFileBadgeColor(fileType: string): { bg: string; text: string; label: string } {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', label: 'PDF' };
    case 'docx':
    case 'doc':
      return { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', label: 'DOCX' };
    case 'pptx':
    case 'ppt':
      return { bg: 'bg-orange-500/10 border-orange-500/30', text: 'text-orange-400', label: 'SLIDES' };
    case 'xlsx':
    case 'xls':
      return { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', label: 'PLANILHA' };
    case 'zip':
    case 'rar':
      return { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', label: 'ZIP' };
    default:
      return { bg: 'bg-orange-500/10 border-orange-500/30', text: 'text-orange-400', label: 'MATERIAL' };
  }
}
