import {
  type SleepSession, type InsertSleepSession, sleepSessions,
  type TimerSession, type InsertTimerSession, timerSessions,
  type DiaryEntry, type InsertDiaryEntry, diaryEntries,
  type DailyMeditation, type InsertDailyMeditation, dailyMeditations,
  type AudioLibraryItem, type InsertAudioLibraryItem, audioLibrary,
  type Visitor, visitors,
  type User, type InsertUser, users,
  type Subscription, type InsertSubscription, subscriptions,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, desc, gte, sql } from "drizzle-orm";

import path from "path";
import fs from "fs";

// Use persistent disk mount on Render, local file in dev
const DATA_DIR = fs.existsSync("/app/data") ? "/app/data" : ".";
const DB_PATH = path.join(DATA_DIR, "data.db");
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  // Visitors
  getOrCreateVisitor(visitorId: string): Promise<Visitor>;

  // Users
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  updateUserStripeCustomerId(userId: number, stripeCustomerId: string): Promise<void>;

  // Subscriptions
  createSubscription(sub: InsertSubscription): Promise<Subscription>;
  getSubscriptionByUserId(userId: number): Promise<Subscription | undefined>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>;
  updateSubscription(stripeSubscriptionId: string, data: Partial<Subscription>): Promise<Subscription | undefined>;

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

  // Daily meditations
  getDailyMeditation(date: string): Promise<DailyMeditation | undefined>;
  createDailyMeditation(entry: InsertDailyMeditation): Promise<DailyMeditation>;
  getLatestDailyMeditation(): Promise<DailyMeditation | undefined>;
}

export function runMigrations() {
  db.run(sql`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    stripe_customer_id TEXT,
    trial_ends_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stripe_subscription_id TEXT NOT NULL UNIQUE,
    stripe_price_id TEXT NOT NULL,
    status TEXT NOT NULL,
    current_period_start TEXT,
    current_period_end TEXT,
    cancel_at_period_end INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS daily_meditations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    concept TEXT NOT NULL,
    concept_label TEXT NOT NULL,
    script TEXT NOT NULL,
    voice_id TEXT NOT NULL,
    audio_filename TEXT,
    generated_at TEXT NOT NULL
  )`);
}

export class DatabaseStorage implements IStorage {
  // === Users ===
  async createUser(user: InsertUser): Promise<User> {
    return db.insert(users).values(user).returning().get();
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.email, email)).get();
  }

  async getUserById(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  async updateUserStripeCustomerId(userId: number, stripeCustomerId: string): Promise<void> {
    db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId)).run();
  }

  // === Subscriptions ===
  async createSubscription(sub: InsertSubscription): Promise<Subscription> {
    return db.insert(subscriptions).values(sub).returning().get();
  }

  async getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    return db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.id))
      .get();
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
    return db.select().from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .get();
  }

  async updateSubscription(stripeSubscriptionId: string, data: Partial<Subscription>): Promise<Subscription | undefined> {
    const updateData: any = { ...data, updatedAt: new Date().toISOString() };
    delete updateData.id;
    delete updateData.stripeSubscriptionId;
    db.update(subscriptions).set(updateData)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId)).run();
    return db.select().from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId)).get();
  }

  // === Visitors ===
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

  // === Daily Meditations ===
  async getDailyMeditation(date: string): Promise<DailyMeditation | undefined> {
    return db.select().from(dailyMeditations).where(eq(dailyMeditations.date, date)).get();
  }

  async createDailyMeditation(entry: InsertDailyMeditation): Promise<DailyMeditation> {
    return db.insert(dailyMeditations).values(entry).returning().get();
  }

  async getLatestDailyMeditation(): Promise<DailyMeditation | undefined> {
    return db.select().from(dailyMeditations).orderBy(desc(dailyMeditations.id)).limit(1).get();
  }
}

export const storage = new DatabaseStorage();
