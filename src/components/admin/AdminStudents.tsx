import React, { useState } from 'react';
import { useLmsData } from '../../context/LmsDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  Award,
  Shield,
  CheckCircle,
  Clock,
  FileText,
  Send,
  Flame,
  Plus,
  X,
  UserPlus,
  Layers,
  Trash2,
} from 'lucide-react';
import { CertificateModal } from '../certificate/CertificateModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { Certificate, Classroom } from '../../types';

export const AdminStudents: React.FC = () => {
  const {
    enrollments,
    classrooms,
    courses,
    getCourseProgress,
    privateNotes,
    addPrivateNote,
    issueCertificate,
    certificates,
    createClassroom,
    deleteClassroom,
    enrollStudent,
    unenrollStudent,
  } = useLmsData();
  const { currentUser, usersList } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentForNotes, setSelectedStudentForNotes] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

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

  // Modals
  const [newClassroomModal, setNewClassroomModal] = useState(false);
  const [newClassroomData, setNewClassroomData] = useState({
    name: '',
    code: '',
    courseId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    maxCapacity: 30,
    location: 'EAD / Online',
  });

  const [newEnrollModal, setNewEnrollModal] = useState(false);
  const [enrollData, setEnrollData] = useState({
    studentId: '',
    classroomId: '',
    courseId: '',
  });

  const mainCourse = courses[0];

  const filteredEnrollments = enrollments.filter((enr) => {
    const user = usersList.find((u) => u.id === enr.studentId);
    const cls = classrooms.find((c) => c.id === enr.classroomId);
    const name = user?.name || enr.studentId;
    const clsName = cls?.name || enr.classroomId;
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clsName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForNotes || !noteInput.trim()) return;
    addPrivateNote(selectedStudentForNotes.id, noteInput);
    setNoteInput('');
  };

  const handleCreateClassroom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassroomData.name.trim()) return;

    createClassroom({
      organizationId: 'org-vulcan-01',
      name: newClassroomData.name.trim(),
      code: newClassroomData.code.trim() || `TMA-${Date.now().toString().slice(-4)}`,
      courseId: newClassroomData.courseId || courses[0]?.id || 'crs-1',
      startDate: newClassroomData.startDate,
      endDate: newClassroomData.endDate || newClassroomData.startDate,
      instructorIds: [currentUser?.id || 'usr-super-1'],
      maxCapacity: Number(newClassroomData.maxCapacity) || 30,
      location: newClassroomData.location,
    });

    setNewClassroomModal(false);
    setNewClassroomData({
      name: '',
      code: '',
      courseId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      maxCapacity: 30,
      location: 'EAD / Online',
    });
  };

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData.studentId || !enrollData.classroomId) {
      alert('Selecione o aluno e a turma.');
      return;
    }
    const cls = classrooms.find((c) => c.id === enrollData.classroomId);
    const courseId = enrollData.courseId || cls?.courseId || courses[0]?.id || 'crs-1';

    enrollStudent(enrollData.studentId, enrollData.classroomId, courseId);
    setNewEnrollModal(false);
    setEnrollData({ studentId: '', classroomId: '', courseId: '' });
  };

  const studentUsers = usersList.filter((u) => u.role === 'STUDENT' || u.role === 'INSTRUCTOR');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Quadro Geral de Efetivo & Turmas</span>
          </div>
          <h1 className="text-2xl font-black text-white">
            Gestão de Turmas, Recrutas e Matrículas
          </h1>
          <p className="text-xs text-slate-400">
            Crie turmas operacionais, matricule alunos e acompanhe o progresso de capacitação.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setNewClassroomModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-none bg-[#121418] hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-orange-400" />
            <span>+ Nova Turma</span>
          </button>
          <button
            onClick={() => setNewEnrollModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-950/40 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Matricular Aluno</span>
          </button>
        </div>
      </div>

      {/* Classrooms summary cards */}
      {classrooms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((cls) => {
            const count = enrollments.filter((e) => e.classroomId === cls.id).length;
            const course = courses.find((c) => c.id === cls.courseId);
            return (
              <div
                key={cls.id}
                className="p-4 rounded-none bg-[#121418] border border-slate-800 space-y-2 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-orange-400 px-2 py-0.5 bg-orange-950/40 border border-orange-800/40">
                    {cls.code}
                  </span>
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Excluir Turma',
                        message: `Tem certeza que deseja excluir a turma "${cls.name}" (${cls.code})?`,
                        onConfirm: () => {
                          deleteClassroom(cls.id);
                        },
                      });
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition cursor-pointer"
                    title="Excluir turma"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="font-bold text-sm text-white">{cls.name}</h3>
                <p className="text-[11px] text-slate-400">{course?.title || 'Curso Vinculado'}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800 font-mono">
                  <span>{count} recrutas</span>
                  <span>Capacidade: {cls.maxCapacity || 30}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome do recruta ou turma..."
          className="w-full pl-10 pr-4 py-2.5 rounded-none bg-[#121418] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* Students Table */}
      <div className="rounded-none bg-[#121418] border border-slate-800 overflow-hidden shadow-xl">
        {filteredEnrollments.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">Nenhum aluno matriculado ainda</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Crie uma turma e matricule os recrutas cadastrados na plataforma para acompanhar o progresso.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setNewClassroomModal(true)}
                className="px-4 py-2 rounded-none bg-[#0c0b0e] border border-slate-700 text-xs text-white font-bold cursor-pointer"
              >
                + Nova Turma
              </button>
              <button
                onClick={() => setNewEnrollModal(true)}
                className="px-4 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-xs text-white font-bold cursor-pointer"
              >
                + Matricular Aluno
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0c0b0e] border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono tracking-wider">
                <tr>
                  <th className="p-4 pl-6">Recruta / Aluno</th>
                  <th className="p-4">Turma Operacional</th>
                  <th className="p-4">Progresso Geral</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Ações de Comando</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredEnrollments.map((enr) => {
                  const user = usersList.find((u) => u.id === enr.studentId);
                  const cls = classrooms.find((c) => c.id === enr.classroomId);
                  const studentName = user?.name || enr.studentId;
                  const classroomName = cls?.name || 'Turma Padrão';
                  const prog = mainCourse ? getCourseProgress(enr.studentId, mainCourse.id) : null;
                  const studentCert = certificates.find((c) => c.studentId === enr.studentId);
                  const isCompleted = prog && prog.progressPct >= 100;

                  return (
                    <tr key={enr.id} className="hover:bg-slate-800/50 transition">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-none bg-slate-800 flex items-center justify-center font-bold text-white">
                            {studentName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{studentName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {user?.email || enr.studentId}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-none bg-[#0c0b0e] border border-slate-700 text-[10px] font-mono text-white">
                          {classroomName}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-[11px] font-mono text-white">
                            <span>{prog?.progressPct || 0}%</span>
                            <span className="text-slate-400">
                              {prog?.completedLessonsCount || 0}/{prog?.totalLessonsCount || 0}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-none overflow-hidden">
                            <div
                              className={`h-full rounded-none ${
                                isCompleted ? 'bg-emerald-500' : 'bg-orange-600'
                              }`}
                              style={{ width: `${prog?.progressPct || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-none text-[10px] font-bold ${
                            enr.active
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                          }`}
                        >
                          {enr.active ? 'Pronto / Ativo' : 'Inativo'}
                        </span>
                      </td>

                      <td className="p-4 pr-6 text-right space-x-2">
                        <button
                          onClick={() =>
                            setSelectedStudentForNotes({ id: enr.studentId, name: studentName })
                          }
                          className="px-3 py-1.5 rounded-none bg-[#0c0b0e] hover:bg-slate-800 border border-slate-700 text-white text-xs font-semibold transition cursor-pointer"
                          title="Ver prontuário e anotações confidenciais"
                        >
                          Prontuário
                        </button>

                        {studentCert ? (
                          <button
                            onClick={() => setSelectedCert(studentCert)}
                            className="px-3 py-1.5 rounded-none bg-orange-600/20 border border-orange-500/40 text-orange-400 text-xs font-bold transition hover:bg-orange-600/30 cursor-pointer"
                          >
                            Ver Certificado
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const issued = issueCertificate(
                                enr.studentId,
                                enr.courseId || courses[0]?.id || 'crs-1',
                                studentName
                              );
                              setSelectedCert(issued);
                            }}
                            className="px-3 py-1.5 rounded-none bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold transition hover:bg-emerald-600/30 cursor-pointer"
                          >
                            Homologar Certificado
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: 'Desmatricular Aluno',
                              message: `Deseja desmatricular o aluno "${studentName}" desta turma?`,
                              onConfirm: () => {
                                unenrollStudent(enr.id);
                              },
                            });
                          }}
                          className="p-1.5 rounded-none bg-[#0c0b0e] hover:bg-red-950/50 border border-slate-700 text-slate-400 hover:text-red-400 transition cursor-pointer"
                          title="Desmatricular aluno"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dossier Modal */}
      {selectedStudentForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-none bg-[#0c0b0e] border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-500" />
                <span>Prontuário & Observações Disciplinares</span>
              </h3>
              <button
                onClick={() => setSelectedStudentForNotes(null)}
                className="p-1 rounded-none text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Registros confidenciais do recruta <strong>{selectedStudentForNotes.name}</strong>:
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {privateNotes
                .filter((n) => n.subjectId === selectedStudentForNotes.id)
                .map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-none bg-[#121418] border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>{n.authorName}</span>
                      <span>{new Date(n.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-slate-200">{n.content}</p>
                  </div>
                ))}
              {privateNotes.filter((n) => n.subjectId === selectedStudentForNotes.id).length === 0 && (
                <p className="text-xs text-slate-500 italic">Nenhum registro no prontuário.</p>
              )}
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3 pt-2">
              <textarea
                rows={2}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Adicionar parecer pedagógico ou observação de conduta..."
                className="w-full px-3 py-2 rounded-none bg-[#121418] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Registrar no Prontuário</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Classroom Modal */}
      {newClassroomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-none bg-[#0c0b0e] border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-500" />
                <span>Cadastrar Nova Turma</span>
              </h3>
              <button
                onClick={() => setNewClassroomModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClassroom} className="space-y-3 text-xs">
              <div>
                <label className="block text-white font-bold mb-1">Nome da Turma *</label>
                <input
                  type="text"
                  required
                  value={newClassroomData.name}
                  onChange={(e) => setNewClassroomData({ ...newClassroomData, name: e.target.value })}
                  placeholder="Ex: Turma Alfa 2026.1"
                  className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white font-bold mb-1">Código</label>
                  <input
                    type="text"
                    value={newClassroomData.code}
                    onChange={(e) => setNewClassroomData({ ...newClassroomData, code: e.target.value })}
                    placeholder="Ex: TURMA-01"
                    className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-white font-bold mb-1">Capacidade</label>
                  <input
                    type="number"
                    value={newClassroomData.maxCapacity}
                    onChange={(e) => setNewClassroomData({ ...newClassroomData, maxCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-bold mb-1">Curso Vinculado</label>
                <select
                  value={newClassroomData.courseId}
                  onChange={(e) => setNewClassroomData({ ...newClassroomData, courseId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500"
                >
                  {courses.length === 0 ? (
                    <option value="">Nenhum curso cadastrado (crie um curso antes)</option>
                  ) : (
                    courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.code})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white font-bold mb-1">Data Início</label>
                  <input
                    type="date"
                    value={newClassroomData.startDate}
                    onChange={(e) => setNewClassroomData({ ...newClassroomData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-white font-bold mb-1">Data Conclusão</label>
                  <input
                    type="date"
                    value={newClassroomData.endDate}
                    onChange={(e) => setNewClassroomData({ ...newClassroomData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewClassroomModal(false)}
                  className="px-3 py-1.5 rounded-none bg-[#121418] text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded-none bg-orange-600 hover:bg-orange-500 text-white font-bold"
                >
                  Criar Turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Modal */}
      {newEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-none bg-[#0c0b0e] border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-orange-500" />
                <span>Matricular Aluno em Turma</span>
              </h3>
              <button
                onClick={() => setNewEnrollModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-white font-bold mb-1">Selecionar Aluno *</label>
                {studentUsers.length === 0 ? (
                  <p className="text-orange-400 italic">
                    Nenhum aluno registrado no sistema ainda. Novos alunos cadastrados pela tela de login aparecerão aqui.
                  </p>
                ) : (
                  <select
                    required
                    value={enrollData.studentId}
                    onChange={(e) => setEnrollData({ ...enrollData, studentId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500"
                  >
                    <option value="">-- Selecione o Aluno --</option>
                    {studentUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-white font-bold mb-1">Selecionar Turma *</label>
                {classrooms.length === 0 ? (
                  <p className="text-orange-400 italic">
                    Nenhuma turma cadastrada. Crie uma turma primeiro.
                  </p>
                ) : (
                  <select
                    required
                    value={enrollData.classroomId}
                    onChange={(e) => {
                      const cls = classrooms.find((c) => c.id === e.target.value);
                      setEnrollData({
                        ...enrollData,
                        classroomId: e.target.value,
                        courseId: cls?.courseId || '',
                      });
                    }}
                    className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500"
                  >
                    <option value="">-- Selecione a Turma --</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewEnrollModal(false)}
                  className="px-3 py-1.5 rounded-none bg-[#121418] text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={studentUsers.length === 0 || classrooms.length === 0}
                  className="px-5 py-1.5 rounded-none bg-orange-600 hover:bg-orange-500 text-white font-bold disabled:opacity-50"
                >
                  Confirmar Matrícula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCert && (
        <CertificateModal certificate={selectedCert} onClose={() => setSelectedCert(null)} />
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
