import React, { useState, useRef } from 'react';
import { useLmsData } from '../../context/LmsDataContext';
import { Course, CourseModule, Lesson, LessonMaterial, CompletionRule } from '../../types';
import { extractYoutubeVideoId, getYoutubeThumbnail } from '../../lib/youtube';
import { getFileBadgeColor, formatFileSize } from '../../lib/storage';
import { LessonMaterialManagerModal } from '../lesson/LessonMaterialManagerModal';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Flame,
  CheckCircle,
  AlertTriangle,
  Play,
  Film,
  FileText,
  Clock,
  Layers,
  FolderPlus,
  Paperclip,
  UploadCloud,
  Download,
  FileUp,
  Shield,
  Eye,
} from 'lucide-react';

export const AdminCourses: React.FC = () => {
  const { courses, saveCourse, deleteCourse, saveModule, deleteModule, saveLesson, deleteLesson, addLessonMaterial, deleteLessonMaterial } = useLmsData();

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(courses[0]?.id || null);

  // Active course reference (handles empty gracefully)
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0] || null;

  // Material Quick Modal State
  const [materialModalLesson, setMaterialModalLesson] = useState<{
    moduleId: string;
    moduleTitle?: string;
    lesson: Lesson;
  } | null>(null);

  // Course Modal state
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourseData, setEditingCourseData] = useState<Partial<Course>>({
    title: '',
    code: '',
    category: 'Formação Básica',
    instructorName: '',
    totalHours: 40,
    completionRule: 'WATCH_80',
    description: '',
    bannerUrl: '',
  });

  // Module Modal state
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModuleData, setEditingModuleData] = useState<{
    id?: string;
    title: string;
    description?: string;
    order: number;
  }>({
    title: '',
    description: '',
    order: 1,
  });

  // Lesson Modal state
  const [editingLesson, setEditingLesson] = useState<{
    moduleId: string;
    lesson: Partial<Lesson>;
  } | null>(null);

  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [extractedId, setExtractedId] = useState<string | null>(null);

  // Inline Lesson Modal Material Upload State
  const [inlineMatTitle, setInlineMatTitle] = useState('');
  const [inlineMatType, setInlineMatType] = useState<'pdf' | 'docx' | 'pptx' | 'xlsx' | 'zip' | 'link'>('pdf');
  const [inlineMatSize, setInlineMatSize] = useState('2.5 MB');
  const [inlineMatVisibility, setInlineMatVisibility] = useState<'STUDENT' | 'INSTRUCTOR_ONLY'>('STUDENT');
  const [inlineUploadedFileName, setInlineUploadedFileName] = useState('');
  const [inlineIsDragOver, setInlineIsDragOver] = useState(false);
  const inlineFileInputRef = useRef<HTMLInputElement>(null);

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

  // Handlers for Course
  const handleOpenNewCourse = () => {
    setEditingCourseData({
      id: undefined,
      title: '',
      code: `CRS-${Date.now().toString().slice(-4)}`,
      category: 'Treinamento Operacional',
      instructorName: '',
      totalHours: 40,
      completionRule: 'WATCH_80',
      description: '',
      bannerUrl: 'https://i.ibb.co/JWKjqdVS/BANNER45.png',
    });
    setCourseModalOpen(true);
  };

  const handleOpenEditCourse = (course: Course) => {
    setEditingCourseData({ ...course, bannerUrl: course.bannerUrl || 'https://i.ibb.co/JWKjqdVS/BANNER45.png' });
    setCourseModalOpen(true);
  };

  const handleSaveCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourseData.title?.trim()) {
      alert('Informe o título do curso.');
      return;
    }

    const courseId = editingCourseData.id || `crs-${Date.now()}`;
    const newCourse: Course = {
      id: courseId,
      organizationId: 'org-vulcan-01',
      title: editingCourseData.title.trim(),
      slug: editingCourseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      code: editingCourseData.code?.trim() || `CRS-${Date.now().toString().slice(-4)}`,
      description: editingCourseData.description || '',
      bannerUrl: editingCourseData.bannerUrl || 'https://i.ibb.co/JWKjqdVS/BANNER45.png',
      totalHours: Number(editingCourseData.totalHours) || 40,
      completionRule: (editingCourseData.completionRule as CompletionRule) || 'WATCH_80',
      status: 'PUBLISHED',
      category: editingCourseData.category || 'Geral',
      instructorName: editingCourseData.instructorName || 'Instrutor Responsável',
      createdAt: editingCourseData.createdAt || new Date().toISOString(),
      modules: editingCourseData.modules || [],
    };

    saveCourse(newCourse);
    setSelectedCourseId(courseId);
    setCourseModalOpen(false);
  };

  const handleDeleteCourse = (courseId: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Curso',
      message: `Tem certeza que deseja excluir o curso "${title}" e todos os seus módulos e aulas vinculadas?`,
      onConfirm: () => {
        deleteCourse(courseId);
        const remaining = courses.filter((c) => c.id !== courseId);
        setSelectedCourseId(remaining[0]?.id || null);
      },
    });
  };

  // Handlers for Module
  const handleOpenNewModule = () => {
    if (!selectedCourse) return;
    const nextOrder = (selectedCourse.modules?.length || 0) + 1;
    setEditingModuleData({
      id: undefined,
      title: '',
      description: '',
      order: nextOrder,
    });
    setModuleModalOpen(true);
  };

  const handleOpenEditModule = (mod: CourseModule) => {
    setEditingModuleData({
      id: mod.id,
      title: mod.title,
      description: mod.description,
      order: mod.order,
    });
    setModuleModalOpen(true);
  };

  const handleSaveModuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !editingModuleData.title.trim()) return;

    const modId = editingModuleData.id || `mod-${Date.now()}`;
    const existingMod = selectedCourse.modules?.find((m) => m.id === modId);

    const modToSave: CourseModule = {
      id: modId,
      courseId: selectedCourse.id,
      title: editingModuleData.title.trim(),
      description: editingModuleData.description || '',
      order: Number(editingModuleData.order) || 1,
      lessons: existingMod?.lessons || [],
    };

    saveModule(selectedCourse.id, modToSave);
    setModuleModalOpen(false);
  };

  const handleDeleteModule = (moduleId: string, title: string) => {
    if (!selectedCourse) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Módulo',
      message: `Tem certeza que deseja excluir o módulo "${title}" e todas as suas aulas?`,
      onConfirm: () => {
        deleteModule(selectedCourse.id, moduleId);
      },
    });
  };

  // Handlers for Lessons
  const handleUrlChange = (url: string) => {
    setYoutubeUrlInput(url);
    const id = extractYoutubeVideoId(url);
    setExtractedId(id);
    if (editingLesson && id) {
      setEditingLesson({
        ...editingLesson,
        lesson: {
          ...editingLesson.lesson,
          youtubeVideoId: id,
          youtubeUrl: url,
        },
      });
    }
  };

  const handleOpenNewLesson = (moduleId: string) => {
    const mod = selectedCourse?.modules?.find((m) => m.id === moduleId);
    const nextOrder = (mod?.lessons?.length || 0) + 1;

    const newLes: Partial<Lesson> = {
      id: `les-${Date.now()}`,
      moduleId,
      title: '',
      description: '',
      order: nextOrder,
      youtubeVideoId: '',
      youtubeUrl: '',
      durationSeconds: 600,
      status: 'PUBLISHED',
      materials: [],
      activities: [],
    };
    setEditingLesson({ moduleId, lesson: newLes });
    setYoutubeUrlInput('');
    setExtractedId(null);
  };

  const handleOpenEditLesson = (moduleId: string, lesson: Lesson) => {
    setEditingLesson({ moduleId, lesson: { ...lesson } });
    setYoutubeUrlInput(lesson.youtubeUrl || lesson.youtubeVideoId);
    setExtractedId(lesson.youtubeVideoId);
  };

  const handleSaveLessonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !editingLesson || !editingLesson.lesson.title || !extractedId) {
      alert('Preencha o título da aula e informe um link ou ID válido do YouTube.');
      return;
    }

    const completeLesson: Lesson = {
      id: editingLesson.lesson.id || `les-${Date.now()}`,
      moduleId: editingLesson.moduleId,
      title: editingLesson.lesson.title || 'Nova Aula',
      description: editingLesson.lesson.description || '',
      order: Number(editingLesson.lesson.order) || 1,
      youtubeVideoId: extractedId,
      youtubeUrl: youtubeUrlInput,
      // Capa da aula = frame real do vídeo do YouTube, nunca uma imagem aleatória.
      thumbnailUrl: getYoutubeThumbnail(extractedId, 'maxres'),
      durationSeconds: Number(editingLesson.lesson.durationSeconds) || 600,
      status: 'PUBLISHED',
      materials: editingLesson.lesson.materials || [],
      activities: editingLesson.lesson.activities || [],
    };

    saveLesson(selectedCourse.id, editingLesson.moduleId, completeLesson);
    setEditingLesson(null);
    setYoutubeUrlInput('');
    setExtractedId(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Gestão Pedagógica de Conteúdo</span>
          </div>
          <h1 className="text-2xl font-black text-white">
            Editor de Cursos, Módulos e Vídeo Aulas (YouTube)
          </h1>
          <p className="text-xs text-slate-400">
            Cadastre seus cursos do zero com extração automática do YouTube, materiais e regras de conclusão.
          </p>
        </div>

        <button
          onClick={handleOpenNewCourse}
          className="flex items-center gap-2 px-4 py-2.5 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-950/50 cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>+ Criar Novo Curso</span>
        </button>
      </div>

      {/* If no courses exist */}
      {courses.length === 0 ? (
        <div className="p-12 rounded-none bg-[#121418] border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-none bg-orange-600/10 border border-orange-500/30 text-orange-400 mx-auto flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-black text-white">Nenhum Curso Cadastrado</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Você está começando do zero. Crie o seu primeiro curso para adicionar módulos, aulas do YouTube e materiais.
            </p>
          </div>
          <button
            onClick={handleOpenNewCourse}
            className="px-6 py-3 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-xl shadow-orange-950/80 cursor-pointer"
          >
            + Criar Primeiro Curso
          </button>
        </div>
      ) : (
        <>
          {/* Select Active Course Tabs */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 overflow-x-auto">
            <div className="flex gap-2 overflow-x-auto">
              {courses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCourseId(c.id)}
                  className={`px-4 py-2 rounded-none text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCourse?.id === c.id
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/50'
                      : 'bg-[#121418] border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {c.title}
                </button>
              ))}
            </div>

            {selectedCourse && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleOpenEditCourse(selectedCourse)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#121418] hover:bg-slate-800 border border-slate-700 text-xs text-white transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Curso</span>
                </button>
                <button
                  onClick={() => handleDeleteCourse(selectedCourse.id, selectedCourse.title)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#121418] hover:bg-red-950/60 border border-slate-700 text-xs text-slate-400 hover:text-red-400 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Curso</span>
                </button>
              </div>
            )}
          </div>

          {selectedCourse && (
            <div className="space-y-6">
              {/* Course Info Banner */}
              <div className="p-5 rounded-none bg-[#121418] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-orange-400 uppercase">
                      {selectedCourse.code}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-slate-300">{selectedCourse.category}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-slate-300">{selectedCourse.totalHours}h</span>
                  </div>
                  <h2 className="text-xl font-black text-white">{selectedCourse.title}</h2>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                    {selectedCourse.description || 'Sem descrição informada.'}
                  </p>
                </div>

                <button
                  onClick={handleOpenNewModule}
                  className="flex items-center gap-2 px-4 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-md cursor-pointer shrink-0"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>+ Novo Módulo</span>
                </button>
              </div>

              {/* Course Modules List */}
              {(!selectedCourse.modules || selectedCourse.modules.length === 0) ? (
                <div className="p-8 rounded-none bg-[#121418] border border-slate-800 text-center space-y-3">
                  <p className="text-xs text-slate-400">
                    Este curso ainda não possui módulos. Adicione o primeiro módulo para estruturar as aulas.
                  </p>
                  <button
                    onClick={handleOpenNewModule}
                    className="px-4 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    + Adicionar Primeiro Módulo
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedCourse.modules.map((mod) => (
                    <div
                      key={mod.id}
                      className="p-6 rounded-none bg-[#121418] border border-slate-800 space-y-4 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-orange-400 uppercase">
                            MÓDULO {mod.order}
                          </span>
                          <h3 className="text-base font-bold text-white">{mod.title}</h3>
                          {mod.description && (
                            <p className="text-xs text-slate-400">{mod.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenNewLesson(mod.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Adicionar Aula</span>
                          </button>
                          <button
                            onClick={() => handleOpenEditModule(mod)}
                            className="p-1.5 rounded-none bg-[#0c0b0e] hover:bg-slate-800 border border-slate-700 text-white transition cursor-pointer"
                            title="Editar módulo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteModule(mod.id, mod.title)}
                            className="p-1.5 rounded-none bg-[#0c0b0e] hover:bg-red-950/60 border border-slate-700 text-slate-400 hover:text-red-400 transition cursor-pointer"
                            title="Excluir módulo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Lessons under this module */}
                      <div className="space-y-2">
                        {(!mod.lessons || mod.lessons.length === 0) ? (
                          <p className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-800">
                            Nenhuma aula neste módulo. Clique em "+ Adicionar Aula" acima.
                          </p>
                        ) : (
                          mod.lessons.map((les) => (
                            <div
                              key={les.id}
                              className="p-3.5 rounded-none bg-[#0c0b0e] border border-slate-800/80 flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-none bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                                  {les.order}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-white truncate">{les.title}</h4>
                                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                                    <span>ID YouTube: {les.youtubeVideoId}</span>
                                    <span>•</span>
                                    <span>{Math.round((les.durationSeconds || 600) / 60)} min</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    setMaterialModalLesson({
                                      moduleId: mod.id,
                                      moduleTitle: mod.title,
                                      lesson: les,
                                    })
                                  }
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-[#121418] hover:bg-slate-800 border border-slate-700 text-xs text-orange-400 hover:text-orange-300 font-bold transition cursor-pointer"
                                  title="Subir ou gerenciar materiais de apoio desta aula"
                                >
                                  <Paperclip className="w-3.5 h-3.5" />
                                  <span>{les.materials?.length || 0} Material(is)</span>
                                </button>
                                <button
                                  onClick={() => handleOpenEditLesson(mod.id, les)}
                                  className="p-2 rounded-none bg-[#121418] hover:bg-slate-800 border border-slate-700 text-white transition cursor-pointer"
                                  title="Editar aula"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setConfirmDialog({
                                      isOpen: true,
                                      title: 'Excluir Aula',
                                      message: `Tem certeza que deseja excluir a aula "${les.title}"?`,
                                      onConfirm: () => {
                                        if (selectedCourse) {
                                          deleteLesson(selectedCourse.id, mod.id, les.id);
                                        }
                                      },
                                    });
                                  }}
                                  className="p-2 rounded-none bg-[#121418] hover:bg-red-950/60 border border-slate-700 text-slate-400 hover:text-red-400 transition cursor-pointer"
                                  title="Excluir aula"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Course Modal */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-none bg-[#0c0b0e] border border-slate-800 shadow-2xl p-6 sm:p-8 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-500" />
                <span>{editingCourseData.id ? 'Editar Curso' : 'Novo Curso'}</span>
              </h3>
              <button
                onClick={() => setCourseModalOpen(false)}
                className="p-1.5 rounded-none bg-[#121418] hover:bg-slate-800 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white mb-1">Título do Curso *</label>
                <input
                  type="text"
                  required
                  value={editingCourseData.title || ''}
                  onChange={(e) => setEditingCourseData({ ...editingCourseData, title: e.target.value })}
                  placeholder="Ex: Formação de Bombeiro Civil"
                  className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">Código / Sigla</label>
                  <input
                    type="text"
                    value={editingCourseData.code || ''}
                    onChange={(e) => setEditingCourseData({ ...editingCourseData, code: e.target.value })}
                    placeholder="Ex: FBC-2026"
                    className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white mb-1">Carga Horária (h)</label>
                  <input
                    type="number"
                    value={editingCourseData.totalHours || 40}
                    onChange={(e) => setEditingCourseData({ ...editingCourseData, totalHours: Number(e.target.value) })}
                    placeholder="40"
                    className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">Categoria</label>
                  <input
                    type="text"
                    value={editingCourseData.category || ''}
                    onChange={(e) => setEditingCourseData({ ...editingCourseData, category: e.target.value })}
                    placeholder="Ex: Emergências, APH, Brigada"
                    className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white mb-1">Regra de Conclusão</label>
                  <select
                    value={editingCourseData.completionRule || 'WATCH_80'}
                    onChange={(e) => setEditingCourseData({ ...editingCourseData, completionRule: e.target.value as CompletionRule })}
                    className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="WATCH_80">Assistir 80% do vídeo</option>
                    <option value="WATCH_90">Assistir 90% do vídeo</option>
                    <option value="WATCH_100">Assistir 100% do vídeo</option>
                    <option value="MANUAL">Marcação Manual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">Instrutor Responsável</label>
                <input
                  type="text"
                  value={editingCourseData.instructorName || ''}
                  onChange={(e) => setEditingCourseData({ ...editingCourseData, instructorName: e.target.value })}
                  placeholder="Ex: Instrutor Chefe Marcelo"
                  className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={editingCourseData.description || ''}
                  onChange={(e) => setEditingCourseData({ ...editingCourseData, description: e.target.value })}
                  placeholder="Descreva os objetivos e conteúdos do treinamento..."
                  className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">URL da Imagem / Banner</label>
                <input
                  type="url"
                  value={editingCourseData.bannerUrl || ''}
                  onChange={(e) => setEditingCourseData({ ...editingCourseData, bannerUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="px-4 py-2 rounded-none bg-[#121418] hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-950/40 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Curso</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Module Modal */}
      {moduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-none bg-[#0c0b0e] border border-slate-800 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-orange-500" />
                <span>{editingModuleData.id ? 'Editar Módulo' : 'Novo Módulo'}</span>
              </h3>
              <button
                onClick={() => setModuleModalOpen(false)}
                className="p-1.5 rounded-none bg-[#121418] hover:bg-slate-800 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModuleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white mb-1">Título do Módulo *</label>
                <input
                  type="text"
                  required
                  value={editingModuleData.title}
                  onChange={(e) => setEditingModuleData({ ...editingModuleData, title: e.target.value })}
                  placeholder="Ex: Módulo 1 - Teoria Geral do Fogo"
                  className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">Ordem / Sequência</label>
                <input
                  type="number"
                  value={editingModuleData.order}
                  onChange={(e) => setEditingModuleData({ ...editingModuleData, order: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={editingModuleData.description || ''}
                  onChange={(e) => setEditingModuleData({ ...editingModuleData, description: e.target.value })}
                  placeholder="Breve resumo deste módulo..."
                  className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModuleModalOpen(false)}
                  className="px-4 py-2 rounded-none bg-[#121418] hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Módulo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Edit / Add Modal */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-none bg-[#0c0b0e] border border-slate-800 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-orange-500" />
                <span>Configurar Vídeo Aula (YouTube Player)</span>
              </h3>
              <button
                onClick={() => setEditingLesson(null)}
                className="p-1.5 rounded-none bg-[#121418] hover:bg-slate-800 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLessonSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Título da Aula *
                </label>
                <input
                  type="text"
                  required
                  value={editingLesson.lesson.title || ''}
                  onChange={(e) =>
                    setEditingLesson({
                      ...editingLesson,
                      lesson: { ...editingLesson.lesson, title: e.target.value },
                    })
                  }
                  placeholder="Ex: Operação de Esguichos e Linhas de Ataque"
                  className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Link do YouTube ou ID do Vídeo *
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={youtubeUrlInput}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="Ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ ou apenas o ID"
                    className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  />

                  {extractedId && (
                    <div className="flex items-center gap-3 p-3 rounded-none bg-[#121418] border border-slate-800">
                      <img
                        src={getYoutubeThumbnail(extractedId)}
                        alt="Thumbnail"
                        className="w-20 h-12 object-cover rounded-none shrink-0"
                      />
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Vídeo Reconhecido</span>
                        </div>
                        <div className="text-slate-400 font-mono text-[11px]">
                          ID: {extractedId}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Ordem na sequência
                  </label>
                  <input
                    type="number"
                    value={editingLesson.lesson.order || 1}
                    onChange={(e) =>
                      setEditingLesson({
                        ...editingLesson,
                        lesson: {
                          ...editingLesson.lesson,
                          order: parseInt(e.target.value) || 1,
                        },
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Duração Estimada (segundos)
                  </label>
                  <input
                    type="number"
                    value={editingLesson.lesson.durationSeconds || 600}
                    onChange={(e) =>
                      setEditingLesson({
                        ...editingLesson,
                        lesson: {
                          ...editingLesson.lesson,
                          durationSeconds: parseInt(e.target.value) || 600,
                        },
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Instruções ou Descrição Técnica
                </label>
                <textarea
                  rows={3}
                  value={editingLesson.lesson.description || ''}
                  onChange={(e) =>
                    setEditingLesson({
                      ...editingLesson,
                      lesson: { ...editingLesson.lesson, description: e.target.value },
                    })
                  }
                  placeholder="Orientações aos alunos, pontos de atenção e resumo pedagógico..."
                  className="w-full px-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Support Materials Section inside Lesson Modal */}
              <div className="p-4 rounded-none bg-[#121418] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    <span>Materiais de Apoio & Apostilas desta Aula ({(editingLesson.lesson.materials || []).length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">PDF, DOCX, PPTX, XLSX ou Links</span>
                </div>

                {/* Existing materials in this lesson */}
                {(editingLesson.lesson.materials && editingLesson.lesson.materials.length > 0) && (
                  <div className="space-y-2">
                    {editingLesson.lesson.materials.map((mat) => {
                      const badge = getFileBadgeColor(mat.fileType);
                      return (
                        <div
                          key={mat.id}
                          className="p-2.5 rounded-none bg-[#0c0b0e] border border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`px-2 py-0.5 rounded-none text-[10px] font-mono font-bold ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">{mat.title}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {formatFileSize(mat.fileSize)} • {mat.visibility === 'INSTRUCTOR_ONLY' ? 'Apenas Instrutor' : 'Livre para Alunos'}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (editingLesson) {
                                setEditingLesson({
                                  ...editingLesson,
                                  lesson: {
                                    ...editingLesson.lesson,
                                    materials: (editingLesson.lesson.materials || []).filter((m) => m.id !== mat.id),
                                  },
                                });
                              }
                            }}
                            className="p-1.5 rounded-none bg-[#121418] hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition cursor-pointer"
                            title="Remover anexo desta aula"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add new attachment input box */}
                <div className="space-y-3 pt-2">
                  <div className="text-[11px] font-bold text-slate-300">
                    + Anexar arquivo ou material a esta aula:
                  </div>

                  {/* Dropzone / File input */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setInlineIsDragOver(true);
                    }}
                    onDragLeave={() => setInlineIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setInlineIsDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        const f = e.dataTransfer.files[0];
                        setInlineUploadedFileName(f.name);
                        if (!inlineMatTitle) {
                          setInlineMatTitle(f.name.replace(/\.[^/.]+$/, ''));
                        }
                        setInlineMatSize(formatFileSize(f.size));
                        const ext = f.name.split('.').pop()?.toLowerCase();
                        if (ext === 'pdf') setInlineMatType('pdf');
                        else if (ext === 'docx' || ext === 'doc') setInlineMatType('docx');
                        else if (ext === 'pptx' || ext === 'ppt') setInlineMatType('pptx');
                        else if (ext === 'xlsx' || ext === 'xls') setInlineMatType('xlsx');
                        else if (ext === 'zip') setInlineMatType('zip');
                      }
                    }}
                    onClick={() => inlineFileInputRef.current?.click()}
                    className={`p-3.5 border border-dashed rounded-none text-center cursor-pointer transition flex items-center justify-center gap-3 ${
                      inlineIsDragOver
                        ? 'border-orange-500 bg-orange-950/20'
                        : inlineUploadedFileName
                        ? 'border-emerald-500/60 bg-emerald-950/20'
                        : 'border-slate-700 bg-[#0c0b0e] hover:border-orange-500/50'
                    }`}
                  >
                    <input
                      ref={inlineFileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.zip"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const f = e.target.files[0];
                          setInlineUploadedFileName(f.name);
                          if (!inlineMatTitle) {
                            setInlineMatTitle(f.name.replace(/\.[^/.]+$/, ''));
                          }
                          setInlineMatSize(formatFileSize(f.size));
                          const ext = f.name.split('.').pop()?.toLowerCase();
                          if (ext === 'pdf') setInlineMatType('pdf');
                          else if (ext === 'docx' || ext === 'doc') setInlineMatType('docx');
                          else if (ext === 'pptx' || ext === 'ppt') setInlineMatType('pptx');
                          else if (ext === 'xlsx' || ext === 'xls') setInlineMatType('xlsx');
                          else if (ext === 'zip') setInlineMatType('zip');
                        }
                      }}
                    />
                    <FileUp className="w-4 h-4 text-orange-400 shrink-0" />
                    <span className="text-xs text-slate-300">
                      {inlineUploadedFileName ? (
                        <span className="text-emerald-400 font-bold">Arquivo: {inlineUploadedFileName}</span>
                      ) : (
                        'Clique ou arraste um arquivo (PDF, Apostila, Slides, Planilha, etc.)'
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={inlineMatTitle}
                        onChange={(e) => setInlineMatTitle(e.target.value)}
                        placeholder="Nome do Material (Ex: Apostila NBR 14608)"
                        className="w-full px-3 py-2 rounded-none bg-[#0c0b0e] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <select
                        value={inlineMatType}
                        onChange={(e) => setInlineMatType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-none bg-[#0c0b0e] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="pdf">PDF (.pdf)</option>
                        <option value="docx">Word (.docx)</option>
                        <option value="pptx">Slides (.pptx)</option>
                        <option value="xlsx">Planilha (.xlsx)</option>
                        <option value="zip">ZIP (.zip)</option>
                        <option value="link">Link / Manual</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-slate-400 font-bold">Visibilidade:</label>
                      <select
                        value={inlineMatVisibility}
                        onChange={(e) => setInlineMatVisibility(e.target.value as any)}
                        className="px-2 py-1 rounded-none bg-[#0c0b0e] border border-slate-800 text-[11px] text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="STUDENT">Livre para Alunos</option>
                        <option value="INSTRUCTOR_ONLY">Apenas Instrutor</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!inlineMatTitle.trim()) {
                          alert('Digite o título do material antes de anexar.');
                          return;
                        }
                        const newMat: LessonMaterial = {
                          id: `mat-${Date.now()}`,
                          lessonId: editingLesson.lesson.id || `les-${Date.now()}`,
                          title: inlineMatTitle.trim(),
                          fileType: inlineMatType,
                          storageKey: `materials/${editingLesson.lesson.id || 'new'}/${Date.now()}_${inlineMatTitle.toLowerCase().replace(/\s+/g, '_')}.${inlineMatType}`,
                          fileSize: inlineMatSize || '2.0 MB',
                          visibility: inlineMatVisibility,
                          downloadable: true,
                          publishedAt: new Date().toISOString(),
                        };
                        setEditingLesson({
                          ...editingLesson,
                          lesson: {
                            ...editingLesson.lesson,
                            materials: [...(editingLesson.lesson.materials || []), newMat],
                          },
                        });
                        setInlineMatTitle('');
                        setInlineUploadedFileName('');
                        setInlineMatSize('2.5 MB');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#121418] hover:bg-orange-600 border border-slate-700 hover:border-orange-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-orange-400" />
                      <span>Adicionar à Lista</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingLesson(null)}
                  className="px-4 py-2 rounded-none bg-[#121418] hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-950/40 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Vídeo Aula</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Lesson Support Material Modal */}
      {materialModalLesson && selectedCourse && (
        <LessonMaterialManagerModal
          courseId={selectedCourse.id}
          courseTitle={selectedCourse.title}
          moduleId={materialModalLesson.moduleId}
          moduleTitle={materialModalLesson.moduleTitle}
          lesson={materialModalLesson.lesson}
          onClose={() => setMaterialModalLesson(null)}
        />
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
