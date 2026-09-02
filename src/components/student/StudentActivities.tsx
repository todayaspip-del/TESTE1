import React, { useState } from 'react';
import { useLmsData } from '../../context/LmsDataContext';
import { useAuth } from '../../context/AuthContext';
import { Activity, Question, Answer, ActivityType } from '../../types';
import { QuizModal } from '../quiz/QuizModal';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  ClipboardCheck,
  CheckCircle,
  Clock,
  HelpCircle,
  ArrowRight,
  Plus,
  Trash2,
  X,
  PlusCircle,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface QuestionDraft {
  prompt: string;
  explanation: string;
  answers: {
    text: string;
    isCorrect: boolean;
  }[];
}

interface StudentActivitiesProps {
  onNavigateView?: (view: string) => void;
}

export const StudentActivities: React.FC<StudentActivitiesProps> = ({ onNavigateView }) => {
  const { courses, quizAttempts, addActivity, deleteActivity } = useLmsData();
  const { currentUser } = useAuth();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  const isAdmin = currentUser && ['ADMIN', 'SUPER_ADMIN', 'INSTRUCTOR'].includes(currentUser.role);

  // Form State for creating a new Quiz/Simulado
  const [targetCourseId, setTargetCourseId] = useState<string>(courses[0]?.id || '');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('QUIZ');
  const [activityInstructions, setActivityInstructions] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [minScore, setMinScore] = useState(70);

  const defaultQuestion: QuestionDraft = {
    prompt: '',
    explanation: '',
    answers: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  };

  const [questionsList, setQuestionsList] = useState<QuestionDraft[]>([
    {
      prompt: '',
      explanation: '',
      answers: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
    },
  ]);

  const handleAddQuestion = () => {
    setQuestionsList((prev) => [
      ...prev,
      {
        prompt: '',
        explanation: '',
        answers: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questionsList.length <= 1) return;
    setQuestionsList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionPromptChange = (qIndex: number, text: string) => {
    setQuestionsList((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], prompt: text };
      return copy;
    });
  };

  const handleExplanationChange = (qIndex: number, text: string) => {
    setQuestionsList((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], explanation: text };
      return copy;
    });
  };

  const handleAnswerTextChange = (qIndex: number, aIndex: number, text: string) => {
    setQuestionsList((prev) => {
      const copy = [...prev];
      const answersCopy = [...copy[qIndex].answers];
      answersCopy[aIndex] = { ...answersCopy[aIndex], text };
      copy[qIndex] = { ...copy[qIndex], answers: answersCopy };
      return copy;
    });
  };

  const handleCorrectAnswerSelect = (qIndex: number, aIndex: number) => {
    setQuestionsList((prev) => {
      const copy = [...prev];
      const answersCopy = copy[qIndex].answers.map((ans, i) => ({
        ...ans,
        isCorrect: i === aIndex,
      }));
      copy[qIndex] = { ...copy[qIndex], answers: answersCopy };
      return copy;
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCourseId) {
      alert('Por favor, selecione um curso.');
      return;
    }
    if (!activityTitle.trim()) {
      alert('Por favor, informe o título do simulado.');
      return;
    }

    // Validate questions
    const validQuestions = questionsList.filter((q) => q.prompt.trim().length > 0);
    if (validQuestions.length === 0) {
      alert('Por favor, adicione pelo menos 1 questão com enunciado válido.');
      return;
    }

    const activityId = `act-${Date.now()}`;
    const builtQuestions: Question[] = validQuestions.map((qDraft, qIdx) => {
      const questionId = `q-${activityId}-${qIdx + 1}`;
      const answers: Answer[] = qDraft.answers
        .filter((a) => a.text.trim().length > 0)
        .map((a, aIdx) => ({
          id: `ans-${questionId}-${aIdx + 1}`,
          questionId,
          text: a.text.trim(),
          isCorrect: a.isCorrect,
        }));

      // Ensure at least one correct answer
      if (answers.length > 0 && !answers.some((a) => a.isCorrect)) {
        answers[0].isCorrect = true;
      }

      return {
        id: questionId,
        activityId,
        type: 'MULTIPLE_CHOICE',
        prompt: qDraft.prompt.trim(),
        order: qIdx + 1,
        explanation: qDraft.explanation.trim() || undefined,
        answers: answers.length > 0 ? answers : [
          { id: `ans-${questionId}-1`, questionId, text: 'Opção A (Correta)', isCorrect: true },
          { id: `ans-${questionId}-2`, questionId, text: 'Opção B', isCorrect: false },
        ],
      };
    });

    const newActivity: Activity = {
      id: activityId,
      type: activityType,
      title: activityTitle.trim(),
      instructions:
        activityInstructions.trim() ||
        'Leia atentamente cada questão antes de selecionar a alternativa correta. Avaliação técnica homologada.',
      timeLimitMinutes: Number(timeLimitMinutes) || 15,
      minScore: Number(minScore) || 70,
      questions: builtQuestions,
    };

    addActivity(targetCourseId, newActivity);

    // Reset Form
    setIsCreateModalOpen(false);
    setActivityTitle('');
    setActivityInstructions('');
    setQuestionsList([defaultQuestion]);
  };

  // Collect all activities from courses
  const allActivities: Array<{
    activity: Activity;
    courseId: string;
    courseTitle: string;
    lessonTitle: string;
  }> = [];

  courses.forEach((c) => {
    (c.modules || []).forEach((m) => {
      (m.lessons || []).forEach((l) => {
        (l.activities || []).forEach((act) => {
          allActivities.push({
            activity: act,
            courseId: c.id,
            courseTitle: c.title,
            lessonTitle: l.title,
          });
        });
      });
    });
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header with Admin Creation Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
            <ClipboardCheck className="w-4 h-4" />
            <span>Simulados Teóricos & Avaliações de Prontidão</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Questionários & Simulados Oficiais
          </h1>
          <p className="text-xs text-slate-300">
            Questões técnicas avaliativas com pontuação em tempo real, gabarito e justificativas normativas.
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onNavigateView && (
              <button
                onClick={() => onNavigateView('admin-quizzes')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-none bg-[#121418] hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4 text-orange-400" />
                <span>Ver Resultados & Notas</span>
              </button>
            )}
            <button
              onClick={() => {
                if (courses.length > 0 && !targetCourseId) {
                  setTargetCourseId(courses[0].id);
                }
                setIsCreateModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-950/60 transition cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Simulado / Quiz</span>
            </button>
          </div>
        )}
      </div>

      {/* Activities Grid */}
      <div className="space-y-4">
        {allActivities.length === 0 ? (
          <div className="p-12 rounded-xl bg-[#121418] border border-slate-800 text-center space-y-3">
            <ClipboardCheck className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Nenhum simulado cadastrado ainda</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Os questionários criados pelo corpo docente e coordenação aparecerão disponíveis para todos os alunos aqui.
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-bold transition cursor-pointer"
              >
                + Criar o Primeiro Simulado
              </button>
            )}
          </div>
        ) : (
          allActivities.map(({ activity, courseTitle, lessonTitle }) => {
            const attempt = quizAttempts.find((qa) => qa.activityId === activity.id);

            return (
              <div
                key={activity.id}
                className="p-6 rounded-xl bg-[#121418] border border-slate-800 hover:border-orange-500/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-md"
              >
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-orange-500/15 text-orange-400 border border-orange-500/30 text-[10px] font-bold uppercase font-mono">
                      {activity.type}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium truncate max-w-md">
                      {courseTitle} {lessonTitle ? `• ${lessonTitle}` : ''}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-white">{activity.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {activity.instructions || 'Avaliação de prontidão técnica profissional.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1 font-mono">
                    <span className="flex items-center gap-1 text-orange-400 font-bold">
                      <HelpCircle className="w-3.5 h-3.5" />
                      {activity.questions?.length || 0} questões
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {activity.timeLimitMinutes || 15} minutos
                    </span>
                    <span>•</span>
                    <span>Nota mínima: {activity.minScore || 70}%</span>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-3 shrink-0 w-full sm:w-auto">
                  {attempt && (
                    <div className="text-right">
                      <div
                        className={`text-xs font-bold flex items-center sm:justify-end gap-1.5 ${
                          attempt.passed ? 'text-emerald-400' : 'text-orange-400'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{attempt.passed ? 'Aprovado' : 'Reprovado'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Última nota: <strong className="text-white">{attempt.score}%</strong>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: 'Excluir Simulado',
                            message: `Tem certeza que deseja excluir o simulado "${activity.title}"?`,
                            onConfirm: () => {
                              deleteActivity(activity.id);
                            },
                          });
                        }}
                        className="p-2.5 rounded-lg bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-600/60 text-slate-400 hover:text-red-400 transition cursor-pointer"
                        title="Excluir Simulado"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedActivity(activity)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-orange-950/40 cursor-pointer"
                    >
                      <span>{attempt ? 'Refazer Simulado' : 'Iniciar Simulado'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quiz Taker Modal */}
      {selectedActivity && (
        <QuizModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} />
      )}

      {/* Admin Creator Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-xl bg-[#0e1017] border border-slate-800 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Painel do Instrutor / Admin</span>
                </div>
                <h2 className="text-xl font-black text-white">Criar Novo Simulado / Quiz</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-lg bg-[#141822] hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-6">
              {/* Target Course & Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Curso Vinculado *</label>
                  <select
                    value={targetCourseId}
                    onChange={(e) => setTargetCourseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#141822] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                    required
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.code || 'VULCAN'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Tipo de Avaliação *</label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as ActivityType)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#141822] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="QUIZ">QUIZ (Simulado Teórico)</option>
                    <option value="EXAM">EXAM (Prova Avaliativa Final)</option>
                    <option value="CHECKLIST">CHECKLIST (Verificação Prática)</option>
                  </select>
                </div>
              </div>

              {/* Title & Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Título do Simulado *</label>
                <input
                  type="text"
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  placeholder="Ex: Simulado Oficial — Suporte Básico de Vida & Desfibrilação"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141822] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Instruções aos Alunos</label>
                <textarea
                  value={activityInstructions}
                  onChange={(e) => setActivityInstructions(e.target.value)}
                  rows={2}
                  placeholder="Instruções sobre tempo, regras de aprovação e conteúdo cobrado..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141822] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Tempo Limite (Minutos)</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#141822] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Nota Mínima para Aprovação (%)</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#141822] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Questions Builder */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-bold text-white">
                      Questões do Simulado ({questionsList.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Questão</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {questionsList.map((q, qIndex) => (
                    <div
                      key={qIndex}
                      className="p-4 rounded-lg bg-[#141822] border border-slate-800/90 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-xs font-mono font-bold">
                          Questão #{qIndex + 1}
                        </span>
                        {questionsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIndex)}
                            className="text-xs text-red-400 hover:text-red-300 transition cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remover
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-300">Enunciado da Questão *</label>
                        <input
                          type="text"
                          value={q.prompt}
                          onChange={(e) => handleQuestionPromptChange(qIndex, e.target.value)}
                          placeholder="Ex: Qual extintor é indicado para equipamentos elétricos energizados?"
                          className="w-full px-3 py-2 rounded bg-[#0c0e14] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                          required
                        />
                      </div>

                      {/* Alternatives */}
                      <div className="space-y-2 pt-1">
                        <label className="text-[11px] font-semibold text-slate-300">
                          Alternativas (marque a correta):
                        </label>
                        {q.answers.map((ans, aIndex) => {
                          const letters = ['A', 'B', 'C', 'D'];
                          return (
                            <div key={aIndex} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCorrectAnswerSelect(qIndex, aIndex)}
                                className={`w-7 h-7 rounded flex items-center justify-center font-mono text-xs font-bold shrink-0 transition cursor-pointer ${
                                  ans.isCorrect
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                                title={ans.isCorrect ? 'Alternativa Correta' : 'Marcar como Correta'}
                              >
                                {letters[aIndex]}
                              </button>
                              <input
                                type="text"
                                value={ans.text}
                                onChange={(e) => handleAnswerTextChange(qIndex, aIndex, e.target.value)}
                                placeholder={`Alternativa ${letters[aIndex]}...`}
                                className="flex-1 px-3 py-1.5 rounded bg-[#0c0e14] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="space-y-1 pt-1">
                        <label className="text-[11px] font-semibold text-slate-400">
                          Justificativa Técnica / Explicação (exibida após o envio):
                        </label>
                        <input
                          type="text"
                          value={q.explanation}
                          onChange={(e) => handleExplanationChange(qIndex, e.target.value)}
                          placeholder="Ex: Conforme a NR 23, extintores de CO2 não conduzem eletricidade..."
                          className="w-full px-3 py-1.5 rounded bg-[#0c0e14] border border-slate-700 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#141822] hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-950/60 transition cursor-pointer"
                >
                  Salvar e Disponibilizar Simulado
                </button>
              </div>
            </form>
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
