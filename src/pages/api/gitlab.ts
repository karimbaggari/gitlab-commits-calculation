import { Commit } from "@/lib/helpers";

interface CommitResponse {
  total_commits: number;
  author_commit_count: Record<string, number>;
  commits?: Commit[];
}


export const fetchGitLabCommits = async (projectName: string): Promise<CommitResponse> => {
  const response = await fetch(
    `https://extension-backend-production-1c13.up.railway.app/commits?projectName=${encodeURIComponent(projectName)}`
  );
  
  if (!response.ok) {
    throw new Error(`Server responded with status: ${response.status}`);
  }

  return await response.json();
}; 

