
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const pastelColors = [
  "bg-red-200/40 hover:bg-red-200/60",
  "bg-green-200/40 hover:bg-green-200/60",
  "bg-blue-200/40 hover:bg-blue-200/60",
  "bg-yellow-200/40 hover:bg-yellow-200/60",
  "bg-purple-200/40 hover:bg-purple-200/60",
  "bg-pink-200/40 hover:bg-pink-200/60",
  "bg-indigo-200/40 hover:bg-indigo-200/60",
  "bg-cyan-200/40 hover:bg-cyan-200/60",
  "bg-teal-200/40 hover:bg-teal-200/60",
  "bg-orange-200/40 hover:bg-orange-200/60",
];

const badgeColors = [
  "bg-red-100/70 text-red-900 border-red-200/80",
  "bg-green-100/70 text-green-900 border-green-200/80",
  "bg-blue-100/70 text-blue-900 border-blue-200/80",
  "bg-yellow-100/70 text-yellow-900 border-yellow-200/80",
  "bg-purple-100/70 text-purple-900 border-purple-200/80",
  "bg-pink-100/70 text-pink-900 border-pink-200/80",
  "bg-indigo-100/70 text-indigo-900 border-indigo-200/80",
  "bg-cyan-100/70 text-cyan-900 border-cyan-200/80",
  "bg-teal-100/70 text-teal-900 border-teal-200/80",
  "bg-orange-100/70 text-orange-900 border-orange-200/80",
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
