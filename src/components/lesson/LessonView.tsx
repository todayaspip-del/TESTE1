import React, { useState } from 'react';
import { Course, CourseModule, Lesson } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLmsData } from '../../context/LmsDataContext';
import { authorizeLessonAccess } from '../../lib/authorize';
import { YoutubePlayer } from '../player/YoutubePlayer';
import { getFileBadgeColor, formatFileSize, triggerMaterialDownload } from '../../lib/storage';
import { LessonMaterialManagerModal } from './LessonMaterialManagerModal';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Lock,
  Download,
  MessageSquare,
  FileText,
  HelpCircle,
  Pin,
  Send,
  Shield,
  Clock,
  Flame,
  Award,
  AlertTriangle,
  UserCheck,
  Check,
  Paperclip,
  UploadCloud,
  Plus,
  Trash2,
} from 'lucide-react';
import { QuizModal } from '../quiz/QuizModal';
import { LessonSidebarList } from './LessonSidebarList';

interface LessonViewProps {
  course: Course;
  currentLessonId: string;
  onSelectLesson: (lessonId: string) => void;
  onBackToCourse: () => void;
}

export const LessonView: React.FC<LessonViewProps> = ({
  course,
  currentLessonId,
  onSelectLesson,
  onBackToCourse,
}) => {
  const { currentUser } = useAuth();
  const {
    enrollments,
    lessonProgress,
    updateLessonProgress,
    markLessonCompleteManual,
    comments,
    addComment,
    pinComment,
    privateNotes,
    addPrivateNote,
    deleteLessonMaterial,
    deleteComment,
  } = useLmsData();

  const [activeTab, setActiveTab] = useState<'video' | 'materials' | 'quiz' | 'comments' | 'notes'>('video');
  const [commentText, setCommentText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [selectedQuizActivity, setSelectedQuizActivity] = useState<any | null>(null);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);

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

  // Find module and lesson
  let currentModule: CourseModule | undefined;
  let currentLesson: Lesson | undefined;

  for (const mod of course.modules) {
    const found = mod.lessons.find((l) => l.id === currentLessonId);
    if (found) {
      currentModule = mod;
      currentLesson = found;
      break;
    }
  }

  // Fallback to first lesson if not found
  if (!currentLesson || !currentModule) {
    if (course.modules[0]?.lessons[0]) {
      currentModule = course.modules[0];
      currentLesson = course.modules[0].lessons[0];
    } else {
      return (
        <div className="p-8 text-center bg-[#121418] border border-slate-800 rounded-none">
          <p className="text-slate-400">Nenhuma aula cadastrada neste módulo.</p>
          <button
            onClick={onBackToCourse}
            className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-none text-xs font-bold transition"
          >
            Voltar ao Curso
          </button>
        </div>
      );
    }
  }

  // Flatten lessons list for Next / Prev navigation
  const allLessons: Lesson[] = [];
  course.modules.forEach((m) => allLessons.push(...m.lessons));
  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Authorization check
  const authResult = authorizeLessonAccess({
    user: currentUser,
    action: 'lesson:view',
    course,
    module: currentModule,
    lesson: currentLesson,
    enrollments,
    userLessonProgress: lessonProgress,
  });

  const studentProgKey = `${currentUser?.id}_${currentLesson.id}`;
  const currentProg = currentUser ? lessonProgress[studentProgKey] : undefined;
  const isCompleted = !!currentProg?.completed;

  const lessonComments = comments.filter((c) => c.lessonId === currentLesson?.id);
  const sortedComments = [...lessonComments].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentLesson) return;
    addComment(currentLesson.id, commentText);
    setCommentText('');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !currentUser) return;
    addPrivateNote(currentUser.id, noteText);
    setNoteText('');
  };

  // If locked / unauthorized for student
  if (!authResult.authorized) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={onBackToCourse}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Currículo do Curso
        </button>

        <div className="p-8 rounded-none bg-[#0e1017] border border-orange-900/40 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-none bg-orange-950/60 border border-orange-800/50 flex items-center justify-center text-orange-400">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Conteúdo Bloqueado</h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            {authResult.reason}
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={onBackToCourse}
              className="px-5 py-2.5 rounded-none bg-[#121418] hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold transition"
            >
              Ver Grade de Aulas
            </button>
            {prevLesson && (
              <button
                onClick={() => onSelectLesson(prevLesson.id)}
                className="px-5 py-2.5 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition"
              >
                Ir para Aula Anterior
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      {/* Top Breadcrumbs & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBackToCourse}
          className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-orange-400" /> {course.title}
        </button>

        {/* Previous / Next Lesson Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => prevLesson && onSelectLesson(prevLesson.id)}
            disabled={!prevLesson}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none border text-xs font-semibold transition cursor-pointer ${
              prevLesson
                ? 'bg-[#121418] border-slate-800 text-white hover:text-orange-400 hover:border-slate-700'
                : 'opacity-40 bg-[#0c0b0e] border-slate-900 text-slate-500 cursor-not-allowed'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Aula Anterior</span>
          </button>

          <button
            onClick={() => nextLesson && onSelectLesson(nextLesson.id)}
            disabled={!nextLesson}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none border text-xs font-semibold transition cursor-pointer ${
              nextLesson
                ? 'bg-orange-600 border-orange-500 text-white hover:bg-orange-500'
                : 'opacity-40 bg-[#0c0b0e] border-slate-900 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span className="hidden sm:inline">Próxima Aula</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Two-column layout: player + tabs on the left, lesson list on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          {/* Lesson Header Title */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-orange-400 font-bold uppercase tracking-wider">
              <span>{currentModule.title}</span>
              <span>•</span>
              <span className="text-slate-400">Aula {currentLesson.order} de {currentModule.lessons.length}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {currentLesson.title}
            </h1>
          </div>

          {/* Main Video Player Container */}
          <YoutubePlayer
        videoId={currentLesson.youtubeVideoId}
        lessonId={currentLesson.id}
        initialPositionSeconds={currentProg?.lastPositionSeconds || 0}
        completionRule={course.completionRule}
        isCompleted={isCompleted}
        onProgressUpdate={(curSec, durSec) => {
          updateLessonProgress(currentLesson.id, curSec, durSec);
        }}
        onEnded={() => {
          updateLessonProgress(currentLesson.id, currentLesson.durationSeconds || 780, currentLesson.durationSeconds || 780, true);
        }}
      />

      {/* Manual Completion Option & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-none bg-[#0e1017] border border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-none flex items-center justify-center ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5 text-orange-400" />}
          </div>
          <div>
            <div className="text-xs font-bold text-white">
              {isCompleted ? 'Aula Registrada como Concluída' : 'Em Andamento'}
            </div>
            <div className="text-[11px] text-slate-400">
              {isCompleted
                ? `Concluída em ${new Date(currentProg?.completedAt || Date.now()).toLocaleDateString('pt-BR')}`
                : `Progresso: ${currentProg?.progressPct || 0}%`}
            </div>
          </div>
        </div>

        {/* Manual Button (always available for easy instructor validation or manual rule) */}
        {!isCompleted ? (
          <button
            onClick={() => markLessonCompleteManual(currentLesson.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-950/40 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Marcar como Concluída</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <CheckCircle className="w-4 h-4" />
            <span>Prontuário Atualizado</span>
          </div>
        )}
      </div>

      {/* Interactive Tabs Menu */}
      <div className="border-b border-slate-800">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'video'
                ? 'border-orange-500 text-orange-400 bg-orange-950/20 rounded-none'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Descrição & Conteúdo</span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'materials'
                ? 'border-orange-500 text-orange-400 bg-orange-950/20 rounded-none'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Materiais de Apoio ({currentLesson.materials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'quiz'
                ? 'border-orange-500 text-orange-400 bg-orange-950/20 rounded-none'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Simulado & Quizzes ({currentLesson.activities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'comments'
                ? 'border-orange-500 text-orange-400 bg-orange-950/20 rounded-none'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Dúvidas & Fórum ({lessonComments.length})</span>
          </button>

          {['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser?.role || '') && (
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'notes'
                  ? 'border-orange-500 text-orange-400 bg-orange-950/20 rounded-none'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4 text-orange-400" />
              <span>Prontuário Militar</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Description & Technical Breakdown */}
      {activeTab === 'video' && (
        <div className="space-y-6">
          <div className="p-6 rounded-none bg-[#0e1017] border border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Objetivo Pedagógico e Tático da Instrução
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed">
              {currentLesson.description ||
                'Esta instrução técnica prepara o profissional bombeiro para o reconhecimento e combate imediato de princípios de incêndio, manuseio seguro de agentes extintores e preservação da integridade física e do patrimônio.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
              <div className="p-3.5 rounded-none bg-[#0c0b0e] border border-slate-800/80 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Regulamentação</div>
                <div className="text-xs font-semibold text-white">ABNT NBR 14608 / NR 23</div>
              </div>
              <div className="p-3.5 rounded-none bg-[#0c0b0e] border border-slate-800/80 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Tempo de Duração</div>
                <div className="text-xs font-semibold text-white">
                  {Math.round((currentLesson.durationSeconds || 780) / 60)} minutos de vídeo aula
                </div>
              </div>
              <div className="p-3.5 rounded-none bg-[#0c0b0e] border border-slate-800/80 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Certificação</div>
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Pontua no Prontuário Oficial
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Materials & Downloads */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-orange-500" />
                <span>Apostilas, Manuais e Materiais de Apoio</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Arquivos e documentações vinculados a esta aula específica
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">
                {currentLesson.materials?.length || 0} arquivo(s)
              </span>

              {['ADMIN', 'SUPER_ADMIN', 'INSTRUCTOR'].includes(currentUser?.role || '') && (
                <button
                  onClick={() => setIsUploadingMaterial(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-md shadow-orange-950/50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Subir Material de Apoio</span>
                </button>
              )}
            </div>
          </div>

          {(!currentLesson.materials || currentLesson.materials.length === 0) ? (
            <div className="p-8 text-center bg-[#0e1017] border border-slate-800 rounded-none space-y-3">
              <Paperclip className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs text-slate-300 font-bold">Nenhum material complementar anexado a esta aula.</p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Apostilas em PDF, slides e manuais operacionais anexados pelo instrutor aparecerão aqui para estudo.
                </p>
              </div>

              {['ADMIN', 'SUPER_ADMIN', 'INSTRUCTOR'].includes(currentUser?.role || '') && (
                <button
                  onClick={() => setIsUploadingMaterial(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Anexar Apostila / Material Agora</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentLesson.materials.map((mat) => {
                const badge = getFileBadgeColor(mat.fileType);
                const canDelete = ['ADMIN', 'SUPER_ADMIN', 'INSTRUCTOR'].includes(currentUser?.role || '');

                return (
                  <div
                    key={mat.id}
                    className="p-4 rounded-none bg-[#0e1017] border border-slate-800 hover:border-orange-500/50 transition flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`px-2.5 py-1 rounded-none border text-xs font-mono font-bold shrink-0 ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white leading-snug truncate">
                          {mat.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono flex items-center gap-2">
                          <span>{formatFileSize(mat.fileSize)}</span>
                          <span>•</span>
                          <span className={mat.visibility === 'INSTRUCTOR_ONLY' ? 'text-amber-400' : 'text-emerald-400'}>
                            {mat.visibility === 'INSTRUCTOR_ONLY' ? 'Acesso Restrito Instrutor' : 'Livre para Alunos'}
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
                            courseTitle: course.title,
                            lessonTitle: currentLesson?.title,
                          });
                        }}
                        className="p-2.5 rounded-none bg-[#121418] hover:bg-orange-600 border border-slate-700 text-white transition cursor-pointer flex items-center justify-center"
                        title="Baixar material"
                      >
                        <Download className="w-4 h-4 text-orange-400 hover:text-white" />
                      </button>

                      {canDelete && (
                        <button
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: 'Remover Material',
                              message: `Deseja remover o material "${mat.title}" desta aula?`,
                              onConfirm: () => {
                                deleteLessonMaterial(mat.id);
                              },
                            });
                          }}
                          className="p-2.5 rounded-none bg-[#121418] hover:bg-red-950/70 border border-slate-700 text-slate-400 hover:text-red-400 transition cursor-pointer"
                          title="Excluir material desta aula"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Activities & Quizzes */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">
              Simulados de Fixação & Avaliações Teóricas
            </h3>
          </div>

          {currentLesson.activities.length === 0 ? (
            <div className="p-8 text-center bg-[#0e1017] border border-slate-800 rounded-none">
              <p className="text-xs text-slate-400">Esta aula não possui questionário avaliativo obrigatório.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentLesson.activities.map((act) => (
                <div
                  key={act.id}
                  className="p-5 rounded-none bg-[#0e1017] border border-slate-800 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-none bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold uppercase">
                        {act.type}
                      </span>
                      <h4 className="text-sm font-bold text-white">{act.title}</h4>
                    </div>
                    <p className="text-xs text-slate-300">{act.instructions}</p>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                      <span>Nota mínima: {act.minScore || 70}%</span>
                      <span>•</span>
                      <span>{act.questions.length} questões</span>
                      <span>•</span>
                      <span>Tempo limite: {act.timeLimitMinutes || 15} min</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedQuizActivity(act)}
                    className="px-4 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-950/40 cursor-pointer"
                  >
                    Iniciar Simulado
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Doubts & Comments */}
      {activeTab === 'comments' && (
        <div className="space-y-6">
          {/* Post New Comment Form */}
          <form onSubmit={handlePostComment} className="p-4 rounded-none bg-[#0e1017] border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-white">
              Tirar Dúvida Técnica com os Instrutores
            </label>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Digite sua dúvida sobre o conteúdo do vídeo, procedimentos operacionais ou normas..."
              className="w-full h-20 p-3 rounded-none bg-[#0c0b0e] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-none bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Dúvida</span>
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {sortedComments.length === 0 ? (
              <div className="p-8 text-center bg-[#0e1017] border border-slate-800 rounded-none">
                <p className="text-xs text-slate-400">Nenhuma dúvida publicada ainda. Seja o primeiro!</p>
              </div>
            ) : (
              sortedComments.map((cmt) => (
                <div
                  key={cmt.id}
                  className={`p-4 rounded-none border transition ${
                    cmt.isInstructorReply
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : cmt.pinned
                      ? 'bg-[#0e1017] border-orange-500/40'
                      : 'bg-[#0e1017] border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {cmt.authorAvatar ? (
                        <img
                          src={cmt.authorAvatar}
                          alt={cmt.authorName}
                          className="w-6 h-6 rounded-none object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-none bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
                          {cmt.authorName.charAt(0)}
                        </div>
                      )}
                      <span className="text-xs font-bold text-white">{cmt.authorName}</span>
                      {cmt.isInstructorReply && (
                        <span className="px-2 py-0.5 rounded-none bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          Oficial / Instrutor
                        </span>
                      )}
                      {cmt.pinned && (
                        <span className="flex items-center gap-1 text-[10px] text-orange-400 font-bold">
                          <Pin className="w-3 h-3" /> Fixado
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(cmt.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed pl-8">{cmt.content}</p>

                  {/* Comment actions: Pin (for instructors) and Delete (for authors/instructors/admins) */}
                  <div className="mt-2 pl-8 flex items-center justify-end gap-3">
                    {['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser?.role || '') && (
                      <button
                        onClick={() => pinComment(cmt.id)}
                        className="text-[10px] text-slate-400 hover:text-orange-400 flex items-center gap-1 cursor-pointer"
                      >
                        <Pin className="w-3 h-3" />
                        {cmt.pinned ? 'Desafixar' : 'Fixar no Topo'}
                      </button>
                    )}

                    {(currentUser?.id === cmt.userId ||
                      ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser?.role || '')) && (
                      <button
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: 'Excluir Dúvida / Comentário',
                            message: 'Deseja excluir permanentemente este comentário?',
                            onConfirm: () => {
                              deleteComment(cmt.id);
                            },
                          });
                        }}
                        className="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1 cursor-pointer transition"
                        title="Excluir comentário"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Excluir</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Private Instructor Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <form onSubmit={handleAddNote} className="p-4 rounded-none bg-orange-950/20 border border-orange-800/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-300">
              <Shield className="w-4 h-4 text-orange-400" />
              <span>Anotação de Prontuário Confidencial (Visível apenas para Instrutores e Comando)</span>
            </div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Registre observações de conduta militar, prontidão, aptidão física ou técnica deste aluno..."
              className="w-full h-20 p-3 rounded-none bg-[#0c0b0e] border border-orange-900/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!noteText.trim()}
                className="px-4 py-2 rounded-none bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
              >
                Salvar no Prontuário
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {privateNotes.map((n) => (
              <div key={n.id} className="p-4 rounded-none bg-[#0e1017] border border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1 font-mono text-[10px]">
                  <span>Registrado por: {n.authorName}</span>
                  <span>{new Date(n.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <p className="text-slate-200">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

        </div>

        {/* Right column: lesson list for the course/module */}
        <LessonSidebarList
          course={course}
          currentLessonId={currentLesson.id}
          currentUser={currentUser}
          enrollments={enrollments}
          lessonProgress={lessonProgress}
          onSelectLesson={onSelectLesson}
        />
      </div>

      {/* Quiz Modal */}
      {selectedQuizActivity && (
        <QuizModal
          activity={selectedQuizActivity}
          onClose={() => setSelectedQuizActivity(null)}
        />
      )}

      {/* Support Material Upload Modal */}
      {isUploadingMaterial && currentLesson && (
        <LessonMaterialManagerModal
          courseId={course.id}
          courseTitle={course.title}
          moduleId={currentModule?.id}
          moduleTitle={currentModule?.title}
          lesson={currentLesson}
          onClose={() => setIsUploadingMaterial(false)}
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
