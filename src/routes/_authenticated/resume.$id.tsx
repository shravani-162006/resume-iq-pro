import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { ScoreReport } from "@/components/ScoreReport";
import { Optimizer } from "@/components/Optimizer";
import { saveOptimizedResume } from "@/lib/persist";
import type { AtsAnalysis, ParsedResume } from "@/lib/resume-types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/resume/$id")({
  head: () => ({
    meta: [
      { title: "Resume report — ResumeIQ" },
      { name: "description", content: "A saved ATS report with category scores, fixes and rewrite tools." },
      { property: "og:title", content: "Resume report — ResumeIQ" },
      { property: "og:description", content: "Saved ATS report with category scores and fixes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResumeDetail,
});

function ResumeDetail() {
  const { id } = Route.useParams();
  const { user } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["resume", id],
    queryFn: async () => {
      const { data: resume, error } = await supabase
        .from("resumes")
        .select("id, file_name, parsed, ats_scores(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return resume;
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-6 py-14">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-sm text-muted-foreground">That report could not be found.</p>
        <Button className="mt-6" asChild>
          <Link to="/dashboard">Back to history</Link>
        </Button>
      </div>
    );
  }

  const parsed = data.parsed as unknown as ParsedResume;
  const scores = (data.ats_scores ?? []) as unknown as {
    overall: number;
    categories: unknown;
    issues: unknown;
    matched_keywords: unknown;
    missing_keywords: unknown;
    verdict: string;
    job_description: string | null;
    created_at: string;
  }[];
  const latest = [...scores].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];

  const analysis: AtsAnalysis = {
    overall: latest?.overall ?? 0,
    categories: (latest?.categories ?? []) as AtsAnalysis["categories"],
    issues: (latest?.issues ?? []) as AtsAnalysis["issues"],
    matched_keywords: (latest?.matched_keywords ?? []) as string[],
    missing_keywords: (latest?.missing_keywords ?? []) as string[],
    verdict: latest?.verdict ?? "",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-14">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{data.file_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Saved ATS report</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/jobs">Find jobs</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">Back to history</Link>
          </Button>
        </div>
      </header>

      <ScoreReport analysis={analysis} parsed={parsed} />

      <Optimizer
        parsed={parsed}
        jobDescription={latest?.job_description ?? undefined}
        onOptimized={(optimized, template) => {
          if (!user) return;
          void saveOptimizedResume({ userId: user.id, resumeId: id, template, optimized });
        }}
      />
    </div>
  );
}
