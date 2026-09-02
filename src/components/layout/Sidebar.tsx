import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Tv,
  ClipboardCheck,
  FolderDown,
  Calendar,
  Award,
  HelpCircle,
  MessageCircle,
  LogOut,
  ShieldCheck,
  Layers,
  FileText,
  Users,
  History,
  Sparkles,
  X,
  ExternalLink,
} from 'lucide-react';
import { ROLE_LABELS } from '../../lib/rbac';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenCertificateModal?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { currentUser, logout } = useAuth();
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);

  if (!currentUser) return null;

  const isStudent = currentUser.role === 'STUDENT';
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);
  const isInstructor = currentUser.role === 'INSTRUCTOR';
  const roleMeta = ROLE_LABELS[currentUser.role];

  // Wraps setActiveView so that on mobile, selecting a nav item also closes the drawer
  const handleNavigate = (view: string) => {
    setActiveView(view);
    onCloseMobile?.();
  };

  return (
    <>
      {/* Mobile backdrop overlay - only rendered/visible when drawer is open, hidden entirely on lg+ */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[300px] transform transition-transform duration-300 ease-in-out
          lg:static lg:z-30 lg:w-64 xl:w-72 lg:max-w-none lg:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          shrink-0 flex flex-col bg-[#121418] border-r border-slate-900/90 h-screen lg:min-h-screen text-slate-300 select-none`}
      >
        {/* Top Brand Logo */}
        <div
          className="relative p-4 sm:p-5 lg:p-6 flex items-center justify-center cursor-pointer border-b border-slate-900/90 hover:opacity-95 transition group shrink-0"
          onClick={() => handleNavigate('dashboard')}
        >
          <img
            src="https://i.ibb.co/SDLZxn5X/LOGO-VULCAN.png"
            alt="Vulcan LMS"
            className="h-16 sm:h-20 lg:h-24 w-auto max-w-[230px] object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
          {/* Close button, mobile only */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCloseMobile?.();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-none text-slate-400 hover:text-white lg:hidden cursor-pointer"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-800">
          {/* Main Menu */}
          <nav className="space-y-1">
            <button
              onClick={() => handleNavigate('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-none text-xs font-semibold transition cursor-pointer ${
                activeView === 'dashboard'
                  ? 'bg-orange-500/15 text-white font-bold border-l-2 border-orange-500 pl-3'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <Home className={`w-4 h-4 ${activeView === 'dashboard' ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>Início</span>
            </button>

            <button
              onClick={() => handleNavigate('courses')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-none text-xs font-semibold transition cursor-pointer ${
                activeView === 'courses' || activeView === 'lesson' || activeView === 'course-detail'
                  ? 'bg-orange-500/15 text-white font-bold border-l-2 border-orange-500 pl-3'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <Tv className={`w-4 h-4 ${activeView === 'courses' ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>Cursos & Aulas</span>
            </button>

            <button
              onClick={() => handleNavigate('activities')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-none text-xs font-semibold transition cursor-pointer ${
                activeView === 'activities'
                  ? 'bg-orange-500/15 text-white font-bold border-l-2 border-orange-500 pl-3'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <ClipboardCheck className={`w-4 h-4 ${activeView === 'activities' ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>Simulados & Quizzes</span>
            </button>

            <button
              onClick={() => handleNavigate('materials')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-none text-xs font-semibold transition cursor-pointer ${
                activeView === 'materials'
                  ? 'bg-orange-500/15 text-white font-bold border-l-2 border-orange-500 pl-3'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <FolderDown className={`w-4 h-4 ${activeView === 'materials' ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>Apostilas & PDFs</span>
            </button>

            <button
              onClick={() => handleNavigate('calendar')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-none text-xs font-semibold transition cursor-pointer ${
                activeView === 'calendar'
                  ? 'bg-orange-500/15 text-white font-bold border-l-2 border-orange-500 pl-3'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <Calendar className={`w-4 h-4 ${activeView === 'calendar' ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>Calendário</span>
            </button>

            <button
              onClick={() => handleNavigate('certificates')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-none text-xs font-semibold transition cursor-pointer ${
                activeView === 'certificates'
                  ? 'bg-orange-500/15 text-white font-bold border-l-2 border-orange-500 pl-3'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <Award className={`w-4 h-4 ${activeView === 'certificates' ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>Certificados</span>
            </button>

            <div className="pt-2 border-t border-slate-900/80">
              <button
                onClick={() => setShowSupportModal(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-none text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900/80 transition cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-orange-400" />
                <span>Suporte</span>
              </button>

              <button
                onClick={() => setShowVipModal(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-none text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/20 transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Grupo para Alunos</span>
              </button>
            </div>
          </nav>

          {/* Instructor / Admin Section */}
          {(!isStudent || isAdmin || isInstructor) && (
            <div className="pt-2 border-t border-slate-900">
              <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
                <span>Gestão & Comando</span>
                <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => handleNavigate('admin-dashboard')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-none text-xs font-semibold transition cursor-pointer ${
                    activeView === 'admin-dashboard'
                      ? 'bg-orange-500/15 text-white border-l-2 border-orange-500 pl-3 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <Layers className="w-4 h-4 text-orange-400" />
                  <span>Painel Admin</span>
                </button>

                <button
                  onClick={() => handleNavigate('admin-courses')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-none text-xs font-semibold transition cursor-pointer ${
                    activeView === 'admin-courses'
                      ? 'bg-orange-500/15 text-white border-l-2 border-orange-500 pl-3 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <FileText className="w-4 h-4 text-orange-400" />
                  <span>Gestor de Cursos</span>
                </button>

                <button
                  onClick={() => handleNavigate('admin-students')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-none text-xs font-semibold transition cursor-pointer ${
                    activeView === 'admin-students'
                      ? 'bg-orange-500/15 text-white border-l-2 border-orange-500 pl-3 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <Users className="w-4 h-4 text-orange-400" />
                  <span>Turmas & Alunos</span>
                </button>

                <button
                  onClick={() => handleNavigate('admin-quizzes')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-none text-xs font-semibold transition cursor-pointer ${
                    activeView === 'admin-quizzes'
                      ? 'bg-orange-500/15 text-white border-l-2 border-orange-500 pl-3 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <ClipboardCheck className="w-4 h-4 text-orange-400" />
                  <span>Resultados de Simulados</span>
                </button>

                <button
                  onClick={() => handleNavigate('admin-audit')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-none text-xs font-semibold transition cursor-pointer ${
                    activeView === 'admin-audit'
                      ? 'bg-orange-500/15 text-white border-l-2 border-orange-500 pl-3 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <History className="w-4 h-4 text-orange-400" />
                  <span>Auditoria RBAC</span>
                </button>
              </nav>
            </div>
          )}

          {/* Promotional / VIP Side Card */}
          <div className="relative rounded-none overflow-hidden p-4 bg-gradient-to-b from-orange-950/40 via-orange-900/20 to-[#121418] border border-orange-500/40 text-center space-y-2.5 group">
            <div className="text-[11px] font-extrabold tracking-wider uppercase text-orange-400">
              RECEBA 15 DIAS DE ACESSO
            </div>
            <div className="text-sm font-black text-white leading-tight">
              100% GRATUITO
            </div>
            <button
              onClick={() => setShowVipModal(true)}
              className="w-full py-2.5 px-3 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-black tracking-wider uppercase shadow-lg shadow-orange-950/80 transition cursor-pointer active:scale-[0.99]"
            >
              RESGATAR
            </button>
            <div className="pt-1 flex items-center justify-center gap-1 text-[10px] font-mono text-orange-400/80">
              <Sparkles className="w-3 h-3 text-orange-400" />
              <span>VULCAN VIP PASS</span>
            </div>
          </div>
        </div>

        {/* Bottom Sair Section */}
        <div className="p-4 border-t border-slate-900/90 bg-[#121418]">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-none text-xs font-bold text-slate-300 hover:text-orange-400 hover:bg-orange-950/20 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121418] border border-slate-800 rounded-none p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-white">Central de Suporte Vulcan</h3>
              </div>
              <button
                onClick={() => setShowSupportModal(false)}
                className="p-1 rounded-none text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              Precisa de ajuda com suas aulas, certificados NBR 14608 ou acesso à plataforma?
              Nossa equipe de instrutores e suporte técnico está à disposição.
            </p>
            <div className="space-y-2 pt-2">
              <a
                href="mailto:suporte@vulcanadm.com"
                className="flex items-center justify-between p-3 rounded-none bg-[#0c0b0e] border border-slate-800 hover:border-orange-500/50 text-xs text-white transition"
              >
                <span>E-mail: suporte@vulcanadm.com</span>
                <ExternalLink className="w-4 h-4 text-orange-400" />
              </a>
              <button
                onClick={() => {
                  setShowSupportModal(false);
                  setShowVipModal(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-none bg-emerald-950/40 border border-emerald-800/40 hover:border-emerald-500 text-xs text-emerald-300 font-bold transition cursor-pointer"
              >
                <span>Plantão WhatsApp de Dúvidas</span>
                <MessageCircle className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp VIP Modal */}
      {showVipModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121418] border border-orange-500/40 rounded-none p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">Comunidade & Grupo VIP</h3>
              </div>
              <button
                onClick={() => setShowVipModal(false)}
                className="p-1 rounded-none text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 rounded-none bg-orange-950/30 border border-orange-600/40 space-y-2 text-center">
              <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                Grupo Oficial de Alunos Vulcan
              </div>
              <p className="text-xs text-slate-200">
                Tire dúvidas diretamente com os instrutores, receba avisos de simulados práticos e faça networking com outros brigadistas.
              </p>
            </div>
            <button
              onClick={() => {
                alert('Redirecionando para o canal oficial de WhatsApp dos Alunos Vulcan...');
                setShowVipModal(false);
              }}
              className="w-full py-3 rounded-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Acessar Grupo no WhatsApp</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

