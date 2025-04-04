"use client"
import { useState, useEffect } from "react"
import { PieChart } from "@/components/pieChart"
import { type ChartConfig } from "@/components/ui/chart"

export default function ChartsPage() {
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly" | "yearly">("monthly")
  const [totalCommits, setTotalCommits] = useState<number | null>(null)
  const [authorStats, setAuthorStats] = useState<Record<string, number>>({})
  const [pieChartData, setPieChartData] = useState<Array<{name: string, value: number}>>([])
  const [pieChartConfig, setPieChartConfig] = useState<ChartConfig>({})
  const [projectName, setProjectName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Time filtering for different views
  const getFilteredData = (data: Record<string, number>, timeFrame: "weekly" | "monthly" | "yearly") => {
    // In a real app, we would filter by dates
    // For this demo, we'll just adjust the values to simulate different time periods
    const multiplier = timeFrame === "weekly" ? 0.25 : timeFrame === "monthly" ? 1 : 4;
    
    return Object.entries(data).map(([name, count]) => ({
      name,
      value: Math.round(count * multiplier)
    }));
  }
  
  // Extract project name from GitLab URL
  const extractProjectNameFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      if (!urlObj.hostname.includes("gitlab")) return null;
      
      // Remove the domain part
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      // Find the project name (it's before the "/-/" part if it exists)
      if (pathParts.length >= 2) {
        // For URLs like gitlab.com/jobzyn/jobzyn-monorepo/-/tree/...
        const fullPath = urlObj.pathname;
        const projectPathEnd = fullPath.indexOf("/-/");
        
        if (projectPathEnd !== -1) {
          const projectPath = fullPath.substring(1, projectPathEnd);
          const projectNameParts = projectPath.split('/');
          // Get the last part of the project path as the project name
          return projectNameParts[projectNameParts.length - 1];
        } else {
          // For URLs without "/-/" like gitlab.com/jobzyn/jobzyn-monorepo
          return pathParts[pathParts.length - 1];
        }
      }
      return null;
    } catch (e) {
      console.error("Error parsing URL:", e);
      return null;
    }
  };

  const fetchCommitData = async () => {
    if (!projectName) {
      setError("No GitLab project detected");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `https://extension-backend-production-1c13.up.railway.app/commits?projectName=${encodeURIComponent(projectName)}`
      );
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      setTotalCommits(data.total_commits);
      setAuthorStats(data.author_commit_count);
      
      setError(null);
    } catch (error) {
      console.error("Error fetching commit data:", error);
      setError(`Failed to fetch data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Create chart data from author stats
  useEffect(() => {
    if (Object.keys(authorStats).length > 0) {
      // Convert to chart format
      const chartData = getFilteredData(authorStats, activeTab);
      
      // Sort by commit count (descending)
      chartData.sort((a, b) => b.value - a.value);
      
      // Create color config for each author
      const colors = ["#2563eb", "#60a5fa", "#93c5fd", "#3b82f6", "#1d4ed8", "#1e40af", "#818cf8", "#4f46e5"];
      const config: ChartConfig = {};
      
      chartData.forEach((item, index) => {
        config[item.name] = {
          label: item.name,
          color: colors[index % colors.length],
        };
      });
      
      setPieChartData(chartData);
      setPieChartConfig(config);
    }
  }, [authorStats, activeTab]);

  // Get tab data
  const getTabTotal = () => {
    if (!totalCommits) return "Loading...";
    
    // Adjust total based on time period
    if (activeTab === "weekly") return Math.round(totalCommits * 0.25);
    if (activeTab === "yearly") return Math.round(totalCommits * 4);
    return totalCommits;
  };

  // Get project name from URL on initial load
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0]?.url;
        if (url && url.includes("gitlab.com")) {
          const extractedProjectName = extractProjectNameFromUrl(url);
          setProjectName(extractedProjectName);
        } else {
          setError("Not a GitLab page");
          setLoading(false);
        }
      });
    } else {
      // For development outside of extension context
      setProjectName("demo-project");
    }
  }, []);

  // Fetch data when project name is available
  useEffect(() => {
    if (projectName) {
      fetchCommitData();
    }
  }, [projectName]);

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: "1.5rem", 
      padding: "1.5rem", 
      maxWidth: "800px", 
      margin: "0 auto", 
      fontFamily: "Arial" 
    }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
          GitLab Commit Analytics
        </h1>
        {projectName && (
          <p style={{ color: "#666" }}>
            Project: <strong>{projectName}</strong>
          </p>
        )}
      </div>
      
      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>Loading commit data...</p>
        </div>
      ) : error ? (
        <div style={{ padding: "2rem", color: "red", textAlign: "center" }}>
          <p>{error}</p>
          <button 
            onClick={fetchCommitData}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Time period selector */}
          <div style={{ 
            display: "flex", 
            gap: "0.5rem", 
            borderBottom: "1px solid #e5e7eb", 
            paddingBottom: "0.5rem" 
          }}>
            {["weekly", "monthly", "yearly"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as "weekly" | "monthly" | "yearly")}
                style={{ 
                  padding: "0.5rem 1rem", 
                  borderRadius: "0.375rem 0.375rem 0 0", 
                  border: activeTab === tab ? "1px solid #e5e7eb" : "none", 
                  borderBottom: activeTab === tab ? "none" : undefined,
                  backgroundColor: activeTab === tab ? "#eff6ff" : "transparent",
                  color: activeTab === tab ? "#2563eb" : "#4b5563",
                  cursor: "pointer"
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Stats summary */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(3, 1fr)", 
            gap: "1rem" 
          }}>
            <div style={{ 
              padding: "1rem", 
              backgroundColor: "#eff6ff", 
              borderRadius: "0.5rem" 
            }}>
              <h3 style={{ 
                fontSize: "0.75rem", 
                textTransform: "uppercase", 
                color: "#1d4ed8", 
                fontWeight: "600", 
                marginBottom: "0.5rem" 
              }}>
                Total Commits
              </h3>
              <p style={{ 
                fontSize: "1.875rem", 
                fontWeight: "bold", 
                color: "#1e3a8a" 
              }}>
                {getTabTotal()}
              </p>
            </div>
            <div style={{ 
              padding: "1rem", 
              backgroundColor: "#eef2ff", 
              borderRadius: "0.5rem" 
            }}>
              <h3 style={{ 
                fontSize: "0.75rem", 
                textTransform: "uppercase", 
                color: "#4f46e5", 
                fontWeight: "600", 
                marginBottom: "0.5rem"
              }}>
                Top Contributor
              </h3>
              <p style={{ 
                fontSize: "1.875rem", 
                fontWeight: "bold", 
                color: "#3730a3" 
              }}>
                {pieChartData[0]?.name || "N/A"}
              </p>
            </div>
            <div style={{ 
              padding: "1rem", 
              backgroundColor: "#ecfdf5", 
              borderRadius: "0.5rem" 
            }}>
              <h3 style={{ 
                fontSize: "0.75rem", 
                textTransform: "uppercase", 
                color: "#047857", 
                fontWeight: "600", 
                marginBottom: "0.5rem"
              }}>
                Contributors
              </h3>
              <p style={{ 
                fontSize: "1.875rem", 
                fontWeight: "bold", 
                color: "#064e3b" 
              }}>
                {pieChartData.length}
              </p>
            </div>
          </div>
          
          {/* Chart visualization */}
          {pieChartData.length > 0 && (
            <div style={{ 
              border: "1px solid #e5e7eb", 
              borderRadius: "0.5rem", 
              padding: "1.5rem" 
            }}>
              <h2 style={{ 
                fontSize: "1.25rem", 
                fontWeight: "600", 
                marginBottom: "1rem" 
              }}>
                Commits by Author ({activeTab})
              </h2>
              <div style={{ height: "400px" }}>
                <PieChart 
                  data={pieChartData} 
                  config={pieChartConfig} 
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
} 