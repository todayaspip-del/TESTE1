import React, { useState } from 'react';
import { useLmsData } from '../../context/LmsDataContext';
import { useAuth } from '../../context/AuthContext';
import { CalendarEvent } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Flame,
  Shield,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';

export const StudentCalendar: React.FC = () => {
  const { calendarEvents, createCalendarEvent, deleteCalendarEvent } = useLmsData();
  const { currentUser } = useAuth();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

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

  // Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<'presencial' | 'prova' | 'atividade' | 'aula' | 'prazo'>('presencial');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      alert('Por favor, informe o título do evento.');
      return;
    }
    if (!startDateTime) {
      alert('Por favor, selecione a data e horário de início.');
      return;
    }

    const newEvent: Omit<CalendarEvent, 'id'> = {
      title: eventTitle.trim(),
      type: eventType,
      startAt: new Date(startDateTime).toISOString(),
      endAt: endDateTime ? new Date(endDateTime).toISOString() : undefined,
      location: eventLocation.trim() || 'Centro de Treinamento Vulcan — Base Operacional',
      description:
        eventDescription.trim() ||
        'Atividade oficial agendada pelo corpo pedagógico e instrutores.',
    };

    createCalendarEvent(newEvent);

    // Reset Form
    setIsScheduleModalOpen(false);
    setEventTitle('');
    setStartDateTime('');
    setEndDateTime('');
    setEventLocation('');
    setEventDescription('');
  };

  const filtered = calendarEvents.filter((evt) => {
    if (filterType === 'ALL') return true;
    return evt.type.toLowerCase() === filterType.toLowerCase();
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
            <CalendarIcon className="w-4 h-4 text-orange-400" />
            <span>Agenda Operacional & Práticas de Campo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Cronograma de Treinamento e Avaliações Teórico-Práticas
          </h1>
          <p className="text-xs text-slate-300">
            Acompanhe datas obrigatórias de pista de fogo, oficinas de APH, provas e simulados de emergência.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              // Set default start date to tomorrow at 08:00
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(8, 0, 0, 0);
              const isoLocal = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
              setStartDateTime(isoLocal);

              const tomorrowEnd = new Date(tomorrow);
              tomorrowEnd.setHours(17, 0, 0, 0);
              const isoEndLocal = new Date(tomorrowEnd.getTime() - tomorrowEnd.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
              setEndDateTime(isoEndLocal);

              setIsScheduleModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-950/60 transition cursor-pointer shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Evento / Prática</span>
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'presencial', 'prova', 'atividade', 'aula'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer capitalize ${
              filterType === type
                ? 'bg-orange-600 text-white font-bold shadow-lg shadow-orange-950/40'
                : 'bg-[#121418] border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {type === 'ALL'
              ? 'Todos os Eventos'
              : type === 'presencial'
              ? 'Prática de Campo'
              : type === 'aula'
              ? 'Aulas & Instrução'
              : type}
          </button>
        ))}
      </div>

      {/* Timeline / Events List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-[#121418] border border-slate-800 rounded-xl space-y-3">
            <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Nenhum evento agendado no momento</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Todas as datas de pista de treinamento, encontros práticos e avaliações agendadas pelos instrutores aparecerão aqui.
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-bold transition cursor-pointer"
              >
                + Agendar Primeiro Evento
              </button>
            )}
          </div>
        ) : (
          filtered.map((evt) => {
            const isPresencial = evt.type === 'presencial';
            const isExam = evt.type === 'prova';

            return (
              <div
                key={evt.id}
                className={`p-6 rounded-xl border transition-all shadow-md ${
                  isPresencial
                    ? 'bg-[#121418] border-orange-500/50 hover:border-orange-500'
                    : isExam
                    ? 'bg-[#121418] border-orange-500/30 hover:border-orange-500/60'
                    : 'bg-[#121418] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-mono font-black shrink-0 ${
                        isPresencial
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                          : isExam
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                          : 'bg-slate-800 text-white border border-slate-700'
                      }`}
                    >
                      <span className="text-lg leading-tight">
                        {new Date(evt.startAt).getDate().toString().padStart(2, '0')}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-300">
                        {new Date(evt.startAt).toLocaleString('pt-BR', { month: 'short' })}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                            isPresencial
                              ? 'bg-orange-950 text-orange-400 border border-orange-800'
                              : isExam
                              ? 'bg-orange-950 text-orange-400 border border-orange-800'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {evt.type === 'presencial' ? 'Prática de Campo' : evt.type}
                        </span>
                        <h3 className="text-base font-black text-white">{evt.title}</h3>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                        {evt.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3 text-xs text-slate-400 font-mono shrink-0 pl-18 sm:pl-0 border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                    <div className="space-y-1 sm:text-right">
                      <div className="flex items-center sm:justify-end gap-1.5 text-white font-bold">
                        <Clock className="w-3.5 h-3.5 text-orange-400" />
                        <span>
                          {new Date(evt.startAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {evt.endAt &&
                            ` às ${new Date(evt.endAt).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`}
                        </span>
                      </div>

                      {evt.location && (
                        <div className="flex items-center sm:justify-end gap-1.5 text-slate-300 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                          <span>{evt.location}</span>
                        </div>
                      )}
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: 'Excluir Evento',
                            message: `Tem certeza que deseja excluir o evento "${evt.title}" do calendário?`,
                            onConfirm: () => {
                              deleteCalendarEvent(evt.id);
                            },
                          });
                        }}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-600/60 text-slate-400 hover:text-red-400 transition cursor-pointer"
                        title="Excluir Evento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Admin Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-xl bg-[#0e1017] border border-slate-800 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Painel de Agendamento do Admin</span>
                </div>
                <h2 className="text-xl font-black text-white">Agendar Evento / Treinamento</h2>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-2 rounded-lg bg-[#141822] hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-5">
              {/* Event Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Título do Evento / Prática *</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Ex: Treinamento em Pista de Fogo & Espaço Confinado (NR 33)"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141822] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              {/* Event Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Tipo de Evento *</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141822] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="presencial">Prática de Campo (Treinamento Presencial)</option>
                  <option value="prova">Avaliação Teórico-Prática / Prova</option>
                  <option value="atividade">Oficina / Simulado Operacional</option>
                  <option value="aula">Aula Inaugural / Instrução Teórica</option>
                </select>
              </div>

              {/* Start and End Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Data & Hora de Início *</label>
                  <input
                    type="datetime-local"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#141822] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Data & Hora de Término (Opcional)</label>
                  <input
                    type="datetime-local"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#141822] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Local / Endereço / Link</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Ex: Centro de Treinamento Vulcan — Campo de Instrução NBR 14608"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141822] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Descrição & Orientações aos Alunos</label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={3}
                  placeholder="Ex: Traje obrigatório com EPI completo, capacete e luvas. Ponto de encontro às 07:45 no pátio central..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#141822] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#141822] hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-950/60 transition cursor-pointer"
                >
                  Agendar e Publicar Evento
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
