import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { readDatabase, writeDatabase, LmsDatabase } from './lib/db';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes (same contract as the /api/*.ts Vercel functions, used for local dev)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/data', async (_req, res) => {
  try {
    const db = await readDatabase();
    res.json({ ok: true, data: db });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error?.message || 'Failed to load database' });
  }
});

app.post('/api/sync', async (req, res) => {
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

    res.json({ ok: true, updatedAt: updatedDb.updatedAt, data: updatedDb });
  } catch (error: any) {
    console.error('Sync error:', error);
    res.status(500).json({ ok: false, error: error?.message || 'Sync failed' });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const course = req.body;
    if (!course || !course.id) {
      return res.status(400).json({ ok: false, error: 'Course with id is required' });
    }
    const db = await readDatabase();
    const idx = db.courses.findIndex((c) => c.id === course.id);
    if (idx >= 0) {
      db.courses[idx] = course;
    } else {
      db.courses.push(course);
    }
    await writeDatabase(db);
    res.json({ ok: true, course, totalCourses: db.courses.length });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error?.message });
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    const db = await readDatabase();
    db.courses = db.courses.filter((c) => c.id !== courseId);
    await writeDatabase(db);
    res.json({ ok: true, remainingCourses: db.courses.length });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error?.message });
  }
});

// Start Express Server with Vite middleware (LOCAL DEV ONLY — Vercel uses /api/*.ts instead)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
