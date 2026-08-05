import { scoreTone } from "@/lib/resume-types";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<string, string> = {
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export function ScoreGauge({
  score,
  size = 176,
  label = "ATS score",
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const stroke = size < 120 ? 8 : 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);
  const tone = TONE_CLASS[scoreTone(score)] ?? "text-primary";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${label}: ${score} out of 100`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-[stroke-dashoffset] duration-700 ease-out", tone)}
          stroke="currentColor"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("font-display font-semibold tabular-nums", tone)} style={{ fontSize: size / 3.4 }}>
          {score}
        </span>
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

export function ScoreBar({ score }: { score: number }) {
  const tone = TONE_CLASS[scoreTone(score)] ?? "text-primary";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
      <div
        className={cn("h-full rounded-full bg-current transition-all duration-700", tone)}
        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
      />
    </div>
  );
}
