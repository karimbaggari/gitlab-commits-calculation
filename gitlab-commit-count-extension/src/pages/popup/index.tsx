import { useEffect, useState } from "react";

const Popup = () => {
  const [totalCommits, setTotalCommits] = useState(null);
  const [authorStats, setAuthorStats] = useState({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState<string | null>(null);

  useEffect(() => {
    // Get the current tab URL to extract project name
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

  return (
    <div style={{ padding: "10px", width: "250px", fontFamily: "Arial" }}>
      <h2>GitLab Commit Stats</h2>
      
      {loading && <p>Loading data...</p>}
      
      {projectName && <p>Project: {projectName}</p>}
      
      {error ? (
        <div style={{ color: "red" }}>
          <p>{error}</p>
          <button onClick={fetchCommitData}>Retry</button>
        </div>
      ) : (
        <>
          <p>Total Commits: {totalCommits ?? "N/A"}</p>
          <div>
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
