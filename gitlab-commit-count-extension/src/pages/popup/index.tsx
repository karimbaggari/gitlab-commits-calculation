import { useEffect, useState } from "react";

const Popup = () => {
  const [totalCommits, setTotalCommits] = useState(null);
  const [authorStats, setAuthorStats] = useState({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCommitData = async () => {
    try {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:8000/commits");
        
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
    } catch (error) {
      console.error("Error fetching commit data:", error);
      setError(`Failed to fetch data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommitData();
  }, []);

  return (
    <div style={{ padding: "10px", width: "250px", fontFamily: "Arial" }}>
      <h2>GitLab Commit Stats</h2>
      
      {loading && <p>Loading data...</p>}
      
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
