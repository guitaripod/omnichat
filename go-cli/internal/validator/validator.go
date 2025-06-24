package validator

import (
	"fmt"
	"strings"

	"github.com/omnichat/validator/internal/client"
	"github.com/omnichat/validator/internal/types"
	"github.com/omnichat/validator/pkg/colors"
)

// Validator handles API validation
type Validator struct {
	client  *client.APIClient
	config  *types.Config
	results []types.TestResult
}

// NewValidator creates a new validator
func NewValidator(config *types.Config) *Validator {
	return &Validator{
		client:  client.NewAPIClient(config),
		config:  config,
		results: []types.TestResult{},
	}
}

// RunAllTests runs all API tests
func (v *Validator) RunAllTests() error {
	fmt.Printf("%s\n\n", colors.Header("🔍", fmt.Sprintf("Validating API at %s", v.config.BaseURL)))

	// Test public endpoints
	fmt.Println(colors.Header("📂", "Testing Public Endpoints:"))
	fmt.Println()
	
	v.testGetConfig()
	v.testGetOpenAPISpec()
	v.testGetAPIDocs()

	// Test authentication endpoints
	fmt.Println()
	fmt.Println(colors.Header("🔐", "Testing Authentication Endpoints:"))
	fmt.Println()
	
	v.testAppleAuth()

	// Test authenticated endpoints
	fmt.Println()
	fmt.Println(colors.Header("🔒", "Testing Authenticated Endpoints:"))
	fmt.Println()
	
	v.testGetModels()

	// Print results
	v.printResults()

	return nil
}

// testGetConfig tests the GET /api/config endpoint
func (v *Validator) testGetConfig() {
	result := v.client.TestEndpoint("GET /api/config", "GET", "/api/config", nil)
	v.results = append(v.results, result)
}

// testGetOpenAPISpec tests the GET /api/openapi.json endpoint
func (v *Validator) testGetOpenAPISpec() {
	result := v.client.TestEndpoint("GET /api/openapi.json", "GET", "/api/openapi.json", nil)
	v.results = append(v.results, result)
}

// testGetAPIDocs tests the GET /api/v1/docs endpoint
func (v *Validator) testGetAPIDocs() {
	result := v.client.TestEndpoint("GET /api/v1/docs", "GET", "/api/v1/docs", nil)
	v.results = append(v.results, result)
}

// testAppleAuth tests the POST /api/v1/auth/apple endpoint
func (v *Validator) testAppleAuth() {
	result := v.client.TestEndpoint(
		"POST /api/v1/auth/apple (no body)",
		"POST",
		"/api/v1/auth/apple",
		map[string]interface{}{},
	)
	v.results = append(v.results, result)
}

// testGetModels tests the GET /api/models endpoint
func (v *Validator) testGetModels() {
	result := v.client.TestEndpoint("GET /api/models", "GET", "/api/models", nil)
	
	// Validate response structure if successful
	if result.Success && result.Response != nil {
		if errors := v.validateModelsResponse(result.Response); len(errors) > 0 {
			result.Success = false
			result.Error = fmt.Sprintf("Response validation failed:\n%s", strings.Join(errors, "\n"))
		}
	}
	
	v.results = append(v.results, result)
}

// validateModelsResponse validates the structure of the models response
func (v *Validator) validateModelsResponse(data interface{}) []string {
	var errors []string
	
	// Convert to map
	respMap, ok := data.(map[string]interface{})
	if !ok {
		errors = append(errors, "Response is not an object")
		return errors
	}
	
	// Check for providers field
	providers, ok := respMap["providers"].(map[string]interface{})
	if !ok {
		errors = append(errors, "Missing or invalid 'providers' field")
		return errors
	}
	
	// Validate each provider
	validProviders := []string{"openai", "anthropic", "google", "ollama", "xai", "deepseek"}
	
	for provider, models := range providers {
		if !contains(validProviders, provider) {
			errors = append(errors, fmt.Sprintf("Unknown provider: %s", provider))
		}
		
		modelList, ok := models.([]interface{})
		if !ok {
			errors = append(errors, fmt.Sprintf("Provider %s models is not an array", provider))
			continue
		}
		
		// Validate each model
		for i, model := range modelList {
			if err := v.validateModel(model, provider, i); err != nil {
				errors = append(errors, err...)
			}
		}
	}
	
	return errors
}

// validateModel validates a single model
func (v *Validator) validateModel(model interface{}, provider string, index int) []string {
	var errors []string
	modelPath := fmt.Sprintf("providers.%s[%d]", provider, index)
	
	m, ok := model.(map[string]interface{})
	if !ok {
		errors = append(errors, fmt.Sprintf("%s is not an object", modelPath))
		return errors
	}
	
	// Check required fields
	requiredFields := map[string]string{
		"id":            "string",
		"name":          "string",
		"provider":      "string",
		"contextWindow": "number",
		"maxOutput":     "number",
	}
	
	for field, expectedType := range requiredFields {
		if val, exists := m[field]; !exists {
			errors = append(errors, fmt.Sprintf("%s.%s is missing", modelPath, field))
		} else if !validateType(val, expectedType) {
			errors = append(errors, fmt.Sprintf("%s.%s is not a %s", modelPath, field, expectedType))
		}
	}
	
	// Check provider matches
	if p, ok := m["provider"].(string); ok && p != provider {
		errors = append(errors, fmt.Sprintf("%s.provider doesn't match parent provider", modelPath))
	}
	
	// Check optional boolean fields
	booleanFields := []string{"supportsVision", "supportsTools", "supportsWebSearch", "supportsImageGeneration"}
	for _, field := range booleanFields {
		if val, exists := m[field]; exists {
			if _, ok := val.(bool); !ok {
				errors = append(errors, fmt.Sprintf("%s.%s is not a boolean", modelPath, field))
			}
		}
	}
	
	// Check optional string fields
	if val, exists := m["description"]; exists {
		if _, ok := val.(string); !ok {
			errors = append(errors, fmt.Sprintf("%s.description is not a string", modelPath))
		}
	}
	
	return errors
}

// printResults prints the test results
func (v *Validator) printResults() {
	fmt.Println()
	fmt.Println(colors.Header("📊", "Test Results:"))
	fmt.Println()
	
	passed := 0
	failed := 0
	
	for _, result := range v.results {
		status := colors.Success("✅")
		if !result.Success {
			status = colors.Error("❌")
			failed++
		} else {
			passed++
		}
		
		fmt.Printf("%s %s (%dms)\n", status, result.Name, result.Duration.Milliseconds())
		
		if !result.Success && result.Error != "" {
			fmt.Printf("   Error: %s\n", result.Error)
		}
		
		// Add contextual information for successful responses
		if result.Success {
			v.printSuccessDetails(result)
		} else {
			v.printErrorHints(result)
		}
	}
	
	fmt.Println()
	fmt.Printf("%s %s passed, %s failed\n\n", 
		colors.Header("📈", "Summary:"),
		colors.Success(fmt.Sprintf("%d", passed)),
		colors.Error(fmt.Sprintf("%d", failed)),
	)
	
	// Exit with error code if any tests failed
	if failed > 0 {
		fmt.Println(colors.Warning("Some tests failed. Check the errors above."))
	}
}

// printSuccessDetails prints additional details for successful tests
func (v *Validator) printSuccessDetails(result types.TestResult) {
	switch result.Name {
	case "GET /api/config":
		if m, ok := result.Response.(map[string]interface{}); ok {
			hasStripe := m["stripePublishableKey"] != nil && m["stripePublishableKey"] != ""
			hasClerk := m["clerkPublishableKey"] != nil && m["clerkPublishableKey"] != ""
			fmt.Printf("   Config: Stripe=%v, Clerk=%v\n", hasStripe, hasClerk)
		}
	case "GET /api/openapi.json":
		if m, ok := result.Response.(map[string]interface{}); ok {
			version := m["openapi"]
			paths := 0
			if p, ok := m["paths"].(map[string]interface{}); ok {
				paths = len(p)
			}
			fmt.Printf("   OpenAPI Version: %v, Paths: %d\n", version, paths)
		}
	case "GET /api/models":
		if m, ok := result.Response.(map[string]interface{}); ok {
			if providers, ok := m["providers"].(map[string]interface{}); ok {
				totalModels := 0
				for _, models := range providers {
					if modelList, ok := models.([]interface{}); ok {
						totalModels += len(modelList)
					}
				}
				fmt.Printf("   Found %d providers with %d models\n", len(providers), totalModels)
			}
		}
	}
}

// printErrorHints prints helpful hints for failed tests
func (v *Validator) printErrorHints(result types.TestResult) {
	if strings.Contains(result.Name, "apple") && strings.Contains(result.Error, "400") {
		fmt.Printf("   💡 Expected: Requires %s\n", colors.Info(`{"idToken": "apple-jwt-token"}`))
	}
	if strings.Contains(result.Name, "models") && strings.Contains(result.Error, "500") {
		fmt.Printf("   💡 This endpoint requires authentication or dev mode setup\n")
	}
	if result.StatusCode == 401 {
		fmt.Printf("   💡 Tip: Use %s flag to provide authentication token\n", colors.Info("--token"))
	}
}

// Helper functions

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func validateType(val interface{}, expectedType string) bool {
	switch expectedType {
	case "string":
		_, ok := val.(string)
		return ok
	case "number":
		// JSON numbers can be float64
		_, ok := val.(float64)
		return ok
	case "boolean":
		_, ok := val.(bool)
		return ok
	default:
		return false
	}
}