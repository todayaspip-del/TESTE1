import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db as firestoreDb } from '../firebase';
import {
  Course,
  CourseModule,
  Lesson,
  Classroom,
  Enrollment,
  LessonProgress,
  CourseProgress,
  Comment,
  Announcement,
  CalendarEvent,
  Certificate,
  PrivateNote,
  AuditLog,
  QuizAttempt,
  Submission,
  LessonMaterial,
  Activity,
} from '../types';
import {
  SEED_COURSES,
  SEED_CLASSROOMS,
  SEED_ENROLLMENTS,
  SEED_LESSON_PROGRESS,
  SEED_COMMENTS,
  SEED_ANNOUNCEMENTS,
  SEED_CALENDAR_EVENTS,
  SEED_CERTIFICATES,
  SEED_PRIVATE_NOTES,
  SEED_AUDIT_LOGS,
} from '../data/seedData';
import { useAuth } from './AuthContext';
import confetti from 'canvas-confetti';

interface LmsDataContextType {
  courses: Course[];
  classrooms: Classroom[];
  enrollments: Enrollment[];
  lessonProgress: Record<string, LessonProgress>;
  comments: Comment[];
  announcements: Announcement[];
  calendarEvents: CalendarEvent[];
  certificates: Certificate[];
  privateNotes: PrivateNote[];
  auditLogs: AuditLog[];
  quizAttempts: QuizAttempt[];
  submissions: Submission[];

  // Progress actions
  updateLessonProgress: (
    lessonId: string,
    currentSeconds: number,
    durationSeconds: number,
    forceComplete?: boolean
  ) => void;
  markLessonCompleteManual: (lessonId: string) => void;
  getLessonProgress: (studentId: string, lessonId: string) => LessonProgress | undefined;
  getCourseProgress: (studentId: string, courseId: string) => CourseProgress;

  // Comments
  addComment: (lessonId: string, content: string, parentId?: string) => void;
  pinComment: (commentId: string) => void;
  deleteComment: (commentId: string) => void;

  // Quizzes & Submissions
  submitQuiz: (activityId: string, answers: Record<string, string | string[]>, score: number, passed: boolean) => void;
  deleteQuizAttempt: (attemptId: string) => void;
  submitEssay: (activityId: string, textAnswer: string, fileName?: string) => void;
  gradeSubmission: (submissionId: string, score: number, feedback: string) => void;

  // Certificates
  issueCertificate: (studentId: string, courseId: string, studentName?: string, courseTitle?: string) => Certificate;
  getCertificateByCode: (code: string) => Certificate | undefined;
  deleteCertificate: (certId: string) => void;

  // Announcements & Notes
  createAnnouncement: (title: string, body: string, urgent: boolean, classroomId?: string) => void;
  deleteAnnouncement: (announcementId: string) => void;
  addPrivateNote: (subjectId: string, content: string) => void;

  // Calendar
  createCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  deleteCalendarEvent: (eventId: string) => void;

  // Classrooms & Enrollments
  createClassroom: (classroom: Omit<Classroom, 'id'>) => Classroom;
  deleteClassroom: (classroomId: string) => void;
  enrollStudent: (studentId: string, classroomId: string, courseId: string) => void;
  unenrollStudent: (enrollmentId: string) => void;

  // Admin Course / Lesson Management
  saveCourse: (course: Course) => void;
  deleteCourse: (courseId: string) => void;
  saveModule: (courseId: string, module: CourseModule) => void;
  deleteModule: (courseId: string, moduleId: string) => void;
  saveLesson: (courseId: string, moduleId: string, lesson: Lesson) => void;
  deleteLesson: (courseId: string, moduleId: string, lessonId: string) => void;
  addActivity: (courseId: string, activity: Activity, moduleId?: string, lessonId?: string) => void;
  deleteActivity: (activityId: string) => void;
  addLessonMaterial: (courseId: string, material: LessonMaterial, moduleId?: string, lessonId?: string) => void;
  deleteLessonMaterial: (materialId: string) => void;

  // Reset
  resetData: () => void;
}

const LmsDataContext = createContext<LmsDataContextType | undefined>(undefined);

const STORAGE_PREFIX = 'vulcan_lms_prod_data_v3_';
const FIRESTORE_DOC_PATH = 'system_data';
const FIRESTORE_DOC_ID = 'lms_main_db';

export const LmsDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'courses');
      const parsed: Course[] = saved ? JSON.parse(saved) : SEED_COURSES;
      return parsed.map((c) => ({
        ...c,
        bannerUrl:
          !c.bannerUrl || c.bannerUrl.includes('unsplash.com')
            ? 'https://i.ibb.co/JWKjqdVS/BANNER45.png'
            : c.bannerUrl,
      }));
    } catch {
      return SEED_COURSES;
    }
  });

  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'classrooms');
      return saved ? JSON.parse(saved) : SEED_CLASSROOMS;
    } catch {
      return SEED_CLASSROOMS;
    }
  });

  const [enrollments, setEnrollments] = useState<Enrollment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'enrollments');
      return saved ? JSON.parse(saved) : SEED_ENROLLMENTS;
    } catch {
      return SEED_ENROLLMENTS;
    }
  });

  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'lesson_progress');
      return saved ? JSON.parse(saved) : SEED_LESSON_PROGRESS;
    } catch {
      return SEED_LESSON_PROGRESS;
    }
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'comments');
      return saved ? JSON.parse(saved) : SEED_COMMENTS;
    } catch {
      return SEED_COMMENTS;
    }
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'announcements');
      return saved ? JSON.parse(saved) : SEED_ANNOUNCEMENTS;
    } catch {
      return SEED_ANNOUNCEMENTS;
    }
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'calendar');
      return saved ? JSON.parse(saved) : SEED_CALENDAR_EVENTS;
    } catch {
      return SEED_CALENDAR_EVENTS;
    }
  });

  const [certificates, setCertificates] = useState<Certificate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'certificates');
      return saved ? JSON.parse(saved) : SEED_CERTIFICATES;
    } catch {
      return SEED_CERTIFICATES;
    }
  });

  const [privateNotes, setPrivateNotes] = useState<PrivateNote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'private_notes');
      return saved ? JSON.parse(saved) : SEED_PRIVATE_NOTES;
    } catch {
      return SEED_PRIVATE_NOTES;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'audit_logs');
      return saved ? JSON.parse(saved) : SEED_AUDIT_LOGS;
    } catch {
      return SEED_AUDIT_LOGS;
    }
  });

  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'quiz_attempts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + 'submissions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Circuit breaker flag for Firestore quota exhaustion
  const [isQuotaExhausted, setIsQuotaExhausted] = useState<boolean>(false);
  const quotaExhaustedUntilRef = React.useRef<number>(0);
  const syncTimeoutRef = React.useRef<any>(null);
  const pendingSyncDataRef = React.useRef<Record<string, any>>({});

  // Real-time Cloud Firestore Synchronizer with debouncing & quota circuit breaker
  const flushSyncToCloud = useCallback(async (dataToSync: Record<string, any>) => {
    const now = Date.now();
    // If quota was exhausted recently, skip Firestore and write directly to local/server
    const isUnderQuotaLockout = now < quotaExhaustedUntilRef.current;

    if (!isUnderQuotaLockout) {
      try {
        const docRef = doc(firestoreDb, FIRESTORE_DOC_PATH, FIRESTORE_DOC_ID);
        await setDoc(docRef, { ...dataToSync, updatedAt: new Date().toISOString() }, { merge: true });
        return;
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        if (errMsg.includes('resource-exhausted') || errMsg.includes('Quota limit') || errMsg.includes('quota')) {
          // Lockout Firestore write retries for 3 minutes to avoid hammering the API
          quotaExhaustedUntilRef.current = Date.now() + 180000;
          setIsQuotaExhausted(true);
          console.warn('Firestore write quota reached. Switched seamlessly to local/server storage mode.');
        } else {
          console.warn('Firestore sync note:', errMsg);
        }
      }
    }

    // Fallback to server API if available
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSync),
      });
    } catch {
      // Offline/static fallback handled by localStorage
    }
  }, []);

  const syncToCloud = useCallback((partialData: Record<string, any>, immediate: boolean = false) => {
    pendingSyncDataRef.current = { ...pendingSyncDataRef.current, ...partialData };

    if (immediate) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      const data = { ...pendingSyncDataRef.current };
      pendingSyncDataRef.current = {};
      flushSyncToCloud(data);
    } else {
      if (!syncTimeoutRef.current) {
        syncTimeoutRef.current = setTimeout(() => {
          syncTimeoutRef.current = null;
          const data = { ...pendingSyncDataRef.current };
          pendingSyncDataRef.current = {};
          flushSyncToCloud(data);
        }, 5000); // 5s debounce
      }
    }
  }, [flushSyncToCloud]);

  // Real-time listener: onSnapshot listens for instant changes across ALL devices and accounts globally
  useEffect(() => {
    let isMounted = true;
    const docRef = doc(firestoreDb, FIRESTORE_DOC_PATH, FIRESTORE_DOC_ID);

    // Initial check: if empty, seed initial data
    getDoc(docRef).then((snap) => {
      if (!snap.exists()) {
        const seedPayload = {
          courses: SEED_COURSES,
          classrooms: SEED_CLASSROOMS,
          enrollments: SEED_ENROLLMENTS,
          lessonProgress: SEED_LESSON_PROGRESS,
          comments: SEED_COMMENTS,
          announcements: SEED_ANNOUNCEMENTS,
          calendarEvents: SEED_CALENDAR_EVENTS,
          certificates: SEED_CERTIFICATES,
          privateNotes: SEED_PRIVATE_NOTES,
          auditLogs: SEED_AUDIT_LOGS,
          quizAttempts: [],
          submissions: [],
          updatedAt: new Date().toISOString(),
        };
        setDoc(docRef, seedPayload);
      }
    }).catch((err) => {
      console.warn('Firestore initial check error, attempting server fallback:', err);
    });

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (!isMounted) return;
      if (snapshot.exists()) {
        const sData = snapshot.data();
        if (Array.isArray(sData.courses) && sData.courses.length > 0) {
          const sanitizedCourses = sData.courses.map((c: Course) => ({
            ...c,
            bannerUrl:
              !c.bannerUrl || c.bannerUrl.includes('unsplash.com')
                ? 'https://i.ibb.co/JWKjqdVS/BANNER45.png'
                : c.bannerUrl,
          }));
          setCourses(sanitizedCourses);
          localStorage.setItem(STORAGE_PREFIX + 'courses', JSON.stringify(sanitizedCourses));
        }
        if (Array.isArray(sData.classrooms)) {
          setClassrooms(sData.classrooms);
          localStorage.setItem(STORAGE_PREFIX + 'classrooms', JSON.stringify(sData.classrooms));
        }
        if (Array.isArray(sData.enrollments)) {
          setEnrollments(sData.enrollments);
          localStorage.setItem(STORAGE_PREFIX + 'enrollments', JSON.stringify(sData.enrollments));
        }
        if (sData.lessonProgress && typeof sData.lessonProgress === 'object') {
          setLessonProgress(sData.lessonProgress);
          localStorage.setItem(STORAGE_PREFIX + 'lesson_progress', JSON.stringify(sData.lessonProgress));
        }
        if (Array.isArray(sData.comments)) {
          setComments(sData.comments);
          localStorage.setItem(STORAGE_PREFIX + 'comments', JSON.stringify(sData.comments));
        }
        if (Array.isArray(sData.announcements)) {
          setAnnouncements(sData.announcements);
          localStorage.setItem(STORAGE_PREFIX + 'announcements', JSON.stringify(sData.announcements));
        }
        if (Array.isArray(sData.calendarEvents)) {
          setCalendarEvents(sData.calendarEvents);
          localStorage.setItem(STORAGE_PREFIX + 'calendar', JSON.stringify(sData.calendarEvents));
        }
        if (Array.isArray(sData.certificates)) {
          setCertificates(sData.certificates);
          localStorage.setItem(STORAGE_PREFIX + 'certificates', JSON.stringify(sData.certificates));
        }
        if (Array.isArray(sData.privateNotes)) {
          setPrivateNotes(sData.privateNotes);
          localStorage.setItem(STORAGE_PREFIX + 'private_notes', JSON.stringify(sData.privateNotes));
        }
        if (Array.isArray(sData.auditLogs)) {
          setAuditLogs(sData.auditLogs);
          localStorage.setItem(STORAGE_PREFIX + 'audit_logs', JSON.stringify(sData.auditLogs));
        }
        if (Array.isArray(sData.quizAttempts)) {
          setQuizAttempts(sData.quizAttempts);
          localStorage.setItem(STORAGE_PREFIX + 'quiz_attempts', JSON.stringify(sData.quizAttempts));
        }
        if (Array.isArray(sData.submissions)) {
          setSubmissions(sData.submissions);
          localStorage.setItem(STORAGE_PREFIX + 'submissions', JSON.stringify(sData.submissions));
        }
      }
    }, (err) => {
      console.warn('Firestore live listener disconnected, falling back to server polling:', err);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const logAudit = (action: string, metadata?: Record<string, any>) => {
    if (!currentUser) return;
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      metadata,
      createdAt: new Date().toISOString(),
    };
    setAuditLogs((prev) => {
      const next = [newLog, ...prev];
      localStorage.setItem(STORAGE_PREFIX + 'audit_logs', JSON.stringify(next));
      syncToCloud({ auditLogs: next });
      return next;
    });
  };

  const getLessonProgress = (studentId: string, lessonId: string): LessonProgress | undefined => {
    return lessonProgress[`${studentId}_${lessonId}`];
  };

  const getCourseProgress = (studentId: string, courseId: string): CourseProgress => {
    const course = courses.find((c) => c.id === courseId);
    if (!course || !course.modules || course.modules.length === 0) {
      return {
        id: `cp-${studentId}-${courseId}`,
        studentId,
        courseId,
        progressPct: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 0,
      };
    }

    const allLessons: Lesson[] = [];
    course.modules.forEach((m) => {
      if (m.lessons) {
        m.lessons.forEach((l) => allLessons.push(l));
      }
    });

    if (allLessons.length === 0) {
      return {
        id: `cp-${studentId}-${courseId}`,
        studentId,
        courseId,
        progressPct: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 0,
      };
    }

    let completedCount = 0;
    let lastLessonId: string | undefined = undefined;

    allLessons.forEach((l) => {
      const prog = getLessonProgress(studentId, l.id);
      if (prog?.completed) {
        completedCount++;
      }
      if (prog && prog.progressPct > 0) {
        lastLessonId = l.id;
      }
    });

    const progressPct = Math.round((completedCount / allLessons.length) * 100);

    return {
      id: `cp-${studentId}-${courseId}`,
      studentId,
      courseId,
      progressPct,
      completedLessonsCount: completedCount,
      totalLessonsCount: allLessons.length,
      lastLessonId,
    };
  };

  const updateLessonProgress = (
    lessonId: string,
    currentSeconds: number,
    durationSeconds: number,
    forceComplete: boolean = false
  ) => {
    if (!currentUser) return;
    const studentId = currentUser.id;
    const key = `${studentId}_${lessonId}`;
    const existing = lessonProgress[key];

    let rule: 'MANUAL' | 'WATCH_80' | 'WATCH_90' | 'WATCH_100' = 'WATCH_80';
    for (const c of courses) {
      for (const m of c.modules || []) {
        if (m.lessons && m.lessons.some((l) => l.id === lessonId)) {
          rule = c.completionRule || 'WATCH_80';
          break;
        }
      }
    }

    const maxSeconds = Math.max(existing?.lastPositionSeconds || 0, Math.floor(currentSeconds));
    const calculatedPct = durationSeconds > 0 ? Math.min(100, Math.round((maxSeconds / durationSeconds) * 100)) : 0;
    const progressPct = Math.max(existing?.progressPct || 0, calculatedPct);

    let isCompleted = existing?.completed || forceComplete;

    if (!isCompleted) {
      if (rule === 'WATCH_80' && progressPct >= 80) isCompleted = true;
      else if (rule === 'WATCH_90' && progressPct >= 90) isCompleted = true;
      else if (rule === 'WATCH_100' && progressPct >= 99) isCompleted = true;
    }

    const updated: LessonProgress = {
      id: existing?.id || `prog-${Date.now()}`,
      studentId,
      lessonId,
      progressPct,
      lastPositionSeconds: maxSeconds,
      completed: isCompleted,
      startedAt: existing?.startedAt || new Date().toISOString(),
      completedAt: isCompleted ? (existing?.completedAt || new Date().toISOString()) : undefined,
      lastAccessAt: new Date().toISOString(),
    };

    setLessonProgress((prev) => {
      const next = { ...prev, [key]: updated };
      localStorage.setItem(STORAGE_PREFIX + 'lesson_progress', JSON.stringify(next));
      syncToCloud({ lessonProgress: next });
      return next;
    });

    if (isCompleted && !existing?.completed) {
      logAudit('LESSON_COMPLETED', { lessonId, studentId });
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#ea580c', '#f59e0b', '#10b981', '#ffffff'],
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const markLessonCompleteManual = (lessonId: string) => {
    if (!currentUser) return;
    const studentId = currentUser.id;
    const key = `${studentId}_${lessonId}`;
    const existing = lessonProgress[key];

    const updated: LessonProgress = {
      id: existing?.id || `prog-${Date.now()}`,
      studentId,
      lessonId,
      progressPct: 100,
      lastPositionSeconds: existing?.lastPositionSeconds || 100,
      completed: true,
      startedAt: existing?.startedAt || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      lastAccessAt: new Date().toISOString(),
    };

    setLessonProgress((prev) => {
      const next = { ...prev, [key]: updated };
      localStorage.setItem(STORAGE_PREFIX + 'lesson_progress', JSON.stringify(next));
      syncToCloud({ lessonProgress: next });
      return next;
    });

    logAudit('LESSON_MANUALLY_COMPLETED', { lessonId, studentId });
    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#ea580c', '#f97316', '#10b981'],
      });
    } catch (e) {
      console.error(e);
    }
  };

  const addComment = (lessonId: string, content: string, parentId?: string) => {
    if (!currentUser || !content.trim()) return;
    const newComment: Comment = {
      id: `cmt-${Date.now()}`,
      lessonId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatarUrl,
      authorRole: currentUser.role,
      parentId,
      content: content.trim(),
      pinned: false,
      isInstructorReply: ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role),
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => {
      const next = [...prev, newComment];
      localStorage.setItem(STORAGE_PREFIX + 'comments', JSON.stringify(next));
      syncToCloud({ comments: next });
      return next;
    });
    logAudit('COMMENT_ADDED', { lessonId, parentId });
  };

  const pinComment = (commentId: string) => {
    setComments((prev) => {
      const next = prev.map((c) => (c.id === commentId ? { ...c, pinned: !c.pinned } : c));
      localStorage.setItem(STORAGE_PREFIX + 'comments', JSON.stringify(next));
      syncToCloud({ comments: next });
      return next;
    });
    logAudit('COMMENT_PIN_TOGGLED', { commentId });
  };

  const deleteComment = (commentId: string) => {
    setComments((prev) => {
      const next = prev.filter((c) => c.id !== commentId && c.parentId !== commentId);
      localStorage.setItem(STORAGE_PREFIX + 'comments', JSON.stringify(next));
      syncToCloud({ comments: next });
      return next;
    });
    logAudit('COMMENT_DELETED', { commentId });
  };

  const submitQuiz = (
    activityId: string,
    answers: Record<string, string | string[]>,
    score: number,
    passed: boolean
  ) => {
    if (!currentUser) return;
    const newAttempt: QuizAttempt = {
      id: `attempt-${Date.now()}`,
      activityId,
      studentId: currentUser.id,
      answers,
      score,
      passed,
      attemptNo: 1,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    };
    setQuizAttempts((prev) => {
      const next = [newAttempt, ...prev];
      localStorage.setItem(STORAGE_PREFIX + 'quiz_attempts', JSON.stringify(next));
      syncToCloud({ quizAttempts: next });
      return next;
    });
    logAudit('QUIZ_SUBMITTED', { activityId, score, passed });

    if (passed) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#ea580c', '#10b981', '#ffffff'],
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const deleteQuizAttempt = (attemptId: string) => {
    setQuizAttempts((prev) => {
      const next = prev.filter((a) => a.id !== attemptId);
      localStorage.setItem(STORAGE_PREFIX + 'quiz_attempts', JSON.stringify(next));
      syncToCloud({ quizAttempts: next });
      return next;
    });
    logAudit('QUIZ_ATTEMPT_DELETED', { attemptId });
  };

  const submitEssay = (activityId: string, textAnswer: string, fileName?: string) => {
    if (!currentUser) return;
    const sub: Submission = {
      id: `sub-${Date.now()}`,
      activityId,
      studentId: currentUser.id,
      textAnswer,
      fileName,
      submittedAt: new Date().toISOString(),
    };
    setSubmissions((prev) => {
      const next = [...prev, sub];
      localStorage.setItem(STORAGE_PREFIX + 'submissions', JSON.stringify(next));
      syncToCloud({ submissions: next });
      return next;
    });
    logAudit('ESSAY_SUBMITTED', { activityId });
  };

  const gradeSubmission = (submissionId: string, score: number, feedback: string) => {
    if (!currentUser) return;
    setSubmissions((prev) => {
      const next = prev.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              score,
              feedback,
              gradedById: currentUser.id,
              gradedAt: new Date().toISOString(),
            }
          : s
      );
      localStorage.setItem(STORAGE_PREFIX + 'submissions', JSON.stringify(next));
      syncToCloud({ submissions: next });
      return next;
    });
    logAudit('SUBMISSION_GRADED', { submissionId, score });
  };

  const issueCertificate = (studentId: string, courseId: string, studentName?: string, courseTitle?: string) => {
    const course = courses.find((c) => c.id === courseId);
    const certCode = `VLC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCert: Certificate = {
      id: `cert-${Date.now()}`,
      code: certCode,
      studentId,
      studentName: studentName || (currentUser?.id === studentId ? currentUser.name : 'Aluno Vulcan'),
      courseId,
      courseTitle: courseTitle || course?.title || 'Curso Vulcan',
      issuedAt: new Date().toISOString(),
      hoursTotal: course?.totalHours || 80,
      organizationName: 'Vulcan LMS',
      instructorName: course?.instructorName || currentUser?.name || 'Instrutor Responsável',
      normaReferencia: 'Certificação de Capacitação Profissional Vulcan',
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://vulcanlms.com/validar/${certCode}`,
    };

    setCertificates((prev) => {
      const next = [newCert, ...prev];
      localStorage.setItem(STORAGE_PREFIX + 'certificates', JSON.stringify(next));
      syncToCloud({ certificates: next });
      return next;
    });
    logAudit('CERTIFICATE_ISSUED', { code: certCode, studentId, courseId });
    return newCert;
  };

  const getCertificateByCode = (code: string) => {
    return certificates.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
  };

  const deleteCertificate = (certId: string) => {
    setCertificates((prev) => {
      const next = prev.filter((c) => c.id !== certId);
      localStorage.setItem(STORAGE_PREFIX + 'certificates', JSON.stringify(next));
      syncToCloud({ certificates: next });
      return next;
    });
    logAudit('CERTIFICATE_DELETED', { certId });
  };

  const createAnnouncement = (title: string, body: string, urgent: boolean, classroomId?: string) => {
    if (!currentUser) return;
    const newAnc: Announcement = {
      id: `anc-${Date.now()}`,
      classroomId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      title,
      body,
      urgent,
      publishAt: new Date().toISOString(),
    };
    setAnnouncements((prev) => {
      const next = [newAnc, ...prev];
      localStorage.setItem(STORAGE_PREFIX + 'announcements', JSON.stringify(next));
      syncToCloud({ announcements: next });
      return next;
    });
    logAudit('ANNOUNCEMENT_CREATED', { title, urgent });
  };

  const deleteAnnouncement = (announcementId: string) => {
    setAnnouncements((prev) => {
      const next = prev.filter((a) => a.id !== announcementId);
      localStorage.setItem(STORAGE_PREFIX + 'announcements', JSON.stringify(next));
      syncToCloud({ announcements: next });
      return next;
    });
    logAudit('ANNOUNCEMENT_DELETED', { announcementId });
  };

  const addPrivateNote = (subjectId: string, content: string) => {
    if (!currentUser) return;
    const newNote: PrivateNote = {
      id: `note-${Date.now()}`,
      subjectId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      content,
      createdAt: new Date().toISOString(),
    };
    setPrivateNotes((prev) => {
      const next = [newNote, ...prev];
      localStorage.setItem(STORAGE_PREFIX + 'private_notes', JSON.stringify(next));
      syncToCloud({ privateNotes: next });
      return next;
    });
    logAudit('PRIVATE_NOTE_CREATED', { subjectId });
  };

  const createCalendarEvent = (event: Omit<CalendarEvent, 'id'>) => {
    const newEvt: CalendarEvent = {
      ...event,
      id: `evt-${Date.now()}`,
    };
    setCalendarEvents((prev) => {
      const next = [newEvt, ...prev];
      localStorage.setItem(STORAGE_PREFIX + 'calendar', JSON.stringify(next));
      syncToCloud({ calendarEvents: next });
      return next;
    });
    logAudit('CALENDAR_EVENT_CREATED', { title: event.title });
  };

  const deleteCalendarEvent = (eventId: string) => {
    setCalendarEvents((prev) => {
      const next = prev.filter((e) => e.id !== eventId);
      localStorage.setItem(STORAGE_PREFIX + 'calendar', JSON.stringify(next));
      syncToCloud({ calendarEvents: next });
      return next;
    });
    logAudit('CALENDAR_EVENT_DELETED', { eventId });
  };

  const createClassroom = (classroom: Omit<Classroom, 'id'>) => {
    const newCls: Classroom = {
      ...classroom,
      id: `cls-${Date.now()}`,
    };
    setClassrooms((prev) => {
      const next = [newCls, ...prev];
      localStorage.setItem(STORAGE_PREFIX + 'classrooms', JSON.stringify(next));
      syncToCloud({ classrooms: next });
      return next;
    });
    logAudit('CLASSROOM_CREATED', { name: classroom.name, code: classroom.code });
    return newCls;
  };

  const deleteClassroom = (classroomId: string) => {
    setClassrooms((prev) => {
      const next = prev.filter((c) => c.id !== classroomId);
      localStorage.setItem(STORAGE_PREFIX + 'classrooms', JSON.stringify(next));
      syncToCloud({ classrooms: next });
      return next;
    });
    setEnrollments((prev) => {
      const next = prev.filter((e) => e.classroomId !== classroomId);
      localStorage.setItem(STORAGE_PREFIX + 'enrollments', JSON.stringify(next));
      syncToCloud({ enrollments: next });
      return next;
    });
    logAudit('CLASSROOM_DELETED', { classroomId });
  };

  const saveCourse = (course: Course) => {
    setCourses((prev) => {
      const idx = prev.findIndex((c) => c.id === course.id);
      let next: Course[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = course;
      } else {
        next = [course, ...prev];
      }
      localStorage.setItem(STORAGE_PREFIX + 'courses', JSON.stringify(next));
      syncToCloud({ courses: next });
      return next;
    });
    logAudit('COURSE_SAVED', { courseId: course.id, title: course.title });
  };

  const deleteCourse = (courseId: string) => {
    setCourses((prev) => {
      const next = prev.filter((c) => c.id !== courseId);
      localStorage.setItem(STORAGE_PREFIX + 'courses', JSON.stringify(next));
      syncToCloud({ courses: next });
      return next;
    });
    setEnrollments((prev) => {
      const next = prev.filter((e) => e.courseId !== courseId);
      localStorage.setItem(STORAGE_PREFIX + 'enrollments', JSON.stringify(next));
      syncToCloud({ enrollments: next });
      return next;
    });
    logAudit('COURSE_DELETED', { courseId });
  };

  const saveLesson = (courseId: string, moduleId: string, lesson: Lesson) => {
    setCourses((prev) => {
      const next = prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: (c.modules || []).map((m) => {
            if (m.id !== moduleId) return m;
            const lessons = m.lessons || [];
            const lIdx = lessons.findIndex((l) => l.id === lesson.id);
            const newLessons = [...lessons];
            if (lIdx >= 0) {
              newLessons[lIdx] = lesson;
            } else {
              newLessons.push(lesson);
            }
            return { ...m, lessons: newLessons };
          }),
        };
      });
      localStorage.setItem(STORAGE_PREFIX + 'courses', JSON.stringify(next));
      syncToCloud({ courses: next });
      return next;
    });
    logAudit('LESSON_SAVED', { courseId, moduleId, lessonId: lesson.id });
  };

  const saveModule = (courseId: string, module: CourseModule) => {
    setCourses((prev) => {
      const next = prev.map((c) => {
        if (c.id !== courseId) return c;
        const modules = c.modules || [];
        const mIdx = modules.findIndex((m) => m.id === module.id);
        const newModules = [...modules];
        if (mIdx >= 0) {
          newModules[mIdx] = module;
        } else {
          newModules.push(module);
        }
        return { ...c, modules: newModules };
      });
      localStorage.setItem(STORAGE_PREFIX + 'courses', JSON.stringify(next));
      syncToCloud({ courses: next });
      return next;
    });
    logAudit('MODULE_SAVED', { courseId, moduleId: module.id });
  };

  const deleteModule = (courseId: string, moduleId: string) => {
    setCourses((prev) => {
      const next = prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: (c.modules || []).filter((m) => m.id !== moduleId),
        };
      });
      localStorage.setItem(STORAGE_PREFIX + 'courses', JSON.stringify(next));
      syncToCloud({ courses: next });
      return next;
    });
    logAudit('MODULE_DELETED', { courseId, moduleId });
  };

  const deleteLesson = (courseId: string, moduleId: string, lessonId: string) => {
    setCourses((prev) => {
      const next = prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: (c.modules || []).map((m) => {
            if (m.id !== moduleId) return m;
            return {
              ...m,
              lessons: (m.lessons || []).filter((l) => l.id !== lessonId),
            };
          }),
        };
      });
      localStorage.setItem(STORAGE_PREFIX + 'courses', JSON.stringify(next));
      syncToCloud({ courses: next });
      return next;
    });
    logAudit('LESSON_DELETED', { courseId, moduleId, lessonId });
  };

  const addActivity = (
    courseId: string,
    activity: Activity,
    moduleId?: string,
    lessonId?: string
  ) => {
    setCourses((prev) => {
      const next = prev.map((c) => {
        if (c.id !== courseId) return c;
        const modules = c.modules ? [...c.modules] : [];

        if (modules.length === 0) {
          const newModId = `mod-${Date.now()}`;
          const newLesId = `les-${Date.now()}`;
          modules.push({
            id: newModId,
            courseId,
            title: 'Módulo 1 — Conteúdo & Avaliações',
            order: 1,
            lessons: [
              {
                id: newLesId,
                moduleId: newModId,
                title: 'Avaliações & Simulados',
                order: 1,
                youtubeVideoId: '',
                youtubeUrl: '',
                status: 'PUBLISHED',
                materials: [],
                activities: [activity],
              },
            ],
          });
          return { ...c, modules };
        }

        let targetModIndex = moduleId ? modules.findIndex((m) => m.id === moduleId) : 0;
        if (targetModIndex === -1) targetModIndex = 0;

        const targetMod = { ...modules[targetModIndex] };
        const lessons = targetMod.lessons ? [...targetMod.lessons] : [];

        if (lessons.length === 0) {
          const newLesId = `les-${Date.now()}`;
          lessons.push({
            id: newLesId,
            moduleId: targetMod.id,
            title: 'Avaliações & Simulados',
            order: 1,
            youtubeVideoId: '',
            youtubeUrl: '',
            status: 'PUBLISHED',
            materials: [],
            activities: [activity],
          });
        } else {
          let targetLesIndex = lessonId ? lessons.findIndex((l) => l.id === lessonId) : 0;
          if (targetLesIndex === -1) targetLesIndex = 0;

          const targetLes = { ...lessons[targetLesIndex] };
          targetLes.activities = [...(targetLes.activities || []).filter((a) => a.id !== activity.id), activity];
          lessons[targetLesIndex] = targetLes;
        }

        targetMod.lessons = lessons;
        modules[targetModIndex] = targetMod;
        return { ...c, modules };
      });
      localStorage.setItem(STORAGE_PREFIX + 'courses', JSON.stringify(next));
      syncToCloud({ courses: next });
      return next;
    });
    logAudit('ACTIVITY_CREATED', { activityId: activity.id, title: activity.title, courseId });
  };

  const deleteActivity = (activityId: string) => {
    setCourses((prev) => {
      const next = prev.map((c) => ({
        ...c,
        modules: (c.modules || []).map((m) => ({
          ...m,
          lessons: (m.lessons || []).map((l) => ({
            ...l,
            activities: (l.activities || []).filter((a) => a.id !== activityId),
          })),
        })),
      }));
      localStorage.setItem(STORAGE_PREFIX + 'courses', JSON.stringify(next));
      syncToCloud({ courses: next });
      return next;
    });
    logAudit('ACTIVITY_DELETED', { activityId });
  };

  const addLessonMaterial = (
    courseId: string,
    material: LessonMaterial,
    moduleId?: string,
    lessonId?: string
  ) => {
    setCourses((prev) => {
      const next = prev.map((c) => {
        if (courseId && c.id !== courseId) return c;
        const modules = c.modules ? [...c.modules] : [];

        // If target lessonId is specified, search across all modules
        if (lessonId) {
          let lessonFound = false;
          const updatedModules = modules.map((m) => {
            const lessons = (m.lessons || []).map((l) => {
              if (l.id === lessonId) {
                lessonFound = true;
                return {
                  ...l,
                  materials: [...(l.materials || []).filter((mat) => mat.id !== material.id), material],
                };
              }
              return l;
            });
            return { ...m, lessons };
          });

          if (lessonFound) {
            return { ...c, modules: updatedModules };
          }
        }

        if (modules.length === 0) {
          const newModId = `mod-${Date.now()}`;
          const newLesId = `les-${Date.now()}`;
          modules.push({
            id: newModId,
            courseId: c.id,
            title: 'Módulo 1 — Conteúdo & Materiais',
            order: 1,
            lessons: [
              {
                id: newLesId,
                moduleId: newModId,
                title: 'Apostilas & Arquivos Complementares',
                order: 1,
                youtubeVideoId: '',
                youtubeUrl: '',
                status: 'PUBLISHED',
                materials: [material],
                activities: [],
              },
            ],
          });
          return { ...c, modules };
        }

        let targetModIndex = moduleId ? modules.findIndex((m) => m.id === moduleId) : 0;
        if (targetModIndex === -1) targetModIndex = 0;

        const targetMod = { ...modules[targetModIndex] };
        const lessons = targetMod.lessons ? [...targetMod.lessons] : [];

        if (lessons.length === 0) {
          const newLesId = `les-${Date.now()}`;
          lessons.push({
            id: newLesId,
            moduleId: targetMod.id,
            title: 'Apostilas & Arquivos Complementares',
            order: 1,
            youtubeVideoId: '',
            youtubeUrl: '',
            status: 'PUBLISHED',
            materials: [material],
            activities: [],
          });
        } else {
          let targetLesIndex = lessonId ? lessons.findIndex((l) => l.id === lessonId) : 0;
          if (targetLesIndex === -1) targetLesIndex = 0;

          const targetLes = { ...lessons[targetLesIndex] };
          targetLes.materials = [...(targetLes.materials || []).filter((mat) => mat.id !== material.id), material];
          lessons[targetLesIndex] = targetLes;
        }

        targetMod.lessons = lessons;
        modules[targetModIndex] = targetMod;
        return { ...c, modules };
      });
      localStorage.setItem(STORAGE_PREFIX + 'courses', JSON.stringify(next));
      syncToCloud({ courses: next });
      return next;
    });
    logAudit('MATERIAL_CREATED', { materialId: material.id, title: material.title, courseId });
  };

  const deleteLessonMaterial = (materialId: string) => {
    setCourses((prev) => {
      const next = prev.map((c) => ({
        ...c,
        modules: (c.modules || []).map((m) => ({
          ...m,
          lessons: (m.lessons || []).map((l) => ({
            ...l,
            materials: (l.materials || []).filter((mat) => mat.id !== materialId),
          })),
        })),
      }));
      localStorage.setItem(STORAGE_PREFIX + 'courses', JSON.stringify(next));
      syncToCloud({ courses: next });
      return next;
    });
    logAudit('MATERIAL_DELETED', { materialId });
  };

  const enrollStudent = (studentId: string, classroomId: string, courseId: string) => {
    const existing = enrollments.find(
      (e) => e.studentId === studentId && e.classroomId === classroomId
    );
    if (existing) return;

    const newEnrollment: Enrollment = {
      id: `enr-${Date.now()}`,
      studentId,
      classroomId,
      courseId,
      enrolledAt: new Date().toISOString(),
      active: true,
    };
    setEnrollments((prev) => {
      const next = [...prev, newEnrollment];
      localStorage.setItem(STORAGE_PREFIX + 'enrollments', JSON.stringify(next));
      syncToCloud({ enrollments: next });
      return next;
    });
    logAudit('STUDENT_ENROLLED', { studentId, classroomId, courseId });
  };

  const unenrollStudent = (enrollmentId: string) => {
    setEnrollments((prev) => {
      const next = prev.filter((e) => e.id !== enrollmentId);
      localStorage.setItem(STORAGE_PREFIX + 'enrollments', JSON.stringify(next));
      syncToCloud({ enrollments: next });
      return next;
    });
    logAudit('STUDENT_UNENROLLED', { enrollmentId });
  };

  const resetData = () => {
    localStorage.clear();
    setCourses(SEED_COURSES);
    setClassrooms(SEED_CLASSROOMS);
    setEnrollments(SEED_ENROLLMENTS);
    setLessonProgress(SEED_LESSON_PROGRESS);
    setComments(SEED_COMMENTS);
    setAnnouncements(SEED_ANNOUNCEMENTS);
    setCalendarEvents(SEED_CALENDAR_EVENTS);
    setCertificates(SEED_CERTIFICATES);
    setPrivateNotes(SEED_PRIVATE_NOTES);
    setAuditLogs(SEED_AUDIT_LOGS);
    setQuizAttempts([]);
    setSubmissions([]);
    syncToCloud({
      courses: SEED_COURSES,
      classrooms: SEED_CLASSROOMS,
      enrollments: SEED_ENROLLMENTS,
      lessonProgress: SEED_LESSON_PROGRESS,
      comments: SEED_COMMENTS,
      announcements: SEED_ANNOUNCEMENTS,
      calendarEvents: SEED_CALENDAR_EVENTS,
      certificates: SEED_CERTIFICATES,
      privateNotes: SEED_PRIVATE_NOTES,
      auditLogs: SEED_AUDIT_LOGS,
      quizAttempts: [],
      submissions: [],
    });
  };

  return (
    <LmsDataContext.Provider
      value={{
        courses,
        classrooms,
        enrollments,
        lessonProgress,
        comments,
        announcements,
        calendarEvents,
        certificates,
        privateNotes,
        auditLogs,
        quizAttempts,
        submissions,
        updateLessonProgress,
        markLessonCompleteManual,
        getLessonProgress,
        getCourseProgress,
        addComment,
        pinComment,
        deleteComment,
        submitQuiz,
        deleteQuizAttempt,
        submitEssay,
        gradeSubmission,
        issueCertificate,
        getCertificateByCode,
        deleteCertificate,
        createAnnouncement,
        deleteAnnouncement,
        addPrivateNote,
        createCalendarEvent,
        deleteCalendarEvent,
        createClassroom,
        deleteClassroom,
        saveCourse,
        deleteCourse,
        saveLesson,
        saveModule,
        deleteModule,
        deleteLesson,
        addActivity,
        deleteActivity,
        addLessonMaterial,
        deleteLessonMaterial,
        enrollStudent,
        unenrollStudent,
        resetData,
      }}
    >
      {children}
    </LmsDataContext.Provider>
  );
};

export function useLmsData() {
  const context = useContext(LmsDataContext);
  if (!context) {
    throw new Error('useLmsData must be used within a LmsDataProvider');
  }
  return context;
}
