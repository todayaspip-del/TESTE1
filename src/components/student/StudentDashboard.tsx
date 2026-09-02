import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLmsData } from '../../context/LmsDataContext';
import { LessonCarouselRow } from '../course/LessonCarouselRow';
import {
  Flame,
  Award,
  Calendar,
  AlertTriangle,
  BookOpen,
  Clock,
  Play,
  CheckCircle,
  FileText,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Download,
  Plus,
} from 'lucide-react';

interface StudentDashboardProps {
  onSelectCourse: (courseId: string) => void;
  onSelectLesson: (courseId: string, lessonId: string) => void;
  onNavigateView: (view: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onSelectCourse,
  onSelectLesson,
  onNavigateView,
}) => {
  const { currentUser } = useAuth();
  const { courses, enrollments, announcements, calendarEvents, certificates, getCourseProgress, lessonProgress } = useLmsData();

  if (!currentUser) return null;

  const mainCourse = courses[0] || null;
  const progress = mainCourse ? getCourseProgress(currentUser.id, mainCourse.id) : null;
  const userCertificates = certificates.filter((c) => c.studentId === currentUser.id);
  const urgentAnnouncements = announcements.filter((a) => a.urgent);

  // Find next uncompleted lesson to resume fast
  let resumeLessonId: string | null = null;
  if (mainCourse && mainCourse.modules) {
    for (const mod of mainCourse.modules) {
      for (const les of mod.lessons || []) {
        const prog = lessonProgress[`${currentUser.id}_${les.id}`];
        if (!prog?.completed) {
          resumeLessonId = les.id;
          break;
        }
      }
      if (resumeLessonId) break;
    }
  }

  const isAdminOrInstructor = ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR'].includes(currentUser.role);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Panoramic Banner */}
      <div className="relative rounded-none overflow-hidden border border-orange-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.8)] min-h-[240px] sm:min-h-[320px] md:min-h-[360px] flex flex-col justify-end">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://i.ibb.co/JWKjqdVS/BANNER45.png"
            alt="Treinamento Vulcan LMS"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080c]/90 via-[#07080c]/20 to-transparent" />
        </div>

        {/* Banner Action Buttons */}
        <div className="relative z-10 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-3">
            {mainCourse && resumeLessonId ? (
              <button
                onClick={() => onSelectLesson(mainCourse.id, resumeLessonId!)}
                className="flex items-center gap-2.5 px-6 py-3 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-black tracking-wider uppercase shadow-xl shadow-black/80 transition cursor-pointer active:scale-[0.99]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Continuar Assistindo</span>
              </button>
            ) : mainCourse ? (
              <button
                onClick={() => onSelectCourse(mainCourse.id)}
                className="flex items-center gap-2.5 px-6 py-3 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-black tracking-wider uppercase shadow-xl shadow-black/80 transition cursor-pointer active:scale-[0.99]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Acessar Curso</span>
              </button>
            ) : isAdminOrInstructor ? (
              <button
                onClick={() => onNavigateView('admin-courses')}
                className="flex items-center gap-2.5 px-6 py-3 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-black tracking-wider uppercase shadow-xl shadow-black/80 transition cursor-pointer active:scale-[0.99]"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Primeiro Curso</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigateView('courses')}
                className="flex items-center gap-2.5 px-6 py-3 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-black tracking-wider uppercase shadow-xl shadow-black/80 transition cursor-pointer active:scale-[0.99]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Acessar Curso</span>
              </button>
            )}

            <button
              onClick={() => onNavigateView('materials')}
              className="flex items-center gap-2 px-5 py-3 rounded-none bg-[#121418]/90 hover:bg-[#121418] border border-slate-700/90 hover:border-orange-500/60 text-white text-xs font-bold backdrop-blur-sm transition cursor-pointer shadow-lg shadow-black/60"
            >
              <Download className="w-4 h-4 text-orange-400" />
              <span>Materiais de Apoio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative overflow-hidden rounded-xl bg-[#0e1017] border border-slate-800/80 shadow-md pl-4 pr-3 py-3 border-l-[3px] border-l-orange-500">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-orange-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400 leading-tight truncate">Carga Horária</p>
              <div className="text-base font-black text-white leading-tight">
                {progress?.completedLessonsCount ? progress.completedLessonsCount * 10 : 0}h <span className="text-slate-500 font-bold text-sm">/ {mainCourse?.totalHours || 0}h</span>
              </div>
            </div>
          </div>
          <div className="mt-2 h-[3px] w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full"
              style={{ width: `${mainCourse?.totalHours ? Math.min(100, ((progress?.completedLessonsCount ? progress.completedLessonsCount * 10 : 0) / mainCourse.totalHours) * 100) : 0}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-slate-500">Horas registradas</p>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-[#0e1017] border border-slate-800/80 shadow-md pl-4 pr-3 py-3 border-l-[3px] border-l-emerald-500">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400 leading-tight truncate">Progresso</p>
              <div className="text-base font-black text-emerald-400 font-mono leading-tight">
                {progress?.progressPct || 0}%
              </div>
            </div>
          </div>
          <div className="mt-2 h-[3px] w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${progress?.progressPct || 0}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-slate-500">
            {progress?.completedLessonsCount || 0} de {progress?.totalLessonsCount || 0} aulas
          </p>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-[#0e1017] border border-slate-800/80 shadow-md pl-4 pr-3 py-3 border-l-[3px] border-l-blue-500">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400 leading-tight truncate">Certificados</p>
              <div className="text-base font-black text-white leading-tight">
                {userCertificates.length}
              </div>
            </div>
          </div>
          <div className="mt-2 h-[3px] w-full rounded-full bg-slate-800" />
          <p className="mt-1.5 text-[10px] text-slate-500">Habilitações ativas</p>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-[#0e1017] border border-slate-800/80 shadow-md pl-4 pr-3 py-3 border-l-[3px] border-l-purple-500">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400 leading-tight truncate">Eventos no Calendário</p>
              <div className="text-base font-black text-white leading-tight">
                {calendarEvents.length}
              </div>
            </div>
          </div>
          <div className="mt-2 h-[3px] w-full rounded-full bg-slate-800" />
          <p className="mt-1.5 text-[10px] text-slate-500">Atividades programadas</p>
        </div>
      </div>

      {/* Urgent Announcements Banner */}
      {urgentAnnouncements.length > 0 && (
        <div className="p-5 rounded-none bg-orange-950/30 border border-orange-600/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-none bg-orange-900/60 text-orange-300">
              <AlertTriangle className="w-5 h-5 text-orange-400 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wide">
                {urgentAnnouncements[0].title || 'Comunicado Oficial'}
              </h4>
              <p className="text-xs text-white mt-0.5">
                {urgentAnnouncements[0].body}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateView('calendar')}
            className="px-4 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition whitespace-nowrap cursor-pointer"
          >
            Ver Calendário
          </button>
        </div>
      )}

      {/* Courses/Modules Section */}
      {courses.length === 0 ? (
        <div className="p-8 rounded-none bg-[#0e1017] border border-slate-800 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-orange-400/80 mx-auto" />
          <h3 className="text-base font-bold text-white">Nenhum curso disponível no momento</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            A coordenação está configurando a grade pedagógica. Novos cursos e aulas cadastrados aparecerão aqui em tempo real.
          </p>
          {isAdminOrInstructor && (
            <button
              onClick={() => onNavigateView('admin-courses')}
              className="px-4 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition cursor-pointer"
            >
              Ir para o Painel de Cursos
            </button>
          )}
        </div>
      ) : (
        courses.map((course) => {
          const courseProg = getCourseProgress(currentUser.id, course.id);
          const isDone = courseProg.progressPct >= 100;

          return (
            <div key={course.id} className="space-y-6">
              {/* 3D Floating Course Showcase (No Card Container) */}
              <div
                onClick={() => onSelectCourse(course.id)}
                className="group relative flex flex-col md:flex-row items-center gap-6 lg:gap-10 py-6 px-2 transition-all duration-300 cursor-pointer select-none"
              >
                {/* Floating 3D Icon with Levitation Effect */}
                <div className="relative shrink-0 flex items-center justify-center">
                  {/* Ambient Glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 bg-orange-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500/35 group-hover:scale-125 transition-all duration-500" />
                  
                  {/* Floating 3D Logo */}
                  <div className="relative z-10 w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 flex items-center justify-center transition-all duration-500 group-hover:-translate-y-3 group-hover:scale-105">
                    {/* Dynamic Floor Shadow */}
                    <div className="absolute -bottom-2 w-32 h-6 bg-black/80 rounded-full blur-lg scale-90 group-hover:scale-75 group-hover:opacity-60 transition-all duration-500" />
                    
                    <img
                      src="https://i.ibb.co/HLSLBX1V/LOGOS-DOS-CURSOS.png"
                      alt={course.title}
                      className="w-full h-full object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.9)] drop-shadow-[0_0_25px_rgba(249,115,22,0.35)] transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Course Floating Info & Progress (Seamless, No Container) */}
                <div className="flex-1 min-w-0 flex flex-col justify-center space-y-4 text-center md:text-left w-full">
                  <div className="space-y-2">
                    {/* Floating Badges */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                      <span className="px-3 py-1 rounded-md bg-orange-500/15 border border-orange-500/40 text-orange-400 text-xs font-mono font-black uppercase tracking-wider">
                        {course.code || 'VULCAN-TRN'}
                      </span>
                      <span className="px-3 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-semibold">
                        {course.category || 'Formação Técnica'}
                      </span>
                      <span className="px-3 py-1 rounded-md bg-[#121418] border border-slate-800 text-slate-400 text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-orange-400" />
                        {course.totalHours || 0} Horas Certificadas
                      </span>
                    </div>

                    {/* Floating Title */}
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white group-hover:text-orange-400 transition-colors duration-300 leading-tight">
                      {course.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-2xl leading-relaxed">
                      {course.description ||
                        'Capacitação profissional técnica com aulas em vídeo, apostilas e emissão de certificado homologado.'}
                    </p>
                  </div>

                  {/* Clean Floating Progress Bar */}
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                        Progresso do Aluno
                      </span>
                      <span className="font-mono text-emerald-400 text-sm font-black">
                        {courseProg.progressPct}%{' '}
                        <span className="text-slate-500 font-normal text-xs">
                          ({courseProg.completedLessonsCount} de {courseProg.totalLessonsCount} aulas)
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-900/90 border border-slate-800/80 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isDone
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                            : 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 shadow-[0_0_15px_rgba(249,115,22,0.5)]'
                        }`}
                        style={{ width: `${courseProg.progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Floating Action Hint */}
                  <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCourse(course.id);
                      }}
                      className="flex items-center gap-2.5 px-6 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-black tracking-wider uppercase shadow-xl shadow-orange-950/80 transition-all duration-300 cursor-pointer active:scale-[0.98] group-hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{isDone ? 'Revisar Grade' : 'Acessar Grade & Aulas'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-xs text-slate-400">
                      Instrutor: <strong className="text-slate-200">{course.instructorName || 'Corpo Docente'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Module Carousels */}
              {(!course.modules || course.modules.length === 0) ? (
                <p className="text-xs text-slate-500 italic p-4 bg-[#0e1017] border border-slate-800">
                  Nenhum módulo cadastrado neste curso ainda.
                </p>
              ) : (
                course.modules.map((mod, idx) => (
                  <LessonCarouselRow
                    key={mod.id}
                    title={`Módulo ${mod.order} — ${mod.title}`}
                    badge={idx === 0 ? 'Fase Inicial' : undefined}
                    course={course}
                    module={mod}
                    currentUser={currentUser}
                    enrollments={enrollments}
                    lessonProgress={lessonProgress}
                    onSelectLesson={onSelectLesson}
                  />
                ))
              )}
            </div>
          );
        })
      )}

      {/* Upcoming Operational Calendar Preview */}
      <div className="p-6 rounded-none bg-[#0e1017] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-400" />
            Próximos Treinamentos e Eventos
          </h3>
          <button
            onClick={() => onNavigateView('calendar')}
            className="text-xs text-slate-400 hover:text-orange-400 font-medium cursor-pointer"
          >
            Ver calendário completo
          </button>
        </div>

        {calendarEvents.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            Nenhum evento agendado no calendário no momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {calendarEvents.slice(0, 3).map((evt) => (
              <div
                key={evt.id}
                className="p-4 rounded-none bg-[#08090d] border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-none bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold uppercase">
                    {evt.type}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    {new Date(evt.startAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="text-xs font-bold text-white">{evt.title}</div>
                <p className="text-[11px] text-slate-300 line-clamp-2">{evt.description}</p>
                {evt.location && (
                  <div className="text-[10px] text-orange-400 font-mono pt-1">
                    Local: {evt.location}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
