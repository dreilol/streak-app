export const LEVELS = [
  { min: 0,   name: "No streak yet", icon: "🥚", blurb: "Every streak starts with one tap." },
  { min: 1,   name: "Drop",          icon: "💧", blurb: "The first step. Every drop counts." },
  { min: 3,   name: "Ripple",        icon: "〰️", blurb: "Small waves start here." },
  { min: 7,   name: "Wave",          icon: "🌊", blurb: "One week strong." },
  { min: 14,  name: "Current",       icon: "🌀", blurb: "Momentum is building." },
  { min: 30,  name: "Tide",          icon: "🌊", blurb: "A full month of consistency." },
  { min: 60,  name: "Ocean",         icon: "🌎", blurb: "You've become part of something bigger." },
  { min: 100, name: "Guardian",      icon: "🛡️", blurb: "100 days of protecting the planet." },
  { min: 200, name: "Legend",        icon: "🏆", blurb: "Top tier. Few reach this far." },
] as const;

export function levelFor(streak: number) {
  return [...LEVELS].reverse().find(l => streak >= l.min) ?? LEVELS[0];
}

export function nextLevel(streak: number) {
  return LEVELS.find(l => l.min > streak);
}

export function progressToNext(streak: number) {
  const cur = levelFor(streak);
  const next = nextLevel(streak);
  if (!next) return { pct: 100, current: cur, next: null, remaining: 0 };
  const span = next.min - cur.min;
  const done = streak - cur.min;
  const pct = Math.max(0, Math.min(100, Math.round((done / span) * 100)));
  return { pct, current: cur, next, remaining: next.min - streak };
}