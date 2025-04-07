"use client"
import { useState, useEffect, useCallback } from "react"
import { PieChart } from "@/components/PieChart"
import { type ChartConfig } from "@/components/ui/chart"
import {
  Commit,
  getFilteredData,
  getTabTotal,
  extractProjectNameFromUrl,
} from "@/lib/helpers"
// import { fetchGitLabCommits } from "@/pages/api/gitlab"

const Popup = () => {
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly" | "yearly" | "all">("all")
  const [commits] = useState<Commit[]>([])
  const [totalCommits, setTotalCommits] = useState<number | null>(null)
  const [authorStats, setAuthorStats] = useState<Record<string, number>>({})
  const [pieChartData, setPieChartData] = useState<Array<{ name: string, value: number }>>([])
  const [pieChartConfig, setPieChartConfig] = useState<ChartConfig>({})
  const [projectName, setProjectName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<"chart" | "contributors">("chart")

  const getCurrentTabTotal = () => {
    return totalCommits ? getTabTotal(commits, totalCommits, activeTab) : "Loading...";
  };

  const fetchCommitData = useCallback(async () => {
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
      console.log("API response:", data);
      
      setTotalCommits(data.total_commits);
      setAuthorStats(data.author_commit_count || {});
      
      setError(null);
    } catch (error) {
      console.error("Error fetching commit data:", error);
      setError(`Failed to fetch data: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [projectName]);

  useEffect(() => {
    if (Object.keys(authorStats).length > 0) {
      const filteredData = getFilteredData(commits, activeTab, authorStats);
      
      filteredData.sort((a, b) => b.value - a.value);
      
      const colors = ["#2563eb", "#60a5fa", "#93c5fd", "#3b82f6", "#1d4ed8", "#1e40af", "#818cf8", "#4f46e5"];
      const config: ChartConfig = {};
      
      filteredData.forEach((item, index) => {
        config[item.name] = {
          label: item.name,
          color: colors[index % colors.length],
        };
      });
      
      setPieChartData(filteredData);
      setPieChartConfig(config);
    }
  }, [authorStats, activeTab, commits]);

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
      setProjectName("demo-project");
    }
  }, []);

  useEffect(() => {
    if (projectName) {
      fetchCommitData();
    }
  }, [projectName, fetchCommitData]);

  return (
    <div style={{
      width: "320px",
      maxHeight: "500px",
      padding: "10px",
      fontFamily: "Arial",
      fontSize: "13px",
      backgroundColor: "#f8fafc",
      color: "#1e293b",
      overflow: "auto"
    }}>
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
        <div style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ color: "#3b82f6", fontWeight: "bold" }}>Loading commit data...</div>
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
          {/* Main view tabs */}
          <div style={{
            display: "flex",
            marginBottom: "8px",
            backgroundColor: "white",
            borderRadius: "4px",
            overflow: "hidden"
          }}>
            <button
              onClick={() => setActiveView("chart")}
              style={{
                flex: 1,
                padding: "6px 4px",
                backgroundColor: activeView === "chart" ? "#3b82f6" : "white",
                color: activeView === "chart" ? "white" : "#64748b",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "bold",
                borderRight: "1px solid #e2e8f0"
              }}
            >
              Chart
            </button>
            <button
              onClick={() => setActiveView("contributors")}
              style={{
                flex: 1,
                padding: "6px 4px",
                backgroundColor: activeView === "contributors" ? "#3b82f6" : "white",
                color: activeView === "contributors" ? "white" : "#64748b",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "bold"
              }}
            >
              Contributors
            </button>
          </div>

          {/* Time period tabs */}
          <div style={{
            display: "flex",
            marginBottom: "8px",
            backgroundColor: "white",
            borderRadius: "4px",
            padding: "2px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
          }}>
            {["all", "yearly", "monthly", "weekly"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as "all" | "weekly" | "monthly" | "yearly")}
                style={{
                  flex: 1,
                  padding: "4px 2px",
                  backgroundColor: activeTab === tab ? "#4f46e5" : "transparent",
                  color: activeTab === tab ? "white" : "#64748b",
                  border: "none",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontSize: "10px",
                  fontWeight: activeTab === tab ? "bold" : "normal"
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Stats info */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            backgroundColor: "#dbeafe",
            padding: "8px",
            borderRadius: "4px",
            marginBottom: "10px"
          }}>
            <div>
              <div style={{fontSize: "11px", color: "#1e40af"}}>Total Commits</div>
              <div style={{fontWeight: "bold", fontSize: "16px"}}>{getCurrentTabTotal()}</div>
            </div>
            <div>
              <div style={{fontSize: "11px", color: "#1e40af"}}>Contributors</div>
              <div style={{fontWeight: "bold", fontSize: "16px"}}>{pieChartData.length}</div>
            </div>
          </div>

          {/* Content based on active view */}
          {activeView === "chart" ? (
            <div style={{
              backgroundColor: "white",
              borderRadius: "6px",
              padding: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              <div style={{ height: "280px" }}>
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
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              overflow: "hidden"
            }}>
              <div style={{
                maxHeight: "280px",
                overflowY: "auto",
                padding: "0"
              }}>
                {pieChartData.map((item, index) => (
                  <div key={item.name} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 8px",
                    borderBottom: "1px solid #f1f5f9",
                    backgroundColor: index < 3 ? index === 0 ? "#f0f9ff" : "#f8fafc" : "white"
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      width: "75%"
                    }}>
                      {index < 3 && (
                        <div style={{
                          minWidth: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          marginRight: "6px",
                          backgroundColor: pieChartConfig[item.name]?.color || "#ccc",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: "bold",
                          fontSize: "9px"
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
                          marginRight: "6px",
                          backgroundColor: pieChartConfig[item.name]?.color || "#ccc"
                        }} />
                      )}
                      <span style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontWeight: index < 3 ? "500" : "normal",
                        fontSize: "11px"
                      }}>
                        {item.name}
                      </span>
                    </div>
                    <div style={{
                      fontWeight: index < 3 ? "bold" : "500",
                      color: index === 0 ? "#1e40af" : "#334155",
                      fontSize: "11px"
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