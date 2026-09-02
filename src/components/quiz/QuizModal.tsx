import React, { useState, useEffect } from 'react';
import { Activity, Question, Answer } from '../../types';
import { useLmsData } from '../../context/LmsDataContext';
import { X, CheckCircle, AlertCircle, Clock, ShieldCheck, Award, RotateCcw, ChevronRight } from 'lucide-react';

interface QuizModalProps {
  activity: Activity;
  onClose: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({ activity, onClose }) => {
  const { submitQuiz } = useLmsData();

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState((activity.timeLimitMinutes || 15) * 60);

  // Timer
  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  const handleSelect = (questionId: string, answerId: string) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleSubmit = () => {
    let correctCount = 0;
    const total = activity.questions.length;

    activity.questions.forEach((q) => {
      const selectedAnsId = selectedAnswers[q.id];
      const correctAns = q.answers.find((a) => a.isCorrect);
      if (correctAns && correctAns.id === selectedAnsId) {
        correctCount++;
      }
    });

    const calculatedScore = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const isPass = calculatedScore >= (activity.minScore || 70);

    setScore(calculatedScore);
    setPassed(isPass);
    setSubmitted(true);

    submitQuiz(activity.id, selectedAnswers, calculatedScore, isPass);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setScore(0);
    setPassed(false);
    setSecondsLeft((activity.timeLimitMinutes || 15) * 60);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-none bg-[#0c0b0e] border border-slate-800 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Avaliação de Conhecimento Técnico</span>
            </div>
            <h2 className="text-xl font-black text-white">{activity.title}</h2>
          </div>

          <div className="flex items-center gap-3">
            {!submitted && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#121418] border border-slate-800 font-mono text-xs font-bold text-orange-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(secondsLeft)}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-none bg-[#121418] hover:bg-slate-800 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results Banner (when submitted) */}
        {submitted && (
          <div
            className={`p-6 rounded-none border mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 ${
              passed
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-orange-950/40 border-orange-500/40 text-orange-200'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-none flex items-center justify-center ${
                  passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
                }`}
              >
                {passed ? <Award className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">
                  {passed ? 'Aprovado na Avaliação Teórica!' : 'Não Atingiu a Nota Mínima'}
                </h3>
                <p className="text-xs text-slate-300">
                  Nota mínima exigida: {activity.minScore || 70}% • Seu resultado:{' '}
                  <span className="font-bold text-white">{score}%</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-none bg-[#121418] hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        )}

        {/* Question List */}
        <div className="space-y-6">
          {activity.questions.map((q, qIndex) => {
            const selectedAnsId = selectedAnswers[q.id];
            const correctAns = q.answers.find((a) => a.isCorrect);

            return (
              <div
                key={q.id}
                className="p-5 rounded-none bg-[#121418] border border-slate-800 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-none bg-slate-800 text-white font-mono text-xs font-bold shrink-0">
                    {qIndex + 1}
                  </span>
                  <p className="text-sm font-bold text-white leading-snug">{q.prompt}</p>
                </div>

                {/* Answers Options */}
                <div className="space-y-2 pl-9">
                  {q.answers.map((ans) => {
                    const isSelected = selectedAnsId === ans.id;
                    let style = 'bg-[#0c0b0e] border-slate-800 text-slate-300 hover:border-slate-700';

                    if (submitted) {
                      if (ans.isCorrect) {
                        style = 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-bold';
                      } else if (isSelected && !ans.isCorrect) {
                        style = 'bg-orange-950/60 border-orange-500/60 text-orange-200 line-through';
                      }
                    } else if (isSelected) {
                      style = 'bg-orange-950/40 border-orange-500 text-white font-bold ring-1 ring-orange-500/30';
                    }

                    return (
                      <button
                        key={ans.id}
                        type="button"
                        onClick={() => handleSelect(q.id, ans.id)}
                        disabled={submitted}
                        className={`w-full p-3 rounded-none border text-left text-xs transition flex items-center justify-between gap-3 cursor-pointer ${style}`}
                      >
                        <span>{ans.text}</span>
                        {submitted && ans.isCorrect && (
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Justification / Explanation */}
                {submitted && q.explanation && (
                  <div className="mt-3 ml-9 p-3 rounded-none bg-[#0c0b0e] border border-slate-800 text-xs text-slate-300">
                    <span className="font-bold text-orange-400">Justificativa Técnica: </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-none bg-[#121418] hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold transition cursor-pointer"
          >
            {submitted ? 'Fechar' : 'Cancelar'}
          </button>

          {!submitted && (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(selectedAnswers).length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-none bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-orange-950/40 cursor-pointer"
            >
              <span>Finalizar e Enviar Respostas</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
