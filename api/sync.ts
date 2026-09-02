import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readDatabase, writeDatabase, LmsDatabase } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const currentDb = await readDatabase();
    const payload = req.body || {};

    const updatedDb: LmsDatabase = {
      courses: payload.courses !== undefined ? payload.courses : currentDb.courses,
      classrooms: payload.classrooms !== undefined ? payload.classrooms : currentDb.classrooms,
      enrollments: payload.enrollments !== undefined ? payload.enrollments : currentDb.enrollments,
      lessonProgress: payload.lessonProgress !== undefined ? payload.lessonProgress : currentDb.lessonProgress,
      comments: payload.comments !== undefined ? payload.comments : currentDb.comments,
      announcements: payload.announcements !== undefined ? payload.announcements : currentDb.announcements,
      calendarEvents: payload.calendarEvents !== undefined ? payload.calendarEvents : currentDb.calendarEvents,
      certificates: payload.certificates !== undefined ? payload.certificates : currentDb.certificates,
      privateNotes: payload.privateNotes !== undefined ? payload.privateNotes : currentDb.privateNotes,
      auditLogs: payload.auditLogs !== undefined ? payload.auditLogs : currentDb.auditLogs,
      quizAttempts: payload.quizAttempts !== undefined ? payload.quizAttempts : currentDb.quizAttempts,
      submissions: payload.submissions !== undefined ? payload.submissions : currentDb.submissions,
      users: payload.users !== undefined ? payload.users : currentDb.users,
      updatedAt: new Date().toISOString(),
    };

    const success = await writeDatabase(updatedDb);
    if (!success) {
      return res.status(500).json({ ok: false, error: 'Failed to persist data to Supabase' });
    }

    res.status(200).json({ ok: true, updatedAt: updatedDb.updatedAt, data: updatedDb });
  } catch (error: any) {
    console.error('Sync error:', error);
    res.status(500).json({ ok: false, error: error?.message || 'Sync failed' });
  }
}
