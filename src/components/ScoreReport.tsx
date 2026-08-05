import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { AtsAnalysis, ParsedResume } from "@/lib/resume-types";
import { scoreTone } from "@/lib/resume-types";
import { ScoreBar, ScoreGauge } from "@/components/ScoreGauge";
import { Badge } from "@/components/ui/badge";

const SEVERITY = {
  high: { icon: XCircle, className: "text-destructive", label: "Critical" },
  medium: { icon: AlertTriangle, className: "text-warning", label: "Important" },
  low: { icon: Info, className: "text-muted-foreground", label: "Minor" },
} as const;

function severityMeta(severity: string) {
  const key = severity.toLowerCase() as keyof typeof SEVERITY;
  return SEVERITY[key] ?? SEVERITY.low;
}

export function ScoreReport({
  analysis,
  parsed,
}: {
  analysis: AtsAnalysis;
  parsed: ParsedResume;
}) {
  const tone = scoreTone(analysis.overall);
  const verdictLabel =
    tone === "success" ? "ATS ready" : tone === "warning" ? "Needs work" : "High risk";

  return (
    <div className="space-y-6">
      <section className="panel p-8">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-center">
          <ScoreGauge score={analysis.overall} />
          <div className="flex-1 space-y-3 text-center md:text-left">
            <Badge variant={tone === "success" ? "default" : "secondary"}>{verdictLabel}</Badge>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {parsed.target_title || "Your resume"}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{analysis.verdict}</p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 pt-2 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-muted-foreground">Level</dt>
                <dd className="font-medium capitalize">{parsed.experience_level || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Skills found</dt>
                <dd className="font-medium tabular-nums">{parsed.skills.length}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Roles</dt>
                <dd className="font-medium tabular-nums">{parsed.experience.length}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Issues</dt>
                <dd className="font-medium tabular-nums">{analysis.issues.length}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="panel p-8">
        <h3 className="font-display text-lg font-semibold tracking-tight">Category breakdown</h3>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {analysis.categories.map((category) => (
            <div key={category.key} className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">{category.label}</span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {category.score}/100
                </span>
              </div>
              <ScoreBar score={category.score} />
              <p className="text-xs leading-relaxed text-muted-foreground">{category.summary}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-8">
        <h3 className="font-display text-lg font-semibold tracking-tight">What to fix</h3>
        <ul className="mt-5 divide-y divide-border">
          {analysis.issues.map((issue, index) => {
            const meta = severityMeta(issue.severity);
            const Icon = meta.icon;
            return (
              <li key={`${issue.category}-${index}`} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                <Icon className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${meta.className}`} aria-hidden />
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">{issue.problem}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{issue.why}</p>
                  <p className="text-sm leading-relaxed">
                    <span className="font-medium text-foreground">Fix: </span>
                    <span className="text-muted-foreground">{issue.fix}</span>
                  </p>
                </div>
              </li>
            );
          })}
          {analysis.issues.length === 0 ? (
            <li className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
              No blocking issues found.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="panel grid gap-8 p-8 sm:grid-cols-2">
        <div>
          <h3 className="font-display text-lg font-semibold tracking-tight">Keywords matched</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {analysis.matched_keywords.length ? (
              analysis.matched_keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary">
                  {keyword}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">None detected.</p>
            )}
          </div>
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold tracking-tight">Missing keywords</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {analysis.missing_keywords.length ? (
              analysis.missing_keywords.map((keyword) => (
                <Badge key={keyword} variant="outline">
                  {keyword}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nothing critical missing.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
