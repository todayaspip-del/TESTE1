import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { readDatabase, writeDatabase, LmsDatabase } from './lib/db';

const app = express();
const PORT = 3000;

// Ensure materials directory exists
const MATERIALS_DIR = path.join(process.cwd(), 'data', 'materials');
if (!fs.existsSync(MATERIALS_DIR)) {
  try {
    fs.mkdirSync(MATERIALS_DIR, { recursive: true });
  } catch {}
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes (same contract as the /api/*.ts Vercel functions, used for local dev)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Materials Streaming Upload (Instant 0-100% progress for 12MB+ files)
app.post('/api/materials/upload', (req, res) => {
  try {
    const rawFileName = (req.headers['x-file-name'] as string) || 'material';
    let decodedFileName = 'material';
    try {
      decodedFileName = decodeURIComponent(rawFileName);
    } catch {
      decodedFileName = rawFileName;
    }
    const contentType =
      (req.headers['x-file-type'] as string) ||
      (req.headers['content-type'] as string) ||
      'application/octet-stream';
    const ext = path.extname(decodedFileName) || '.bin';
    const cleanExt = ext.startsWith('.') ? ext : `.${ext}`;
    const fileId = `mat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const savedFileName = `${fileId}${cleanExt}`;
    const filePath = path.join(MATERIALS_DIR, savedFileName);

    const writeStream = fs.createWriteStream(filePath);
    req.pipe(writeStream);

    writeStream.on('finish', () => {
      const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : { size: 0 };
      res.json({
        ok: true,
        fileId,
        fileName: decodedFileName,
        url: `/api/materials/file/${savedFileName}`,
        size: stats.size,
        contentType,
      });
    });

    writeStream.on('error', (err) => {
      console.error('Error writing material file:', err);
      res.status(500).json({ ok: false, error: 'Failed to write material file' });
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ ok: false, error: error?.message || 'Upload failed' });
  }
});

// Materials Streaming Download / Serve
app.get('/api/materials/file/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(MATERIALS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Material file not found');
    }

    res.sendFile(filePath);
  } catch (error: any) {
    res.status(500).send('Error reading material file');
  }
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
