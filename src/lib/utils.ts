
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const pastelColors = [
  "bg-rose-100/40 hover:bg-rose-100/60 dark:bg-rose-900/20 dark:hover:bg-rose-900/30",
  "bg-lime-100/40 hover:bg-lime-100/60 dark:bg-lime-900/20 dark:hover:bg-lime-900/30",
  "bg-sky-100/40 hover:bg-sky-100/60 dark:bg-sky-900/20 dark:hover:bg-sky-900/30",
  "bg-amber-100/40 hover:bg-amber-100/60 dark:bg-amber-900/20 dark:hover:bg-amber-900/30",
  "bg-violet-100/40 hover:bg-violet-100/60 dark:bg-violet-900/20 dark:hover:bg-violet-900/30",
  "bg-fuchsia-100/40 hover:bg-fuchsia-100/60 dark:bg-fuchsia-900/20 dark:hover:bg-fuchsia-900/30",
  "bg-indigo-100/40 hover:bg-indigo-100/60 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30",
  "bg-cyan-100/40 hover:bg-cyan-100/60 dark:bg-cyan-900/20 dark:hover:bg-cyan-900/30",
  "bg-teal-100/40 hover:bg-teal-100/60 dark:bg-teal-900/20 dark:hover:bg-teal-900/30",
  "bg-orange-100/40 hover:bg-orange-100/60 dark:bg-orange-900/20 dark:hover:bg-orange-900/30",
];

const badgeColors = [
  "bg-rose-100 text-rose-900 border-rose-200/80 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800/50",
  "bg-lime-100 text-lime-900 border-lime-200/80 dark:bg-lime-900/30 dark:text-lime-200 dark:border-lime-800/50",
  "bg-sky-100 text-sky-900 border-sky-200/80 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-800/50",
  "bg-amber-100 text-amber-900 border-amber-200/80 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800/50",
  "bg-violet-100 text-violet-900 border-violet-200/80 dark:bg-violet-900/30 dark:text-violet-200 dark:border-violet-800/50",
  "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200/80 dark:bg-fuchsia-900/30 dark:text-fuchsia-200 dark:border-fuchsia-800/50",
  "bg-indigo-100 text-indigo-900 border-indigo-200/80 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-800/50",
  "bg-cyan-100 text-cyan-900 border-cyan-200/80 dark:bg-cyan-900/30 dark:text-cyan-200 dark:border-cyan-800/50",
  "bg-teal-100 text-teal-900 border-teal-200/80 dark:bg-teal-900/30 dark:text-teal-200 dark:border-teal-800/50",
  "bg-orange-100 text-orange-900 border-orange-200/80 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-800/50",
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
