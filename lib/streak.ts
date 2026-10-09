import type { Profile } from "./types";

const TZ = "Asia/Manila";

/** Calendar date (YYYY-MM-DD) in Philippine time, offset by whole days. */
export function manilaDate(offsetDays = 0) {
  return new Date(Date.now() + offsetDays * 86_400_000).toLocaleDateString("en-CA", {
    timeZone: TZ,
  });
}

type StreakFields = Pick<Profile, "current_streak" | "last_log_date">;

/**
 * The database only updates a streak when someone taps, so a student who
 * stopped tapping would keep their old number forever. A streak is only
 * alive if the last tap was today or yesterday; otherwise it shows as 0.
 */
export function effectiveStreak(p: StreakFields) {
  if (!p.last_log_date) return 0;
  return p.last_log_date >= manilaDate(-1) ? p.current_streak : 0;
}

export function loggedToday(p: Pick<Profile, "last_log_date">) {
  return p.last_log_date === manilaDate();
}
