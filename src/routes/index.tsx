import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResumeIQ — ATS Resume Checker, Optimizer & Job Matcher" },
      {
        name: "description",
        content:
          "Score your resume against applicant tracking systems, get an AI-rewritten ATS-friendly version, and match with live remote jobs.",
      },
      { property: "og:title", content: "ResumeIQ — ATS Resume Checker & Optimizer" },
      {
        property: "og:description",
        content:
          "Upload your resume for an instant ATS score, fix-it feedback, an AI rewrite, and matching job vacancies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    icon: UploadCloud,
    title: "Upload",
    body: "Drop a PDF or DOCX. Text is extracted in your browser — the file never leaves your device unless you save it.",
  },
  {
    icon: BarChart3,
    title: "Score",
    body: "Get a 0–100 ATS score with a breakdown across parsing, keywords, formatting, impact and completeness.",
  },
  {
    icon: Sparkles,
    title: "Optimize",
    body: "One click rewrites your resume into a clean, single-column, keyword-aligned version you can download.",
  },
  {
    icon: Briefcase,
    title: "Match",
    body: "Your parsed skills and title feed a live job search, ranked by how well each posting fits your profile.",
  },
];

const CHECKS = [
  "Parseability of headings, dates and contact details",
  "Keyword coverage against the job description you target",
  "Formatting traps: tables, columns, graphics, headers/footers",
  "Impact: quantified achievements and strong action verbs",
  "Completeness: missing sections an ATS expects to find",
];

function Landing() {
  return (
    <>
      <section className="border-b border-border bg-gradient-to-b from-accent/60 to-background">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
              Free ATS check — no card required
            </span>
            <h1 className="mt-6 font-display text-4xl leading-[1.08] font-semibold tracking-tight text-balance md:text-6xl">
              Know why your resume is being filtered out.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              ResumeIQ scores your resume the way applicant tracking systems read it, tells you
              exactly what to fix, rewrites it for you, and points you at the jobs you actually
              match.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/analyze">
                  Check my resume
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/jobs">Browse matching jobs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Four steps from upload to interview
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div key={step.title} className="panel p-6">
              <step.icon className="h-5 w-5 text-primary" aria-hidden />
              <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Step {index + 1}
              </p>
              <h3 className="mt-1 font-display text-base font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              What we check
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Every report is specific to your document — no generic checklists. You get the
              problem, why an ATS cares, and the exact fix.
            </p>
            <ul className="mt-8 space-y-4">
              {CHECKS.map((check) => (
                <li key={check} className="flex gap-3 text-sm leading-relaxed">
                  <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{check}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel flex flex-col justify-between gap-8 p-8">
            <div>
              <h3 className="font-display text-lg font-semibold tracking-tight">
                Keep a record of every version
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Create a free account to store your resumes, track how your score improves over
                time, and revisit optimized versions whenever you apply somewhere new.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/auth">Create free account</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/analyze">Try it without signing up</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
