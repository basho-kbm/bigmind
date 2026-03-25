import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Moon, Timer, BookHeart, Loader2, RefreshCw, TrendingUp, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import type { SleepSession, TimerSession, DiaryEntry } from "@shared/schema";

interface InsightResponse {
  insight: string;
  generatedAt: string;
}

export default function InsightsPage() {
  const [insight, setInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch all data for stats
  const { data: sleepSessions = [] } = useQuery<SleepSession[]>({
    queryKey: ["/api/sleep/sessions"],
  });

  const { data: timerSessions = [] } = useQuery<TimerSession[]>({
    queryKey: ["/api/timer/sessions"],
  });

  const { data: diaryEntries = [] } = useQuery<DiaryEntry[]>({
    queryKey: ["/api/diary/entries"],
  });

  // Generate insight from Roshi
  const generateInsight = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const res = await apiRequest("POST", "/api/insights/generate", {});
      return res.json() as Promise<InsightResponse>;
    },
    onSuccess: (data) => {
      setInsight(data.insight);
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
    },
  });

  // Stats
  const totalSleepSessions = sleepSessions.length;
  const totalTimerSessions = timerSessions.length;
  const totalDiaryEntries = diaryEntries.length;
  const totalTimerMinutes = timerSessions.reduce((sum, s) => sum + Math.floor(s.duration / 60), 0);
  const totalSleepMinutes = sleepSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

  // Most used meditation type
  const typeFreq = sleepSessions.reduce((acc, s) => {
    acc[s.meditationType] = (acc[s.meditationType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const favoriteType = Object.entries(typeFreq).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace(/-/g, " ") || "None yet";

  const stats = [
    { label: "Sleep Sessions", value: totalSleepSessions, icon: Moon },
    { label: "Timer Sessions", value: totalTimerSessions, icon: Timer },
    { label: "Diary Entries", value: totalDiaryEntries, icon: BookHeart },
    { label: "Minutes Meditating", value: totalTimerMinutes, icon: TrendingUp },
  ];

  const hasData = totalSleepSessions > 0 || totalTimerSessions > 0;

  return (
    <div className="h-full p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold" data-testid="text-insights-title">Insights</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Roshi reflects on your practice
            </p>
          </div>
          {hasData && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => generateInsight.mutate()}
              disabled={isGenerating}
              data-testid="button-generate-insight"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
              )}
              Ask Roshi
            </Button>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4" data-testid={`card-stat-${stat.label.toLowerCase().replace(/ /g, "-")}`}>
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <div className="text-xl font-semibold tabular-nums">{stat.value}</div>
            </Card>
          ))}
        </div>

        {/* Practice details */}
        {hasData && (
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Practice Summary</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total sleep time</span>
                <span className="font-medium">{totalSleepMinutes} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total meditation time</span>
                <span className="font-medium">{totalTimerMinutes} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Favorite style</span>
                <span className="font-medium capitalize">{favoriteType}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Roshi insight */}
        {insight && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-5 border-primary/20" data-testid="card-roshi-insight">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">Roshi's Reflection</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line">{insight}</p>
            </Card>
          </motion.div>
        )}

        {/* Empty state */}
        {!hasData && !insight && (
          <div className="text-center py-12">
            <Brain className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-sm font-medium mb-1">No Practice Data Yet</h3>
            <p className="text-xs text-muted-foreground max-w-[18rem] mx-auto">
              Complete a sleep or meditation session, and Roshi will begin offering 
              insights about your practice patterns and Zen teachings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
