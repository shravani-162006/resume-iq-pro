import type { JobPosting } from "./resume-types";

type RemotiveJob = {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  job_type: string;
  candidate_required_location: string;
  publication_date: string;
  description: string;
};

const LEVEL_HINTS: Record<string, string[]> = {
  entry: ["junior", "entry", "graduate", "intern", "associate"],
  mid: ["mid", "intermediate", "engineer ii", "specialist"],
  senior: ["senior", "sr.", "sr ", "staff", "principal"],
  lead: ["lead", "head of", "manager", "director", "principal"],
};

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function daysSince(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 9999;
  return Math.floor((Date.now() - then) / 86_400_000);
}

export async function fetchJobs(params: {
  query: string;
  skills: string[];
  level?: string | undefined;
  location?: string | undefined;
  postedWithinDays?: number | undefined;
  limit?: number | undefined;
}): Promise<JobPosting[]> {
  // Remotive ignores `search`/`limit` server-side, so filtering and ranking happen here.
  const response = await fetch("https://remotive.com/api/remote-jobs", {
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("The job search service is unavailable right now. Please try again shortly.");
  }
  const payload = (await response.json()) as { jobs?: RemotiveJob[] };
  const jobs = payload.jobs ?? [];

  const skills = params.skills.map((skill) => skill.toLowerCase().trim()).filter(Boolean);
  const levelHints = params.level ? (LEVEL_HINTS[params.level] ?? []) : [];
  const location = params.location?.toLowerCase().trim();
  const terms = params.query
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((term) => term.length > 2);

  const mapped = jobs.map((job) => {
    const title = job.title.toLowerCase();
    const body = stripHtml(job.description).toLowerCase();
    const text = `${title} ${body}`;

    const matched = skills.filter((skill) => text.includes(skill));
    const coverage = skills.length ? matched.length / skills.length : 0;
    const termHitsTitle = terms.filter((term) => title.includes(term)).length;
    const termHitsBody = terms.filter((term) => body.includes(term)).length;
    const termScore = terms.length
      ? (termHitsTitle / terms.length) * 0.7 + (termHitsBody / terms.length) * 0.3
      : 0;
    const levelBoost = levelHints.some((hint) => title.includes(hint)) ? 8 : 0;

    const base = skills.length
      ? coverage * 60 + termScore * 30
      : termScore * 88;
    const match = Math.max(10, Math.min(99, Math.round(base + levelBoost + 8)));

    return {
      posting: {
        id: String(job.id),
        title: job.title,
        company: job.company_name,
        location: job.candidate_required_location || "Worldwide",
        workplace: "Remote",
        category: job.category,
        posted_at: job.publication_date,
        url: job.url,
        description: stripHtml(job.description).slice(0, 6000),
        match,
        matched_skills: matched.slice(0, 8),
      } satisfies JobPosting,
      termHitsTitle,
      termHitsBody,
    };
  });

  return mapped
    .filter(({ termHitsTitle, termHitsBody }) =>
      terms.length ? termHitsTitle > 0 || termHitsBody >= Math.ceil(terms.length / 2) : true,
    )
    .filter(({ posting }) =>
      location ? posting.location.toLowerCase().includes(location) : true,
    )
    .filter(({ posting }) =>
      params.postedWithinDays ? daysSince(posting.posted_at) <= params.postedWithinDays : true,
    )
    .filter(({ posting }) => {
      if (!levelHints.length) return true;
      const title = posting.title.toLowerCase();
      const anyLevel = Object.values(LEVEL_HINTS).flat();
      return (
        levelHints.some((hint) => title.includes(hint)) ||
        !anyLevel.some((hint) => title.includes(hint))
      );
    })
    .map(({ posting }) => posting)
    .sort((a, b) => b.match - a.match)
    .slice(0, params.limit ?? 30);
}
