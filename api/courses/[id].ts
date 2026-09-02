import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readDatabase, writeDatabase } from '../../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const courseId = req.query.id as string;
    const db = await readDatabase();
    db.courses = db.courses.filter((c: any) => c.id !== courseId);
    await writeDatabase(db);
    res.status(200).json({ ok: true, remainingCourses: db.courses.length });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error?.message });
  }
}
