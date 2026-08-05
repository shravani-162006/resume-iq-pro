import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const jobsInput = z.object({
  query: z.string().default(""),
  skills: z.array(z.string()).default([]),
  level: z.string().optional(),
  location: z.string().optional(),
  postedWithinDays: z.number().optional(),
});

export const searchJobs = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => jobsInput.parse(data))
  .handler(async ({ data }) => {
    const { fetchJobs } = await import("./jobs.server");
    return fetchJobs(data);
  });
