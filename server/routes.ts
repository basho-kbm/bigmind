import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { askRoshi, generateDiaryOpener, generateInsight } from "./roshi";
import { generateAudioLibrary, generateSingleAudio } from "./audio-gen";
import { setupAuth, authRouter } from "./auth";
import { billingRouter, webhookRouter } from "./stripe";
import { requireAuth, requireSubscription } from "./middleware";

function getUserId(req: Request): string {
  if (req.user) {
    return String(req.user.id);
  }
  // Fallback for backwards compatibility
  return req.headers["x-visitor-id"] as string || "local-dev";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Set up auth (session + passport) — MUST be before routes
  setupAuth(app);

  // Register webhook routes (need raw body, registered early)
  app.use(webhookRouter);

  // Register auth routes (no subscription required)
  app.use(authRouter);

  // Register billing routes (require auth but not subscription)
  app.use(billingRouter);

  // ============ Audio Library ============

  // Serve audio files statically
  const audioDir = path.resolve(process.cwd(), "public/audio");
  app.use("/api/audio/files", (req, res, next) => {
    const filePath = path.join(audioDir, req.path);
    if (fs.existsSync(filePath) && filePath.endsWith(".mp3")) {
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Cache-Control", "public, max-age=3600");
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.status(404).json({ error: "Audio not found" });
    }
  });

  // Get audio manifest — lists available pre-generated audio (PUBLIC)
  app.get("/api/audio/manifest", async (_req, res) => {
    try {
      const manifestPath = path.join(audioDir, "manifest.json");
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        res.json(manifest);
      } else {
        res.json({ entries: [], lastGenerated: null });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to load audio manifest" });
    }
  });

  // Get audio for a specific meditation type + duration + voice
  app.get("/api/audio/find", requireAuth, requireSubscription, async (req, res) => {
    try {
      const { type, duration, voice } = req.query;
      const manifestPath = path.join(audioDir, "manifest.json");

      if (!fs.existsSync(manifestPath)) {
        return res.json({ found: false });
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      const entry = manifest.entries.find((e: any) =>
        e.meditationType === type &&
        e.duration === parseInt(duration as string) &&
        e.voiceId === voice
      );

      if (entry) {
        res.json({
          found: true,
          audioUrl: `/api/audio/files/${entry.filename}`,
          script: entry.script,
          generatedAt: entry.generatedAt,
        });
      } else {
        // Try to find any audio for this type/duration (different voice is OK)
        const fallback = manifest.entries.find((e: any) =>
          e.meditationType === type &&
          e.duration === parseInt(duration as string)
        );
        if (fallback) {
          res.json({
            found: true,
            audioUrl: `/api/audio/files/${fallback.filename}`,
            script: fallback.script,
            generatedAt: fallback.generatedAt,
            voiceSubstituted: true,
          });
        } else {
          // Find closest duration
          const sameType = manifest.entries
            .filter((e: any) => e.meditationType === type)
            .sort((a: any, b: any) =>
              Math.abs(a.duration - parseInt(duration as string)) -
              Math.abs(b.duration - parseInt(duration as string))
            );
          if (sameType.length > 0) {
            res.json({
              found: true,
              audioUrl: `/api/audio/files/${sameType[0].filename}`,
              script: sameType[0].script,
              generatedAt: sameType[0].generatedAt,
              durationSubstituted: true,
            });
          } else {
            res.json({ found: false });
          }
        }
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to find audio" });
    }
  });

  // Admin route to trigger audio generation
  app.post("/api/audio/generate", requireAuth, requireSubscription, async (_req, res) => {
    try {
      const logs: string[] = [];
      const log = (msg: string) => {
        logs.push(msg);
        console.log(`[audio-gen] ${msg}`);
      };

      // Run async — respond immediately
      res.json({ status: "started", message: "Audio generation started in background" });

      // Generate in background
      generateAudioLibrary(log).then(result => {
        console.log(`[audio-gen] Complete: ${result.generated} generated, ${result.total} total`);
      }).catch(err => {
        console.error(`[audio-gen] Error:`, err);
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start audio generation" });
    }
  });

  // Generate a single audio file on demand
  app.post("/api/audio/generate-single", requireAuth, requireSubscription, async (req, res) => {
    try {
      const { meditationType, duration, voice } = req.body;
      const log = (msg: string) => console.log(`[audio-gen] ${msg}`);
      const entry = await generateSingleAudio(meditationType, duration, voice, log);
      if (entry) {
        res.json({ success: true, entry });
      } else {
        res.status(500).json({ error: "Failed to generate audio" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ Sleep Sessions ============

  app.post("/api/sleep/start", requireAuth, requireSubscription, async (req, res) => {
    try {
      const visitorId = getUserId(req);
      await storage.getOrCreateVisitor(visitorId);
      const { meditationType, duration, voiceId } = req.body;

      const session = await storage.createSleepSession({
        visitorId,
        meditationType,
        duration,
        voiceId: voiceId || "kore",
        startedAt: new Date().toISOString(),
      });

      res.json(session);
    } catch (error) {
      console.error("Sleep start error:", error);
      res.status(400).json({ error: "Failed to start sleep session" });
    }
  });

  app.get("/api/sleep/sessions", requireAuth, requireSubscription, async (req, res) => {
    try {
      const visitorId = getUserId(req);
      const sessions = await storage.getSleepSessions(visitorId);
      res.json(sessions);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch sleep sessions" });
    }
  });

  // ============ Timer Sessions ============

  app.post("/api/timer/start", requireAuth, requireSubscription, async (req, res) => {
    try {
      const visitorId = getUserId(req);
      await storage.getOrCreateVisitor(visitorId);
      const { targetDuration } = req.body;

      const session = await storage.createTimerSession({
        visitorId,
        duration: 0,
        targetDuration,
        startedAt: new Date().toISOString(),
      });

      res.json(session);
    } catch (error) {
      console.error("Timer start error:", error);
      res.status(400).json({ error: "Failed to start timer session" });
    }
  });

  app.post("/api/timer/:id/complete", requireAuth, requireSubscription, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { duration } = req.body;
      
      // Update the actual duration
      const session = await storage.completeTimerSession(id, new Date().toISOString());
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(400).json({ error: "Failed to complete timer session" });
    }
  });

  app.get("/api/timer/sessions", requireAuth, requireSubscription, async (req, res) => {
    try {
      const visitorId = getUserId(req);
      const sessions = await storage.getTimerSessions(visitorId);
      res.json(sessions);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch timer sessions" });
    }
  });

  // ============ Diary (Roshi Q&A) ============

  app.post("/api/diary/start", requireAuth, requireSubscription, async (req, res) => {
    try {
      const visitorId = getUserId(req);
      await storage.getOrCreateVisitor(visitorId);

      // Generate opening question from Roshi
      const opener = await generateDiaryOpener();
      const messages = JSON.stringify([
        { role: "assistant", content: opener },
      ]);

      const entry = await storage.createDiaryEntry({
        visitorId,
        messages,
        createdAt: new Date().toISOString(),
      });

      res.json(entry);
    } catch (error) {
      console.error("Diary start error:", error);
      res.status(400).json({ error: "Failed to start diary entry" });
    }
  });

  app.post("/api/diary/:id/message", requireAuth, requireSubscription, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { message } = req.body;

      const entry = await storage.getDiaryEntry(id);
      if (!entry) {
        return res.status(404).json({ error: "Diary entry not found" });
      }

      const existingMessages = JSON.parse(entry.messages) as Array<{ role: string; content: string }>;
      existingMessages.push({ role: "user", content: message });

      // Get Roshi's response
      const roshiResponse = await askRoshi(
        existingMessages.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );

      existingMessages.push({ role: "assistant", content: roshiResponse });

      const updated = await storage.updateDiaryMessages(
        id,
        JSON.stringify(existingMessages)
      );

      res.json(updated);
    } catch (error) {
      console.error("Diary message error:", error);
      res.status(400).json({ error: "Failed to send message" });
    }
  });

  app.get("/api/diary/entries", requireAuth, requireSubscription, async (req, res) => {
    try {
      const visitorId = getUserId(req);
      const entries = await storage.getDiaryEntries(visitorId);
      res.json(entries);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch diary entries" });
    }
  });

  // ============ Insights ============

  app.post("/api/insights/generate", requireAuth, requireSubscription, async (req, res) => {
    try {
      const visitorId = getUserId(req);

      const sleepSessions = await storage.getSleepSessions(visitorId, 100);
      const timerSessions = await storage.getTimerSessions(visitorId, 100);
      const diaryEntries = await storage.getDiaryEntries(visitorId, 100);

      const sleepMinutes = sleepSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const timerMinutes = timerSessions.reduce((sum, s) => sum + Math.floor(s.duration / 60), 0);

      // Find most used meditation type
      const typeFreq: Record<string, number> = {};
      sleepSessions.forEach(s => {
        typeFreq[s.meditationType] = (typeFreq[s.meditationType] || 0) + 1;
      });
      const favoriteType = Object.entries(typeFreq)
        .sort((a, b) => b[1] - a[1])[0]?.[0]?.replace(/-/g, " ") || "";

      const insight = await generateInsight(
        { count: sleepSessions.length, totalMinutes: sleepMinutes, favoriteType },
        { count: timerSessions.length, totalMinutes: timerMinutes },
        diaryEntries.length,
      );

      res.json({ insight, generatedAt: new Date().toISOString() });
    } catch (error) {
      console.error("Insight generation error:", error);
      res.status(400).json({ error: "Failed to generate insight" });
    }
  });

  return httpServer;
}
