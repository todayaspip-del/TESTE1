import React, { useState, useRef } from 'react';
import { Lesson, LessonMaterial, Course } from '../../types';
import { useLmsData } from '../../context/LmsDataContext';
import { getFileBadgeColor, formatFileSize, triggerMaterialDownload, uploadMaterialFile } from '../../lib/storage';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  FileText,
  UploadCloud,
  Download,
  Trash2,
  X,
  Plus,
  CheckCircle,
  FileUp,
  Shield,
  Eye,
  Link2,
  Paperclip,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface LessonMaterialManagerModalProps {
  courseId: string;
  courseTitle?: string;
  moduleId?: string;
  moduleTitle?: string;
  lesson: Lesson;
  onClose: () => void;
}

export const LessonMaterialManagerModal: React.FC<LessonMaterialManagerModalProps> = ({
  courseId,
  courseTitle,
  moduleId,
  moduleTitle,
  lesson,
  onClose,
}) => {
  const { courses, addLessonMaterial, deleteLessonMaterial } = useLmsData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find updated lesson from context to ensure real-time reactive state
  const currentCourse = courses.find((c) => c.id === courseId);
  let liveLesson = lesson;
  if (currentCourse) {
    for (const m of currentCourse.modules || []) {
      const found = (m.lessons || []).find((l) => l.id === lesson.id);
      if (found) {
        liveLesson = found;
        break;
      }
    }
  }

  // Upload Form State
  const [materialTitle, setMaterialTitle] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'docx' | 'pptx' | 'xlsx' | 'zip' | 'link'>('pdf');
  const [fileSizeStr, setFileSizeStr] = useState('2.5 MB');
  const [storageKey, setStorageKey] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [visibility, setVisibility] = useState<'STUDENT' | 'INSTRUCTOR_ONLY'>('STUDENT');
  const [isDragOver, setIsDragOver] = useState(false);

  // Confirm Modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [linkUrl, setLinkUrl] = useState('');
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setUploadedFileName(file.name);
    if (!materialTitle) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setMaterialTitle(nameWithoutExt);
    }
    setFileSizeStr(formatFileSize(file.size));
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') setFileType('pdf');
    else if (ext === 'docx' || ext === 'doc') setFileType('docx');
    else if (ext === 'xlsx' || ext === 'xls') setFileType('xlsx');
    else if (ext === 'pptx' || ext === 'ppt') setFileType('pptx');
    else if (ext === 'zip' || ext === 'rar') setFileType('zip');
    else setFileType('pdf');

    const key = `materials/${lesson.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    setStorageKey('');
    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);
    try {
      // Upload the real file bytes to Firebase Storage — this is what makes
      // the downloaded file match the original instead of a truncated/fake one.
      const downloadUrl = await uploadMaterialFile(file, key, setUploadProgress);
      setStorageKey(downloadUrl);
    } catch (err) {
      console.error('Falha no upload do material:', err);
      setUploadError('Falha ao enviar o arquivo. Tente novamente.');
      setUploadedFileName('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialTitle.trim()) {
      alert('Informe o título do material de apoio.');
      return;
    }
    if (isUploading) {
      alert('Aguarde o upload do arquivo terminar antes de anexar.');
      return;
    }
    if (!isLinkMode && !storageKey) {
      alert('Selecione um arquivo para enviar (ou aguarde o upload concluir).');
      return;
    }

    const finalStorageKey = isLinkMode ? (linkUrl || '') : storageKey;

    const newMaterial: LessonMaterial = {
      id: `mat-${Date.now()}`,
      lessonId: lesson.id,
      title: materialTitle.trim(),
      fileType: isLinkMode ? 'link' : fileType,
      storageKey: finalStorageKey,
      fileSize: isLinkMode ? 'Link Externo' : fileSizeStr || '2.0 MB',
      visibility,
      downloadable: true,
      publishedAt: new Date().toISOString(),
    };

    addLessonMaterial(courseId, newMaterial, moduleId, lesson.id);

    // Reset Form
    setMaterialTitle('');
    setUploadedFileName('');
    setStorageKey('');
    setLinkUrl('');
    setFileSizeStr('2.5 MB');
    setSuccessMessage(`Material "${newMaterial.title}" anexado com sucesso à aula!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-none bg-[#0c0b0e] border border-slate-800 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">
              <Paperclip className="w-4 h-4" />
              <span>Gestão de Materiais da Aula</span>
            </div>
            <h2 className="text-lg font-black text-white mt-1">
              {liveLesson.title}
            </h2>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{courseTitle || 'Curso'}</span>
              {moduleTitle && (
                <>
                  <span>•</span>
                  <span>{moduleTitle}</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-none bg-[#121418] hover:bg-slate-800 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMessage && (
          <div className="p-3 rounded-none bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Existing Materials List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-orange-400" />
              <span>Materiais Anexados a Esta Aula ({liveLesson.materials?.length || 0})</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              Visualizados na aba "Materiais de Apoio" do aluno
            </span>
          </div>

          {(!liveLesson.materials || liveLesson.materials.length === 0) ? (
            <div className="p-6 rounded-none bg-[#121418] border border-dashed border-slate-800 text-center space-y-1">
              <p className="text-xs text-slate-400">Nenhum material de apoio anexado a esta aula ainda.</p>
              <p className="text-[11px] text-slate-500">
                Utilize o formulário abaixo para subir apostilas em PDF, manuais técnicos ou planilhas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {liveLesson.materials.map((mat) => {
                const badge = getFileBadgeColor(mat.fileType);
                return (
                  <div
                    key={mat.id}
                    className="p-3.5 rounded-none bg-[#121418] border border-slate-800/90 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`px-2.5 py-1 rounded-none border text-[11px] font-mono font-bold shrink-0 ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{mat.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>{formatFileSize(mat.fileSize)}</span>
                          <span>•</span>
                          <span className={mat.visibility === 'INSTRUCTOR_ONLY' ? 'text-amber-400' : 'text-emerald-400'}>
                            {mat.visibility === 'INSTRUCTOR_ONLY' ? 'Apenas Instrutor' : 'Livre para Alunos'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          triggerMaterialDownload({
                            ...mat,
                            courseTitle,
                            lessonTitle: liveLesson.title,
                          });
                        }}
                        className="p-2 rounded-none bg-[#0c0b0e] hover:bg-orange-600 border border-slate-700 text-white transition cursor-pointer flex items-center justify-center"
                        title="Baixar material"
                      >
                        <Download className="w-3.5 h-3.5 text-orange-400 hover:text-white" />
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: 'Excluir Material',
                            message: `Tem certeza que deseja excluir o material "${mat.title}" desta aula?`,
                            onConfirm: () => {
                              deleteLessonMaterial(mat.id);
                            },
                          });
                        }}
                        className="p-2 rounded-none bg-[#0c0b0e] hover:bg-red-950/70 border border-slate-700 text-slate-400 hover:text-red-400 transition cursor-pointer"
                        title="Remover material"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUploadSubmit} className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-4 h-4" />
              <span>Subir Novo Material de Apoio</span>
            </h3>

            {/* Mode Switch: File vs Link */}
            <div className="flex items-center gap-1 bg-[#121418] p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setIsLinkMode(false)}
                className={`px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                  !isLinkMode ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Arquivo (Upload)
              </button>
              <button
                type="button"
                onClick={() => setIsLinkMode(true)}
                className={`px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                  isLinkMode ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Link Externo / URL
              </button>
            </div>
          </div>

          {!isLinkMode ? (
            /* Drag and Drop Zone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-none text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                isDragOver
                  ? 'border-orange-500 bg-orange-950/20'
                  : uploadedFileName
                  ? 'border-emerald-500/60 bg-emerald-950/20'
                  : 'border-slate-700 bg-[#121418] hover:border-orange-500/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.zip"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <div className="w-10 h-10 rounded-none bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center">
                {isUploading ? (
                  <UploadCloud className="w-5 h-5 animate-pulse" />
                ) : uploadedFileName && storageKey ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <FileUp className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-0.5 w-full">
                <p className="text-xs font-bold text-white">
                  {isUploading ? (
                    <span className="text-orange-400">Enviando {uploadedFileName}... {uploadProgress}%</span>
                  ) : uploadedFileName && storageKey ? (
                    <span className="text-emerald-400">Arquivo Enviado: {uploadedFileName}</span>
                  ) : (
                    'Clique para selecionar ou arraste o arquivo aqui'
                  )}
                </p>
                <p className="text-[10px] text-slate-400">
                  Formatos aceitos: PDF, Apostilas Word (.docx), Slides (.pptx), Planilhas (.xlsx) ou ZIP (Até 50MB)
                </p>
                {uploadError && <p className="text-[10px] text-red-400 font-bold">{uploadError}</p>}
                {isUploading && (
                  <div className="w-full h-1.5 bg-slate-800 mt-1 overflow-hidden">
                    <div
                      className="h-full bg-orange-500 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-white mb-1">
                Link Externo / URL da Norma ou Material *
              </label>
              <input
                type="url"
                required
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://exemplo.com.br/normas/abnt-nbr-14608.pdf"
                className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          )}

          {/* Title & Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white mb-1">
                Título do Material de Apoio *
              </label>
              <input
                type="text"
                required
                value={materialTitle}
                onChange={(e) => setMaterialTitle(e.target.value)}
                placeholder="Ex: Apostila NBR 14608 - Tática Operacional"
                className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1">
                Formato do Documento
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as any)}
                disabled={isLinkMode}
                className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="pdf">Documento PDF (.pdf)</option>
                <option value="docx">Apostila Word (.docx)</option>
                <option value="pptx">Apresentação de Slides (.pptx)</option>
                <option value="xlsx">Planilha de Cálculos (.xlsx)</option>
                <option value="zip">Pacote Compactado (.zip)</option>
                <option value="link">Link / Manual Externo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white mb-1">
                Visibilidade de Acesso
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="STUDENT">Disponível para todos os Alunos (Padrão)</option>
                <option value="INSTRUCTOR_ONLY">Restrito a Instrutores & Avaliadores</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1">
                Tamanho Estimado
              </label>
              <input
                type="text"
                value={fileSizeStr}
                onChange={(e) => setFileSizeStr(e.target.value)}
                placeholder="Ex: 3.5 MB"
                className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-none bg-[#121418] hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-none bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-orange-950/60 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isUploading ? `Enviando... ${uploadProgress}%` : 'Anexar Material à Aula'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
