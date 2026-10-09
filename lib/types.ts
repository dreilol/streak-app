export type Role = "student" | "admin";

export interface Profile {
  id: string;
  name: string;
  role: Role;
  rfid_tag: string | null;
  current_streak: number;
  longest_streak: number;
  last_log_date: string | null;
}

export interface LogRow {
  id: number;
  profile_id: string;
  tag: string;
  logged_at: string;
  log_date: string;
}
