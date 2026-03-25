import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, Square, RotateCcw, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import type { TimerSession } from "@shared/schema";

const TIMER_PRESETS = [5, 10, 15, 20, 30, 45, 60];

export default function TimerPage() {
  const [targetMinutes, setTargetMinutes] = useState(15);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qc = useQueryClient();

  const targetSeconds = targetMinutes * 60;

  // Fetch history
  const { data: sessions = [] } = useQuery<TimerSession[]>({
    queryKey: ["/api/timer/sessions"],
  });

  // Start session
  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/timer/start", {
        targetDuration: targetSeconds,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setSessionId(data.id);
    },
  });

  // Complete session
  const completeMutation = useMutation({
    mutationFn: async (data: { id: number; duration: number }) => {
      const res = await apiRequest("POST", `/api/timer/${data.id}/complete`, {
        duration: data.duration,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/timer/sessions"] });
    },
  });

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1;
          if (next >= targetSeconds) {
            setIsRunning(false);
            setShowComplete(true);
            if (sessionId) {
              completeMutation.mutate({ id: sessionId, duration: next });
            }
            return next;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, targetSeconds, sessionId]);

  const handleStart = () => {
    if (!isRunning && elapsed === 0) {
      startMutation.mutate();
    }
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    if (sessionId && elapsed > 0) {
      completeMutation.mutate({ id: sessionId, duration: elapsed });
    }
    setShowComplete(true);
  }, [sessionId, elapsed]);

  const handleReset = () => {
    setIsRunning(false);
    setElapsed(0);
    setSessionId(null);
    setShowComplete(false);
  };

  const remaining = Math.max(0, targetSeconds - elapsed);
  const progress = targetSeconds > 0 ? (elapsed / targetSeconds) * 100 : 0;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="h-full p-4 md:p-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold" data-testid="text-timer-title">Meditation Timer</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Set your intention and sit
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!showComplete ? (
            <motion.div
              key="timer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Duration presets — only when not running */}
              {elapsed === 0 && !isRunning && (
                <div className="mb-8">
                  <label className="text-sm font-medium mb-3 block">Duration</label>
                  <div className="flex flex-wrap gap-2">
                    {TIMER_PRESETS.map((d) => (
                      <Button
                        key={d}
                        variant={targetMinutes === d ? "default" : "secondary"}
                        size="sm"
                        onClick={() => setTargetMinutes(d)}
                        data-testid={`button-preset-${d}`}
                      >
                        {d} min
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Timer display */}
              <div className="flex flex-col items-center py-8">
                <div className="relative mb-8">
                  <div className={`w-52 h-52 rounded-full border-2 border-primary/20 flex items-center justify-center ${isRunning ? "animate-breathe glow-primary" : ""}`}>
                    <div className="text-center">
                      <div className="text-4xl font-light tabular-nums" data-testid="text-timer-display">
                        {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {isRunning ? "remaining" : elapsed > 0 ? "paused" : "ready"}
                      </div>
                    </div>
                  </div>
                  <svg className="absolute inset-0 -rotate-90 w-52 h-52" viewBox="0 0 208 208">
                    <circle
                      cx="104" cy="104" r="100"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      strokeDasharray={`${2 * Math.PI * 100}`}
                      strokeDashoffset={`${2 * Math.PI * 100 * (1 - progress / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                      opacity="0.5"
                    />
                  </svg>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                  {elapsed > 0 && (
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={handleReset}
                      data-testid="button-reset"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}

                  <Button
                    size="lg"
                    className="w-14 h-14 rounded-full"
                    onClick={isRunning ? handlePause : handleStart}
                    data-testid="button-timer-toggle"
                  >
                    {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </Button>

                  {(isRunning || elapsed > 0) && (
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={handleStop}
                      data-testid="button-timer-stop"
                    >
                      <Square className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-1" data-testid="text-session-complete">Session Complete</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {Math.floor(elapsed / 60)} minutes of meditation
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={handleReset} data-testid="button-new-session">
                  New Session
                </Button>
                {sessionId && (
                  <Button
                    onClick={() => {
                      // Navigate to diary with this session
                      window.location.hash = `/diary?session=${sessionId}`;
                    }}
                    data-testid="button-open-diary"
                  >
                    Open Diary
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Session history */}
        {sessions.length > 0 && (
          <div className="mt-8 border-t border-border/50 pt-6">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">Recent Sessions</h3>
            <div className="space-y-2">
              {sessions.slice(0, 10).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2 text-sm"
                  data-testid={`row-session-${s.id}`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{Math.floor(s.duration / 60)} min</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {s.startedAt ? format(new Date(s.startedAt), "MMM d, h:mm a") : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
