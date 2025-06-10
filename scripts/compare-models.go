package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"reflect"
)

// Model represents a generic AI model
type Model struct {
	ID       string `json:"id"`
	Object   string `json:"object"`
	Created  int64  `json:"created,omitempty"` // Omit if empty
	OwnedBy  string `json:"owned_by"`
	Provider string `json:"provider"`
}

// ProviderModels holds all models organized by provider
type ProviderModels struct {
	XAI       []Model `json:"xai"`
	OpenAI    []Model `json:"openai"`
	Anthropic []Model `json:"anthropic"`
	Google    []Model `json:"google"`
	DeepSeek  []Model `json:"deepseek"`
	UpdatedAt string  `json:"updatedAt,omitempty"` // Omit when comparing
}

// NormalizedProviderModels is the same as ProviderModels but without UpdatedAt
type NormalizedProviderModels struct {
	XAI       []Model `json:"xai"`
	OpenAI    []Model `json:"openai"`
	Anthropic []Model `json:"anthropic"`
	Google    []Model `json:"google"`
	DeepSeek  []Model `json:"deepseek"`
}

func normalizeModels(models []Model) []Model {
	normalized := make([]Model, len(models))
	for i, model := range models {
		// Remove created timestamp for comparison
		normalized[i] = Model{
			ID:       model.ID,
			Object:   model.Object,
			OwnedBy:  model.OwnedBy,
			Provider: model.Provider,
		}
	}
	return normalized
}

func loadAndNormalize(filename string) (*NormalizedProviderModels, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}

	var models ProviderModels
	if err := json.Unmarshal(data, &models); err != nil {
		return nil, err
	}

	// Normalize by removing timestamps
	normalized := &NormalizedProviderModels{
		XAI:      normalizeModels(models.XAI),
		OpenAI:   normalizeModels(models.OpenAI),
		Anthropic: normalizeModels(models.Anthropic),
		Google:   normalizeModels(models.Google),
		DeepSeek: normalizeModels(models.DeepSeek),
	}

	return normalized, nil
}

func main() {
	if len(os.Args) != 3 {
		fmt.Fprintf(os.Stderr, "Usage: %s <file1> <file2>\n", os.Args[0])
		os.Exit(1)
	}

	file1 := os.Args[1]
	file2 := os.Args[2]

	// Load and normalize both files
	models1, err := loadAndNormalize(file1)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error loading %s: %v\n", file1, err)
		os.Exit(1)
	}

	models2, err := loadAndNormalize(file2)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error loading %s: %v\n", file2, err)
		os.Exit(1)
	}

	// Compare normalized models
	if reflect.DeepEqual(models1, models2) {
		fmt.Println("Models are identical (ignoring timestamps)")
		os.Exit(0)
	} else {
		fmt.Println("Models have changed")
		os.Exit(1)
	}
}