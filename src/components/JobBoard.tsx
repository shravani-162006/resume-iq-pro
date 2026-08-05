import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase, ExternalLink, Loader2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { searchJobs } from "@/lib/jobs.functions";
import type { JobPosting } from "@/lib/resume-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LEVELS = [
  { value: "any", label: "Any level" },
  { value: "entry", label: "Entry" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / Manager" },
];

const RECENCY = [
  { value: "any", label: "Any time" },
  { value: "7", label: "Past week" },
  { value: "30", label: "Past month" },
];

export function JobBoard({
  defaultQuery,
  defaultLevel,
  skills,
}: {
  defaultQuery: string;
  defaultLevel?: string;
  skills: string[];
}) {
  const run = useServerFn(searchJobs);
  const [query, setQuery] = useState(defaultQuery);
  const [level, setLevel] = useState(defaultLevel && LEVELS.some((l) => l.value === defaultLevel) ? defaultLevel : "any");
  const [location, setLocation] = useState("");
  const [recency, setRecency] = useState("any");

  const mutation = useMutation({
    mutationFn: () =>
      run({
        data: {
          query,
          skills,
          ...(level !== "any" ? { level } : {}),
          ...(location.trim() ? { location: location.trim() } : {}),
          ...(recency !== "any" ? { postedWithinDays: Number(recency) } : {}),
        },
      }) as Promise<JobPosting[]>,
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Job search failed."),
  });

  const jobs = mutation.data ?? [];

  return (
    <div className="space-y-6">
      <div className="panel grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Role or keyword"
            aria-label="Role or keyword"
          />
        </div>
        <Input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Location (e.g. Europe)"
          aria-label="Location"
        />
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger aria-label="Experience level">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEVELS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-3">
          <Select value={recency} onValueChange={setRecency}>
            <SelectTrigger aria-label="Date posted">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECENCY.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Search className="h-4 w-4" aria-hidden />
            )}
            Search
          </Button>
        </div>
      </div>

      {mutation.isPending ? (
        <p className="text-sm text-muted-foreground">Finding roles that match your profile…</p>
      ) : null}

      {mutation.isSuccess && jobs.length === 0 ? (
        <div className="panel p-10 text-center text-sm text-muted-foreground">
          No roles matched those filters. Try a broader keyword or clear the location.
        </div>
      ) : null}

      <ul className="space-y-3">
        {jobs.map((job) => (
          <li key={job.id} className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <h3 className="font-display text-base font-semibold tracking-tight">{job.title}</h3>
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" aria-hidden />
                    {job.company}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {job.location}
                  </span>
                  <span>{new Date(job.posted_at).toLocaleDateString()}</span>
                </p>
                {job.matched_skills.length ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.matched_skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <div className="text-right">
                  <p className="font-display text-xl font-semibold tabular-nums">{job.match}%</p>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    match
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={job.url} target="_blank" rel="noreferrer noopener">
                    View
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
