import {
  type SleepSession, type InsertSleepSession, sleepSessions,
  type TimerSession, type InsertTimerSession, timerSessions,
  type DiaryEntry, type InsertDiaryEntry, diaryEntries,
  type AudioLibraryItem, type InsertAudioLibraryItem, audioLibrary,
  type Visitor, visitors,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, desc, gte } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  // Visitors
  getOrCreateVisitor(visitorId: string): Promise<Visitor>;

  // Sleep sessions
  createSleepSession(session: InsertSleepSession): Promise<SleepSession>;
  getSleepSessions(visitorId: string, limit?: number): Promise<SleepSession[]>;

  // Timer sessions
  createTimerSession(session: InsertTimerSession): Promise<TimerSession>;
  completeTimerSession(id: number, completedAt: string): Promise<TimerSession | undefined>;
  getTimerSessions(visitorId: string, limit?: number): Promise<TimerSession[]>;

  // Diary entries
  createDiaryEntry(entry: InsertDiaryEntry): Promise<DiaryEntry>;
  updateDiaryMessages(id: number, messages: string): Promise<DiaryEntry | undefined>;
  getDiaryEntries(visitorId: string, limit?: number): Promise<DiaryEntry[]>;
  getDiaryEntry(id: number): Promise<DiaryEntry | undefined>;

  // Audio library
  getAudioForSession(meditationType: string, duration: number, voiceId: string): Promise<AudioLibraryItem | undefined>;
  upsertAudioLibraryItem(item: InsertAudioLibraryItem): Promise<AudioLibraryItem>;
  getExpiredAudio(): Promise<AudioLibraryItem[]>;
  getAllAudioItems(): Promise<AudioLibraryItem[]>;
}

export class DatabaseStorage implements IStorage {
  async getOrCreateVisitor(visitorId: string): Promise<Visitor> {
    const existing = db.select().from(visitors).where(eq(visitors.visitorId, visitorId)).get();
    if (existing) return existing;
    return db.insert(visitors).values({ visitorId }).returning().get();
  }

  async createSleepSession(session: InsertSleepSession): Promise<SleepSession> {
    return db.insert(sleepSessions).values(session).returning().get();
  }

  async getSleepSessions(visitorId: string, limit = 50): Promise<SleepSession[]> {
    return db.select().from(sleepSessions)
      .where(eq(sleepSessions.visitorId, visitorId))
      .orderBy(desc(sleepSessions.id))
      .limit(limit)
      .all();
  }

  async createTimerSession(session: InsertTimerSession): Promise<TimerSession> {
    return db.insert(timerSessions).values(session).returning().get();
  }

  async completeTimerSession(id: number, completedAt: string): Promise<TimerSession | undefined> {
    db.update(timerSessions).set({ completedAt }).where(eq(timerSessions.id, id)).run();
    return db.select().from(timerSessions).where(eq(timerSessions.id, id)).get();
  }

  async getTimerSessions(visitorId: string, limit = 50): Promise<TimerSession[]> {
    return db.select().from(timerSessions)
      .where(eq(timerSessions.visitorId, visitorId))
      .orderBy(desc(timerSessions.id))
      .limit(limit)
      .all();
  }

  async createDiaryEntry(entry: InsertDiaryEntry): Promise<DiaryEntry> {
    return db.insert(diaryEntries).values(entry).returning().get();
  }

  async updateDiaryMessages(id: number, messages: string): Promise<DiaryEntry | undefined> {
    db.update(diaryEntries).set({ messages }).where(eq(diaryEntries.id, id)).run();
    return db.select().from(diaryEntries).where(eq(diaryEntries.id, id)).get();
  }

  async getDiaryEntries(visitorId: string, limit = 50): Promise<DiaryEntry[]> {
    return db.select().from(diaryEntries)
      .where(eq(diaryEntries.visitorId, visitorId))
      .orderBy(desc(diaryEntries.id))
      .limit(limit)
      .all();
  }

  async getDiaryEntry(id: number): Promise<DiaryEntry | undefined> {
    return db.select().from(diaryEntries).where(eq(diaryEntries.id, id)).get();
  }

  async getAudioForSession(meditationType: string, duration: number, voiceId: string): Promise<AudioLibraryItem | undefined> {
    const now = new Date().toISOString();
    return db.select().from(audioLibrary)
      .where(
        and(
          eq(audioLibrary.meditationType, meditationType),
          eq(audioLibrary.duration, duration),
          eq(audioLibrary.voiceId, voiceId),
          gte(audioLibrary.expiresAt, now)
        )
      )
      .get();
  }

  async upsertAudioLibraryItem(item: InsertAudioLibraryItem): Promise<AudioLibraryItem> {
    return db.insert(audioLibrary).values(item).returning().get();
  }

  async getExpiredAudio(): Promise<AudioLibraryItem[]> {
    const now = new Date().toISOString();
    return db.select().from(audioLibrary)
      .where(gte(now, audioLibrary.expiresAt))
      .all();
  }

  async getAllAudioItems(): Promise<AudioLibraryItem[]> {
    return db.select().from(audioLibrary).all();
  }
}

export const storage = new DatabaseStorage();
