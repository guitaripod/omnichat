package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
)

func main() {
	fmt.Println("🔍 Checking migration status...\n")

	// Get database ID from environment
	databaseID := os.Getenv("D1_DATABASE_ID")
	if databaseID == "" {
		fmt.Println("❌ D1_DATABASE_ID environment variable not set")
		fmt.Println("\nPlease set it with:")
		fmt.Println("  export D1_DATABASE_ID=your-database-id\n")
		os.Exit(1)
	}

	// Read all migration files
	migrationsDir := filepath.Join("..", "migrations")
	files, err := ioutil.ReadDir(migrationsDir)
	if err != nil {
		log.Fatalf("Error reading migrations directory: %v", err)
	}

	var migrationFiles []string
	for _, file := range files {
		if strings.HasSuffix(file.Name(), ".sql") {
			migrationFiles = append(migrationFiles, file.Name())
		}
	}
	sort.Strings(migrationFiles)

	fmt.Printf("Found %d migration files:\n", len(migrationFiles))
	for _, f := range migrationFiles {
		fmt.Printf("  - %s\n", f)
	}

	// Check which migrations have been applied
	cmd := exec.Command("wrangler", "d1", "migrations", "list", databaseID)
	output, err := cmd.Output()
	if err != nil {
		fmt.Printf("\n❌ Error checking migrations: %v\n", err)
		fmt.Println("\nMake sure you have:")
		fmt.Println("  1. Configured wrangler with your Cloudflare credentials")
		fmt.Println("  2. Created the omnichat-db database")
		os.Exit(1)
	}

	fmt.Println("\n📋 Applied migrations:")
	fmt.Println(string(output))

	// Parse applied migrations
	lines := strings.Split(string(output), "\n")
	var appliedMigrations []string
	for _, line := range lines {
		if strings.Contains(line, ".sql") {
			fields := strings.Fields(line)
			if len(fields) > 0 {
				appliedMigrations = append(appliedMigrations, fields[0])
			}
		}
	}

	// Find unapplied migrations
	var unappliedMigrations []string
	for _, file := range migrationFiles {
		found := false
		for _, applied := range appliedMigrations {
			if strings.Contains(applied, file) {
				found = true
				break
			}
		}
		if !found {
			unappliedMigrations = append(unappliedMigrations, file)
		}
	}

	if len(unappliedMigrations) > 0 {
		fmt.Println("\n⚠️  Unapplied migrations found:")
		for _, f := range unappliedMigrations {
			fmt.Printf("  - %s\n", f)
		}
		fmt.Println("\n❌ Please apply migrations before deploying:")
		fmt.Printf("   wrangler d1 migrations apply %s\n\n", databaseID)
		os.Exit(1)
	}

	fmt.Println("\n✅ All migrations are applied!")
}