import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LmsDataProvider, useLmsData } from './context/LmsDataContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentActivities } from './components/student/StudentActivities';
import { StudentMaterials } from './components/student/StudentMaterials';
import { StudentCalendar } from './components/student/StudentCalendar';
import { StudentCertificates } from './components/student/StudentCertificates';
import { CourseCard } from './components/course/CourseCard';
import { CourseDetailView } from './components/course/CourseDetailView';
import { LessonView } from './components/lesson/LessonView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminCourses } from './components/admin/AdminCourses';
import { AdminStudents } from './components/admin/AdminStudents';
import { AdminQuizResults } from './components/admin/AdminQuizResults';
import { AdminAuditLogs } from './components/admin/AdminAuditLogs';
import { LoginPage } from './components/auth/LoginPage';
import { BookOpen } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const { courses } = useLmsData();

  const [activeView, setActiveView] = useState<string>('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(courses[0]?.id || null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setActiveView('course-detail');
  };

  const handleSelectLesson = (courseId: string, lessonId: string) => {
    setSelectedCourseId(courseId);
    setSelectedLessonId(lessonId);
    setActiveView('lesson');
  };

  const handleBackToCourse = () => {
    setActiveView('course-detail');
  };

  const handleBackToCoursesList = () => {
    setActiveView('courses');
  };

  // Close the mobile drawer automatically whenever the view changes
  // (covers navigation triggered from places other than the sidebar itself)
  const handleSetActiveView = (view: string) => {
    setActiveView(view);
    setIsMobileNavOpen(false);
  };

  return (
    <div className="h-screen w-screen bg-[#0c0b0e] text-white flex overflow-hidden font-sans selection:bg-orange-500/30 selection:text-orange-200">
      {/* Left Sidebar (Full Height on desktop, off-canvas drawer on mobile) */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Right Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          activeView={activeView}
          setActiveView={handleSetActiveView}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
        />

        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-8 bg-[#0c0b0e] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-800">
          {/* View Router */}
          {activeView === 'dashboard' && (
            <StudentDashboard
              onSelectCourse={handleSelectCourse}
              onSelectLesson={handleSelectLesson}
              onNavigateView={setActiveView}
            />
          )}

          {activeView === 'courses' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-orange-500" />
                  <span>Currículo Oficial de Capacitação</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  Cursos & Especializações
                </h1>
                <p className="text-xs text-slate-300">
                  Grade de treinamentos técnicos homologados e módulos operacionais.
                </p>
              </div>

              {courses.length === 0 ? (
                <div className="p-12 rounded-none bg-[#121418] border border-slate-800 text-center space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="text-base font-bold text-white">Nenhum curso cadastrado ainda</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Os cursos adicionados pela coordenação pedagógica aparecerão aqui.
                  </p>
                  {currentUser && ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR'].includes(currentUser.role) && (
                    <button
                      onClick={() => setActiveView('admin-courses')}
                      className="px-4 py-2 rounded-none bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      + Cadastrar Novo Curso
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((c) => (
                    <CourseCard
                      key={c.id}
                      course={c}
                      onSelect={() => handleSelectCourse(c.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeView === 'course-detail' && (
            activeCourse ? (
              <CourseDetailView
                course={activeCourse}
                onBack={handleBackToCoursesList}
                onSelectLesson={(lesId) => handleSelectLesson(activeCourse.id, lesId)}
              />
            ) : (
              <div className="p-12 text-center bg-[#121418] border border-slate-800 rounded-none space-y-3">
                <p className="text-xs text-slate-400">Nenhum curso selecionado ou cadastrado.</p>
                <button
                  onClick={handleBackToCoursesList}
                  className="px-4 py-2 rounded-none bg-orange-600 text-white text-xs font-bold"
                >
                  Voltar para Cursos
                </button>
              </div>
            )
          )}

          {activeView === 'lesson' && (
            activeCourse && activeCourse.modules?.some((m) => m.lessons?.length > 0) ? (
              <LessonView
                course={activeCourse}
                currentLessonId={
                  selectedLessonId ||
                  activeCourse.modules[0]?.lessons[0]?.id ||
                  'les-1'
                }
                onSelectLesson={(lesId) => setSelectedLessonId(lesId)}
                onBackToCourse={handleBackToCourse}
              />
            ) : (
              <div className="p-12 text-center bg-[#121418] border border-slate-800 rounded-none space-y-3">
                <p className="text-xs text-slate-400">Esta aula ou curso ainda não possui vídeos cadastrados.</p>
                <button
                  onClick={handleBackToCoursesList}
                  className="px-4 py-2 rounded-none bg-orange-600 text-white text-xs font-bold"
                >
                  Voltar para Cursos
                </button>
              </div>
            )
          )}

          {activeView === 'activities' && (
            <StudentActivities onNavigateView={setActiveView} />
          )}

          {activeView === 'materials' && <StudentMaterials />}

          {activeView === 'calendar' && <StudentCalendar />}

          {activeView === 'certificates' && <StudentCertificates />}

          {/* Admin & Instructor Views */}
          {activeView === 'admin-dashboard' && (
            <AdminDashboard onNavigate={setActiveView} />
          )}

          {activeView === 'admin-courses' && <AdminCourses />}

          {activeView === 'admin-students' && <AdminStudents />}

          {activeView === 'admin-quizzes' && <AdminQuizResults />}

          {activeView === 'admin-audit' && <AdminAuditLogs />}
        </main>
      </div>
    </div>
  );
};

const AuthGate: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <LmsDataProvider>
      <MainAppContent />
    </LmsDataProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

