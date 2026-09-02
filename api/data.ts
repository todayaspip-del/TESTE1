import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readDatabase } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const db = await readDatabase();
    res.status(200).json({ ok: true, data: db });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error?.message || 'Failed to load database' });
  }
}
