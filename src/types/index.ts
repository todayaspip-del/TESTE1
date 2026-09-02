export type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'SUPER_ADMIN';

export type CompletionRule = 'MANUAL' | 'WATCH_80' | 'WATCH_90' | 'WATCH_100';

export type ContentStatus = 'DRAFT' | 'PUBLISHED';

export type MaterialVisibility = 'STUDENT' | 'INSTRUCTOR_ONLY';

export type ActivityType = 'QUIZ' | 'ESSAY' | 'FILE_UPLOAD' | 'CHECKLIST' | 'EXAM';

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'MULTIPLE_ANSWER' | 'SHORT_ANSWER';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    motto?: string;
    registrationCode?: string;
  };
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // demo-only credential (never do this in production)
  role: Role;
  avatarUrl?: string;
  organizationId: string;
  registrationNumber?: string; // Matrícula / Registro Profissional
  rank?: string; // e.g., "Recruta", "Bombeiro Civil Nível 2", "Instrutor Chefe", "Coordenador"
  createdAt: string;
}

export interface LessonMaterial {
  id: string;
  lessonId: string;
  title: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'image' | 'zip' | 'link';
  storageKey: string;
  fileSize?: string;
  visibility: MaterialVisibility;
  downloadable: boolean;
  publishedAt: string;
}

export interface Answer {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface Question {
  id: string;
  activityId: string;
  type: QuestionType;
  prompt: string;
  order: number;
  answers: Answer[];
  explanation?: string;
}

export interface Activity {
  id: string;
  lessonId?: string;
  moduleId?: string;
  type: ActivityType;
  title: string;
  instructions?: string;
  dueDate?: string;
  minScore?: number; // e.g. 70 (%)
  maxAttempts?: number;
  timeLimitMinutes?: number;
  shuffleQuestions?: boolean;
  questions: Question[];
}

export interface Submission {
  id: string;
  activityId: string;
  studentId: string;
  fileKey?: string;
  fileName?: string;
  textAnswer?: string;
  score?: number;
  feedback?: string;
  gradedById?: string;
  submittedAt: string;
  gradedAt?: string;
}

export interface QuizAttempt {
  id: string;
  activityId: string;
  studentId: string;
  answers: Record<string, string | string[]>; // questionId -> answerId(s)
  score: number;
  passed: boolean;
  attemptNo: number;
  startedAt: string;
  finishedAt: string;
}

export interface Comment {
  id: string;
  lessonId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: Role;
  parentId?: string;
  content: string;
  pinned: boolean;
  isInstructorReply: boolean;
  createdAt: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  order: number;
  youtubeVideoId: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  status: ContentStatus;
  releaseAt?: string;
  requiredLessonId?: string;
  materials: LessonMaterial[];
  activities: Activity[];
  commentsCount?: number;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  releaseAt?: string;
  requiredModuleId?: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  organizationId: string;
  title: string;
  slug: string;
  code: string; // e.g., "FBC-14608"
  description?: string;
  bannerUrl?: string;
  totalHours?: number;
  completionRule: CompletionRule;
  status: ContentStatus;
  category: string;
  instructorName: string;
  createdAt: string;
  modules: CourseModule[];
}

export interface Classroom {
  id: string;
  organizationId: string;
  code: string; // ex: "BC-2026-01"
  name: string;
  courseId: string;
  startDate: string;
  endDate: string;
  instructorIds: string[];
  maxCapacity?: number;
  location?: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  classroomId: string;
  courseId: string;
  enrolledAt: string;
  active: boolean;
}

export interface LessonProgress {
  id: string;
  studentId: string;
  lessonId: string;
  progressPct: number;
  lastPositionSeconds: number;
  completed: boolean;
  startedAt?: string;
  completedAt?: string;
  lastAccessAt: string;
}

export interface CourseProgress {
  id: string;
  studentId: string;
  courseId: string;
  progressPct: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  lastLessonId?: string;
}

export interface Announcement {
  id: string;
  classroomId?: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  urgent: boolean;
  publishAt: string;
  expireAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'PROGRESS' | 'ANNOUNCEMENT' | 'GRADE' | 'CERTIFICATE' | 'CALENDAR' | 'COMMENT';
  title: string;
  message: string;
  read: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  classroomId?: string;
  type: 'aula' | 'prova' | 'atividade' | 'presencial' | 'prazo';
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  location?: string;
}

export interface Certificate {
  id: string;
  code: string; // e.g. "BC-2026-BR-9842"
  studentId: string;
  studentName: string;
  studentDoc?: string;
  courseId: string;
  courseTitle: string;
  issuedAt: string;
  hoursTotal: number;
  qrCodeUrl?: string;
  organizationName: string;
  instructorName: string;
  normaReferencia: string; // e.g., "ABNT NBR 14608 / NR 23"
}

export interface PrivateNote {
  id: string;
  subjectId: string; // aluno referido
  authorId: string; // instrutor/admin autor
  authorName: string;
  content: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
