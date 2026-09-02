import React, { useState } from 'react';
import { useLmsData } from '../../context/LmsDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  Award,
  Shield,
  ShieldCheck,
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
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  UserCheck,
  GraduationCap,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { CertificateModal } from '../certificate/CertificateModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { Certificate, Classroom, User, Role } from '../../types';

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
  const { currentUser, usersList, createStudentUser, updateUserRole } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'STUDENT' | 'INSTRUCTOR'>('ALL');
  const [selectedStudentForNotes, setSelectedStudentForNotes] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  // Success Feedback Toast/Card for newly created student/instructor
  const [createdStudentSuccess, setCreatedStudentSuccess] = useState<{
    name: string;
    email: string;
    password: string;
    registrationNumber: string;
    role: 'STUDENT' | 'INSTRUCTOR';
    classroomName?: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

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

  // Modal: Enroll Student in Classroom
  const [newEnrollModal, setNewEnrollModal] = useState(false);
  const [enrollTab, setEnrollTab] = useState<'EXISTING' | 'CREATE_NEW'>('CREATE_NEW');
  const [enrollData, setEnrollData] = useState({
    studentId: '',
    classroomId: '',
    courseId: '',
  });

  // Form for creating a new user from scratch
  const [newStudentForm, setNewStudentForm] = useState<{
    role: 'STUDENT' | 'INSTRUCTOR';
    name: string;
    email: string;
    password: string;
    registrationNumber: string;
    rank: string;
    classroomId: string;
    showPassword: boolean;
    isSubmitting: boolean;
    error: string;
  }>({
    role: 'STUDENT',
    name: '',
    email: '',
    password: '123456',
    registrationNumber: '',
    rank: 'Recruta / Aluno',
    classroomId: '',
    showPassword: false,
    isSubmitting: false,
    error: '',
  });

  // Dedicated "Novo Aluno / Usuário" modal
  const [dedicatedNewStudentModal, setDedicatedNewStudentModal] = useState(false);

  const mainCourse = courses[0];

  const studentCount = usersList.filter((u) => u.role === 'STUDENT').length;
  const instructorCount = usersList.filter((u) => u.role === 'INSTRUCTOR').length;

  const filteredEnrollments = enrollments.filter((enr) => {
    const user = usersList.find((u) => u.id === enr.studentId);
    const cls = classrooms.find((c) => c.id === enr.classroomId);
    const name = user?.name || enr.studentId;
    const clsName = cls?.name || enr.classroomId;
    const email = user?.email || '';
    const reg = user?.registrationNumber || '';
    const userRole = user?.role || 'STUDENT';

    if (roleFilter === 'STUDENT' && userRole !== 'STUDENT') return false;
    if (roleFilter === 'INSTRUCTOR' && userRole !== 'INSTRUCTOR') return false;

    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clsName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Submit enrollment for existing student
  const handleEnrollExistingSubmit = (e: React.FormEvent) => {
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

  // Create student/instructor from scratch AND optionally enroll
  const handleCreateStudentFromScratch = async (
    e: React.FormEvent,
    targetClassroomId?: string,
    closeModals?: () => void
  ) => {
    e.preventDefault();
    setNewStudentForm((prev) => ({ ...prev, isSubmitting: true, error: '' }));

    const res = await createStudentUser({
      name: newStudentForm.name,
      email: newStudentForm.email,
      password: newStudentForm.password || '123456',
      registrationNumber: newStudentForm.registrationNumber,
      rank: newStudentForm.rank,
      role: newStudentForm.role,
    });

    if (!res.ok) {
      setNewStudentForm((prev) => ({ ...prev, isSubmitting: false, error: res.error }));
      return;
    }

    const createdUser = res.user;
    const effectiveClassroomId = targetClassroomId || newStudentForm.classroomId;
    let enrolledClassName = '';

    // If classroom specified, immediately enroll the student
    if (effectiveClassroomId) {
      const cls = classrooms.find((c) => c.id === effectiveClassroomId);
      const courseId = cls?.courseId || courses[0]?.id || 'crs-1';
      enrollStudent(createdUser.id, effectiveClassroomId, courseId);
      enrolledClassName = cls?.name || 'Turma Selecionada';
    }

    // Set success modal feedback
    setCreatedStudentSuccess({
      name: createdUser.name,
      email: createdUser.email,
      password: newStudentForm.password || '123456',
      registrationNumber: createdUser.registrationNumber || 'N/A',
      role: createdUser.role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT',
      classroomName: enrolledClassName || undefined,
    });

    // Reset form
    setNewStudentForm({
      role: 'STUDENT',
      name: '',
      email: '',
      password: '123456',
      registrationNumber: '',
      rank: 'Recruta / Aluno',
      classroomId: '',
      showPassword: false,
      isSubmitting: false,
      error: '',
    });

    if (closeModals) {
      closeModals();
    } else {
      setNewEnrollModal(false);
      setDedicatedNewStudentModal(false);
    }
  };

  const handleToggleUserRole = (user: User) => {
    const isNowInstructor = user.role === 'INSTRUCTOR';
    const targetRole: Role = isNowInstructor ? 'STUDENT' : 'INSTRUCTOR';

    setConfirmDialog({
      isOpen: true,
      title: isNowInstructor ? 'Alterar para Papel de Aluno' : 'Promover a Instrutor',
      message: isNowInstructor
        ? `Deseja alterar o papel de "${user.name}" para ALUNO? O usuário passará a ter restrições de aluno e não poderá mais gerenciar cursos ou acessar o painel de comando.`
        : `Deseja promover "${user.name}" para INSTRUTOR? O usuário terá acesso privilegiado total a tudo (criação e edição de cursos, turmas, notas, alunos e gestão pedagógica).`,
      onConfirm: async () => {
        await updateUserRole(user.id, targetRole);
      },
    });
  };

  const studentUsers = usersList.filter((u) => u.role === 'STUDENT' || u.role === 'INSTRUCTOR');

  const copyCredentials = () => {
    if (!createdStudentSuccess) return;
    const isInst = createdStudentSuccess.role === 'INSTRUCTOR';
    const text = `*CREDENCIAS DE ACESSO AO LMS VULCAN*\nNome: ${createdStudentSuccess.name}\nPapel / Categoria: ${
      isInst ? 'INSTRUTOR (Acesso Privilegiado a Tudo)' : 'ALUNO (Acesso Restrito)'
    }\nMatrícula / RE: ${createdStudentSuccess.registrationNumber}\nE-mail / Login: ${createdStudentSuccess.email}\nSenha Inicial: ${createdStudentSuccess.password}${
      createdStudentSuccess.classroomName ? `\nTurma: ${createdStudentSuccess.classroomName}` : ''
    }\nPlataforma: Acesse a tela de login com o e-mail ou matrícula informados.`;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

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
            Cadastre novos alunos do zero, crie turmas operacionais e acompanhe o progresso de capacitação.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-nova-turma"
            onClick={() => setNewClassroomModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-none bg-[#121418] hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-orange-400" />
            <span>+ Nova Turma</span>
          </button>
          <button
            id="btn-cadastrar-novo-aluno"
            onClick={() => {
              setNewStudentForm({
                role: 'STUDENT',
                name: '',
                email: '',
                password: '123456',
                registrationNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                rank: 'Recruta / Aluno',
                classroomId: classrooms[0]?.id || '',
                showPassword: false,
                isSubmitting: false,
                error: '',
              });
              setDedicatedNewStudentModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-none bg-[#1a1c22] hover:bg-slate-800 border border-orange-500/50 text-orange-400 hover:text-white text-xs font-bold transition cursor-pointer shadow-sm"
          >
            <UserCheck className="w-3.5 h-3.5 text-orange-400" />
            <span>+ Criar Usuário / Aluno</span>
          </button>
          <button
            id="btn-matricular-aluno"
            onClick={() => {
              setNewStudentForm({
                role: 'STUDENT',
                name: '',
                email: '',
                password: '123456',
                registrationNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                rank: 'Recruta / Aluno',
                classroomId: classrooms[0]?.id || '',
                showPassword: false,
                isSubmitting: false,
                error: '',
              });
              setEnrollTab(studentUsers.length > 0 ? 'CREATE_NEW' : 'CREATE_NEW');
              setNewEnrollModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-950/40 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Matricular Aluno</span>
          </button>
        </div>
      </div>

      {/* Success Modal / Credentials Banner */}
      {createdStudentSuccess && (
        <div className="p-4 rounded-none bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-none bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>
                  {createdStudentSuccess.role === 'INSTRUCTOR' ? 'Instrutor Criado com Acesso Privilegiado!' : 'Aluno Criado e Sincronizado no Firebase!'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 border font-bold ${
                  createdStudentSuccess.role === 'INSTRUCTOR'
                    ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300'
                    : 'bg-blue-900/60 border-blue-500 text-blue-300'
                }`}>
                  {createdStudentSuccess.role === 'INSTRUCTOR' ? 'INSTRUTOR (Acesso Total)' : 'ALUNO (Restrito)'}
                </span>
                {createdStudentSuccess.classroomName && (
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 font-mono">
                    Matriculado em: {createdStudentSuccess.classroomName}
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-300">
                <strong>{createdStudentSuccess.name}</strong> • Matrícula / RE:{' '}
                <span className="font-mono text-emerald-300">{createdStudentSuccess.registrationNumber}</span> •
                E-mail: <span className="font-mono text-white">{createdStudentSuccess.email}</span> • Senha:{' '}
                <span className="font-mono text-amber-300">{createdStudentSuccess.password}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={copyCredentials}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Copiado!' : 'Copiar Credenciais'}</span>
            </button>
            <button
              onClick={() => setCreatedStudentSuccess(null)}
              className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
              title="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Classrooms summary cards */}
      {classrooms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((cls) => {
            const count = enrollments.filter((e) => e.classroomId === cls.id).length;
            const course = courses.find((c) => c.id === cls.courseId);
            return (
              <div
                key={cls.id}
                className="p-4 rounded-none bg-[#121418] border border-slate-800 space-y-2 relative group hover:border-slate-700 transition"
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

      {/* Search Bar & Role Filter Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail, matrícula ou turma..."
            className="w-full pl-10 pr-4 py-2 rounded-none bg-[#121418] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Role Filter Tabs & Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-0.5 bg-[#121418] border border-slate-800 text-xs">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 font-bold transition flex items-center gap-1.5 ${
                roleFilter === 'ALL'
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Todos</span>
              <span className="text-[10px] font-mono px-1 py-0.2 bg-black/40 text-white/90">
                {enrollments.length}
              </span>
            </button>
            <button
              onClick={() => setRoleFilter('STUDENT')}
              className={`px-3 py-1.5 font-bold transition flex items-center gap-1.5 ${
                roleFilter === 'STUDENT'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Alunos</span>
              <span className="text-[10px] font-mono px-1 py-0.2 bg-black/40 text-white/90">
                {studentCount}
              </span>
            </button>
            <button
              onClick={() => setRoleFilter('INSTRUCTOR')}
              className={`px-3 py-1.5 font-bold transition flex items-center gap-1.5 ${
                roleFilter === 'INSTRUCTOR'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Instrutores</span>
              <span className="text-[10px] font-mono px-1 py-0.2 bg-black/40 text-white/90">
                {instructorCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-none bg-[#121418] border border-slate-800 overflow-hidden shadow-xl">
        {filteredEnrollments.length === 0 ? (
          <div className="p-10 text-center space-y-4">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">Nenhum usuário/aluno encontrado nesta filtragem</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Você pode cadastrar um novo recruta ou instrutor do zero (sem necessidade de pré-cadastro prévio) e gerenciar os níveis de privilégios a qualquer momento.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  setNewStudentForm({
                    role: 'STUDENT',
                    name: '',
                    email: '',
                    password: '123456',
                    registrationNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                    rank: 'Recruta / Aluno',
                    classroomId: classrooms[0]?.id || '',
                    showPassword: false,
                    isSubmitting: false,
                    error: '',
                  });
                  setDedicatedNewStudentModal(true);
                }}
                className="px-4 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-xs text-white font-bold cursor-pointer transition shadow-md"
              >
                + Cadastrar Usuário do Zero
              </button>
              <button
                onClick={() => setNewClassroomModal(true)}
                className="px-4 py-2 rounded-none bg-[#0c0b0e] border border-slate-700 text-xs text-white font-bold cursor-pointer transition hover:bg-slate-800"
              >
                + Nova Turma
              </button>
              <button
                onClick={() => setNewEnrollModal(true)}
                className="px-4 py-2 rounded-none bg-[#1a1c22] border border-orange-500/40 text-orange-400 hover:text-white text-xs font-bold cursor-pointer transition"
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
                  <th className="p-4 pl-6">Nome & E-mail</th>
                  <th className="p-4">Papel & Privilégios</th>
                  <th className="p-4">Matrícula & Posto</th>
                  <th className="p-4">Turma Operacional</th>
                  <th className="p-4">Progresso</th>
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
                  const isInstructor = user?.role === 'INSTRUCTOR';

                  return (
                    <tr key={enr.id} className="hover:bg-slate-800/50 transition">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-none border flex items-center justify-center font-bold ${
                            isInstructor
                              ? 'bg-emerald-950/60 border-emerald-800/40 text-emerald-400'
                              : 'bg-orange-950/60 border-orange-800/40 text-orange-400'
                          }`}>
                            {studentName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>{studentName}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {user?.email || enr.studentId}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        {isInstructor ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                              <ShieldCheck className="w-3 h-3" />
                              Instrutor (Acesso Total)
                            </span>
                            <div className="text-[9px] text-slate-500">Privilégios administrativos</div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                              <GraduationCap className="w-3 h-3" />
                              Aluno (Restrito)
                            </span>
                            <div className="text-[9px] text-slate-500">Aulas e atividades</div>
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="inline-block px-2 py-0.5 rounded-none bg-[#0c0b0e] border border-slate-700 text-[10px] font-mono text-orange-300">
                            {user?.registrationNumber || `REC-${enr.studentId.slice(-4)}`}
                          </span>
                          <div className="text-[10px] text-slate-400">
                            {user?.rank || (isInstructor ? 'Instrutor' : 'Recruta')}
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-none bg-[#0c0b0e] border border-slate-700 text-[10px] font-mono text-white">
                          {classroomName}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="w-32 space-y-1">
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
                          {enr.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>

                      <td className="p-4 pr-6 text-right space-x-1.5">
                        {user && (
                          <button
                            onClick={() => handleToggleUserRole(user)}
                            className={`px-2.5 py-1.5 rounded-none border text-[11px] font-bold transition cursor-pointer ${
                              isInstructor
                                ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
                                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60'
                            }`}
                            title={
                              isInstructor
                                ? 'Mudar papel para Aluno (Restrito)'
                                : 'Promover para Instrutor (Acesso Privilegiado Total)'
                            }
                          >
                            {isInstructor ? 'Definir Aluno' : 'Promover Instrutor'}
                          </button>
                        )}

                        <button
                          onClick={() =>
                            setSelectedStudentForNotes({ id: enr.studentId, name: studentName })
                          }
                          className="px-2.5 py-1.5 rounded-none bg-[#0c0b0e] hover:bg-slate-800 border border-slate-700 text-white text-[11px] font-semibold transition cursor-pointer"
                          title="Ver prontuário e anotações confidenciais"
                        >
                          Prontuário
                        </button>

                        {studentCert ? (
                          <button
                            onClick={() => setSelectedCert(studentCert)}
                            className="px-2.5 py-1.5 rounded-none bg-orange-600/20 border border-orange-500/40 text-orange-400 text-[11px] font-bold transition hover:bg-orange-600/30 cursor-pointer"
                          >
                            Certificado
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
                            className="px-2.5 py-1.5 rounded-none bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold transition hover:bg-emerald-600/30 cursor-pointer"
                          >
                            Homologar
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

      {/* Enroll Modal (With Tab Switcher for Existing vs. Create New from Scratch) */}
      {newEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-none bg-[#0c0b0e] border border-slate-800 shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-orange-500" />
                <span>Matricular Aluno / Criar Usuário em Turma</span>
              </h3>
              <button
                onClick={() => setNewEnrollModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switch */}
            <div className="grid grid-cols-2 p-1 bg-[#121418] border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setEnrollTab('CREATE_NEW')}
                className={`py-2 text-center font-bold transition flex items-center justify-center gap-1.5 ${
                  enrollTab === 'CREATE_NEW'
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Criar Novo do Zero</span>
              </button>
              <button
                type="button"
                onClick={() => setEnrollTab('EXISTING')}
                className={`py-2 text-center font-bold transition flex items-center justify-center gap-1.5 ${
                  enrollTab === 'EXISTING'
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Já Registrado ({studentUsers.length})</span>
              </button>
            </div>

            {enrollTab === 'CREATE_NEW' ? (
              /* Sub-form: Create student/instructor from scratch and enroll */
              <form
                onSubmit={(e) => handleCreateStudentFromScratch(e, newStudentForm.classroomId)}
                className="space-y-3.5 text-xs"
              >
                {newStudentForm.error && (
                  <div className="p-2.5 bg-red-950/50 border border-red-800 text-red-300 text-xs">
                    {newStudentForm.error}
                  </div>
                )}

                {/* Role selector */}
                <div>
                  <label className="block text-white font-bold mb-1.5 flex items-center justify-between">
                    <span>Papel de Acesso / Nível de Privilégio *</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      {newStudentForm.role === 'INSTRUCTOR' ? 'Acesso privilegiado a tudo' : 'Restrito a aulas e atividades'}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setNewStudentForm((prev) => ({
                          ...prev,
                          role: 'STUDENT',
                          rank: prev.rank === 'Instrutor / Oficial' ? 'Recruta / Aluno' : prev.rank,
                          registrationNumber: prev.registrationNumber.startsWith('INST-')
                            ? prev.registrationNumber.replace('INST-', 'REC-')
                            : prev.registrationNumber,
                        }))
                      }
                      className={`p-2.5 text-left border rounded-none transition cursor-pointer flex flex-col justify-between ${
                        newStudentForm.role === 'STUDENT'
                          ? 'bg-blue-950/40 border-blue-500 text-white'
                          : 'bg-[#121418] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs flex items-center gap-1.5 text-blue-400">
                          <GraduationCap className="w-4 h-4" />
                          Aluno / Recruta
                        </span>
                        {newStudentForm.role === 'STUDENT' && (
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Sujeito a restrições de aluno (aulas, simulados e certificados próprios).
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setNewStudentForm((prev) => ({
                          ...prev,
                          role: 'INSTRUCTOR',
                          rank: prev.rank === 'Recruta / Aluno' ? 'Instrutor / Oficial' : prev.rank,
                          registrationNumber: prev.registrationNumber.startsWith('REC-')
                            ? prev.registrationNumber.replace('REC-', 'INST-')
                            : prev.registrationNumber,
                        }))
                      }
                      className={`p-2.5 text-left border rounded-none transition cursor-pointer flex flex-col justify-between ${
                        newStudentForm.role === 'INSTRUCTOR'
                          ? 'bg-emerald-950/40 border-emerald-500 text-white'
                          : 'bg-[#121418] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-400">
                          <ShieldCheck className="w-4 h-4" />
                          Instrutor / Oficial
                        </span>
                        {newStudentForm.role === 'INSTRUCTOR' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Acesso privilegiado a tudo (cursos, turmas, notas, alunos e gestão).
                      </p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-white font-bold mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo de Oliveira"
                    value={newStudentForm.name}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-1">E-mail de Acesso *</label>
                  <input
                    type="email"
                    required
                    placeholder={
                      newStudentForm.role === 'INSTRUCTOR'
                        ? 'Ex: carlos.oliveira@instrutor.vulcan.com'
                        : 'Ex: carlos.oliveira@aluno.vulcan.com'
                    }
                    value={newStudentForm.email}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white font-bold mb-1">Matrícula / RE</label>
                    <input
                      type="text"
                      placeholder={newStudentForm.role === 'INSTRUCTOR' ? 'Ex: INST-2026-081' : 'Ex: REC-2026-081'}
                      value={newStudentForm.registrationNumber}
                      onChange={(e) =>
                        setNewStudentForm({ ...newStudentForm, registrationNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-bold mb-1">Posto / Categoria</label>
                    <select
                      value={newStudentForm.rank}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, rank: e.target.value })}
                      className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500"
                    >
                      {newStudentForm.role === 'INSTRUCTOR' ? (
                        <>
                          <option value="Instrutor / Oficial">Instrutor / Oficial</option>
                          <option value="Oficial Instrutor">Oficial Instrutor</option>
                          <option value="Comandante de Pelotão">Comandante de Pelotão</option>
                          <option value="Coordenador Técnico">Coordenador Técnico</option>
                          <option value="Instrutor Chefe">Instrutor Chefe</option>
                          <option value="Monitor Operacional">Monitor Operacional</option>
                        </>
                      ) : (
                        <>
                          <option value="Recruta / Aluno">Recruta / Aluno</option>
                          <option value="Aluno Bombeiro">Aluno Bombeiro</option>
                          <option value="Soldado">Soldado</option>
                          <option value="Brigadista">Brigadista</option>
                          <option value="Cabo">Cabo</option>
                          <option value="Sargento">Sargento</option>
                          <option value="Civil Voluntário">Civil Voluntário</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white font-bold mb-1">Senha Inicial</label>
                    <div className="relative">
                      <input
                        type={newStudentForm.showPassword ? 'text' : 'password'}
                        value={newStudentForm.password}
                        onChange={(e) =>
                          setNewStudentForm({ ...newStudentForm, password: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setNewStudentForm((prev) => ({ ...prev, showPassword: !prev.showPassword }))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {newStudentForm.showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-bold mb-1">Turma de Destino *</label>
                    {classrooms.length === 0 ? (
                      <p className="text-orange-400 italic text-[11px] pt-1">
                        Nenhuma turma cadastrada. Crie uma turma primeiro.
                      </p>
                    ) : (
                      <select
                        required
                        value={newStudentForm.classroomId}
                        onChange={(e) =>
                          setNewStudentForm({ ...newStudentForm, classroomId: e.target.value })
                        }
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
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setNewEnrollModal(false)}
                    className="px-3 py-1.5 rounded-none bg-[#121418] text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={newStudentForm.isSubmitting || classrooms.length === 0}
                    className="px-5 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-white font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{newStudentForm.isSubmitting ? 'Cadastrando...' : 'Cadastrar e Matricular'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Sub-form: Select existing student and enroll */
              <form onSubmit={handleEnrollExistingSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-white font-bold mb-1">Selecionar Usuário / Aluno *</label>
                  {studentUsers.length === 0 ? (
                    <div className="p-3 bg-amber-950/30 border border-amber-800/40 text-amber-300 space-y-2">
                      <p>Nenhum aluno registrado no sistema ainda.</p>
                      <button
                        type="button"
                        onClick={() => setEnrollTab('CREATE_NEW')}
                        className="underline text-white font-bold cursor-pointer"
                      >
                        Clique aqui para criar um novo usuário do zero.
                      </button>
                    </div>
                  ) : (
                    <select
                      required
                      value={enrollData.studentId}
                      onChange={(e) => setEnrollData({ ...enrollData, studentId: e.target.value })}
                      className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500"
                    >
                      <option value="">-- Selecione o Aluno/Instrutor --</option>
                      {studentUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role === 'INSTRUCTOR' ? 'INSTRUTOR' : 'ALUNO'}) • {u.email} {u.registrationNumber ? `• ${u.registrationNumber}` : ''}
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
                    className="px-3 py-1.5 rounded-none bg-[#121418] text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={studentUsers.length === 0 || classrooms.length === 0}
                    className="px-5 py-1.5 rounded-none bg-orange-600 hover:bg-orange-500 text-white font-bold disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    Confirmar Matrícula
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Dedicated "Cadastrar Novo Usuário / Aluno do Zero" Modal */}
      {dedicatedNewStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-none bg-[#0c0b0e] border border-slate-800 shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-orange-500" />
                <span>Cadastrar Novo Usuário do Zero (Aluno ou Instrutor)</span>
              </h3>
              <button
                onClick={() => setDedicatedNewStudentModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) =>
                handleCreateStudentFromScratch(e, newStudentForm.classroomId, () =>
                  setDedicatedNewStudentModal(false)
                )
              }
              className="space-y-3.5 text-xs"
            >
              {newStudentForm.error && (
                <div className="p-2.5 bg-red-950/50 border border-red-800 text-red-300 text-xs">
                  {newStudentForm.error}
                </div>
              )}

              {/* Role selector card */}
              <div>
                <label className="block text-white font-bold mb-1.5 flex items-center justify-between">
                  <span>Papel de Acesso / Categoria de Privilégio *</span>
                  <span className="text-[10px] font-normal text-slate-400">
                    {newStudentForm.role === 'INSTRUCTOR' ? 'Acesso privilegiado a tudo' : 'Restrito a aluno'}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setNewStudentForm((prev) => ({
                        ...prev,
                        role: 'STUDENT',
                        rank: prev.rank === 'Instrutor / Oficial' ? 'Recruta / Aluno' : prev.rank,
                        registrationNumber: prev.registrationNumber.startsWith('INST-')
                          ? prev.registrationNumber.replace('INST-', 'REC-')
                          : prev.registrationNumber,
                      }))
                    }
                    className={`p-3 text-left border rounded-none transition cursor-pointer flex flex-col justify-between ${
                      newStudentForm.role === 'STUDENT'
                        ? 'bg-blue-950/40 border-blue-500 text-white ring-1 ring-blue-500/50'
                        : 'bg-[#121418] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-1.5 text-blue-400">
                        <GraduationCap className="w-4 h-4" />
                        Aluno / Recruta
                      </span>
                      {newStudentForm.role === 'STUDENT' && (
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Acesso padrão: sujeito a restrições de aluno (aulas, simulados e certificados próprios).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setNewStudentForm((prev) => ({
                        ...prev,
                        role: 'INSTRUCTOR',
                        rank: prev.rank === 'Recruta / Aluno' ? 'Instrutor / Oficial' : prev.rank,
                        registrationNumber: prev.registrationNumber.startsWith('REC-')
                          ? prev.registrationNumber.replace('REC-', 'INST-')
                          : prev.registrationNumber,
                      }))
                    }
                    className={`p-3 text-left border rounded-none transition cursor-pointer flex flex-col justify-between ${
                      newStudentForm.role === 'INSTRUCTOR'
                        ? 'bg-emerald-950/40 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                        : 'bg-[#121418] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                        Instrutor / Oficial
                      </span>
                      {newStudentForm.role === 'INSTRUCTOR' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Acesso privilegiado a tudo (criação de cursos, turmas, notas, alunos e gestão).
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-white font-bold mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Marcos Vinícius da Silva"
                  value={newStudentForm.name}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-1">E-mail de Acesso ao Sistema *</label>
                <input
                  type="email"
                  required
                  placeholder={
                    newStudentForm.role === 'INSTRUCTOR'
                      ? 'Ex: marcos.silva@instrutor.vulcan.com'
                      : 'Ex: marcos.silva@aluno.vulcan.com'
                  }
                  value={newStudentForm.email}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white font-bold mb-1">Matrícula / Registro Funcional</label>
                  <input
                    type="text"
                    placeholder={newStudentForm.role === 'INSTRUCTOR' ? 'Ex: INST-2026-1044' : 'Ex: REC-2026-1044'}
                    value={newStudentForm.registrationNumber}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, registrationNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-white font-bold mb-1">Posto / Graduação / Categoria</label>
                  <select
                    value={newStudentForm.rank}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, rank: e.target.value })}
                    className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500"
                  >
                    {newStudentForm.role === 'INSTRUCTOR' ? (
                      <>
                        <option value="Instrutor / Oficial">Instrutor / Oficial</option>
                        <option value="Oficial Instrutor">Oficial Instrutor</option>
                        <option value="Comandante de Pelotão">Comandante de Pelotão</option>
                        <option value="Coordenador Técnico">Coordenador Técnico</option>
                        <option value="Instrutor Chefe">Instrutor Chefe</option>
                        <option value="Monitor Operacional">Monitor Operacional</option>
                      </>
                    ) : (
                      <>
                        <option value="Recruta / Aluno">Recruta / Aluno</option>
                        <option value="Aluno Bombeiro">Aluno Bombeiro</option>
                        <option value="Soldado">Soldado</option>
                        <option value="Brigadista">Brigadista</option>
                        <option value="Cabo">Cabo</option>
                        <option value="Sargento">Sargento</option>
                        <option value="Civil Voluntário">Civil Voluntário</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white font-bold mb-1">Senha Inicial de Acesso</label>
                  <div className="relative">
                    <input
                      type={newStudentForm.showPassword ? 'text' : 'password'}
                      value={newStudentForm.password}
                      onChange={(e) =>
                        setNewStudentForm({ ...newStudentForm, password: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setNewStudentForm((prev) => ({ ...prev, showPassword: !prev.showPassword }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {newStudentForm.showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-white font-bold mb-1">
                    Matricular em Turma <span className="text-slate-500 font-normal">(Opcional)</span>
                  </label>
                  <select
                    value={newStudentForm.classroomId}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, classroomId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#121418] border border-slate-800 text-white rounded-none focus:outline-none focus:border-orange-500"
                  >
                    <option value="">-- Não matricular agora --</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDedicatedNewStudentModal(false)}
                  className="px-3 py-1.5 rounded-none bg-[#121418] text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={newStudentForm.isSubmitting}
                  className="px-5 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-white font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {newStudentForm.isSubmitting
                      ? 'Salvando no Firebase...'
                      : newStudentForm.role === 'INSTRUCTOR'
                      ? 'Criar Instrutor'
                      : 'Criar Aluno'}
                  </span>
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
