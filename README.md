# Resume IQ Pro

Project Overview

Build a minimalistic, professional web application called "ResumeIQ" (feel free to suggest a better name) that helps job seekers create ATS-optimized resumes and discover matching job openings. The product has three core pillars:

ATS Resume Checker — upload an existing resume and get an ATS compatibility score with actionable feedback.

AI Resume Optimizer — automatically rewrite/reformat the resume into an ATS-friendly version, downloadable as PDF/DOCX.

Job Matcher — based on the parsed resume (skills, title, experience level), surface relevant job vacancies.

Target users: job seekers of all experience levels who want a fast, no-fluff tool — not a bloated resume-template marketplace.

Tech Stack

Frontend: React (with TypeScript), Tailwind CSS

Backend/DB: Supabase (Auth, Postgres, Storage for resume files)

AI layer: Claude API (via Anthropic) for resume parsing, ATS scoring logic, and resume rewriting

Job search: integrate a job search API (e.g., Adzuna, JSearch/RapidAPI, or Remotive) via edge functions — do not scrape job boards directly

File handling: support .pdf and .docx upload/parsing and .pdf/.docx export

Design Guidelines

Minimalistic, professional, "productivity tool" aesthetic — think Linear / Notion, not a flashy template gallery

Neutral color palette: off-white/light gray background, one confident accent color (deep navy, forest green, or charcoal — pick one and use it consistently for CTAs and score indicators)

Generous white space, clear typographic hierarchy, no more than 2 font families

Avoid stock "resume builder" clichés (no cartoon illustrations, no rainbow gradients)

Fully responsive, mobile-first where reasonable, but this is primarily a desktop/laptop workflow tool

Dark mode optional (nice-to-have, not required for v1)

Core Features & Pages

1. Landing Page

Clear value proposition: "Upload your resume. Get an ATS score. Get matched to jobs."

Simple 3-step visual (Upload → Analyze → Match)

Single primary CTA: "Check My Resume"

No pricing complexity for v1 — assume free tier only

2. Auth

Email/password + Google OAuth via Supabase Auth

Users must be logged in to save resumes and view history; allow one free anonymous check before requiring signup (soft paywall)

3. Resume Upload & Parsing

Drag-and-drop upload (.pdf, .docx)

Parse resume text and structure it into sections: Contact Info, Summary, Skills, Experience, Education, Certifications

Show a loading state with clear progress steps ("Reading document…", "Extracting sections…", "Scoring against ATS rules…")

4. ATS Score Report (this is the core screen — invest the most design effort here)

Overall ATS score (0–100) displayed prominently, e.g., a circular score gauge

Breakdown by category, each with its own sub-score and short explanation:

Formatting (tables/columns/graphics that confuse parsers, use of standard section headers, file type)

Keyword match (if a job description is pasted/selected, compare against it; otherwise compare against general role-based keyword benchmarks)

Contact info completeness

Section structure (missing sections, non-standard ordering)

Readability/length (word count, bullet density, passive voice usage)

Quantified impact (percentage of bullet points with measurable results)

Each issue found should list: what's wrong, why it matters for ATS parsing, and a one-line fix suggestion

Optional: paste a target job description to get a tailored keyword-match score against that specific posting

5. AI Resume Rewrite / Optimizer

"Fix My Resume" button that generates an ATS-optimized version using the Claude API

Show a side-by-side or before/after diff view of original vs. optimized content

Let users edit the AI-generated content inline before finalizing (never force a blind auto-replace)

Export as clean, ATS-safe .pdf and .docx (single column, standard fonts, no tables/text boxes/images in the exported file)

Maintain 2–3 professional, ATS-safe formatting templates the user can pick from (not decorative templates — structural ones: chronological, skills-first, hybrid)

6. Job Matcher

Based on parsed skills, job titles, and experience level, query the job search API and display a list of matching openings

Each job card: title, company, location, remote/hybrid/onsite tag, and a "match %" relative to the user's resume

Filters: location, remote-only, experience level, date posted

Clicking a job shows the full description and a "Tailor resume for this job" action that re-runs the ATS keyword match against that specific posting

Link out to the original job posting (do not attempt to host applications)

7. Dashboard / History

List of previously uploaded resumes with their scores and dates

Ability to re-run analysis, download past optimized versions, or delete records

Data & Backend Notes

Store uploaded resumes in Supabase Storage; store parsed structured data + scores in Postgres tables (resumes, ats_scores, job_matches)

All AI calls (parsing, scoring, rewriting) should go through Supabase Edge Functions — never call the Claude API directly from the client, to protect API keys

Rate-limit free-tier usage (e.g., 3 resume checks/month) with a clear upgrade prompt placeholder (no need to build real billing yet — just the UI hook)

Explicit Non-Goals for v1

No resume builder-from-scratch wizard (focus is upload + optimize, not blank-template filling)

No in-app job applications/autofill

No collaborative/team features

No payment processing yet — just UI placeholders for a future paid tier

Deliverable Priorities (build in this order)

Auth + landing page

Resume upload + parsing + ATS score report

AI resume rewrite/export

Job matcher integration

Dashboard/history

Keep the UI clean and functional at every step rather than polishing one screen extensively before others exist.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/90f57deb-08e2-4e91-a1be-1c56a6b7dd00).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
