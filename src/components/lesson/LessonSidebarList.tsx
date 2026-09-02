import React from 'react';
import { Course, Lesson, Enrollment, LessonProgress, User } from '../../types';
import { authorizeLessonAccess } from '../../lib/authorize';
import { CheckCircle, Lock, Play, Clock, ListVideo } from 'lucide-react';

interface LessonSidebarListProps {
  course: Course;
  currentLessonId: string;
  currentUser: User | null;
  enrollments: Enrollment[];
  lessonProgress: Record<string, LessonProgress>;
  onSelectLesson: (lessonId: string) => void;
}

export const LessonSidebarList: React.FC<LessonSidebarListProps> = ({
  course,
  currentLessonId,
  currentUser,
  enrollments,
  lessonProgress,
  onSelectLesson,
}) => {
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedCount = course.modules.reduce((acc, m) => {
    return (
      acc +
      m.lessons.filter((l) => lessonProgress[`${currentUser?.id}_${l.id}`]?.completed).length
    );
  }, 0);

  return (
    <aside className="lg:sticky lg:top-4 rounded-none bg-[#121418] border border-slate-800 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-[#0e1017] space-y-1.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold text-orange-400 uppercase tracking-wider">
            <ListVideo className="w-3.5 h-3.5" />
            <span>Grade da Turma</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {totalLessons} aulas
          </span>
        </div>
        <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
          {course.title}
        </h3>
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Progresso</span>
            <span className="font-mono font-bold text-white">
              {completedCount}/{totalLessons}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-none overflow-hidden">
            <div
              className="h-full bg-orange-600 rounded-none transition-all duration-500"
              style={{ width: `${totalLessons ? (completedCount / totalLessons) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Scrollable module/lesson list */}
      <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800">
        {course.modules.map((mod) => (
          <div key={mod.id}>
            <div className="px-4 py-2 bg-[#0c0b0e] border-y border-slate-800/70 sticky top-0 z-[1]">
              <span className="text-[10px] font-bold text-orange-400/80 uppercase tracking-wider">
                Módulo {mod.order} — {mod.title}
              </span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {mod.lessons.map((lesson: Lesson) => {
                const authResult =  authorizeLessonAccess({
                  user: currentUser,
                  action: 'lesson:view',
                  course,
                  module: mod,
                  lesson,
                  enrollments,
                  userLessonProgress: lessonProgress,
                });
                const progKey = `${currentUser?.id}_${lesson.id}`;
                const isDone = !!lessonProgress[progKey]?.completed;
                const isActive = lesson.id === currentLessonId;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => authResult.authorized && onSelectLesson(lesson.id)}
                    disabled={!authResult.authorized}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                      isActive
                        ? 'bg-orange-600/15 border-l-2 border-orange-500'
                        : 'border-l-2 border-transparent hover:bg-slate-800/50'
                    } ${!authResult.authorized ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="shrink-0">
                      {isDone ? (
                        <div className="w-6 h-6 rounded-none bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                      ) : !authResult.authorized ? (
                        <div className="w-6 h-6 rounded-none bg-slate-800 text-slate-500 flex items-center justify-center">
                          <Lock className="w-3 h-3" />
                        </div>
                      ) : (
                        <div
                          className={`w-6 h-6 rounded-none flex items-center justify-center ${
                            isActive
                              ? 'bg-orange-600 text-white'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          <Play className="w-3 h-3 ml-0.5 fill-current" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isActive ? 'text-orange-400 font-bold' : isDone ? 'text-slate-400' : 'text-white'
                        }`}
                      >
                        Aula {lesson.order} — {lesson.title}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{Math.round((lesson.durationSeconds || 780) / 60)} min</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
