import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Visitors identified by X-Visitor-Id header (no auth in Phase One)
export const visitors = sqliteTable("visitors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  visitorId: text("visitor_id").notNull().unique(),
  displayName: text("display_name"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Sleep sessions — tracks each BigMind Sleep playback
export const sleepSessions = sqliteTable("sleep_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  visitorId: text("visitor_id").notNull(),
  meditationType: text("meditation_type").notNull(), // body-scan, breath-awareness, etc.
  duration: integer("duration").notNull(), // requested duration in minutes
  voiceId: text("voice_id").notNull(),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  audioUrl: text("audio_url"), // URL of the cached audio file played
});

// Meditation timer sessions
export const timerSessions = sqliteTable("timer_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  visitorId: text("visitor_id").notNull(),
  duration: integer("duration").notNull(), // actual duration in seconds
  targetDuration: integer("target_duration").notNull(), // target in seconds
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
});

// Diary entries — post-meditation Q&A with Roshi (timer sessions only)
export const diaryEntries = sqliteTable("diary_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  visitorId: text("visitor_id").notNull(),
  timerSessionId: integer("timer_session_id"),
  messages: text("messages").notNull(), // JSON array of {role, content} messages
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Cached audio library — pre-generated meditations refreshed daily
export const audioLibrary = sqliteTable("audio_library", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  meditationType: text("meditation_type").notNull(),
  duration: integer("duration").notNull(), // in minutes
  voiceId: text("voice_id").notNull(),
  script: text("script").notNull(), // the meditation script text
  audioData: text("audio_data"), // base64 audio or URL
  generatedAt: text("generated_at").notNull(),
  expiresAt: text("expires_at").notNull(),
});

// Insert schemas
export const insertSleepSessionSchema = createInsertSchema(sleepSessions).omit({ id: true });
export const insertTimerSessionSchema = createInsertSchema(timerSessions).omit({ id: true });
export const insertDiaryEntrySchema = createInsertSchema(diaryEntries).omit({ id: true });
export const insertAudioLibrarySchema = createInsertSchema(audioLibrary).omit({ id: true });

// Types
export type SleepSession = typeof sleepSessions.$inferSelect;
export type InsertSleepSession = z.infer<typeof insertSleepSessionSchema>;
export type TimerSession = typeof timerSessions.$inferSelect;
export type InsertTimerSession = z.infer<typeof insertTimerSessionSchema>;
export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type InsertDiaryEntry = z.infer<typeof insertDiaryEntrySchema>;
export type AudioLibraryItem = typeof audioLibrary.$inferSelect;
export type InsertAudioLibraryItem = z.infer<typeof insertAudioLibrarySchema>;
export type Visitor = typeof visitors.$inferSelect;

// Meditation types enum for the UI
export const MEDITATION_TYPES = [
  { id: "ocean-sounds", label: "Ocean Sounds", category: "sounds", icon: "waves" },
  { id: "forest-sounds", label: "Forest Sounds", category: "sounds", icon: "trees" },
  { id: "orchestra-warmup", label: "Orchestra Warm-up", category: "sounds", icon: "music" },
  { id: "jungle-sounds", label: "Jungle Sounds", category: "sounds", icon: "leaf" },
  { id: "body-scan", label: "Body Scan Meditation", category: "meditation", icon: "scan" },
  { id: "open-awareness", label: "Open Awareness", category: "meditation", icon: "eye" },
  { id: "breath-awareness", label: "Breath Awareness", category: "meditation", icon: "wind" },
  { id: "exploring-self", label: "Exploring the Self", category: "zen", icon: "user" },
  { id: "impermanence", label: "Exploring Impermanence", category: "zen", icon: "hourglass" },
  { id: "emptiness", label: "Exploring Emptiness", category: "zen", icon: "circle" },
  { id: "beginners-mind", label: "Beginner's Mind", category: "zen", icon: "sparkles" },
  { id: "zen-stories", label: "Zen Buddhist Stories", category: "zen", icon: "book-open" },
] as const;

export const VOICE_OPTIONS = [
  { id: "kore", label: "Serene", gender: "female", quality: "calm" },
  { id: "charon", label: "Deep", gender: "male", quality: "deep" },
  { id: "aoede", label: "Warm", gender: "female", quality: "warm" },
  { id: "fenrir", label: "Grounded", gender: "male", quality: "grounded" },
  { id: "puck", label: "Gentle", gender: "neutral", quality: "gentle" },
  { id: "zephyr", label: "Soft", gender: "neutral", quality: "soft" },
] as const;

export const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60] as const;
