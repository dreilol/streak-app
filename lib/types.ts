export type Role = "student" | "admin";

export interface Profile {
  id: string;
  name: string;
  role: Role;
  rfid_tag: string | null;
  current_streak: number;
  longest_streak: number;
  last_log_date: string | null;

  // Added in phase 1
  username: string | null;
  full_name: string | null;
  display_name: string | null;
  section_id: string | null;
  restore_tokens: number;
  last_token_reset: string | null;
}

export interface LogRow {
  id: number;
  profile_id: string;
  tag: string;
  logged_at: string;
  log_date: string;
}