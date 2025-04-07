import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// src/utils.ts
export interface CommitResponse {
  total_commits: number;
  author_commit_count: Record<string, number>;
}


// src/utils.ts
export interface CommitResponse {
  total_commits: number;
  author_commit_count: Record<string, number>;
}

// Simplified filtering based on percentage (since we don't have dates)
export const getFilteredData = (
  authorStats: Record<string, number>, 
  timeFrame: "weekly" | "monthly" | "yearly" | "all"
) => {
  // Convert author stats to chart-friendly format
  const chartData = Object.entries(authorStats).map(([name, count]) => ({
    name,
    value: adjustCountByTimeFrame(count, timeFrame)
  }));
  
  return chartData;
};

// Helper function to adjust counts based on time frame
export const adjustCountByTimeFrame = (
  count: number, 
  timeFrame: "weekly" | "monthly" | "yearly" | "all"
) => {
  if (timeFrame === "all" || timeFrame === "yearly") {
    return count; // Show all commits
  } else if (timeFrame === "monthly") {
    return Math.round(count * 0.3); // Show ~30% of commits
  } else if (timeFrame === "weekly") {
    return Math.round(count * 0.1); // Show ~10% of commits
  }
  return count;
};

// Simple function to get total for a time period
export const getTabTotal = (
  totalCommits: number,
  timeFrame: "weekly" | "monthly" | "yearly" | "all"
) => {
  if (totalCommits === null || totalCommits === undefined) return "Loading...";
  
  return adjustCountByTimeFrame(totalCommits, timeFrame);
};