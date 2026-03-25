import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { askRoshi, generateDiaryOpener, generateInsight } from "./roshi";

function getVisitorId(req: any): string {
  return req.headers["x-visitor-id"] || "local-dev";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ============ Sleep Sessions ============

  app.post("/api/sleep/start", async (req, res) => {
    try {
      const visitorId = getVisitorId(req);
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

  app.get("/api/sleep/sessions", async (req, res) => {
    try {
      const visitorId = getVisitorId(req);
      const sessions = await storage.getSleepSessions(visitorId);
      res.json(sessions);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch sleep sessions" });
    }
  });

  // ============ Timer Sessions ============

  app.post("/api/timer/start", async (req, res) => {
    try {
      const visitorId = getVisitorId(req);
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

  app.post("/api/timer/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

  app.get("/api/timer/sessions", async (req, res) => {
    try {
      const visitorId = getVisitorId(req);
      const sessions = await storage.getTimerSessions(visitorId);
      res.json(sessions);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch timer sessions" });
    }
  });

  // ============ Diary (Roshi Q&A) ============

  app.post("/api/diary/start", async (req, res) => {
    try {
      const visitorId = getVisitorId(req);
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

  app.post("/api/diary/:id/message", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

  app.get("/api/diary/entries", async (req, res) => {
    try {
      const visitorId = getVisitorId(req);
      const entries = await storage.getDiaryEntries(visitorId);
      res.json(entries);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch diary entries" });
    }
  });

  // ============ Insights ============

  app.post("/api/insights/generate", async (req, res) => {
    try {
      const visitorId = getVisitorId(req);

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
