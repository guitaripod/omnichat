package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// Model represents a generic AI model
type Model struct {
	ID        string `json:"id"`
	Object    string `json:"object"`
	Created   int64  `json:"created"`
	OwnedBy   string `json:"owned_by"`
	Provider  string `json:"provider"`
}

// ModelsResponse represents the response from various API endpoints
type ModelsResponse struct {
	Data   []Model `json:"data"`
	Object string  `json:"object"`
}

// GoogleModelsResponse represents the response from Google's API
type GoogleModelsResponse struct {
	Models []GoogleModel `json:"models"`
}

// GoogleModel represents a model from Google's API
type GoogleModel struct {
	Name                  string   `json:"name"`
	BaseModelID           string   `json:"baseModelId"`
	DisplayName           string   `json:"displayName"`
	Description           string   `json:"description"`
	SupportedActions      []string `json:"supportedGenerationMethods"`
}

// ProviderModels holds all models organized by provider
type ProviderModels struct {
	XAI      []Model `json:"xai"`
	OpenAI   []Model `json:"openai"`
	Anthropic []Model `json:"anthropic"`
	Google   []Model `json:"google"`
	UpdatedAt string  `json:"updatedAt"`
}

func fetchXAIModels(apiKey string) ([]Model, error) {
	url := "https://api.x.ai/v1/models"
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	req.Header.Set("Authorization", "Bearer "+apiKey)
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("XAI API error: %d - %s", resp.StatusCode, string(body))
	}
	
	var modelsResp ModelsResponse
	if err := json.NewDecoder(resp.Body).Decode(&modelsResp); err != nil {
		return nil, err
	}
	
	// Add provider field
	for i := range modelsResp.Data {
		modelsResp.Data[i].Provider = "xai"
	}
	
	return modelsResp.Data, nil
}

func fetchOpenAIModels(apiKey string) ([]Model, error) {
	url := "https://api.openai.com/v1/models"
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	req.Header.Set("Authorization", "Bearer "+apiKey)
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OpenAI API error: %d - %s", resp.StatusCode, string(body))
	}
	
	var modelsResp ModelsResponse
	if err := json.NewDecoder(resp.Body).Decode(&modelsResp); err != nil {
		return nil, err
	}
	
	// Add provider field
	for i := range modelsResp.Data {
		modelsResp.Data[i].Provider = "openai"
	}
	
	return modelsResp.Data, nil
}

// AnthropicModelsResponse represents the response from Anthropic's API
type AnthropicModelsResponse struct {
	Data []AnthropicModel `json:"data"`
}

// AnthropicModel represents a model from Anthropic's API
type AnthropicModel struct {
	ID          string `json:"id"`
	DisplayName string `json:"display_name"`
	CreatedAt   string `json:"created_at"`
}

func fetchAnthropicModels(apiKey string) ([]Model, error) {
	url := "https://api.anthropic.com/v1/models"
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Anthropic API error: %d - %s", resp.StatusCode, string(body))
	}
	
	var anthropicResp AnthropicModelsResponse
	if err := json.NewDecoder(resp.Body).Decode(&anthropicResp); err != nil {
		return nil, err
	}
	
	// Convert Anthropic models to our standard format
	var models []Model
	for _, am := range anthropicResp.Data {
		// Parse created_at timestamp
		createdAt, _ := time.Parse(time.RFC3339, am.CreatedAt)
		
		model := Model{
			ID:       am.ID,
			Object:   "model",
			Created:  createdAt.Unix(),
			OwnedBy:  "anthropic",
			Provider: "anthropic",
		}
		models = append(models, model)
	}
	
	return models, nil
}

func fetchGoogleModels(apiKey string) ([]Model, error) {
	url := "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Google API error: %d - %s", resp.StatusCode, string(body))
	}
	
	var googleResp GoogleModelsResponse
	if err := json.NewDecoder(resp.Body).Decode(&googleResp); err != nil {
		return nil, err
	}
	
	// Convert Google models to our standard format
	var models []Model
	for _, gm := range googleResp.Models {
		// Extract model ID from name (e.g., "models/gemini-1.5-flash" -> "gemini-1.5-flash")
		modelID := gm.Name
		if len(modelID) > 7 && modelID[:7] == "models/" {
			modelID = modelID[7:]
		}
		
		model := Model{
			ID:       modelID,
			Object:   "model",
			Created:  time.Now().Unix(), // Google doesn't provide creation time
			OwnedBy:  "google",
			Provider: "google",
		}
		
		// Only include models that support content generation
		for _, action := range gm.SupportedActions {
			if action == "generateContent" {
				models = append(models, model)
				break
			}
		}
	}
	
	return models, nil
}

func main() {
	// Check for API keys from environment variables
	xaiKey := os.Getenv("XAI_API_KEY")
	openaiKey := os.Getenv("OPENAI_API_KEY")
	anthropicKey := os.Getenv("ANTHROPIC_API_KEY")
	googleKey := os.Getenv("GOOGLE_API_KEY")
	
	allModels := ProviderModels{
		UpdatedAt: time.Now().UTC().Format(time.RFC3339),
	}
	
	// Fetch XAI models
	if xaiKey != "" {
		fmt.Println("Fetching XAI models...")
		models, err := fetchXAIModels(xaiKey)
		if err != nil {
			fmt.Printf("Error fetching XAI models: %v\n", err)
		} else {
			allModels.XAI = models
			fmt.Printf("Found %d XAI models\n", len(models))
		}
	} else {
		fmt.Println("XAI_API_KEY not set, skipping XAI models")
	}
	
	// Fetch OpenAI models
	if openaiKey != "" {
		fmt.Println("Fetching OpenAI models...")
		models, err := fetchOpenAIModels(openaiKey)
		if err != nil {
			fmt.Printf("Error fetching OpenAI models: %v\n", err)
		} else {
			allModels.OpenAI = models
			fmt.Printf("Found %d OpenAI models\n", len(models))
		}
	} else {
		fmt.Println("OPENAI_API_KEY not set, skipping OpenAI models")
	}
	
	// Fetch Anthropic models
	if anthropicKey != "" {
		fmt.Println("Fetching Anthropic models...")
		models, err := fetchAnthropicModels(anthropicKey)
		if err != nil {
			fmt.Printf("Error fetching Anthropic models: %v\n", err)
		} else {
			allModels.Anthropic = models
			fmt.Printf("Found %d Anthropic models\n", len(models))
		}
	} else {
		fmt.Println("ANTHROPIC_API_KEY not set, skipping Anthropic models")
	}
	
	// Fetch Google models
	if googleKey != "" {
		fmt.Println("Fetching Google models...")
		models, err := fetchGoogleModels(googleKey)
		if err != nil {
			fmt.Printf("Error fetching Google models: %v\n", err)
		} else {
			allModels.Google = models
			fmt.Printf("Found %d Google models\n", len(models))
		}
	} else {
		fmt.Println("GOOGLE_API_KEY not set, skipping Google models")
	}
	
	// Write to JSON file
	outputFile := "available-models.json"
	file, err := os.Create(outputFile)
	if err != nil {
		fmt.Printf("Error creating output file: %v\n", err)
		os.Exit(1)
	}
	defer file.Close()
	
	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(allModels); err != nil {
		fmt.Printf("Error encoding JSON: %v\n", err)
		os.Exit(1)
	}
	
	fmt.Printf("\nModels saved to %s\n", outputFile)
	
	// Print summary
	totalModels := len(allModels.XAI) + len(allModels.OpenAI) + len(allModels.Anthropic) + len(allModels.Google)
	fmt.Printf("\nTotal models fetched: %d\n", totalModels)
}