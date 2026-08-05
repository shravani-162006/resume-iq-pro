import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { JobBoard } from "@/components/JobBoard";
import { loadAnalysis, type StoredAnalysis } from "@/lib/analysis-store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Job Matcher — ResumeIQ" },
      {
        name: "description",
        content:
          "Find live remote job vacancies ranked against the skills, title and seniority parsed from your resume.",
      },
      { property: "og:title", content: "Job Matcher — ResumeIQ" },
      {
        property: "og:description",
        content: "Live job vacancies ranked by how well they match your resume profile.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JobsPage,
});

function JobsPage() {
  const [stored, setStored] = useState<StoredAnalysis | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStored(loadAnalysis());
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Job matcher</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {stored
            ? `Matching against your resume: ${stored.parsed.target_title || "your profile"} · ${stored.parsed.skills.length} skills.`
            : "Search live remote roles. Run an ATS check first to rank results against your resume."}
        </p>
      </header>

      {!stored ? (
        <div className="panel mb-6 flex flex-wrap items-center gap-4 p-6">
          <p className="text-sm text-muted-foreground">
            No resume analysed in this session yet.
          </p>
          <Button size="sm" asChild className="ml-auto">
            <Link to="/analyze">Run an ATS check</Link>
          </Button>
        </div>
      ) : null}

      <JobBoard
        defaultQuery={stored?.parsed.target_title ?? ""}
        {...(stored?.parsed.experience_level
          ? { defaultLevel: stored.parsed.experience_level.toLowerCase() }
          : {})}
        skills={stored?.parsed.skills ?? []}
      />
    </div>
  );
}
