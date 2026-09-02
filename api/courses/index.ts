import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readDatabase, writeDatabase } from '../../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const course = req.body;
    if (!course || !course.id) {
      return res.status(400).json({ ok: false, error: 'Course with id is required' });
    }
    const db = await readDatabase();
    const idx = db.courses.findIndex((c: any) => c.id === course.id);
    if (idx >= 0) {
      db.courses[idx] = course;
    } else {
      db.courses.push(course);
    }
    await writeDatabase(db);
    res.status(200).json({ ok: true, course, totalCourses: db.courses.length });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error?.message });
  }
}
