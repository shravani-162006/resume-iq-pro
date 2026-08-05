import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { UploadPanel } from "@/components/UploadPanel";
import { ScoreReport } from "@/components/ScoreReport";
import { Optimizer } from "@/components/Optimizer";
import { useSession } from "@/hooks/useSession";
import { saveAnalysisToCloud, saveOptimizedResume } from "@/lib/persist";
import {
  ANON_LIMIT,
  anonChecksUsed,
  recordAnonCheck,
  saveAnalysis,
} from "@/lib/analysis-store";
import type { AnalysisResult } from "@/lib/resume-types";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "ATS Resume Check — ResumeIQ" },
      {
        name: "description",
        content:
          "Upload a PDF or DOCX resume and get an instant ATS compatibility score with specific, actionable fixes.",
      },
      { property: "og:title", content: "ATS Resume Check — ResumeIQ" },
      {
        property: "og:description",
        content: "Instant ATS score, category breakdown, and fix-it feedback for your resume.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyzePage,
});

function AnalyzePage() {
  const { user } = useSession();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const anonBlocked = !user && anonChecksUsed() >= ANON_LIMIT && !result;

  async function handleComplete(next: AnalysisResult, fileName: string, jd: string) {
    setResult(next);
    setJobDescription(jd);
    saveAnalysis({ ...next, fileName, jobDescription: jd, savedAt: new Date().toISOString() });
    if (!user) {
      recordAnonCheck();
      return;
    }
    try {
      const id = await saveAnalysisToCloud({
        userId: user.id,
        file: file ?? new File([""], fileName),
        rawText: "",
        result: next,
        jobDescription: jd,
      });
      setResumeId(id);
      saveAnalysis({
        ...next,
        fileName,
        jobDescription: jd,
        resumeId: id,
        savedAt: new Date().toISOString(),
      });
    } catch {
      toast.error("Your report is ready, but we couldn't save it to your history.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <header className="mb-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight">ATS resume check</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          PDF or DOCX. Text extraction happens in your browser; only the text is scored.
        </p>
      </header>

      {result ? null : (
        <FileAwareUpload
          onFile={setFile}
          onComplete={handleComplete}
          disabled={anonBlocked}
          disabledReason={
            anonBlocked ? "You've used your free anonymous check — sign in to continue." : undefined
          }
        />
      )}

      {anonBlocked ? (
        <div className="panel mt-6 flex flex-wrap items-center gap-4 p-6">
          <Lock className="h-4 w-4 text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Free accounts get 3 checks a month plus saved history.
          </p>
          <Button size="sm" asChild className="ml-auto">
            <Link to="/auth">Create free account</Link>
          </Button>
        </div>
      ) : null}

      {result ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Report for {file?.name ?? "your resume"}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/jobs">Find matching jobs</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setResult(null);
                  setResumeId(null);
                }}
              >
                Check another resume
              </Button>
            </div>
          </div>

          <ScoreReport analysis={result.analysis} parsed={result.parsed} />

          {user ? (
            <Optimizer
              parsed={result.parsed}
              jobDescription={jobDescription}
              onOptimized={(optimized, template) => {
                if (!resumeId) return;
                void saveOptimizedResume({
                  userId: user.id,
                  resumeId,
                  template,
                  optimized,
                });
              }}
            />
          ) : (
            <section className="panel flex flex-wrap items-center gap-4 p-8">
              <div>
                <h3 className="font-display text-lg font-semibold tracking-tight">
                  Want the rewrite?
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in to generate an ATS-friendly version and download it as PDF or DOCX.
                </p>
              </div>
              <Button asChild className="ml-auto">
                <Link to="/auth">Sign in to optimize</Link>
              </Button>
            </section>
          )}
        </div>
      ) : null}
    </div>
  );
}

function FileAwareUpload({
  onFile,
  onComplete,
  disabled,
  disabledReason,
}: {
  onFile: (file: File) => void;
  onComplete: (result: AnalysisResult, fileName: string, jobDescription: string) => void;
  disabled: boolean;
  disabledReason?: string | undefined;
}) {
  return (
    <div
      onChangeCapture={(event) => {
        const target = event.target as HTMLInputElement;
        if (target.type === "file" && target.files?.[0]) onFile(target.files[0]);
      }}
      onDropCapture={(event) => {
        const dropped = event.dataTransfer.files?.[0];
        if (dropped) onFile(dropped);
      }}
    >
      <UploadPanel
        onComplete={onComplete}
        disabled={disabled}
        {...(disabledReason ? { disabledReason } : {})}
      />
    </div>
  );
}
