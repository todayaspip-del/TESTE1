import React from 'react';
import { Course } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLmsData } from '../../context/LmsDataContext';
import { Clock, Flame, TrendingUp, ChevronRight, Play } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  onSelect: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onSelect }) => {
  const { currentUser } = useAuth();
  const { getCourseProgress } = useLmsData();

  const progress = currentUser ? getCourseProgress(currentUser.id, course.id) : null;
  const isComplete = progress && progress.progressPct >= 100;

  return (
    <div
      onClick={onSelect}
      className="group relative flex flex-col items-center text-center p-5 transition-all duration-300 cursor-pointer select-none"
    >
      {/* Floating 3D Icon with Ambient Glow */}
      <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center transition-all duration-500 group-hover:-translate-y-3 group-hover:scale-105">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-orange-500/20 rounded-full blur-2xl group-hover:bg-orange-500/35 transition-all duration-500" />
        
        {/* Floor Shadow */}
        <div className="absolute bottom-2 w-28 h-5 bg-black/80 rounded-full blur-md scale-90 group-hover:scale-75 group-hover:opacity-60 transition-all duration-500" />
        
        {/* 3D Image */}
        <img
          src="https://i.ibb.co/HLSLBX1V/LOGOS-DOS-CURSOS.png"
          alt={course.title}
          className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.9)] drop-shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all duration-500"
        />
      </div>

      {/* Floating Content */}
      <div className="w-full space-y-3 pt-2 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-orange-500/15 border border-orange-500/40 text-[10px] font-mono font-bold text-orange-400 uppercase">
              {course.code || 'VULCAN'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[10px] font-semibold text-slate-300">
              {course.category}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#121418] border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-orange-400" />
              {course.totalHours}h
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-white group-hover:text-orange-400 transition-colors leading-snug">
            {course.title}
          </h3>
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed max-w-sm mx-auto">
            {course.description || 'Formação técnica profissional homologada com aulas práticas e teóricas.'}
          </p>
        </div>

        {/* Progress & Action */}
        <div className="space-y-3 pt-2 max-w-sm mx-auto w-full">
          {progress && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <TrendingUp className="w-3 h-3 text-orange-400" />
                  Progresso
                </span>
                <span className="font-mono text-emerald-400">{progress.progressPct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isComplete
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-orange-600 to-amber-500'
                  }`}
                  style={{ width: `${progress.progressPct}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 pt-1">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 group-hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-950/80 transition-all duration-300">
              <Play className="w-3 h-3 fill-white" />
              <span>{isComplete ? 'Revisar Aulas' : 'Acessar Curso'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

