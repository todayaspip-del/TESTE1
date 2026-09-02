import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLmsData } from '../../context/LmsDataContext';
import {
  Users,
  BookOpen,
  Award,
  Shield,
  Layers,
  Flame,
  AlertTriangle,
  Clock,
  TrendingUp,
  ChevronRight,
  History,
  ClipboardCheck,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { courses, classrooms, enrollments, certificates, auditLogs, announcements, quizAttempts } = useLmsData();

  const totalLessons = courses.reduce(
    (acc, c) => acc + c.modules.reduce((mAcc, m) => mAcc + m.lessons.length, 0),
    0
  );

  const passedQuizzes = quizAttempts.filter((a) => a.passed).length;
  const passRate = quizAttempts.length > 0 ? Math.round((passedQuizzes / quizAttempts.length) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Coordenação Pedagógica & Comando Geral</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Centro de Controle LMS — Bombeiro Civil
          </h1>
          <p className="text-xs text-slate-400">
            Painel consolidado de turmas, progresso NBR 14608, registros de auditoria e prontuários.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('admin-courses')}
            className="px-4 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-950/40 cursor-pointer"
          >
            + Nova Aula / Vídeo
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-none bg-[#121418] border border-slate-800 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Turmas Ativas</span>
            <Layers className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-white">{classrooms.length}</div>
          <p className="text-[11px] text-slate-400">{enrollments.length} recrutas matriculados</p>
        </div>

        <div className="p-5 rounded-none bg-[#121418] border border-slate-800 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Aulas Homologadas</span>
            <BookOpen className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalLessons}</div>
          <p className="text-[11px] text-slate-400">{courses.length} cursos cadastrados</p>
        </div>

        <div className="p-5 rounded-none bg-[#121418] border border-slate-800 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Certificados Emitidos</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{certificates.length}</div>
          <p className="text-[11px] text-slate-400">NBR 14608 chancelados</p>
        </div>

        <div className="p-5 rounded-none bg-[#121418] border border-slate-800 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Eventos Auditados</span>
            <History className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-white">{auditLogs.length}</div>
          <p className="text-[11px] text-slate-400">Trilha de conformidade</p>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          onClick={() => onNavigate('admin-courses')}
          className="p-5 rounded-none bg-[#121418] border border-slate-800 hover:border-orange-500/50 transition cursor-pointer space-y-3 group"
        >
          <div className="w-10 h-10 rounded-none bg-orange-500/10 text-orange-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-white group-hover:text-orange-400 transition">
            Gerenciamento Curricular
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cadastrar novos módulos, aulas em vídeo (YouTube IFrame API), regras de conclusão e materiais.
          </p>
          <div className="flex items-center gap-1 text-xs font-bold text-orange-400 pt-1">
            <span>Acessar editor</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('admin-students')}
          className="p-5 rounded-none bg-[#121418] border border-slate-800 hover:border-orange-500/50 transition cursor-pointer space-y-3 group"
        >
          <div className="w-10 h-10 rounded-none bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition">
            Turmas & Prontuários
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Acompanhar frequência e progresso de recrutas, registrar anotações confidenciais e emitir certificados.
          </p>
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 pt-1">
            <span>Ver alunos</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('admin-quizzes')}
          className="p-5 rounded-none bg-[#121418] border border-slate-800 hover:border-orange-500/50 transition cursor-pointer space-y-3 group"
        >
          <div className="w-10 h-10 rounded-none bg-orange-500/10 text-orange-400 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-white group-hover:text-orange-400 transition">
            Resultados de Simulados
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Auditar respostas questão por questão, notas obtidas ({passRate}% aprovação) e histórico de tentativas.
          </p>
          <div className="flex items-center gap-1 text-xs font-bold text-orange-400 pt-1">
            <span>Ver notas e gabaritos</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('admin-audit')}
          className="p-5 rounded-none bg-[#121418] border border-slate-800 hover:border-orange-500/50 transition cursor-pointer space-y-3 group"
        >
          <div className="w-10 h-10 rounded-none bg-orange-500/10 text-orange-400 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-white group-hover:text-orange-400 transition">
            Trilha de Auditoria & RBAC
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Logs imutáveis de acesso, validação de permissões e eventos de conclusão de aulas e simulados.
          </p>
          <div className="flex items-center gap-1 text-xs font-bold text-orange-400 pt-1">
            <span>Consultar registros</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Recent Audit Logs Snapshot */}
      <div className="p-6 rounded-none bg-[#121418] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <History className="w-4 h-4 text-orange-400" />
            Atividades Recentes no Sistema (Auditoria)
          </h3>
          <button
            onClick={() => onNavigate('admin-audit')}
            className="text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
          >
            Ver todos os logs
          </button>
        </div>

        <div className="space-y-2">
          {auditLogs.slice(0, 4).map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-none bg-[#0c0b0e] border border-slate-800/80 flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-none bg-[#121418] border border-slate-700 font-mono font-bold text-[10px] text-orange-400">
                  {log.action}
                </span>
                <span className="text-slate-200 font-medium">
                  {log.userName} ({log.userRole})
                </span>
              </div>
              <span className="text-slate-400 font-mono text-[10px]">
                {new Date(log.createdAt).toLocaleString('pt-BR')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
