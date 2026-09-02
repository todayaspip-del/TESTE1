import React, { useRef } from 'react';
import { Course, CourseModule, Enrollment, LessonProgress, User } from '../../types';
import { authorizeLessonAccess } from '../../lib/authorize';
import { getYoutubeThumbnail } from '../../lib/youtube';
import { Play, Lock, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface LessonCarouselRowProps {
  title: string;
  badge?: string;
  course: Course;
  module: CourseModule;
  currentUser: User | null;
  enrollments: Enrollment[];
  lessonProgress: Record<string, LessonProgress>;
  onSelectLesson: (courseId: string, lessonId: string) => void;
}

export const LessonCarouselRow: React.FC<LessonCarouselRowProps> = ({
  title,
  badge,
  course,
  module,
  currentUser,
  enrollments,
  lessonProgress,
  onSelectLesson,
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: number) => {
    scrollerRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  if (!module.lessons.length) return null;

  return (
    <div className="space-y-4 group/row">
      {/* Module Title Header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-3">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {title}
          </h3>
          {badge && (
            <span className="px-2.5 py-0.5 rounded-none bg-orange-950/80 text-orange-400 border border-orange-500/50 text-[10px] font-bold uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 opacity-80 sm:opacity-0 group-hover/row:opacity-100 transition">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Rolar para a esquerda"
            className="p-2 rounded-none bg-[#121418] border border-slate-800 text-white hover:text-orange-400 hover:border-orange-500/50 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Rolar para a direita"
            className="p-2 rounded-none bg-[#121418] border border-slate-800 text-white hover:text-orange-400 hover:border-orange-500/50 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards Scroller Container */}
      <div
        ref={scrollerRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-[#0c0b0e] [&::-webkit-scrollbar-thumb]:bg-slate-800"
      >
        {module.lessons.map((lesson, idx) => {
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
          const isDone = !!prog?.completed;
          // Capa real da aula: usa o frame do próprio vídeo do YouTube (maxres, com fallback
          // automático para hq caso o vídeo não tenha versão em alta resolução disponível).
          const thumb = lesson.thumbnailUrl || getYoutubeThumbnail(lesson.youtubeVideoId, 'maxres');
          const thumbFallback = getYoutubeThumbnail(lesson.youtubeVideoId, 'hq');

          return (
            <div
              key={lesson.id}
              onClick={() => authResult.authorized && onSelectLesson(course.id, lesson.id)}
              className={`relative shrink-0 w-[220px] sm:w-[250px] md:w-[270px] h-[350px] sm:h-[380px] snap-start rounded-none overflow-hidden bg-[#0c0b0e] border-2 transition-all duration-300 group select-none flex flex-col justify-between p-4 cursor-pointer ${
                authResult.authorized
                  ? 'border-orange-500/40 hover:border-orange-500 shadow-[0_0_16px_rgba(234,88,12,0.15)] hover:shadow-[0_0_28px_rgba(249,115,22,0.35)] hover:-translate-y-1.5'
                  : 'border-slate-800/80 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Card Background Image with Gradient Overlay */}
              <div className="absolute inset-0 z-0">
                <img
                  src={thumb}
                  alt={lesson.title}
                  onError={(e) => {
                    // maxresdefault nem sempre existe (vídeos antigos/verticais);
                    // cai para hqdefault, que o YouTube sempre gera.
                    if (e.currentTarget.src !== thumbFallback) {
                      e.currentTarget.src = thumbFallback;
                    }
                  }}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-70 group-hover:opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060709] via-[#060709]/50 to-[#060709]/10" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#060709]/40 via-transparent to-[#060709]" />
              </div>

              {/* Top Card Badges */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-none bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white">
                  Aula {lesson.order}
                </span>

                {isDone ? (
                  <span className="px-2 py-0.5 rounded-none bg-emerald-950/80 backdrop-blur-md border border-emerald-500/50 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>Concluída</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-none bg-black/80 backdrop-blur-md text-[10px] font-mono text-white flex items-center gap-1 border border-white/10">
                    <Clock className="w-2.5 h-2.5 text-orange-400" />
                    <span>{Math.round((lesson.durationSeconds || 780) / 60)} min</span>
                  </span>
                )}
              </div>

              {/* Center Glowing Play Button & "Assistir agora" text */}
              <div className="relative z-10 flex flex-col items-center justify-center my-auto pt-4 group">
                {!authResult.authorized ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-none bg-[#121418]/90 border border-slate-700 flex items-center justify-center shadow-lg backdrop-blur-sm">
                      <Lock className="w-6 h-6 text-slate-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-400">Bloqueada</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-none bg-orange-600 hover:bg-orange-500 flex items-center justify-center shadow-[0_0_20px_rgba(234,88,12,0.8)] group-hover:shadow-[0_0_30px_rgba(249,115,22,1)] group-hover:scale-110 transition-all duration-300">
                      <Play className="w-6 sm:w-7 h-6 sm:h-7 text-white fill-white ml-1 drop-shadow" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-white tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] group-hover:text-orange-300 transition">
                      Assistir agora
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Card Title */}
              <div className="relative z-10 pt-2 border-t border-white/10">
                <h4 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  Aula {lesson.order} - {lesson.title.replace(/^\d+(\.\d+)?\s*/, '')}
                </h4>
                {lesson.description && (
                  <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5 drop-shadow">
                    {lesson.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

