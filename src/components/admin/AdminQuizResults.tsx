import React, { useState, useMemo } from 'react';
import { useLmsData } from '../../context/LmsDataContext';
import { useAuth } from '../../context/AuthContext';
import { QuizAttempt, Activity, Course } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  ClipboardCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Trash2,
  Filter,
  User as UserIcon,
  BookOpen,
  Award,
  AlertCircle,
  X,
  Printer,
  ChevronDown,
  Sparkles,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const AdminQuizResults: React.FC = () => {
  const { quizAttempts, courses, deleteQuizAttempt } = useLmsData();
  const { usersList, currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');
  const [selectedActivityFilter, setSelectedActivityFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'score_high' | 'score_low' | 'name'>('recent');

  // Selected attempt for detailed review modal
  const [inspectingAttempt, setInspectingAttempt] = useState<QuizAttempt | null>(null);

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

  // Map activities across all courses for fast lookup
  const activityMap = useMemo(() => {
    const map = new Map<string, { activity: Activity; course: Course; lessonTitle?: string }>();
    courses.forEach((c) => {
      (c.modules || []).forEach((m) => {
        (m.lessons || []).forEach((l) => {
          (l.activities || []).forEach((act) => {
            map.set(act.id, { activity: act, course: c, lessonTitle: l.title });
          });
        });
      });
    });
    return map;
  }, [courses]);

  // List of all activities for filter dropdown
  const allActivitiesList = useMemo(() => {
    const list: Array<{ id: string; title: string; courseTitle: string }> = [];
    activityMap.forEach(({ activity, course }) => {
      list.push({ id: activity.id, title: activity.title, courseTitle: course.title });
    });
    return list;
  }, [activityMap]);

  // Enriched and filtered attempts list
  const enrichedAttempts = useMemo(() => {
    return quizAttempts.map((attempt) => {
      const student = usersList.find((u) => u.id === attempt.studentId);
      const actData = activityMap.get(attempt.activityId);

      return {
        ...attempt,
        studentName: student?.name || 'Aluno Vulcan',
        studentEmail: student?.email || 'aluno@vulcan.com',
        studentDoc: student?.registrationNumber || 'REC-VLC-000',
        studentRank: student?.rank || 'Aluno Recruta',
        studentAvatar: student?.avatarUrl,
        activityTitle: actData?.activity.title || 'Simulado / Prova',
        activityType: actData?.activity.type || 'QUIZ',
        minScore: actData?.activity.minScore || 70,
        courseTitle: actData?.course.title || 'Curso Vulcan',
        courseId: actData?.course.id || '',
        activityObj: actData?.activity,
      };
    });
  }, [quizAttempts, usersList, activityMap]);

  const filteredAttempts = useMemo(() => {
    return enrichedAttempts
      .filter((att) => {
        const matchesSearch =
          att.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          att.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          att.studentDoc.toLowerCase().includes(searchTerm.toLowerCase()) ||
          att.activityTitle.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (selectedCourseFilter !== 'ALL' && att.courseId !== selectedCourseFilter) {
          return false;
        }

        if (selectedActivityFilter !== 'ALL' && att.activityId !== selectedActivityFilter) {
          return false;
        }

        if (selectedStatusFilter === 'PASSED' && !att.passed) return false;
        if (selectedStatusFilter === 'FAILED' && att.passed) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          return new Date(b.finishedAt || b.startedAt).getTime() - new Date(a.finishedAt || a.startedAt).getTime();
        }
        if (sortBy === 'score_high') {
          return b.score - a.score;
        }
        if (sortBy === 'score_low') {
          return a.score - b.score;
        }
        if (sortBy === 'name') {
          return a.studentName.localeCompare(b.studentName);
        }
        return 0;
      });
  }, [enrichedAttempts, searchTerm, selectedCourseFilter, selectedActivityFilter, selectedStatusFilter, sortBy]);

  // Overall Statistics
  const totalAttemptsCount = quizAttempts.length;
  const passedAttemptsCount = quizAttempts.filter((a) => a.passed).length;
  const failedAttemptsCount = totalAttemptsCount - passedAttemptsCount;
  const passRate = totalAttemptsCount > 0 ? Math.round((passedAttemptsCount / totalAttemptsCount) * 100) : 0;
  const avgScore =
    totalAttemptsCount > 0
      ? Math.round(quizAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / totalAttemptsCount)
      : 0;

  const uniqueStudentsCount = new Set(quizAttempts.map((a) => a.studentId)).size;

  const handlePrintExam = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-orange-400" />
            <span>Auditoria & Avaliação de Rendimento</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Resultados e Respostas de Simulados & Quizzes
          </h1>
          <p className="text-xs text-slate-300">
            Acompanhe o desempenho individual de cada aluno, audite questões acertadas/erradas e monitore a prontidão técnica.
          </p>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-none bg-[#121418] border border-slate-800 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Provas Realizadas</span>
            <ClipboardCheck className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalAttemptsCount}</div>
          <p className="text-[11px] text-slate-400 font-mono">{uniqueStudentsCount} alunos avaliados</p>
        </div>

        <div className="p-5 rounded-none bg-[#121418] border border-slate-800 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Média Geral das Notas</span>
            <TrendingUp className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-white">{avgScore}%</div>
          <p className="text-[11px] text-slate-400 font-mono">Nota mínima média: 70%</p>
        </div>

        <div className="p-5 rounded-none bg-[#121418] border border-slate-800 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Taxa de Aprovação</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{passRate}%</div>
          <p className="text-[11px] text-emerald-400/80 font-mono">{passedAttemptsCount} aprovações</p>
        </div>

        <div className="p-5 rounded-none bg-[#121418] border border-slate-800 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Reprovações / Reforço</span>
            <AlertCircle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400">{failedAttemptsCount}</div>
          <p className="text-[11px] text-orange-400/80 font-mono">Precisam de revisão teórica</p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-5 rounded-none bg-[#121418] border border-slate-800 space-y-4 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por aluno, e-mail, matrícula ou simulado..."
              className="w-full pl-10 pr-4 py-2 rounded-none bg-[#0c0b0e] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Filter by Course */}
          <div>
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-none bg-[#0c0b0e] border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Todos os Cursos</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Specific Activity */}
          <div>
            <select
              value={selectedActivityFilter}
              onChange={(e) => setSelectedActivityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-none bg-[#0c0b0e] border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Todos os Simulados</option>
              {allActivitiesList.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sub-Filters: Status & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-orange-400" />
              Status:
            </span>
            {(['ALL', 'PASSED', 'FAILED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatusFilter(status)}
                className={`px-3 py-1 text-xs font-semibold rounded-none transition cursor-pointer ${
                  selectedStatusFilter === status
                    ? 'bg-orange-600 text-white font-bold'
                    : 'bg-[#0c0b0e] border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {status === 'ALL' ? 'Todos' : status === 'PASSED' ? 'Aprovados' : 'Reprovados'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 rounded-none bg-[#0c0b0e] border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="recent">Mais Recentes</option>
              <option value="score_high">Maior Nota</option>
              <option value="score_low">Menor Nota</option>
              <option value="name">Nome do Aluno (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results List / Table */}
      <div className="space-y-3">
        {filteredAttempts.length === 0 ? (
          <div className="p-12 text-center bg-[#121418] border border-slate-800 rounded-none space-y-3">
            <ClipboardCheck className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Nenhuma tentativa de simulado encontrada</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Assim que os alunos realizarem simulados e quizzes avaliativos, as notas e o espelho de respostas completo aparecerão listados aqui para auditoria.
            </p>
          </div>
        ) : (
          filteredAttempts.map((attempt) => {
            const dateStr = new Date(attempt.finishedAt || attempt.startedAt).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            // Calculate answered vs correct count
            const totalQuestions = attempt.activityObj?.questions?.length || Object.keys(attempt.answers || {}).length || 1;
            const correctCount = Math.round((attempt.score / 100) * totalQuestions);

            return (
              <div
                key={attempt.id}
                className="p-5 rounded-none bg-[#121418] border border-slate-800 hover:border-orange-500/50 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 shadow-sm"
              >
                {/* Left: Student & Quiz Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-none bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                    {attempt.studentAvatar ? (
                      <img
                        src={attempt.studentAvatar}
                        alt={attempt.studentName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      attempt.studentName.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-white truncate max-w-sm">
                        {attempt.studentName}
                      </h3>
                      <span className="px-2 py-0.5 rounded-none bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
                        {attempt.studentDoc}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate">({attempt.studentEmail})</span>
                    </div>

                    <div className="text-xs font-bold text-orange-300 flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span>{attempt.activityTitle}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400 font-normal">{attempt.courseTitle}</span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {dateStr}
                      </span>
                      <span>•</span>
                      <span>
                        {correctCount}/{totalQuestions} acertos ({attempt.score}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Score Pill & Action Buttons */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-slate-800 pt-3 lg:pt-0">
                  <div className="text-right">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-none text-xs font-bold font-mono border ${
                        attempt.passed
                          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
                          : 'bg-orange-950/60 border-orange-500/50 text-orange-400'
                      }`}
                    >
                      {attempt.passed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>APROVADO • {attempt.score}%</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-orange-400" />
                          <span>REPROVADO • {attempt.score}%</span>
                        </>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      Mínimo: {attempt.minScore}%
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInspectingAttempt(attempt)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-md shadow-orange-950/40 cursor-pointer"
                      title="Ver Respostas Detalhadas"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Gabarito</span>
                    </button>

                    <button
                      onClick={() => {
                        setConfirmDialog({
                          isOpen: true,
                          title: 'Excluir / Resetar Tentativa',
                          message: `Deseja excluir a tentativa do aluno "${attempt.studentName}" no simulado "${attempt.activityTitle}"? O aluno poderá refazer a avaliação.`,
                          onConfirm: () => {
                            deleteQuizAttempt(attempt.id);
                          },
                        });
                      }}
                      className="p-2 rounded-none bg-[#0c0b0e] hover:bg-red-950/60 border border-slate-800 hover:border-red-600/60 text-slate-400 hover:text-red-400 transition cursor-pointer"
                      title="Excluir / Resetar Tentativa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detailed Exam & Answers Review Modal */}
      {inspectingAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
          <div className="relative w-full max-w-4xl rounded-none bg-[#0c0b0e] border border-slate-800 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:text-black print:bg-white">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5 mb-6 print:border-slate-300">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider print:text-orange-600">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Espelho Oficial de Avaliação & Auditoria de Respostas</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white print:text-black">
                  {inspectingAttempt.activityTitle || 'Simulado Oficial'}
                </h2>
                <p className="text-xs text-slate-300 print:text-slate-700">
                  Curso: <strong className="text-white print:text-black">{inspectingAttempt.courseTitle}</strong> • Realizado em:{' '}
                  <span className="font-mono text-slate-300 print:text-slate-700">
                    {new Date(inspectingAttempt.finishedAt || inspectingAttempt.startedAt).toLocaleString('pt-BR')}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={handlePrintExam}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-none bg-[#121418] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
                  title="Imprimir Relatório de Avaliação"
                >
                  <Printer className="w-3.5 h-3.5 text-orange-400" />
                  <span>Imprimir</span>
                </button>

                <button
                  onClick={() => setInspectingAttempt(null)}
                  className="p-2 rounded-none bg-[#121418] hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Student & Score Summary Card */}
            <div
              className={`p-5 rounded-none border mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                inspectingAttempt.passed
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 print:bg-emerald-50 print:border-emerald-300 print:text-emerald-900'
                  : 'bg-orange-950/40 border-orange-500/40 text-orange-200 print:bg-orange-50 print:border-orange-300 print:text-orange-900'
              }`}
            >
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-300 print:text-slate-600">Dados do Aluno Avaliado:</div>
                <div className="text-base font-black text-white print:text-black flex items-center gap-2">
                  <span>{inspectingAttempt.studentName}</span>
                  <span className="text-xs font-mono font-normal px-2 py-0.5 bg-black/40 rounded-none text-slate-300 print:bg-slate-200 print:text-slate-800">
                    Matrícula: {inspectingAttempt.studentDoc}
                  </span>
                </div>
                <div className="text-xs text-slate-300 print:text-slate-600 font-mono">
                  {inspectingAttempt.studentEmail} • Cargo/Posto: {inspectingAttempt.studentRank}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs uppercase font-bold tracking-wider">Resultado Obtido:</div>
                <div className="text-2xl font-black font-mono">
                  {inspectingAttempt.score}% ({inspectingAttempt.passed ? 'APROVADO' : 'REPROVADO'})
                </div>
                <div className="text-[11px] opacity-80 font-mono">
                  Critério de Corte: {inspectingAttempt.minScore}%
                </div>
              </div>
            </div>

            {/* Questions Detailed Audit List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 print:border-slate-300">
                <h3 className="text-sm font-bold text-white print:text-black flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-orange-400" />
                  Detalhamento Questão por Questão ({inspectingAttempt.activityObj?.questions?.length || 0} questões)
                </h3>
                <span className="text-xs text-slate-400 print:text-slate-600 font-mono">
                  Respostas registradas pelo sistema
                </span>
              </div>

              {inspectingAttempt.activityObj?.questions && inspectingAttempt.activityObj.questions.length > 0 ? (
                inspectingAttempt.activityObj.questions.map((q, qIndex) => {
                  const studentAnswerId = inspectingAttempt.answers?.[q.id];
                  const correctAnswer = q.answers.find((a) => a.isCorrect);
                  const isCorrect = studentAnswerId === correctAnswer?.id;

                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-none border space-y-3.5 transition ${
                        isCorrect
                          ? 'bg-[#121418] border-slate-800 print:bg-slate-50 print:border-slate-200'
                          : 'bg-[#141014] border-orange-900/50 print:bg-orange-50/50 print:border-orange-200'
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span
                            className={`w-7 h-7 rounded-none flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-orange-600 text-white'
                            }`}
                          >
                            {qIndex + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-white print:text-black leading-snug">
                              {q.prompt}
                            </h4>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isCorrect ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-none bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[11px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Acertou
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-none bg-orange-950/80 border border-orange-500/50 text-orange-400 text-[11px] font-bold">
                              <XCircle className="w-3.5 h-3.5" />
                              Errou
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Alternatives List */}
                      <div className="space-y-2 pt-1 pl-10">
                        {q.answers.map((ans, aIndex) => {
                          const letters = ['A', 'B', 'C', 'D', 'E'];
                          const isStudentChoice = studentAnswerId === ans.id;
                          const isOfficialCorrect = ans.isCorrect;

                          let containerStyle = 'bg-[#0c0b0e] border-slate-800 text-slate-300 print:bg-white print:border-slate-200 print:text-slate-800';
                          let badgeText = null;

                          if (isOfficialCorrect && isStudentChoice) {
                            containerStyle =
                              'bg-emerald-950/40 border-emerald-500 text-white font-medium print:bg-emerald-50 print:border-emerald-500 print:text-emerald-950';
                            badgeText = '✓ Resposta Correta do Aluno (Gabarito)';
                          } else if (isStudentChoice && !isOfficialCorrect) {
                            containerStyle =
                              'bg-orange-950/40 border-orange-500 text-orange-200 font-medium print:bg-orange-50 print:border-orange-500 print:text-orange-950';
                            badgeText = '✗ Resposta Incorreta Marcada pelo Aluno';
                          } else if (isOfficialCorrect && !isStudentChoice) {
                            containerStyle =
                              'bg-emerald-950/20 border-emerald-500/60 text-emerald-300 print:bg-emerald-50/50 print:border-emerald-400 print:text-emerald-900';
                            badgeText = '★ Gabarito Oficial Correto';
                          }

                          return (
                            <div
                              key={ans.id}
                              className={`p-3 rounded-none border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition ${containerStyle}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-none bg-slate-800 print:bg-slate-200 text-white print:text-black font-mono font-bold flex items-center justify-center text-[11px] shrink-0">
                                  {letters[aIndex]}
                                </span>
                                <span>{ans.text}</span>
                              </div>

                              {badgeText && (
                                <span
                                  className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-none shrink-0 ${
                                    isOfficialCorrect && isStudentChoice
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                      : isStudentChoice
                                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  }`}
                                >
                                  {badgeText}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Technical Explanation / Normative reference */}
                      {q.explanation && (
                        <div className="mt-3 p-3 rounded-none bg-[#0c0b0e] border-l-2 border-orange-500 text-xs text-slate-300 print:bg-slate-100 print:text-slate-800 ml-10 space-y-1">
                          <span className="font-bold text-orange-400 print:text-orange-600 block">
                            Justificativa Técnica / Base Normativa:
                          </span>
                          <p className="leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-[#121418] border border-slate-800 text-xs text-slate-400">
                  Os detalhes completos das questões deste simulado não estão mais disponíveis no catálogo do curso.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800 print:hidden">
              <span className="text-xs text-slate-400 font-mono">
                ID da Tentativa: {inspectingAttempt.id}
              </span>
              <button
                onClick={() => setInspectingAttempt(null)}
                className="px-6 py-2.5 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Fechar Espelho de Prova
              </button>
            </div>
          </div>
        </div>
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
