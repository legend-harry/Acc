
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { categories } from "./data";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const pastelColors = [
  "bg-red-100/70 hover:bg-red-100",
  "bg-green-100/70 hover:bg-green-100",
  "bg-blue-100/70 hover:bg-blue-100",
  "bg-yellow-100/70 hover:bg-yellow-100",
  "bg-purple-100/70 hover:bg-purple-100",
  "bg-pink-100/70 hover:bg-pink-100",
  "bg-indigo-100/70 hover:bg-indigo-100",
  "bg-cyan-100/70 hover:bg-cyan-100",
  "bg-teal-100/70 hover:bg-teal-100",
  "bg-orange-100/70 hover:bg-orange-100",
];

const badgeColors = [
  "bg-red-100/30 text-red-800 border-red-200/50",
  "bg-green-100/30 text-green-800 border-green-200/50",
  "bg-blue-100/30 text-blue-800 border-blue-200/50",
  "bg-yellow-100/30 text-yellow-800 border-yellow-200/50",
  "bg-purple-100/30 text-purple-800 border-purple-200/50",
  "bg-pink-100/30 text-pink-800 border-pink-200/50",
  "bg-indigo-100/30 text-indigo-800 border-indigo-200/50",
  "bg-cyan-100/30 text-cyan-800 border-cyan-200/50",
  "bg-teal-100/30 text-teal-800 border-teal-200/50",
  "bg-orange-100/30 text-orange-800 border-orange-200/50",
];


const categoryColorMap = new Map<string, string>();
const categoryBadgeColorMap = new Map<string, string>();

categories.forEach((category, index) => {
  categoryColorMap.set(category, pastelColors[index % pastelColors.length]);
  categoryBadgeColorMap.set(category, badgeColors[index % badgeColors.length]);
});

export function getCategoryColorClass(category: string): string {
  return categoryColorMap.get(category) || "hover:bg-muted/50";
}

export function getCategoryBadgeColorClass(category: string): string {
  return categoryBadgeColorMap.get(category) || "";
}
