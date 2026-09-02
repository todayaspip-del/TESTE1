import { User, Course, Lesson, CourseModule, Enrollment, LessonProgress } from '../types';
import { hasPermission } from './rbac';

export interface AuthorizeResult {
  authorized: boolean;
  reason?: string;
  code?: 'UNAUTHENTICATED' | 'FORBIDDEN_ROLE' | 'NOT_ENROLLED' | 'NOT_RELEASED' | 'PREREQUISITE_NOT_MET' | 'OK';
}

export function authorizeLessonAccess(params: {
  user: User | null;
  action: string;
  course: Course;
  module: CourseModule;
  lesson: Lesson;
  enrollments: Enrollment[];
  userLessonProgress: Record<string, LessonProgress>;
}): AuthorizeResult {
  const { user, action, course, module, lesson, enrollments, userLessonProgress } = params;

  // 1. Authenticated
  if (!user) {
    return {
      authorized: false,
      code: 'UNAUTHENTICATED',
      reason: 'Usuário não autenticado. Faça login para acessar o conteúdo pedagógico.',
    };
  }

  // Instructors, Admins, and Super Admins bypass student enrollment/unlock locks for preview & grading
  if (['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    if (!hasPermission(user.role, action)) {
      return {
        authorized: false,
        code: 'FORBIDDEN_ROLE',
        reason: 'Seu perfil não possui permissão para executar esta ação.',
      };
    }
    return { authorized: true, code: 'OK' };
  }

  // 2. Role check
  if (!hasPermission(user.role, action)) {
    return {
      authorized: false,
      code: 'FORBIDDEN_ROLE',
      reason: 'Acesso restrito pelo controle de acesso (RBAC).',
    };
  }

  // 3. Enrolled check (for students)
  // Check if student was explicitly suspended/deactivated in this course
  const isExplicitlyInactive = enrollments.some(
    (e) => e.studentId === user.id && e.courseId === course.id && e.active === false
  );

  if (isExplicitlyInactive) {
    return {
      authorized: false,
      code: 'NOT_ENROLLED',
      reason: `Sua matrícula para o curso "${course.title}" está inativa ou suspensa. Entre em contato com a administração.`,
    };
  }

  // Check if student has explicit enrollment OR is a registered student in the organization
  const hasExplicitEnrollment = enrollments.some(
    (e) => e.studentId === user.id && e.courseId === course.id && e.active !== false
  );

  // In Vulcan LMS, all registered students have default access to available training courses
  const isEnrolled =
    hasExplicitEnrollment ||
    user.role === 'STUDENT' ||
    course.status === 'PUBLISHED' ||
    !course.status;

  if (!isEnrolled) {
    return {
      authorized: false,
      code: 'NOT_ENROLLED',
      reason: `Matrícula ativa não encontrada para o curso "${course.title}". Entre em contato com a coordenação de ensino.`,
    };
  }

  // 4. Content release date check
  const now = new Date();
  if (module.releaseAt && new Date(module.releaseAt).getTime() > now.getTime()) {
    const releaseFormatted = new Date(module.releaseAt).toLocaleDateString('pt-BR');
    return {
      authorized: false,
      code: 'NOT_RELEASED',
      reason: `Este módulo está programado para liberação em ${releaseFormatted}.`,
    };
  }

  if (lesson.releaseAt && new Date(lesson.releaseAt).getTime() > now.getTime()) {
    const releaseFormatted = new Date(lesson.releaseAt).toLocaleDateString('pt-BR');
    return {
      authorized: false,
      code: 'NOT_RELEASED',
      reason: `Esta aula estará disponível em ${releaseFormatted}.`,
    };
  }

  // 5. Prerequisite checks
  if (module.requiredModuleId) {
    // Check if all lessons in required module are completed
    const requiredMod = course.modules.find((m) => m.id === module.requiredModuleId);
    if (requiredMod) {
      const allReqCompleted = requiredMod.lessons.every((l) => {
        const prog = userLessonProgress[`${user.id}_${l.id}`] || userLessonProgress[l.id];
        return !!prog?.completed;
      });
      if (!allReqCompleted) {
        return {
          authorized: false,
          code: 'PREREQUISITE_NOT_MET',
          reason: `Você precisa concluir todas as aulas do módulo pré-requisito "${requiredMod.title}" primeiro.`,
        };
      }
    }
  }

  if (lesson.requiredLessonId) {
    const prog = userLessonProgress[`${user.id}_${lesson.requiredLessonId}`] || userLessonProgress[lesson.requiredLessonId];
    const isReqCompleted = !!prog?.completed;
    if (!isReqCompleted) {
      // Find required lesson title
      let reqTitle = 'Aula anterior';
      for (const mod of course.modules) {
        const found = mod.lessons.find((l) => l.id === lesson.requiredLessonId);
        if (found) {
          reqTitle = found.title;
          break;
        }
      }
      return {
        authorized: false,
        code: 'PREREQUISITE_NOT_MET',
        reason: `Pré-requisito pendente: Conclua a aula "${reqTitle}" antes de prosseguir.`,
      };
    }
  }

  return { authorized: true, code: 'OK' };
}
