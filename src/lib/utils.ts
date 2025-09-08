import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { categories } from "./data";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const pastelColors = [
  "bg-red-50/50 hover:bg-red-50",
  "bg-green-50/50 hover:bg-green-50",
  "bg-blue-50/50 hover:bg-blue-50",
  "bg-yellow-50/50 hover:bg-yellow-50",
  "bg-purple-50/50 hover:bg-purple-50",
  "bg-pink-50/50 hover:bg-pink-50",
  "bg-indigo-50/50 hover:bg-indigo-50",
  "bg-cyan-50/50 hover:bg-cyan-50",
  "bg-teal-50/50 hover:bg-teal-50",
  "bg-orange-50/50 hover:bg-orange-50",
];

const categoryColorMap = new Map<string, string>();

categories.forEach((category, index) => {
  categoryColorMap.set(category, pastelColors[index % pastelColors.length]);
});

export function getCategoryColorClass(category: string): string {
  return categoryColorMap.get(category) || "hover:bg-muted/50";
}
