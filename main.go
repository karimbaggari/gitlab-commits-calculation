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

func getCommitsByAuthor(author string) ([]Commit, error) {
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
		url := fmt.Sprintf("%s/projects/%d/repository/commits?all=true&author=%s&per_page=100&page=%d",
			api, projectID, author, page)

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
			break
		}

		allCommits = append(allCommits, commits...)

		nextPage := resp.Header.Get("X-Next-Page")
		if nextPage == "" {
			break
		}
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

func main() {
	if err := loadEnv(); err != nil {
		fmt.Println("Warning:", err)
	}
	
	author := "karim"
	commits, err := getCommitsByAuthor(author)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}

	fmt.Printf("Fetched %d commits from %s\n", len(commits), author)
	if len(commits) > 0 {
		displayCount := min(5, len(commits))
		for _, commit := range commits[:displayCount] {
			fmt.Printf("[%s] %s - %s\n", commit.ShortID, commit.CreatedAt, commit.Title)
		}
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
