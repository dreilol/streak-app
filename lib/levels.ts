export const LEVELS = [
  { min: 0,  name: "No streak yet", icon: "🥚" },
  { min: 1,  name: "Seedling",      icon: "🌱" },
  { min: 3,  name: "Sprout",        icon: "🌿" },
  { min: 7,  name: "Sapling",       icon: "🌳" },
  { min: 14, name: "Tree",          icon: "🌲" },
  { min: 30, name: "Forest",        icon: "🏞️" },
] as const;

export function levelFor(streak: number) {
  return [...LEVELS].reverse().find(l => streak >= l.min) ?? LEVELS[0];
}

export function nextLevel(streak: number) {
  return LEVELS.find(l => l.min > streak);
}
