import { useEffect, useState } from "react";
import { type ChartConfig } from "@/components/ui/chart"
import { PieChart } from "@/components/pieChart"
 
const Popup = () => {
  const [totalCommits, setTotalCommits] = useState(null);
  const [authorStats, setAuthorStats] = useState({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [pieChartData, setPieChartData] = useState<{name: string, value: number}[]>([]);
  const [pieChartConfig, setPieChartConfig] = useState<ChartConfig>({});

  // Demo data for visualization when not on GitLab
  const demoData = [
    { name: "Alice", value: 120 },
    { name: "Bob", value: 85 },
    { name: "Charlie", value: 65 },
    { name: "David", value: 45 },
    { name: "Eve", value: 30 },
  ];

  const demoConfig: ChartConfig = {
    "Alice": { label: "Alice", color: "#2563eb" },
    "Bob": { label: "Bob", color: "#60a5fa" },
    "Charlie": { label: "Charlie", color: "#93c5fd" },
    "David": { label: "David", color: "#3b82f6" },
    "Eve": { label: "Eve", color: "#1d4ed8" }
  };

  useEffect(() => {
    // Get the current tab URL to extract project name
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url;
      if (url && url.includes("gitlab.com")) {
        const extractedProjectName = extractProjectNameFromUrl(url);
        setProjectName(extractedProjectName);
      } else {
        setError("Not a GitLab page - showing demo data");
        setLoading(false);
        // Use demo data when not on GitLab
        setPieChartData(demoData);
        setPieChartConfig(demoConfig);
      }
    });
  }, []);

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
      const response = await fetch(`https://extension-backend-production-1c13.up.railway.app/commits?projectName=${encodeURIComponent(projectName)}`);
      
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

  useEffect(() => {
    if (projectName) {
      fetchCommitData();
    }
  }, [projectName]);

  // Convert author stats to pie chart data format
  useEffect(() => {
    if (Object.keys(authorStats).length > 0) {
      // Create pie chart data
      const chartData = Object.entries(authorStats).map(([author, count]) => ({
        name: author,
        value: count as number
      }));
      
      // Create dynamic color config for each author
      const colors = ["#2563eb", "#60a5fa", "#93c5fd", "#3b82f6", "#1d4ed8", "#1e40af", "#818cf8", "#4f46e5"];
      const config: ChartConfig = {};
      
      Object.keys(authorStats).forEach((author, index) => {
        config[author] = {
          label: author,
          color: colors[index % colors.length]
        };
      });
      
      setPieChartData(chartData);
      setPieChartConfig(config);
    }
  }, [authorStats]);

  return (
    <div style={{ padding: "10px", width: "400px", fontFamily: "Arial" }}>
      <h2>GitLab Commit Stats</h2>
      
      {loading && <p>Loading data...</p>}
      
      {projectName && <p>Project: {projectName}</p>}
      
      {error ? (
        <div>
          <p style={error.includes("demo") ? {} : { color: "red" }}>{error}</p>
          
          {/* Show demo chart if we're showing demo data */}
          {error.includes("demo") && (
            <div style={{ marginTop: "20px", height: "300px" }}>
              <h3>Demo: Commits by Author</h3>
              <PieChart data={demoData} config={demoConfig} />
              <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#666" }}>
                (This is demo data. Visit a GitLab project page for real stats.)
              </p>
            </div>
          )}
          
          {!error.includes("demo") && (
            <button onClick={fetchCommitData}>Retry</button>
          )}
        </div>
      ) : (
        <>
          <p>Total Commits: {totalCommits ?? "N/A"}</p>
          
          {/* Add the pie chart if we have data */}
          {pieChartData.length > 0 && (
            <div style={{ marginTop: "20px", height: "300px" }}>
              <h3>Commits by Author</h3>
              <PieChart data={pieChartData} config={pieChartConfig} />
            </div>
          )}
          
          <div style={{ marginTop: "20px" }}>
            <h3>Author Breakdown</h3>
            {Object.entries(authorStats).map(([author, count]) => (
              <p key={author}>{author}: {count as number} commits</p>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Popup;
