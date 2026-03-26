import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiBase } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Sunrise, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DailyMeditationData {
  date: string;
  concept: string;
  conceptLabel: string;
  conceptPaliName: string;
  conceptDescription: string;
  script: string;
  audioUrl: string | null;
  voiceId: string;
  generatedAt: string;
  tomorrow: {
    concept: string;
    label: string;
    paliName: string;
  };
}

const DURATION_OPTIONS = [5, 10, 15, 20] as const;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function DailyPage() {
  const [selectedDuration, setSelectedDuration] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSeconds = selectedDuration * 60;

  const { data, isLoading, error } = useQuery<DailyMeditationData>({
    queryKey: ["/api/daily"],
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  // Create audio element when data arrives
  useEffect(() => {
    if (data?.audioUrl) {
      const audio = new Audio(`${getApiBase()}${data.audioUrl}`);
      audio.preload = "auto";
      audio.addEventListener("canplaythrough", () => setAudioLoaded(true));
      audio.addEventListener("error", () => {
        console.log("Audio failed to load");
        setAudioLoaded(false);
      });
      audioRef.current = audio;
      return () => {
        audio.pause();
        audio.removeEventListener("canplaythrough", () => setAudioLoaded(true));
        audio.removeEventListener("error", () => setAudioLoaded(false));
        audioRef.current = null;
      };
    }
  }, [data?.audioUrl]);

  // Timer effect
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= totalSeconds) {
            setIsPlaying(false);
            return totalSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalSeconds]);

  // Sync audio with play/pause
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Stop when timer ends
  useEffect(() => {
    if (elapsed >= totalSeconds && isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [elapsed, totalSeconds, isPlaying]);

  const handlePlay = useCallback(() => {
    if (!hasStarted) {
      setHasStarted(true);
      setElapsed(0);
    }
    setIsPlaying(true);
  }, [hasStarted]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setElapsed(0);
    setHasStarted(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const progress = totalSeconds > 0 ? (elapsed / totalSeconds) * 100 : 0;
  const isComplete = elapsed >= totalSeconds;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mb-6"
        >
          <Sunrise className="w-16 h-16 text-primary" />
        </motion.div>
        <p className="text-muted-foreground text-sm">
          Preparing today's meditation...
        </p>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Sunrise className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Unable to load today's meditation</h2>
        <p className="text-sm text-muted-foreground">
          Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-lg mx-auto p-6 md:p-8 flex flex-col items-center min-h-full">
        {/* Top spacer */}
        <div className="flex-1 min-h-4 max-h-16" />

        {/* Main content card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6 md:p-8"
        >
          {/* Concept header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-1">
              {data.conceptLabel}
            </h1>
            <p className="text-sm text-muted-foreground/70 italic">
              {data.conceptPaliName}
            </p>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center text-muted-foreground text-sm md:text-base leading-relaxed mb-8"
          >
            {data.conceptDescription}
          </motion.p>

          {/* Duration selector — only show before starting */}
          <AnimatePresence>
            {!hasStarted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block text-center mb-3">
                  Duration
                </label>
                <div className="flex justify-center gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <Button
                      key={d}
                      variant={selectedDuration === d ? "default" : "secondary"}
                      size="sm"
                      className="rounded-full px-4"
                      onClick={() => setSelectedDuration(d)}
                    >
                      {d} min
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Player area */}
          <div className="flex flex-col items-center">
            {/* Breathing circle with progress */}
            <div className="relative mb-6">
              <motion.div
                animate={
                  isPlaying
                    ? {
                        scale: [1, 1.04, 1],
                        opacity: [0.7, 1, 0.7],
                      }
                    : {}
                }
                transition={
                  isPlaying
                    ? {
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                    : {}
                }
                className="w-40 h-40 rounded-full border-2 border-primary/20 flex items-center justify-center"
              >
                <div className="text-center">
                  {hasStarted ? (
                    <>
                      <div className="text-3xl font-light tabular-nums">
                        {formatTime(elapsed)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        of {selectedDuration} min
                      </div>
                    </>
                  ) : (
                    <Sunrise className="w-10 h-10 text-primary/60" />
                  )}
                </div>
              </motion.div>
              {/* Progress ring */}
              {hasStarted && (
                <svg
                  className="absolute inset-0 -rotate-90 w-40 h-40"
                  viewBox="0 0 160 160"
                >
                  <circle
                    cx="80"
                    cy="80"
                    r="76"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 76}`}
                    strokeDashoffset={`${2 * Math.PI * 76 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                    opacity="0.6"
                  />
                </svg>
              )}
            </div>

            {/* Status text */}
            {hasStarted && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground mb-4"
              >
                {isComplete
                  ? "Session complete"
                  : isPlaying
                    ? "Playing..."
                    : "Paused"}
              </motion.p>
            )}

            {/* Controls */}
            <div className="flex items-center gap-4">
              {hasStarted && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full w-10 h-10"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="lg"
                className="w-16 h-16 rounded-full shadow-lg shadow-primary/20"
                onClick={isPlaying ? handlePause : handlePlay}
                disabled={isComplete}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </Button>
              {/* Spacer for visual balance when reset is shown */}
              {hasStarted && <div className="w-10" />}
            </div>
          </div>
        </motion.div>

        {/* Tomorrow teaser */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-muted-foreground/60 flex items-center justify-center gap-1">
            Tomorrow <ChevronRight className="w-3 h-3" />
            <span className="text-muted-foreground/80">
              {data.tomorrow.label}
            </span>
            <span className="italic text-muted-foreground/50">
              ({data.tomorrow.paliName})
            </span>
          </p>
        </motion.div>

        {/* Bottom spacer */}
        <div className="flex-1 min-h-4 max-h-16" />
      </div>
    </div>
  );
}
