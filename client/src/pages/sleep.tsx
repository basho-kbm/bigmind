import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, getApiBase } from "@/lib/queryClient";
import { MEDITATION_TYPES, VOICE_OPTIONS, DURATION_OPTIONS } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Waves, Trees, Music, Leaf, Scan, Eye, Wind, User,
  Hourglass, Circle, Sparkles, BookOpen, Play, Pause,
  Square, Volume2, VolumeX, ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const iconMap: Record<string, any> = {
  waves: Waves, trees: Trees, music: Music, leaf: Leaf,
  scan: Scan, eye: Eye, wind: Wind, user: User,
  hourglass: Hourglass, circle: Circle, sparkles: Sparkles,
  "book-open": BookOpen,
};

const categoryLabels: Record<string, string> = {
  sounds: "Ambient Sounds",
  meditation: "Guided Meditations",
  zen: "Zen Concepts",
};

type ViewState = "select" | "configure" | "playing";

export default function SleepPage() {
  const [view, setView] = useState<ViewState>("select");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].id);
  const [selectedDuration, setSelectedDuration] = useState(20);
  const [volume, setVolume] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedTypeInfo = MEDITATION_TYPES.find(t => t.id === selectedType);
  const isSoundType = selectedTypeInfo?.category === "sounds";

  // Group meditation types by category
  const grouped = MEDITATION_TYPES.reduce((acc, type) => {
    if (!acc[type.category]) acc[type.category] = [];
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, typeof MEDITATION_TYPES[number][]>);

  // Start session mutation
  const startSession = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sleep/start", {
        meditationType: selectedType,
        duration: selectedDuration,
        voiceId: selectedVoice,
      });
      return res.json();
    },
  });

  // Timer effect
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          if (prev >= selectedDuration * 60) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, selectedDuration]);

  const handleSelectType = (typeId: string) => {
    setSelectedType(typeId);
    setView("configure");
  };

  const handleStartSession = async () => {
    setView("playing");
    setElapsed(0);
    setIsPlaying(true);
    startSession.mutate();

    // Try to load pre-generated audio
    setAudioLoading(true);
    try {
      const res = await apiRequest(
        "GET",
        `/api/audio/find?type=${selectedType}&duration=${selectedDuration}&voice=${selectedVoice}`
      );
      const data = await res.json();
      if (data.found && data.audioUrl) {
        const audioUrl = `${getApiBase()}${data.audioUrl}`;
        const audio = new Audio(audioUrl);
        audio.volume = volume / 100;
        audio.loop = true; // Loop for ambient sounds
        audioRef.current = audio;
        await audio.play();
        setAudioAvailable(true);
      }
    } catch (err) {
      console.log("No pre-generated audio available");
    }
    setAudioLoading(false);
  };

  const handleStop = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setAudioAvailable(false);
    setView("select");
    setElapsed(0);
    setSelectedType(null);
  };

  // Sync audio play/pause with player state
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Sync volume/mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progress = selectedDuration > 0 ? (elapsed / (selectedDuration * 60)) * 100 : 0;

  return (
    <div className="h-full p-4 md:p-6">
      <AnimatePresence mode="wait">
        {view === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-semibold" data-testid="text-sleep-title">BigMind Sleep</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a meditation to drift into restful sleep
                </p>
              </div>

              {Object.entries(grouped).map(([category, types]) => (
                <div key={category} className="mb-6">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                    {categoryLabels[category]}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {types.map((type) => {
                      const Icon = iconMap[type.icon] || Circle;
                      return (
                        <Card
                          key={type.id}
                          className="p-4 cursor-pointer hover-elevate active-elevate-2 transition-colors"
                          onClick={() => handleSelectType(type.id)}
                          data-testid={`card-meditation-${type.id}`}
                        >
                          <div className="flex flex-col gap-2">
                            <Icon className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium leading-tight">{type.label}</span>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {view === "configure" && selectedTypeInfo && (
          <motion.div
            key="configure"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="max-w-md mx-auto">
              <button
                onClick={() => { setView("select"); setSelectedType(null); }}
                className="flex items-center gap-1 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors"
                data-testid="button-back"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                  {(() => {
                    const Icon = iconMap[selectedTypeInfo.icon] || Circle;
                    return <Icon className="w-5 h-5 text-primary" />;
                  })()}
                  <h2 className="text-xl font-semibold" data-testid="text-config-title">
                    {selectedTypeInfo.label}
                  </h2>
                </div>
              </div>

              {/* Duration */}
              <div className="mb-8">
                <label className="text-sm font-medium mb-3 block">Duration</label>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <Button
                      key={d}
                      variant={selectedDuration === d ? "default" : "secondary"}
                      size="sm"
                      onClick={() => setSelectedDuration(d)}
                      data-testid={`button-duration-${d}`}
                    >
                      {d} min
                    </Button>
                  ))}
                </div>
              </div>

              {/* Voice — only for guided meditations and zen concepts */}
              {!isSoundType && (
                <div className="mb-8">
                  <label className="text-sm font-medium mb-3 block">Voice</label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger data-testid="select-voice">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICE_OPTIONS.map((v) => (
                        <SelectItem key={v.id} value={v.id} data-testid={`option-voice-${v.id}`}>
                          {v.label} — {v.gender}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Volume */}
              <div className="mb-10">
                <label className="text-sm font-medium mb-3 block">Volume</label>
                <div className="flex items-center gap-3">
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                  <Slider
                    value={[volume]}
                    onValueChange={([v]) => setVolume(v)}
                    max={100}
                    step={1}
                    className="flex-1"
                    data-testid="slider-volume"
                  />
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleStartSession}
                data-testid="button-start-session"
              >
                <Play className="w-4 h-4 mr-2" />
                Begin Session
              </Button>
            </div>
          </motion.div>
        )}

        {view === "playing" && selectedTypeInfo && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-md mx-auto text-center">
              {/* Breathing circle */}
              <div className="relative mb-10">
                <div className="w-48 h-48 rounded-full border-2 border-primary/20 flex items-center justify-center animate-breathe glow-primary">
                  <div className="text-center">
                    <div className="text-3xl font-light tabular-nums" data-testid="text-elapsed-time">
                      {formatTime(elapsed)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      of {selectedDuration} min
                    </div>
                  </div>
                </div>
                {/* Progress ring */}
                <svg className="absolute inset-0 -rotate-90 w-48 h-48" viewBox="0 0 192 192">
                  <circle
                    cx="96" cy="96" r="92"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 92}`}
                    strokeDashoffset={`${2 * Math.PI * 92 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                    opacity="0.6"
                  />
                </svg>
              </div>

              <h3 className="text-lg font-medium mb-1" data-testid="text-playing-title">
                {selectedTypeInfo.label}
              </h3>
              <p className="text-sm text-muted-foreground mb-8">
                {isPlaying ? "Playing..." : "Paused"}
              </p>

              {/* Playback controls */}
              <div className="flex items-center gap-4">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  data-testid="button-mute"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>

                <Button
                  size="lg"
                  className="w-14 h-14 rounded-full"
                  onClick={() => setIsPlaying(!isPlaying)}
                  data-testid="button-play-pause"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </Button>

                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleStop}
                  data-testid="button-stop"
                >
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
