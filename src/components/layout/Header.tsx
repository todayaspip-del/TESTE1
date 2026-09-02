import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../lib/rbac';
import { Bell, ChevronDown, Flame, LogOut, AlertTriangle, User as UserIcon, ShieldCheck, Search, Trash2, Menu } from 'lucide-react';
import { useLmsData } from '../../context/LmsDataContext';

interface HeaderProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenMobileNav?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ setActiveView, onOpenMobileNav }) => {
  const { currentUser, organization, logout } = useAuth();
  const { announcements, courses, getCourseProgress, deleteAnnouncement } = useLmsData();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const roleInfo = currentUser ? ROLE_LABELS[currentUser.role] : null;
  const urgentAnnouncements = announcements.filter((a) => a.urgent);

  const studentProgress =
    currentUser?.role === 'STUDENT' && courses[0]
      ? getCourseProgress(currentUser.id, courses[0].id)
      : null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 w-full bg-[#0c0b0e]/95 backdrop-blur-md border-b border-slate-900/60 px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4 select-none">
      {/* Left: Mobile menu button + Quick Search */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Hamburger - mobile / tablet only, opens the off-canvas sidebar */}
        <button
          onClick={onOpenMobileNav}
          className="shrink-0 p-2 rounded-none bg-[#0e1017] border border-slate-800 text-slate-300 hover:text-white hover:border-orange-500/50 transition cursor-pointer lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="relative w-full max-w-[220px] sm:max-w-none sm:w-64 lg:w-88">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="w-full pl-10 pr-3 sm:pr-4 py-2 rounded-none bg-[#0e1017] border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
          />
        </div>
      </div>

      {/* Right: Progress, Notifications & User Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
        {/* Student Quick Progress Pill */}
        {currentUser?.role === 'STUDENT' && studentProgress && (
          <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-none bg-[#0e1017] border border-slate-800 shadow-inner">
            <div className="flex items-center gap-1.5 text-xs text-white">
              <span className="text-slate-400">Turma Alfa:</span>
              <span className="font-semibold text-white">
                {studentProgress.completedLessonsCount}/{studentProgress.totalLessonsCount} aulas
              </span>
            </div>
            <div className="w-20 h-1.5 bg-slate-800 rounded-none overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-none transition-all duration-500"
                style={{ width: `${studentProgress.progressPct}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-orange-400">{studentProgress.progressPct}%</span>
          </div>
        )}

        {/* Notifications Flyout */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="relative p-2 rounded-none bg-[#0e1017] border border-slate-800 hover:border-orange-500/50 text-slate-300 hover:text-white transition cursor-pointer"
            title="Notificações & Comunicados"
          >
            <Bell className="w-4 h-4" />
            {urgentAnnouncements.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-none bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center">
                {urgentAnnouncements.length}
              </span>
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-auto mt-0 sm:mt-2 w-auto sm:w-96 max-w-full rounded-none bg-[#121418] border border-slate-800 shadow-2xl p-4 z-50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-1">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-400" />
                  Comunicados Oficiais
                </h4>
                <span className="text-xs text-slate-400">{announcements.length} recados</span>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className={`p-3 rounded-none border text-xs ${
                      a.urgent
                        ? 'bg-orange-950/40 border-orange-600/60 text-orange-100'
                        : 'bg-[#0c0b0e] border-slate-800 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="flex items-center gap-1 text-white">
                        {a.urgent && <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />}
                        {a.title}
                      </span>
                      {['ADMIN', 'SUPER_ADMIN', 'INSTRUCTOR'].includes(currentUser?.role || '') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAnnouncement(a.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-400 transition cursor-pointer"
                          title="Excluir comunicado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-200 leading-relaxed">{a.body}</p>
                    <div className="mt-2 text-[10px] text-orange-400 font-mono">Por {a.authorName}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Signed-in user only */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-none bg-[#0e1017] hover:bg-slate-800/80 border border-slate-800 hover:border-orange-500/50 transition cursor-pointer group"
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-7 h-7 rounded-none object-cover ring-1 ring-slate-700"
              />
            ) : (
              <div className="w-7 h-7 rounded-none bg-orange-600 flex items-center justify-center font-bold text-xs text-white">
                {currentUser?.name.charAt(0) || 'U'}
              </div>
            )}
            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-white leading-tight">
                {currentUser?.name}
              </div>
              <div className="text-[10px] text-orange-400">
                {roleInfo?.label || currentUser?.rank || 'Aluno'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
          </button>

          {showUserMenu && (
            <div className="fixed sm:absolute right-3 sm:right-0 left-3 sm:left-auto top-16 sm:top-auto mt-0 sm:mt-2 w-auto sm:w-64 max-w-full rounded-none bg-[#121418] border border-slate-800 shadow-2xl p-3 z-50 space-y-1">
              <div className="flex items-center gap-3 p-2 border-b border-slate-800 pb-3 mb-2">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-none object-cover ring-1 ring-slate-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-none bg-orange-600 flex items-center justify-center font-bold text-white">
                    {currentUser?.name.charAt(0) || 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">{currentUser?.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{currentUser?.email}</div>
                </div>
              </div>

              {roleInfo && (
                <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-none border text-[11px] font-semibold mb-2 ${roleInfo.color}`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {roleInfo.label}
                </div>
              )}

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  setActiveView('dashboard');
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-none text-left text-xs font-semibold text-white hover:bg-slate-800/80 transition cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-orange-400" />
                Minha Área
              </button>

              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 p-2 rounded-none text-left text-xs font-semibold text-red-400 hover:bg-red-950/40 transition cursor-pointer border-t border-slate-800 pt-2 mt-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair da conta
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
