import React, { useState } from 'react';
import { Course } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLmsData } from '../../context/LmsDataContext';
import { authorizeLessonAccess } from '../../lib/authorize';
import { getYoutubeThumbnail } from '../../lib/youtube';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  Lock,
  Clock,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp,
  Flame,
  FileText,
  HelpCircle,
  Shield,
} from 'lucide-react';
import { CertificateModal } from '../certificate/CertificateModal';

interface CourseDetailViewProps {
  course: Course;
  onBack: () => void;
  onSelectLesson: (lessonId: string) => void;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  course,
  onBack,
  onSelectLesson,
}) => {
  const { currentUser } = useAuth();
  const { enrollments, lessonProgress, getCourseProgress, issueCertificate, certificates } = useLmsData();

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    course.modules.forEach((m) => {
      initial[m.id] = true;
    });
    return initial;
  });

  const [showCertModal, setShowCertModal] = useState(false);

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const progress = currentUser ? getCourseProgress(currentUser.id, course.id) : null;
  const isComplete = progress && progress.progressPct >= 100;

  // Capa do curso: usa o banner oficial https://i.ibb.co/JWKjqdVS/BANNER45.png
  const isCustomValidBanner =
    course.bannerUrl &&
    !course.bannerUrl.includes('unsplash.com') &&
    !course.bannerUrl.includes('photo-1542282088-72c9c27ed0cd');
  const bannerSrc = isCustomValidBanner ? course.bannerUrl : 'https://i.ibb.co/JWKjqdVS/BANNER45.png';

  // Existing or newly issued certificate
  const cert = currentUser
    ? certificates.find((c) => c.studentId === currentUser.id && c.courseId === course.id)
    : null;

  const handleGenerateCertificate = () => {
    if (!currentUser) return;
    issueCertificate(currentUser.id, course.id);
    setShowCertModal(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Back Navigation */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para Meus Cursos
      </button>

      {/* Course Banner Hero */}
      <div className="relative rounded-none bg-[#121418] border border-slate-800 overflow-hidden shadow-2xl">
        <div className="h-64 sm:h-72 w-full relative bg-[#0c0b0e]">
          <img
            src={bannerSrc}
            alt={course.title}
            onError={(e) => {
              if (e.currentTarget.src !== 'https://i.ibb.co/JWKjqdVS/BANNER45.png') {
                e.currentTarget.src = 'https://i.ibb.co/JWKjqdVS/BANNER45.png';
              }
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b0e] via-[#0c0b0e]/70 to-[#0c0b0e]/30" />

          {/* Badges Over Image */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-none bg-[#0c0b0e]/90 backdrop-blur-md border border-slate-700 text-xs font-mono font-bold text-white">
              {course.code}
            </span>
            <span className="px-3 py-1 rounded-none bg-orange-950/90 backdrop-blur-md border border-orange-800 text-xs font-bold text-orange-400">
              {course.category}
            </span>
          </div>

          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
              {course.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-400" />
                {course.totalHours} Horas Totais
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-orange-400" />
                {course.modules.length} Módulos Especializados
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                Instrutor: {course.instructorName}
              </span>
            </div>
          </div>
        </div>

        {/* Progress & Certificate Strip */}
        <div className="p-6 bg-[#0c0b0e] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          {progress && (
            <div className="w-full sm:w-1/2 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-semibold">
                  Aproveitamento do Aluno: {progress.completedLessonsCount}/{progress.totalLessonsCount} aulas
                </span>
                <span className="font-mono font-bold text-white">{progress.progressPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-none overflow-hidden">
                <div
                  className={`h-full rounded-none transition-all duration-500 ${
                    isComplete ? 'bg-emerald-500' : 'bg-orange-600'
                  }`}
                  style={{ width: `${progress.progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Certificate Trigger Button */}
          {isComplete || cert ? (
            <button
              onClick={() => {
                if (cert) setShowCertModal(true);
                else handleGenerateCertificate();
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-950/50 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Ver Certificado NBR 14608</span>
            </button>
          ) : (
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-slate-400" />
              <span>Certificado liberado ao atingir 100% de conclusão</span>
            </div>
          )}
        </div>
      </div>

      {/* Curriculum Module Accordion */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Estrutura Curricular & Grade de Instrução
          </h2>
          <span className="text-xs text-slate-400">
            Regra de Conclusão: <strong className="text-white">{course.completionRule}</strong>
          </span>
        </div>

        <div className="space-y-4">
          {course.modules.map((module) => {
            const isExpanded = expandedModules[module.id];

            return (
              <div
                key={module.id}
                className="rounded-none bg-[#121418] border border-slate-800 overflow-hidden shadow-md"
              >
                {/* Module Header */}
                <div
                  onClick={() => toggleModule(module.id)}
                  className="p-5 bg-[#121418] hover:bg-slate-800/80 transition cursor-pointer flex items-center justify-between gap-4 select-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-none bg-[#0c0b0e] border border-slate-700 text-[10px] font-mono font-bold text-orange-400">
                        MÓDULO {module.order}
                      </span>
                      <h3 className="text-sm font-bold text-white">{module.title}</h3>
                    </div>
                    <p className="text-xs text-slate-400">{module.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                      {module.lessons.length} aulas
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Module Lessons List */}
                {isExpanded && (
                  <div className="divide-y divide-slate-800/80 bg-[#0c0b0e]">
                    {module.lessons.map((lesson) => {
                      const authResult =  authorizeLessonAccess({
                        user: currentUser,
                        action: 'lesson:view',
                        course,
                        module,
                        lesson,
                        enrollments,
                        userLessonProgress: lessonProgress,
                      });

                      const progKey = `${currentUser?.id}_${lesson.id}`;
                      const prog = currentUser ? lessonProgress[progKey] : undefined;
                      const isLessonDone = !!prog?.completed;

                      return (
                        <div
                          key={lesson.id}
                          onClick={() => {
                            if (authResult.authorized) {
                              onSelectLesson(lesson.id);
                            }
                          }}
                          className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition ${
                            authResult.authorized
                              ? 'hover:bg-slate-800/60 cursor-pointer'
                              : 'opacity-60 bg-[#0c0b0e] cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            <div className="mt-0.5">
                              {isLessonDone ? (
                                <div className="w-6 h-6 rounded-none bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                  <CheckCircle className="w-4 h-4" />
                                </div>
                              ) : !authResult.authorized ? (
                                <div className="w-6 h-6 rounded-none bg-slate-800 text-slate-400 flex items-center justify-center">
                                  <Lock className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-none bg-orange-600/20 text-orange-400 flex items-center justify-center">
                                  <Play className="w-3.5 h-3.5 ml-0.5" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4
                                  className={`text-xs sm:text-sm font-bold truncate ${
                                    isLessonDone ? 'text-slate-400 line-through' : 'text-white'
                                  }`}
                                >
                                  {lesson.title}
                                </h4>
                              </div>
                              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                                {lesson.description}
                              </p>

                              {/* Lesson Tags */}
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                                <span className="flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {Math.round((lesson.durationSeconds || 780) / 60)} min
                                </span>
                                {lesson.materials.length > 0 && (
                                  <span className="flex items-center gap-1 text-slate-300">
                                    <FileText className="w-3 h-3" />
                                    {lesson.materials.length} material(is)
                                  </span>
                                )}
                                {lesson.activities.length > 0 && (
                                  <span className="flex items-center gap-1 text-orange-400">
                                    <HelpCircle className="w-3 h-3" />
                                    {lesson.activities.length} simulado(s)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Pill */}
                          <div className="shrink-0">
                            {authResult.authorized ? (
                              <span className="px-3 py-1 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition">
                                {isLessonDone ? 'Reassistir' : 'Iniciar Aula'}
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-none bg-[#121418] border border-slate-800 text-slate-400 text-xs font-medium">
                                Bloqueado
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertModal && cert && (
        <CertificateModal certificate={cert} onClose={() => setShowCertModal(false)} />
      )}
    </div>
  );
};
