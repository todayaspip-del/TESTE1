/**
 * Storage management simulation matching Cloudflare R2 / S3 signed URLs
 */

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

  // If storageKey is a direct HTTP/HTTPS link, open in new tab
  if (material.storageKey && (material.storageKey.startsWith('http://') || material.storageKey.startsWith('https://'))) {
    window.open(material.storageKey, '_blank', 'noopener,noreferrer');
    return;
  }

  // Generate authentic file blob for download
  let mimeType = 'application/octet-stream';
  let fileContent: string | Uint8Array = '';

  switch (type) {
    case 'pdf':
      mimeType = 'application/pdf';
      fileContent = `%PDF-1.4
% Vulcan LMS - Material Oficial Homologado
1 0 obj
<<
  /Title (${material.title})
  /Author (Vulcan LMS - Academia Tática)
  /Subject (Capacitação e Material Complementar de Aula)
  /Creator (Vulcan Training Systems)
>>
endobj
% Documento técnico emitido para: ${material.courseTitle || 'Vulcan LMS'} ${material.lessonTitle ? ` - ${material.lessonTitle}` : ''}
`;
      break;

    case 'docx':
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      fileContent = `Vulcan LMS - Documento de Apoio: ${material.title}\nCurso: ${material.courseTitle || 'Geral'}\nAula: ${material.lessonTitle || 'N/A'}\nData de Homologação: ${new Date().toLocaleDateString('pt-BR')}`;
      break;

    case 'pptx':
      mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      fileContent = `Vulcan LMS - Apresentação de Slides: ${material.title}\nCurso: ${material.courseTitle || 'Geral'}\nAula: ${material.lessonTitle || 'N/A'}`;
      break;

    case 'xlsx':
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileContent = `Título,Curso,Aula,Status\n"${material.title}","${material.courseTitle || ''}","${material.lessonTitle || ''}","Homologado"`;
      break;

    case 'zip':
      mimeType = 'application/zip';
      fileContent = `Vulcan LMS Archive Package: ${material.title}`;
      break;

    default:
      mimeType = 'application/octet-stream';
      fileContent = `Vulcan LMS Material: ${material.title}`;
  }

  const blob = new Blob([fileContent], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
