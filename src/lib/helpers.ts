
// src/utils.ts

export interface Commit {
    id: string;
    author: string;
    message: string;
    date: string;
    // other properties that might be in the commits object
  }
  
  /**
   * Filters commits data based on selected time frame
   */
  export const getFilteredData = (commits: Commit[], timeFrame: "weekly" | "monthly" | "yearly" | "all", authorStats: Record<string, number>) => {
    if (timeFrame === "all") {
      return Object.entries(authorStats).map(([name, count]) => ({
        name,
        value: count
      }));
    } else {
      const filteredCommits = filterCommitsByDate(commits, timeFrame);
      return Object.entries(getAuthorStats(filteredCommits)).map(([name, count]) => ({
        name,
        value: count
      }));
    }
  }
  
  /**
   * Filters commits by date based on the selected time frame
   */
  export const filterCommitsByDate = (commits: Commit[], timeFrame: "weekly" | "monthly" | "yearly") => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    if (timeFrame === "weekly") {
      return commits.filter(commit => new Date(commit.date) >= oneWeekAgo);
    } else if (timeFrame === "monthly") {
      return commits.filter(commit => new Date(commit.date) >= oneMonthAgo);
    }
    return commits;
  }
  
  /**
   * Counts commits per author from a filtered list of commits
   */
  export const getAuthorStats = (filteredCommits: Commit[]): Record<string, number> => {
    return filteredCommits.reduce((stats, commit) => {
      stats[commit.author] = (stats[commit.author] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);
  }
  
  /**
   * Gets the total number of commits for the selected time period
   */
  export const getTabTotal = (commits: Commit[], totalCommits: number, activeTab: "weekly" | "monthly" | "yearly" | "all") => {
    if (commits.length === 0) return "Loading...";
    
    if (activeTab === "all") return totalCommits;
    const filteredCommits = filterCommitsByDate(commits, activeTab as "weekly" | "monthly" | "yearly");
    return filteredCommits.length;
  };
  
  /**
   * Extracts project name from GitLab URL
   */
  export const extractProjectNameFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      if (!urlObj.hostname.includes("gitlab")) return null;
      
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      if (pathParts.length >= 2) {
        const fullPath = urlObj.pathname;
        const projectPathEnd = fullPath.indexOf("/-/");
        
        if (projectPathEnd !== -1) {
          const projectPath = fullPath.substring(1, projectPathEnd);
          const projectNameParts = projectPath.split('/');
          return projectNameParts[projectNameParts.length - 1];
        } else {
          return pathParts[pathParts.length - 1];
        }
      }
      return null;
    } catch (e) {
      console.error("Error parsing URL:", e);
      return null;
    }
  };
  
  /**
   * Creates color configuration for chart data
   */
  export const createChartConfig = (data: Array<{name: string, value: number}>): Record<string, {label: string, color: string}> => {
    const colors = ["#2563eb", "#60a5fa", "#93c5fd", "#3b82f6", "#1d4ed8", "#1e40af", "#818cf8", "#4f46e5"];
    const config: Record<string, {label: string, color: string}> = {};
    
    data.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: colors[index % colors.length],
      };
    });
    
    return config;
  };