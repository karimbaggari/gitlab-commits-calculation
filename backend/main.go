package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"errors"
	"github.com/joho/godotenv"
)

type Commit struct {
	ID        string `json:"id"`
	ShortID   string `json:"short_id"`
	Title     string `json:"title"`
	Author    string `json:"author_name"`
	CreatedAt string `json:"created_at"`
	WebURL    string `json:"web_url"`
}

func getGitLabAPI() (string, error) {
	api := os.Getenv("GITLAB_API")
	if api == "" {
		return "", errors.New("GITLAB_API environment variable not set")
	}
	return api, nil
}

func getProjectID() (int, error) {
	idStr := os.Getenv("GITLAB_PROJECT_ID")
	if idStr == "" {
		return 0, errors.New("GITLAB_PROJECT_ID environment variable not set")
	}
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return 0, fmt.Errorf("invalid GITLAB_PROJECT_ID: %v", err)
	}
	return id, nil
}

func getGitLabToken() (string, error) {
	token := os.Getenv("GITLAB_TOKEN")
	if token == "" {
		return "", errors.New("GITLAB_TOKEN environment variable not set")
	}
	return token, nil
}

func getCommits() ([]Commit, error) {
	var allCommits []Commit
	page := 1

	api, err := getGitLabAPI()
	if err != nil {
		return nil, err
	}

	projectID, err := getProjectID()
	if err != nil {
		return nil, err
	}

	token, err := getGitLabToken()
	if err != nil {
		return nil, err
	}

	for {
		url := fmt.Sprintf("%s/projects/%d/repository/commits?per_page=100&page=%d&all=true",
			api, projectID, page)

		req, _ := http.NewRequest("GET", url, nil)
		req.Header.Set("PRIVATE-TOKEN", token)

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("GitLab API error: %s", resp.Status)
		}

		var commits []Commit
		body, _ := io.ReadAll(resp.Body)
		if err := json.Unmarshal(body, &commits); err != nil {
			return nil, err
		}

		if len(commits) == 0 {
			// No more commits to fetch, break the loop
			break
		}

		// Append fetched commits to the allCommits slice
		allCommits = append(allCommits, commits...)

		// Check for the next page of commits
		nextPage := resp.Header.Get("X-Next-Page")
		if nextPage == "" {
			break
		}

		// Update page number to fetch next set of commits
		page, _ = strconv.Atoi(nextPage)
	}

	return allCommits, nil
}

func loadEnv() error {
	err := godotenv.Load()
	if err != nil {
		return fmt.Errorf("error loading .env file: %v", err)
	}
	return nil
}

func countCommitsByAuthor(commits []Commit) map[string]int {
	authorCommitCount := make(map[string]int)

	for _, commit := range commits {
		authorCommitCount[commit.Author]++
	}

	return authorCommitCount
}

func handleCommits(w http.ResponseWriter, r *http.Request) {
	// Add CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "*")

	// Handle preflight OPTIONS request
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	commits, err := getCommits()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error: %v", err), http.StatusInternalServerError)
		return
	}

	authorCommitCount := countCommitsByAuthor(commits)
	
	response := struct {
		TotalCommits      int            `json:"total_commits"`
		AuthorCommitCount map[string]int `json:"author_commit_count"`
	}{
		TotalCommits:      len(commits),
		AuthorCommitCount: authorCommitCount,
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func main() {
	if err := loadEnv(); err != nil {
		fmt.Println("Warning:", err)
	}

	http.HandleFunc("/commits", handleCommits)
	
	fmt.Println("Server starting on localhost:8000...")
	if err := http.ListenAndServe(":8000", nil); err != nil {
		fmt.Printf("Server error: %v\n", err)
	}
}
