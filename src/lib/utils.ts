
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const pastelColors = [
  "bg-rose-100/40 hover:bg-rose-100/60",
  "bg-lime-100/40 hover:bg-lime-100/60",
  "bg-sky-100/40 hover:bg-sky-100/60",
  "bg-amber-100/40 hover:bg-amber-100/60",
  "bg-violet-100/40 hover:bg-violet-100/60",
  "bg-fuchsia-100/40 hover:bg-fuchsia-100/60",
  "bg-indigo-100/40 hover:bg-indigo-100/60",
  "bg-cyan-100/40 hover:bg-cyan-100/60",
  "bg-teal-100/40 hover:bg-teal-100/60",
  "bg-orange-100/40 hover:bg-orange-100/60",
];

const badgeColors = [
  "bg-rose-100 text-rose-900 border-rose-200/80",
  "bg-lime-100 text-lime-900 border-lime-200/80",
  "bg-sky-100 text-sky-900 border-sky-200/80",
  "bg-amber-100 text-amber-900 border-amber-200/80",
  "bg-violet-100 text-violet-900 border-violet-200/80",
  "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200/80",
  "bg-indigo-100 text-indigo-900 border-indigo-200/80",
  "bg-cyan-100 text-cyan-900 border-cyan-200/80",
  "bg-teal-100 text-teal-900 border-teal-200/80",
  "bg-orange-100 text-orange-900 border-orange-200/80",
];


// We need a consistent mapping, so we can't rely on index.
// Let's create a function that generates a hash from the category name.
const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

export function getCategoryColorClass(category: string): string {
  if (!category) return "hover:bg-muted/50";
  const index = getHash(category) % pastelColors.length;
  return pastelColors[index];
}

export function getCategoryBadgeColorClass(category: string): string {
  if (!category) return "";
  const index = getHash(category) % badgeColors.length;
  return badgeColors[index];
}
