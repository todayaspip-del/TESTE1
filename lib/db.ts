import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
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
  SEED_USERS,
} from '../src/data/seedData';

// ---------------------------------------------------------------------------
// Database configuration with dual storage:
// 1. Supabase (when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set)
// 2. Local JSON disk storage (as automatic fallback / container persistent data)
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && SUPABASE_URL.startsWith('http')) {
    try {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client, falling back to local storage:', err);
      supabaseClient = null;
    }
  }
  return supabaseClient;
}

// Single-row table: id is always 1, `data` holds the entire LMS database as JSONB.
const TABLE = 'lms_database';
const ROW_ID = 1;

// Disk persistence fallback file location
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'lms-database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

export interface LmsDatabase {
  courses: any[];
  classrooms: any[];
  enrollments: any[];
  lessonProgress: Record<string, any>;
  comments: any[];
  announcements: any[];
  calendarEvents: any[];
  certificates: any[];
  privateNotes: any[];
  auditLogs: any[];
  quizAttempts: any[];
  submissions: any[];
  users: any[];
  updatedAt: string;
}

export const DEFAULT_DB: LmsDatabase = {
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
  users: SEED_USERS,
  updatedAt: new Date().toISOString(),
};

function sanitize(parsed: any): LmsDatabase {
  const courses = Array.isArray(parsed?.courses) && parsed.courses.length > 0 ? parsed.courses : SEED_COURSES;
  const classrooms = Array.isArray(parsed?.classrooms) && parsed.classrooms.length > 0 ? parsed.classrooms : SEED_CLASSROOMS;
  const users = Array.isArray(parsed?.users) && parsed.users.length > 0 ? parsed.users : SEED_USERS;

  return {
    courses: courses.map((c: any) => ({
      ...c,
      bannerUrl:
        !c.bannerUrl || c.bannerUrl.includes('unsplash.com')
          ? 'https://i.ibb.co/JWKjqdVS/BANNER45.png'
          : c.bannerUrl,
    })),
    classrooms,
    enrollments: Array.isArray(parsed?.enrollments) ? parsed.enrollments : SEED_ENROLLMENTS,
    lessonProgress: parsed?.lessonProgress && typeof parsed.lessonProgress === 'object' ? parsed.lessonProgress : SEED_LESSON_PROGRESS,
    comments: Array.isArray(parsed?.comments) ? parsed.comments : SEED_COMMENTS,
    announcements: Array.isArray(parsed?.announcements) ? parsed.announcements : SEED_ANNOUNCEMENTS,
    calendarEvents: Array.isArray(parsed?.calendarEvents) ? parsed.calendarEvents : SEED_CALENDAR_EVENTS,
    certificates: Array.isArray(parsed?.certificates) ? parsed.certificates : SEED_CERTIFICATES,
    privateNotes: Array.isArray(parsed?.privateNotes) ? parsed.privateNotes : SEED_PRIVATE_NOTES,
    auditLogs: Array.isArray(parsed?.auditLogs) ? parsed.auditLogs : SEED_AUDIT_LOGS,
    quizAttempts: Array.isArray(parsed?.quizAttempts) ? parsed.quizAttempts : [],
    submissions: Array.isArray(parsed?.submissions) ? parsed.submissions : [],
    users,
    updatedAt: parsed?.updatedAt || new Date().toISOString(),
  };
}

// Local disk reader
function readLocalDatabase(): LmsDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return sanitize(parsed);
    }
  } catch (err) {
    console.error('Error reading local database file, creating fresh default:', err);
  }
  // Initialize with DEFAULT_DB
  writeLocalDatabase(DEFAULT_DB);
  return { ...DEFAULT_DB };
}

// Local disk atomic writer
function writeLocalDatabase(db: LmsDatabase): boolean {
  try {
    db.updatedAt = new Date().toISOString();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Error writing local database file:', err);
    return false;
  }
}

// Reads the DB blob: tries Supabase first if configured, else reads local disk.
export async function readDatabase(): Promise<LmsDatabase> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from(TABLE).select('data').eq('id', ROW_ID).maybeSingle();
      if (!error && data?.data) {
        return sanitize(data.data);
      }
      if (!error && !data) {
        // First run in Supabase: seed row with local disk or default data
        const initialData = readLocalDatabase();
        await writeDatabase(initialData);
        return initialData;
      }
      console.warn('Supabase read warning (falling back to disk):', error?.message);
    } catch (err) {
      console.warn('Supabase read exception (falling back to disk):', err);
    }
  }

  return readLocalDatabase();
}

// Upserts the DB blob: writes to Supabase if configured, and always saves local disk copy.
export async function writeDatabase(db: LmsDatabase): Promise<boolean> {
  const sanitized = sanitize(db);
  const payload = { ...sanitized, updatedAt: new Date().toISOString() };
  let supabaseSuccess = false;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from(TABLE).upsert({ id: ROW_ID, data: payload });
      if (!error) {
        supabaseSuccess = true;
      } else {
        console.warn('Supabase upsert warning:', error.message);
      }
    } catch (err) {
      console.warn('Supabase upsert exception:', err);
    }
  }

  // Always write to local disk as backup/cache
  const diskSuccess = writeLocalDatabase(payload);
  return supabase ? (supabaseSuccess || diskSuccess) : diskSuccess;
}
