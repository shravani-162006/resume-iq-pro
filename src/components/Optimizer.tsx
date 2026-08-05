import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { optimizeResume } from "@/lib/resume.functions";
import { TEMPLATES, type ParsedResume, type ResumeTemplate } from "@/lib/resume-types";
import { downloadDocx, downloadPdf, toPlainText } from "@/lib/export-resume";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Optimizer({
  parsed,
  jobDescription,
  onOptimized,
}: {
  parsed: ParsedResume;
  jobDescription?: string | undefined;
  onOptimized?: (optimized: ParsedResume, template: ResumeTemplate, changes: string[]) => void;
}) {
  const optimize = useServerFn(optimizeResume);
  const [template, setTemplate] = useState<ResumeTemplate>("chronological");
  const [result, setResult] = useState<{ optimized: ParsedResume; changes: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const output = await optimize({
        data: { parsed, template, jobDescription: jobDescription || undefined },
      });
      setResult(output);
      onOptimized?.(output.optimized, template, output.changes);
      toast.success("Your ATS-friendly rewrite is ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The rewrite failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const finalResume = result?.optimized;
  const baseName = (finalResume?.contact.name || "resume").replace(/\s+/g, "-").toLowerCase();

  return (
    <section className="panel space-y-6 p-8">
      <div>
        <h3 className="font-display text-lg font-semibold tracking-tight">AI resume optimizer</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Rewrites your content into a single-column, keyword-aligned resume that parses cleanly.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {TEMPLATES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTemplate(item.id)}
            className={cn(
              "rounded-lg border border-border p-4 text-left transition-colors hover:border-primary/50",
              template === item.id && "border-primary bg-accent",
            )}
          >
            <span className="text-sm font-medium">{item.label}</span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              {item.description}
            </span>
          </button>
        ))}
      </div>

      <Button onClick={run} disabled={busy} size="lg">
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Wand2 className="h-4 w-4" aria-hidden />
        )}
        {busy ? "Rewriting your resume…" : result ? "Rewrite again" : "Optimize my resume"}
      </Button>

      {result && finalResume ? (
        <div className="space-y-6 border-t border-border pt-6">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              What changed
            </h4>
            <ul className="mt-3 space-y-2">
              {result.changes.map((change, index) => (
                <li key={index} className="text-sm leading-relaxed text-muted-foreground">
                  — {change}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => downloadPdf(finalResume, template, `${baseName}-ats`)}>
              <Download className="h-4 w-4" aria-hidden />
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadDocx(finalResume, template, `${baseName}-ats`)}
            >
              <Download className="h-4 w-4" aria-hidden />
              Download DOCX
            </Button>
          </div>

          <div>
            <h4 className="text-sm font-medium">Preview</h4>
            <pre className="mt-3 max-h-[28rem] overflow-auto rounded-lg bg-muted p-5 font-sans text-[13px] leading-relaxed whitespace-pre-wrap text-foreground">
              {toPlainText(finalResume, template)}
            </pre>
          </div>
        </div>
      ) : null}
    </section>
  );
}
