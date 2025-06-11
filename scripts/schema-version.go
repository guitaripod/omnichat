package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"strings"
	"time"
)

type SchemaVersion struct {
	Version   int    `json:"version"`
	Name      string `json:"name"`
	AppliedAt int64  `json:"applied_at"`
}

type WranglerResult struct {
	Results []SchemaVersion `json:"results"`
	Success bool            `json:"success"`
}

func main() {
	if len(os.Args) < 2 {
		showUsage()
		return
	}

	command := os.Args[1]
	switch command {
	case "check":
		checkVersion()
	case "list":
		listVersions()
	case "apply":
		if len(os.Args) < 4 {
			fmt.Println("Usage: go run schema-version.go apply <version> <filename>")
			os.Exit(1)
		}
		applyVersion(os.Args[2], os.Args[3])
	default:
		showUsage()
	}
}

func showUsage() {
	fmt.Println("Schema Version Manager")
	fmt.Println()
	fmt.Println("Usage:")
	fmt.Println("  go run schema-version.go check      - Show current schema version")
	fmt.Println("  go run schema-version.go list       - List all applied migrations")
	fmt.Println("  go run schema-version.go apply <version> <filename> - Record a migration as applied")
	fmt.Println()
	fmt.Println("Example:")
	fmt.Println("  go run schema-version.go apply 5 0005_add_new_feature.sql")
}

func checkVersion() {
	cmd := exec.Command("wrangler", "d1", "execute", "omnichat-db", "--remote", 
		"--command", "SELECT MAX(version) as version FROM schema_version")
	
	output, err := cmd.Output()
	if err != nil {
		log.Fatalf("Error checking version: %v", err)
	}

	// Extract JSON from output
	jsonStr := extractJSON(string(output))
	if jsonStr == "" {
		fmt.Println("❌ No schema version found. Database might be uninitialized.")
		return
	}

	var results []struct {
		Results []struct {
			Version *int `json:"version"`
		} `json:"results"`
	}

	if err := json.Unmarshal([]byte(jsonStr), &results); err != nil {
		log.Fatalf("Error parsing JSON: %v", err)
	}

	if len(results) > 0 && len(results[0].Results) > 0 && results[0].Results[0].Version != nil {
		fmt.Printf("📌 Current schema version: %d\n", *results[0].Results[0].Version)
	} else {
		fmt.Println("❌ No schema version found")
	}
}

func listVersions() {
	cmd := exec.Command("wrangler", "d1", "execute", "omnichat-db", "--remote",
		"--command", "SELECT version, name, applied_at FROM schema_version ORDER BY version")
	
	output, err := cmd.Output()
	if err != nil {
		log.Fatalf("Error listing versions: %v", err)
	}

	jsonStr := extractJSON(string(output))
	if jsonStr == "" {
		fmt.Println("❌ No migrations found")
		return
	}

	var results []struct {
		Results []SchemaVersion `json:"results"`
	}

	if err := json.Unmarshal([]byte(jsonStr), &results); err != nil {
		log.Fatalf("Error parsing JSON: %v", err)
	}

	fmt.Println("📋 Applied Migrations:")
	fmt.Println()
	
	if len(results) > 0 && len(results[0].Results) > 0 {
		for _, v := range results[0].Results {
			appliedTime := time.Unix(v.AppliedAt, 0).Format("2006-01-02 15:04:05")
			fmt.Printf("  v%d: %-40s (applied: %s)\n", v.Version, v.Name, appliedTime)
		}
	} else {
		fmt.Println("  No migrations applied yet")
	}
}

func applyVersion(version, filename string) {
	query := fmt.Sprintf("INSERT INTO schema_version (version, name) VALUES (%s, '%s')", version, filename)
	
	cmd := exec.Command("wrangler", "d1", "execute", "omnichat-db", "--remote", "--command", query)
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("❌ Error applying version: %v\n", err)
		fmt.Printf("Output: %s\n", string(output))
		os.Exit(1)
	}

	fmt.Printf("✅ Recorded migration v%s: %s\n", version, filename)
}

func extractJSON(output string) string {
	// Find the JSON array in the output
	start := strings.Index(output, "[")
	if start == -1 {
		return ""
	}
	
	// Find the matching closing bracket
	bracketCount := 0
	end := start
	for i := start; i < len(output); i++ {
		if output[i] == '[' {
			bracketCount++
		} else if output[i] == ']' {
			bracketCount--
			if bracketCount == 0 {
				end = i + 1
				break
			}
		}
	}
	
	if end > start {
		return output[start:end]
	}
	return ""
}