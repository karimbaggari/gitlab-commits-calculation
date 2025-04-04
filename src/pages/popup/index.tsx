"use client"
import { useState, useEffect } from "react"
import { PieChart } from "@/components/pieChart"
import { type ChartConfig } from "@/components/ui/chart"

const Popup = () => {
  const [activeTab] = useState<"weekly" | "monthly" | "yearly">("monthly")
  const [totalCommits, setTotalCommits] = useState<number | null>(null)
  const [authorStats, setAuthorStats] = useState<Record<string, number>>({})
  const [pieChartData, setPieChartData] = useState<Array<{name: string, value: number}>>([])
  const [pieChartConfig, setPieChartConfig] = useState<ChartConfig>({})
  const [projectName, setProjectName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<"chart" | "contributors">("chart")

  console.log(totalCommits)
  
  const getFilteredData = (data: Record<string, number>, timeFrame: "weekly" | "monthly" | "yearly") => {
    const multiplier = timeFrame === "weekly" ? 0.1 : timeFrame === "monthly" ? 0.3 : 1;
    
    return Object.entries(data).map(([name, count]) => ({
      name,
      value: Math.round(count * multiplier)
    }));
  }
  

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
      width: "320px",  // Standard extension popup width
      maxHeight: "500px",
      padding: "10px",
      fontFamily: "Arial",
      fontSize: "13px",
      backgroundColor: "#f8fafc",
      color: "#1e293b",
      overflow: "auto"
    }}>
      {/* Simplified Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px",
        borderBottom: "2px solid #3b82f6",
        paddingBottom: "6px",
        position: "sticky",
        top: 0,
        backgroundColor: "#f8fafc",
        zIndex: 10
      }}>
        <h1 style={{ 
          fontSize: "16px", 
          fontWeight: "bold", 
          margin: 0, 
          color: "#1e40af" 
        }}>
          GitLab Stats
        </h1>
        {projectName && (
          <span style={{ 
            color: "#475569", 
            fontSize: "12px", 
            maxWidth: "140px", 
            overflow: "hidden", 
            textOverflow: "ellipsis", 
            whiteSpace: "nowrap",
            fontWeight: "500" 
          }}>
            {projectName}
          </span>
        )}
      </div>
      
      {loading ? (
        <div style={{ 
          padding: "20px", 
          textAlign: "center"
        }}>
          <div style={{ 
            color: "#3b82f6", 
            fontWeight: "bold" 
          }}>Loading commit data...</div>
        </div>
      ) : error ? (
        <div style={{ 
          padding: "15px", 
          color: "#b91c1c", 
          textAlign: "center",
          backgroundColor: "#fee2e2",
          borderRadius: "6px"
        }}>
          <p style={{ fontSize: "13px", fontWeight: "500", margin: "0 0 8px 0" }}>{error}</p>
          <button 
            onClick={fetchCommitData}
            style={{
              padding: "5px 10px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold"
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* View selector */}
          <div style={{display: "flex", marginBottom: "8px"}}>
            <button 
              onClick={() => setActiveView("chart")}
              style={{
                flex: 1,
                padding: "4px",
                backgroundColor: activeView === "chart" ? "#3b82f6" : "white",
                color: activeView === "chart" ? "white" : "#64748b",
                border: "1px solid #e2e8f0",
                borderRadius: "4px 0 0 4px",
                fontSize: "11px"
              }}
            >
              Chart
            </button>
            <button 
              onClick={() => setActiveView("contributors")}
              style={{
                flex: 1,
                padding: "4px",
                backgroundColor: activeView === "contributors" ? "#3b82f6" : "white",
                color: activeView === "contributors" ? "white" : "#64748b",
                border: "1px solid #e2e8f0",
                borderRadius: "0 4px 4px 0",
                borderLeft: "none",
                fontSize: "11px"
              }}
            >
              Contributors
            </button>
          </div>
          
          {/* Show selected view */}
          {activeView === "chart" ? (
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "6px", 
              padding: "10px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ 
                fontSize: "14px", 
                fontWeight: "600", 
                margin: "0 0 8px 0",
                color: "#1e40af"
              }}>
                Commit Distribution
              </h3>
              <div style={{ height: "200px" }}>
                <PieChart 
                  data={pieChartData} 
                  config={pieChartConfig} 
                />
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: "white",
              borderRadius: "6px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              <div style={{
                padding: "8px 10px",
                backgroundColor: "#3b82f6",
                color: "white",
                fontWeight: "600",
                fontSize: "13px",
                borderRadius: "6px 6px 0 0"
              }}>
                Contributors
              </div>
              
              <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                {pieChartData.map((item, index) => (
                  <div key={item.name} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "4px 8px",
                    borderBottom: "1px solid #f1f5f9",
                    backgroundColor: index < 3 ? index === 0 ? "#f0f9ff" : "#f8fafc" : "white",
                    fontSize: "11px"
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      width: "75%"
                    }}>
                      {index < 3 && (
                        <div style={{
                          minWidth: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          marginRight: "8px",
                          backgroundColor: pieChartConfig[item.name]?.color || "#ccc",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: "bold",
                          fontSize: "10px"
                        }}>
                          {index + 1}
                        </div>
                      )}
                      {index >= 3 && (
                        <div style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          minWidth: "8px",
                          marginRight: "8px",
                          backgroundColor: pieChartConfig[item.name]?.color || "#ccc"
                        }} />
                      )}
                      <span style={{
                        whiteSpace: "nowrap", 
                        overflow: "hidden", 
                        textOverflow: "ellipsis",
                        fontWeight: index < 3 ? "500" : "normal"
                      }}>
                        {item.name}
                      </span>
                    </div>
                    <div style={{
                      fontWeight: index < 3 ? "bold" : "500",
                      color: index === 0 ? "#1e40af" : "#334155",
                      display: "flex",
                      alignItems: "center"
                    }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Popup; 