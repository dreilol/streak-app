import type { Profile } from "./types";

export type Pause = {
  id: string;
  target_type: "student" | "section" | "batch" | "all";
  target_id: string | null;
  reason: string | null;
  started_at: string;
  ended_at: string | null;
};

export type SectionInfo = { id: string; name: string; batch_id: string | null };

/**
 * Is this student paused right now?
 * A pause matches if it targets:
 *  - them directly (student)
 *  - their section
 *  - their section's batch
 *  - everyone (all)
 */
export function isPaused(
  profile: Pick<Profile, "id" | "section_id">,
  pauses: Pause[],
  sections: SectionInfo[]
): Pause | null {
  const mySection = sections.find(s => s.id === profile.section_id);
  const myBatchId = mySection?.batch_id ?? null;

  return (
    pauses.find(p =>
      (p.target_type === "student" && p.target_id === profile.id) ||
      (p.target_type === "section" && p.target_id === profile.section_id) ||
      (p.target_type === "batch" && myBatchId !== null && p.target_id === myBatchId) ||
      (p.target_type === "all")
    ) ?? null
  );
}

/** Human-readable label for a pause target. */
export function pauseLabel(p: Pause): string {
  if (p.target_type === "all") return "Everyone";
  if (p.target_type === "batch") return "A batch";
  if (p.target_type === "section") return "A section";
  if (p.target_type === "student") return "A student";
  return "Unknown";
}