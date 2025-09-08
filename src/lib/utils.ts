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

const categoryColorMap = new Map<string, string>();

categories.forEach((category, index) => {
  categoryColorMap.set(category, pastelColors[index % pastelColors.length]);
});

export function getCategoryColorClass(category: string): string {
  return categoryColorMap.get(category) || "hover:bg-muted/50";
}
