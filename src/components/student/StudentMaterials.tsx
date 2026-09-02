import React, { useState, useRef } from 'react';
import { useLmsData } from '../../context/LmsDataContext';
import { useAuth } from '../../context/AuthContext';
import { LessonMaterial } from '../../types';
import { getFileBadgeColor, formatFileSize, triggerMaterialDownload, uploadMaterialFile } from '../../lib/storage';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  FolderDown,
  Download,
  Search,
  FileText,
  Shield,
  Filter,
  Plus,
  Trash2,
  X,
  UploadCloud,
  CheckCircle,
  FileUp,
  Sparkles,
} from 'lucide-react';

export const StudentMaterials: React.FC = () => {
  const { courses, addLessonMaterial, deleteLessonMaterial } = useLmsData();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PDF' | 'DOCX' | 'XLSX'>('ALL');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

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

  const isAdmin = currentUser && ['ADMIN', 'SUPER_ADMIN', 'INSTRUCTOR'].includes(currentUser.role);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload Form State
  const [targetCourseId, setTargetCourseId] = useState<string>(courses[0]?.id || '');
  const [targetLessonId, setTargetLessonId] = useState<string>('');
  const [materialTitle, setMaterialTitle] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'docx' | 'pptx' | 'xlsx' | 'zip'>('pdf');
  const [fileSizeStr, setFileSizeStr] = useState('3.8 MB');
  const [storageKey, setStorageKey] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [visibility, setVisibility] = useState<'STUDENT' | 'INSTRUCTOR_ONLY'>('STUDENT');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const selectedTargetCourse = courses.find((c) => c.id === targetCourseId);
  const targetCourseLessons: Array<{ id: string; title: string; moduleTitle: string }> = [];
  if (selectedTargetCourse) {
    (selectedTargetCourse.modules || []).forEach((m) => {
      (m.lessons || []).forEach((l) => {
        targetCourseLessons.push({
          id: l.id,
          title: l.title,
          moduleTitle: m.title,
        });
      });
    });
  }

  const handleFileSelect = async (file: File) => {
    setUploadedFileName(file.name);
    if (!materialTitle) {
      // Remove extension for default title
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

    const key = `uploads/materials/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    setStorageKey('');
    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);
    try {
      // Upload the real file bytes — fixes downloads arriving corrupted/truncated.
      const downloadUrl = await uploadMaterialFile(file, key, setUploadProgress);
      setStorageKey(downloadUrl);
    } catch (err: any) {
      console.error('Falha no upload do material:', err);
      setUploadError(err?.message || 'Falha ao enviar o arquivo. Tente novamente.');
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
    if (!targetCourseId) {
      alert('Por favor, selecione um curso.');
      return;
    }
    if (!materialTitle.trim()) {
      alert('Por favor, informe o título da apostila ou material.');
      return;
    }
    if (isUploading) {
      alert('Aguarde o upload do arquivo terminar antes de publicar.');
      return;
    }
    if (!storageKey) {
      alert('Selecione um arquivo para enviar (ou aguarde o upload concluir).');
      return;
    }

    const newMaterial: LessonMaterial = {
      id: `mat-${Date.now()}`,
      lessonId: targetLessonId || `les-${Date.now()}`,
      title: materialTitle.trim(),
      fileType,
      storageKey,
      fileSize: fileSizeStr || '2.5 MB',
      visibility,
      downloadable: true,
      publishedAt: new Date().toISOString(),
    };

    addLessonMaterial(targetCourseId, newMaterial, undefined, targetLessonId || undefined);

    // Reset Form
    setIsUploadModalOpen(false);
    setMaterialTitle('');
    setUploadedFileName('');
    setStorageKey('');
    setTargetLessonId('');
    setFileSizeStr('3.8 MB');
  };

  // Collect all materials from all courses/lessons
  const allMaterials: Array<{
    id: string;
    title: string;
    fileType: string;
    storageKey: string;
    fileSize?: string;
    visibility: string;
    courseId: string;
    courseTitle: string;
    lessonTitle: string;
  }> = [];

  courses.forEach((c) => {
    (c.modules || []).forEach((m) => {
      (m.lessons || []).forEach((l) => {
        (l.materials || []).forEach((mat) => {
          allMaterials.push({
            ...mat,
            courseId: c.id,
            courseTitle: c.title,
            lessonTitle: l.title,
          });
        });
      });
    });
  });

  const filtered = allMaterials.filter((m) => {
    // Check role visibility
    if (m.visibility === 'INSTRUCTOR_ONLY' && currentUser?.role === 'STUDENT') {
      return false;
    }
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.lessonTitle && m.lessonTitle.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === 'PDF') return m.fileType.toLowerCase() === 'pdf';
    if (selectedFilter === 'DOCX') return m.fileType.toLowerCase() === 'docx';
    if (selectedFilter === 'XLSX') return m.fileType.toLowerCase() === 'xlsx';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
            <FolderDown className="w-4 h-4 text-orange-400" />
            <span>Biblioteca Digital de Salvamento & Prevenção</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Apostilas Oficiais, Normas NBR e Manuais de Campo
          </h1>
          <p className="text-xs text-slate-300">
            Documentos e apostilas homologadas para consulta em treinamentos de Bombeiro Civil, Brigada e APH.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              if (courses.length > 0 && !targetCourseId) {
                setTargetCourseId(courses[0].id);
              }
              setIsUploadModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-950/60 transition cursor-pointer shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Subir Apostila / PDF</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por apostila, norma (ex: NBR 14608), APH, extintor..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#121418] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#121418] border border-slate-800 p-1 rounded-lg">
          {(['ALL', 'PDF', 'DOCX', 'XLSX'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                selectedFilter === filter
                  ? 'bg-orange-600 text-white font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {filter === 'ALL' ? 'Todos' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 p-12 text-center bg-[#121418] border border-slate-800 rounded-xl space-y-3">
            <FolderDown className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Nenhum documento encontrado</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Todas as apostilas e PDFs adicionados pela coordenação ficarão disponíveis para download aqui.
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-bold transition cursor-pointer"
              >
                + Subir Primeira Apostila
              </button>
            )}
          </div>
        ) : (
          filtered.map((mat) => {
            const badge = getFileBadgeColor(mat.fileType);

            return (
              <div
                key={mat.id}
                className="p-5 rounded-xl bg-[#121418] border border-slate-800 hover:border-orange-500/50 transition flex flex-col justify-between gap-4 shadow-sm"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded border text-[10px] font-mono font-bold ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                      {mat.visibility === 'INSTRUCTOR_ONLY' && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                          Instrutores
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatFileSize(mat.fileSize)}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-white leading-snug">
                    {mat.title}
                  </h3>

                  <div className="text-[11px] text-slate-300">
                    <span className="text-slate-400">Curso: </span>
                    <span className="text-orange-300 font-medium">{mat.courseTitle}</span>
                    {mat.lessonTitle && (
                      <span className="text-slate-400"> • {mat.lessonTitle}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Cloud Storage Criptografado
                  </span>

                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: 'Excluir Material',
                            message: `Tem certeza que deseja excluir o material "${mat.title}"?`,
                            onConfirm: () => {
                              deleteLessonMaterial(mat.id);
                            },
                          });
                        }}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-600/60 text-slate-400 hover:text-red-400 transition cursor-pointer"
                        title="Excluir Material"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => triggerMaterialDownload(mat)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#181c26] hover:bg-orange-600 border border-slate-700 hover:border-orange-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-orange-400" />
                      <span>Baixar {(mat.fileType || 'PDF').toUpperCase()}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Admin Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-xl bg-[#0e1017] border border-slate-800 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Painel de Materiais do Admin</span>
                </div>
                <h2 className="text-xl font-black text-white">Subir Nova Apostila / PDF</h2>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 rounded-lg bg-[#141822] hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-5">
              {/* Target Course & Optional Lesson */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Curso de Destino *</label>
                  <select
                    value={targetCourseId}
                    onChange={(e) => {
                      setTargetCourseId(e.target.value);
                      setTargetLessonId('');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#141822] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                    required
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.code || 'VULCAN'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Aula Específica (Opcional)</label>
                  <select
                    value={targetLessonId}
                    onChange={(e) => setTargetLessonId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#141822] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Todo o Curso (Geral / Todas as Aulas)</option>
                    {targetCourseLessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.moduleTitle} › {l.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Drag and Drop Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition ${
                  isDragOver
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-slate-700 hover:border-orange-500/70 bg-[#12141a]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.zip"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <UploadCloud className={`w-10 h-10 text-orange-400 mb-2 ${isUploading ? 'animate-pulse' : ''}`} />
                {isUploading ? (
                  <div className="space-y-1 w-full max-w-xs">
                    <p className="text-xs font-bold text-orange-400">
                      Enviando {uploadedFileName}... {uploadProgress}%
                    </p>
                    <div className="w-full h-1.5 bg-slate-800 overflow-hidden rounded-full">
                      <div
                        className="h-full bg-orange-500 transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : uploadedFileName && storageKey ? (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      {uploadedFileName}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">{fileSizeStr}</p>
                    <p className="text-[10px] text-orange-400">Clique para selecionar outro arquivo</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">
                      Arraste o arquivo PDF/Apostila aqui ou clique para buscar
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Suporta arquivos PDF, DOCX, PPTX, XLSX e ZIP (até 100MB)
                    </p>
                  </div>
                )}
                {uploadError && <p className="text-[10px] text-red-400 font-bold mt-2">{uploadError}</p>}
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Título do Material / Apostila *</label>
                <input
                  type="text"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  placeholder="Ex: Manual de Salvamento em Altura & Espaço Confinado (NBR 14608)"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141822] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              {/* File Type & Size */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Tipo de Arquivo</label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#141822] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="pdf">PDF (Documento Oficial)</option>
                    <option value="docx">DOCX (Word)</option>
                    <option value="pptx">PPTX (Apresentação de Slides)</option>
                    <option value="xlsx">XLSX (Planilha de Cálculo)</option>
                    <option value="zip">ZIP (Pacote de Arquivos)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Tamanho Estimado</label>
                  <input
                    type="text"
                    value={fileSizeStr}
                    onChange={(e) => setFileSizeStr(e.target.value)}
                    placeholder="Ex: 4.5 MB"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#141822] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Visibility */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Visibilidade do Documento</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141822] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="STUDENT">Todos os Alunos & Instrutores (Público no LMS)</option>
                  <option value="INSTRUCTOR_ONLY">Apenas Instrutores e Administradores</option>
                </select>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#141822] hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-950/60 transition cursor-pointer"
                >
                  {isUploading ? `Enviando... ${uploadProgress}%` : 'Publicar Apostila'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
