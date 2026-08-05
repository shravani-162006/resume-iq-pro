import { useRef, useState } from "react";
import { FileText, Loader2, UploadCloud } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { analyzeResume } from "@/lib/resume.functions";
import { extractResumeText } from "@/lib/extract-text";
import type { AnalysisResult } from "@/lib/resume-types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function UploadPanel({
  onComplete,
  disabled,
  disabledReason,
}: {
  onComplete: (result: AnalysisResult, fileName: string, jobDescription: string) => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const analyze = useServerFn(analyzeResume);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const busy = status !== null;

  async function run() {
    if (!file || disabled) return;
    try {
      setStatus("Extracting text…");
      const text = await extractResumeText(file, setStatus);
      if (text.trim().length < 40) {
        throw new Error(
          "We couldn't read enough text from that file. If it's a scanned image, export a text-based PDF.",
        );
      }
      setStatus("Scoring against ATS rules…");
      const result = await analyze({
        data: { resumeText: text.slice(0, 24_000), jobDescription: jobDescription.trim() || undefined },
      });
      onComplete(result, file.name, jobDescription.trim());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setStatus(null);
    }
  }

  return (
    <div className="panel space-y-5 p-6 sm:p-8">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const dropped = event.dataTransfer.files?.[0];
          if (dropped) setFile(dropped);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-12 text-center transition-colors",
          dragging && "border-primary bg-accent",
          busy && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        {file ? (
          <>
            <FileText className="h-7 w-7 text-primary" aria-hidden />
            <p className="mt-3 text-sm font-medium">{file.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(0)} KB · click to choose a different file
            </p>
          </>
        ) : (
          <>
            <UploadCloud className="h-7 w-7 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-sm font-medium">Drop your resume here, or click to browse</p>
            <p className="mt-1 text-xs text-muted-foreground">PDF or DOCX · parsed in your browser</p>
          </>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="jd" className="text-sm font-medium">
          Job description <span className="text-muted-foreground">(optional, sharpens scoring)</span>
        </label>
        <Textarea
          id="jd"
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          placeholder="Paste the job posting you're targeting…"
          rows={5}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={run} disabled={!file || busy || disabled} size="lg">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {busy ? status : "Run ATS check"}
        </Button>
        {disabled && disabledReason ? (
          <p className="text-sm text-muted-foreground">{disabledReason}</p>
        ) : null}
      </div>
    </div>
  );
}
