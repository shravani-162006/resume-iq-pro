import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { ScoreBar } from "@/components/ScoreGauge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FREE_LIMIT } from "@/lib/analysis-store";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your resume history — ResumeIQ" },
      {
        name: "description",
        content: "Review every resume you've checked, track ATS score progress and open past reports.",
      },
      { property: "og:title", content: "Your resume history — ResumeIQ" },
      { property: "og:description", content: "Track ATS score progress across your resume versions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

type Row = {
  id: string;
  file_name: string;
  created_at: string;
  ats_scores: { overall: number; verdict: string; created_at: string }[];
};

function Dashboard() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["resumes", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("resumes")
        .select("id, file_name, created_at, ats_scores(overall, verdict, created_at)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return rows as unknown as Row[];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: row } = await supabase
        .from("profiles")
        .select("checks_used, plan")
        .eq("id", user!.id)
        .maybeSingle();
      return row;
    },
  });

  async function remove(id: string) {
    const { error } = await supabase.from("resumes").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete that resume.");
      return;
    }
    toast.success("Resume deleted.");
    void queryClient.invalidateQueries({ queryKey: ["resumes", user?.id] });
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Your history</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {profile
              ? `${profile.checks_used} of ${FREE_LIMIT} checks used this month on the ${profile.plan} plan.`
              : "Every resume you check is saved here."}
          </p>
        </div>
        <Button asChild>
          <Link to="/analyze">New check</Link>
        </Button>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !data?.length ? (
        <div className="panel p-12 text-center">
          <FileText className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="mt-4 text-sm text-muted-foreground">
            Nothing here yet. Run your first ATS check to start tracking progress.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/analyze">Check a resume</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((row) => {
            const latest = [...row.ats_scores].sort((a, b) =>
              a.created_at < b.created_at ? 1 : -1,
            )[0];
            return (
              <li key={row.id} className="panel p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/resume/$id"
                      params={{ id: row.id }}
                      className="font-display text-base font-semibold tracking-tight underline-offset-4 hover:underline"
                    >
                      {row.file_name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleString()}
                    </p>
                    {latest ? (
                      <div className="mt-4 max-w-sm space-y-1.5">
                        <ScoreBar score={latest.overall} />
                        <p className="text-xs text-muted-foreground">{latest.verdict}</p>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4">
                    {latest ? (
                      <p className="font-display text-2xl font-semibold tabular-nums">
                        {latest.overall}
                      </p>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(row.id)}
                      aria-label={`Delete ${row.file_name}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
