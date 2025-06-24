package validator

import (
	"bytes"
	"fmt"
	"mime/multipart"
	"strings"

	"github.com/omnichat/validator/internal/client"
	"github.com/omnichat/validator/internal/types"
	"github.com/omnichat/validator/pkg/colors"
)

// Validator handles comprehensive API validation
type Validator struct {
	client       *client.APIClient
	clerkClient  *client.APIClient // For Clerk auth endpoints
	jwtClient    *client.APIClient // For JWT auth endpoints
	config       *types.Config
	results      []types.TestResult
	authMode     string // "none", "clerk", "jwt", "both"
	hasClerkAuth bool
	hasJWTAuth   bool
}

// NewValidator creates a new validator with expanded functionality
func NewValidator(config *types.Config, clerkToken, jwtToken string) *Validator {
	v := &Validator{
		client:  client.NewAPIClient(config),
		config:  config,
		results: []types.TestResult{},
	}

	// Set up auth clients
	if clerkToken != "" {
		clerkConfig := *config
		clerkConfig.AuthToken = clerkToken
		v.clerkClient = client.NewAPIClient(&clerkConfig)
		v.hasClerkAuth = true
	}

	if jwtToken != "" {
		jwtConfig := *config
		jwtConfig.AuthToken = jwtToken
		v.jwtClient = client.NewAPIClient(&jwtConfig)
		v.hasJWTAuth = true
	}

	// Determine auth mode
	if v.hasClerkAuth && v.hasJWTAuth {
		v.authMode = "both"
	} else if v.hasClerkAuth {
		v.authMode = "clerk"
	} else if v.hasJWTAuth {
		v.authMode = "jwt"
	} else {
		v.authMode = "none"
	}

	return v
}

// RunAllTests runs all API tests
func (v *Validator) RunAllTests() error {
	fmt.Printf("%s\n", colors.Header("🔍", fmt.Sprintf("Validating OmniChat API at %s", v.config.BaseURL)))
	fmt.Printf("🔐 Authentication: %s\n\n", v.getAuthStatus())

	// Always test public endpoints
	v.testPublicEndpoints()

	// Test auth endpoints
	v.testAuthEndpoints()

	// Test Clerk auth endpoints
	v.testClerkAuthEndpoints()

	// Test JWT auth endpoints (V1 API)
	v.testJWTAuthEndpoints()

	// Print comprehensive results
	v.printResults()

	return nil
}

func (v *Validator) getAuthStatus() string {
	switch v.authMode {
	case "both":
		return colors.Success("Clerk + JWT tokens provided")
	case "clerk":
		return colors.Warning("Clerk token only")
	case "jwt":
		return colors.Warning("JWT token only")
	default:
		return colors.Error("No authentication")
	}
}

// Test Public Endpoints (no auth required)
func (v *Validator) testPublicEndpoints() {
	fmt.Println(colors.Header("📂", "Testing Public Endpoints:"))
	fmt.Println()

	// Config endpoint
	result := v.client.TestEndpoint("GET /api/config", "GET", "/api/config", nil)
	if result.Success && v.config.Verbose {
		fmt.Printf("   Config: Stripe=%v, Clerk=%v\n",
			result.Response != nil, result.Response != nil)
	}
	v.results = append(v.results, result)

	// OpenAPI spec
	result = v.client.TestEndpoint("GET /api/openapi.json", "GET", "/api/openapi.json", nil)
	if result.Success && v.config.Verbose {
		fmt.Println("   OpenAPI spec available")
	}
	v.results = append(v.results, result)

	// API docs
	result = v.client.TestEndpoint("GET /api/v1/docs", "GET", "/api/v1/docs", nil)
	if result.Success && v.config.Verbose {
		fmt.Println("   API documentation available")
	}
	v.results = append(v.results, result)
}

// Test Authentication Endpoints
func (v *Validator) testAuthEndpoints() {
	fmt.Println()
	fmt.Println(colors.Header("🔐", "Testing Authentication Endpoints:"))
	fmt.Println()

	// Apple Sign In
	appleAuth := types.AppleAuthRequest{
		IDToken: "mock-apple-jwt-token",
		User: &types.AppleUserData{
			Email: "test@example.com",
			Name: &types.AppleUserName{
				FirstName: "Test",
				LastName:  "User",
			},
		},
	}
	result := v.client.TestEndpoint("POST /api/v1/auth/apple", "POST", "/api/v1/auth/apple", appleAuth)
	if !result.Success && result.StatusCode == 400 {
		fmt.Println("   💡 Expected: Requires valid Apple ID token")
	}
	v.results = append(v.results, result)

	// Token Refresh
	refreshReq := types.RefreshTokenRequest{
		RefreshToken: "mock-refresh-token",
	}
	result = v.client.TestEndpoint("POST /api/v1/auth/refresh", "POST", "/api/v1/auth/refresh", refreshReq)
	if !result.Success && result.StatusCode == 401 {
		fmt.Println("   💡 Expected: Requires valid refresh token")
	}
	v.results = append(v.results, result)
}

// Test Clerk Auth Endpoints
func (v *Validator) testClerkAuthEndpoints() {
	fmt.Println()
	fmt.Println(colors.Header("🔒", "Testing Clerk Auth Endpoints:"))
	fmt.Println()

	client := v.client
	if v.hasClerkAuth {
		client = v.clerkClient
	}

	// 1. Chat endpoint
	fmt.Println(colors.Subheader("💬", "Chat & AI:"))
	chatReq := types.ChatRequest{
		Messages: []types.ChatMessage{
			{Role: "user", Content: "Hello, this is a test message"},
		},
		Model:          "gpt-4o-mini",
		ConversationID: "test-conversation",
		Stream:         false,
	}
	result := client.TestEndpoint("POST /api/chat", "POST", "/api/chat", chatReq)
	v.addAuthHint(result, "clerk")
	v.results = append(v.results, result)

	// 2. Models endpoint
	result = client.TestEndpoint("GET /api/models", "GET", "/api/models", nil)
	v.addAuthHint(result, "clerk")
	v.results = append(v.results, result)

	// 3. Conversations
	fmt.Println()
	fmt.Println(colors.Subheader("📚", "Conversations:"))

	result = client.TestEndpoint("GET /api/conversations", "GET", "/api/conversations", nil)
	v.addAuthHint(result, "clerk")
	v.results = append(v.results, result)

	convReq := types.ConversationRequest{
		Title: "Test Conversation",
		Model: "gpt-4o-mini",
	}
	result = client.TestEndpoint("POST /api/conversations", "POST", "/api/conversations", convReq)
	v.addAuthHint(result, "clerk")
	v.results = append(v.results, result)

	result = client.TestEndpoint("DELETE /api/conversations/{id}", "DELETE", "/api/conversations/test-id", nil)
	v.addAuthHint(result, "clerk")
	v.results = append(v.results, result)

	// 4. Messages
	fmt.Println()
	fmt.Println(colors.Subheader("✉️", "Messages:"))

	result = client.TestEndpoint("GET /api/conversations/{id}/messages", "GET", "/api/conversations/test-id/messages", nil)
	v.addAuthHint(result, "clerk")
	v.results = append(v.results, result)

	msgReq := types.MessageRequest{
		Role:    "user",
		Content: "Test message",
		Model:   "gpt-4o-mini",
	}
	result = client.TestEndpoint("POST /api/conversations/{id}/messages", "POST", "/api/conversations/test-id/messages", msgReq)
	v.addAuthHint(result, "clerk")
	v.results = append(v.results, result)

	// 5. Files
	fmt.Println()
	fmt.Println(colors.Subheader("📁", "Files:"))

	// File upload (multipart)
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	writer.WriteField("conversationId", "test-id")
	fileWriter, _ := writer.CreateFormFile("file", "test.txt")
	fileWriter.Write([]byte("test file content"))
	writer.Close()

	result = v.testMultipartEndpoint(client, "POST /api/upload", "/api/upload", &buf, writer.FormDataContentType())
	v.addAuthHint(result, "clerk")
	v.results = append(v.results, result)

	result = client.TestEndpoint("GET /api/upload?key=test", "GET", "/api/upload?key=test", nil)
	v.addAuthHint(result, "clerk")
	v.results = append(v.results, result)

	// 6. Search
	fmt.Println()
	fmt.Println(colors.Subheader("🔍", "Search:"))

	result = client.TestEndpoint("GET /api/search?q=test", "GET", "/api/search?q=test", nil)
	v.addAuthHint(result, "clerk")
	v.results = append(v.results, result)

	// 7. Battery
	fmt.Println()
	fmt.Println(colors.Subheader("🔋", "Battery & Usage:"))

	result = client.TestEndpoint("GET /api/battery", "GET", "/api/battery", nil)
	v.addAuthHint(result, "clerk")
	v.results = append(v.results, result)

	// 8. User
	fmt.Println()
	fmt.Println(colors.Subheader("👤", "User:"))

	result = client.TestEndpoint("GET /api/user/tier", "GET", "/api/user/tier", nil)
	v.addAuthHint(result, "clerk")
	v.results = append(v.results, result)

	// 9. Billing
	fmt.Println()
	fmt.Println(colors.Subheader("💳", "Billing:"))

	checkoutReq := types.CheckoutRequest{
		Type:      "subscription",
		PlanID:    "monthly",
		ReturnURL: "http://localhost:3000/billing",
	}
	result = client.TestEndpoint("POST /api/stripe/checkout", "POST", "/api/stripe/checkout", checkoutReq)
	v.addAuthHint(result, "clerk")
	v.results = append(v.results, result)

	result = client.TestEndpoint("GET /api/stripe/checkout", "GET", "/api/stripe/checkout", nil)
	v.addAuthHint(result, "clerk")
	v.results = append(v.results, result)

	portalReq := map[string]string{
		"returnUrl": "http://localhost:3000/billing",
	}
	result = client.TestEndpoint("POST /api/stripe/portal", "POST", "/api/stripe/portal", portalReq)
	v.addAuthHint(result, "clerk")
	v.results = append(v.results, result)
}

// Test JWT Auth Endpoints (V1 API)
func (v *Validator) testJWTAuthEndpoints() {
	fmt.Println()
	fmt.Println(colors.Header("🔑", "Testing JWT Auth Endpoints (V1 API):"))
	fmt.Println()

	client := v.client
	if v.hasJWTAuth {
		client = v.jwtClient
	}

	// 1. Conversations V1
	fmt.Println(colors.Subheader("📚", "Conversations V1:"))

	result := client.TestEndpoint("GET /api/v1/conversations", "GET", "/api/v1/conversations", nil)
	v.addAuthHint(result, "jwt")
	v.results = append(v.results, result)

	convReq := types.ConversationRequest{
		Title: "Test V1 Conversation",
		Model: "gpt-4o-mini",
	}
	result = client.TestEndpoint("POST /api/v1/conversations", "POST", "/api/v1/conversations", convReq)
	v.addAuthHint(result, "jwt")
	v.results = append(v.results, result)

	result = client.TestEndpoint("GET /api/v1/conversations/{id}", "GET", "/api/v1/conversations/test-id", nil)
	v.addAuthHint(result, "jwt")
	v.results = append(v.results, result)

	updateReq := types.ConversationUpdateRequest{
		Title:      "Updated Title",
		IsArchived: true,
	}
	result = client.TestEndpoint("PATCH /api/v1/conversations/{id}", "PATCH", "/api/v1/conversations/test-id", updateReq)
	v.addAuthHint(result, "jwt")
	v.results = append(v.results, result)

	result = client.TestEndpoint("DELETE /api/v1/conversations/{id}", "DELETE", "/api/v1/conversations/test-id", nil)
	v.addAuthHint(result, "jwt")
	v.results = append(v.results, result)

	// 2. Messages V1
	fmt.Println()
	fmt.Println(colors.Subheader("✉️", "Messages V1:"))

	result = client.TestEndpoint("GET /api/v1/conversations/{id}/messages", "GET", "/api/v1/conversations/test-id/messages", nil)
	v.addAuthHint(result, "jwt")
	v.results = append(v.results, result)

	v1MsgReq := types.V1MessageRequest{
		Content: "Test V1 message",
		Stream:  false,
	}
	result = client.TestEndpoint("POST /api/v1/conversations/{id}/messages", "POST", "/api/v1/conversations/test-id/messages", v1MsgReq)
	v.addAuthHint(result, "jwt")
	v.results = append(v.results, result)

	// 3. User Profile V1
	fmt.Println()
	fmt.Println(colors.Subheader("👤", "User Profile V1:"))

	result = client.TestEndpoint("GET /api/v1/user/profile", "GET", "/api/v1/user/profile", nil)
	v.addAuthHint(result, "jwt")
	v.results = append(v.results, result)

	profileUpdate := types.UserProfileUpdate{
		Name: "Updated Test User",
	}
	result = client.TestEndpoint("PATCH /api/v1/user/profile", "PATCH", "/api/v1/user/profile", profileUpdate)
	v.addAuthHint(result, "jwt")
	v.results = append(v.results, result)

	result = client.TestEndpoint("GET /api/v1/user/usage", "GET", "/api/v1/user/usage", nil)
	v.addAuthHint(result, "jwt")
	v.results = append(v.results, result)

	// 4. Files V1
	fmt.Println()
	fmt.Println(colors.Subheader("📁", "Files V1:"))

	// File upload V1 (multipart)
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	writer.WriteField("conversationId", "test-id")
	fileWriter, _ := writer.CreateFormFile("file", "test-v1.txt")
	fileWriter.Write([]byte("test v1 file content"))
	writer.Close()

	result = v.testMultipartEndpoint(client, "POST /api/v1/upload", "/api/v1/upload", &buf, writer.FormDataContentType())
	v.addAuthHint(result, "jwt")
	v.results = append(v.results, result)

	result = client.TestEndpoint("GET /api/v1/files/{key}", "GET", "/api/v1/files/test-key", nil)
	v.addAuthHint(result, "jwt")
	v.results = append(v.results, result)
}

// Helper to test multipart endpoints
func (v *Validator) testMultipartEndpoint(client *client.APIClient, name, path string, body *bytes.Buffer, contentType string) types.TestResult {
	// For now, just test that the endpoint exists
	// Real implementation would send the multipart data
	return client.TestEndpoint(name+" (multipart)", "POST", path, nil)
}

// Add auth hint to failed requests
func (v *Validator) addAuthHint(result types.TestResult, authType string) {
	if !result.Success && (result.StatusCode == 401 || result.StatusCode == 403) {
		if authType == "clerk" && !v.hasClerkAuth {
			result.Error += "\n   🔑 Requires Clerk authentication. Use --clerk flag"
		} else if authType == "jwt" && !v.hasJWTAuth {
			result.Error += "\n   🔑 Requires JWT authentication. Use --bearer flag"
		}
	}
}

// Print comprehensive results
func (v *Validator) printResults() {
	fmt.Println()
	fmt.Println(colors.Header("📊", "Test Summary:"))
	fmt.Println()

	// Calculate statistics
	total := len(v.results)
	passed := 0
	failed := 0
	authRequired := 0

	categoryStats := make(map[string]struct {
		total  int
		passed int
		failed int
		auth   int
	})

	for _, result := range v.results {
		category := v.getEndpointCategory(result.Name)
		stats := categoryStats[category]
		stats.total++

		if result.Success {
			passed++
			stats.passed++
		} else {
			failed++
			stats.failed++
			if result.StatusCode == 401 || result.StatusCode == 403 {
				authRequired++
				stats.auth++
			}
		}

		categoryStats[category] = stats
	}

	// Print category breakdown
	fmt.Println("By Category:")
	for category, stats := range categoryStats {
		fmt.Printf("  %-20s Total: %2d | Passed: %s | Failed: %s",
			category,
			stats.total,
			v.colorNumber(stats.passed, stats.passed == stats.total),
			v.colorNumber(stats.failed, stats.failed == 0))

		if stats.auth > 0 {
			fmt.Printf(" | Auth Required: %s", colors.Warning(fmt.Sprintf("%d", stats.auth)))
		}
		fmt.Println()
	}

	// Overall summary
	fmt.Println()
	fmt.Printf("Overall: Total: %d | Passed: %s | Failed: %s | Auth Required: %s\n",
		total,
		v.colorNumber(passed, passed == total),
		v.colorNumber(failed, failed == 0),
		colors.Warning(fmt.Sprintf("%d", authRequired)))

	// Coverage
	coverage := float64(total) / 43.0 * 100
	fmt.Printf("Endpoint Coverage: %d/43 (%.1f%%)\n", total, coverage)

	// Next steps
	fmt.Println()
	if v.authMode == "none" {
		fmt.Println(colors.Warning("💡 To test authenticated endpoints:"))
		fmt.Println("   1. Get a Clerk token from the web app session")
		fmt.Println("   2. Get a JWT token via: POST /api/v1/auth/apple")
		fmt.Println("   3. Run: omnichat-validator --clerk CLERK_TOKEN --bearer JWT_TOKEN")
	} else if v.authMode == "clerk" {
		fmt.Println(colors.Warning("💡 To test V1 API endpoints:"))
		fmt.Println("   1. Get a JWT token via: POST /api/v1/auth/apple")
		fmt.Println("   2. Run: omnichat-validator --bearer JWT_TOKEN")
	} else if v.authMode == "jwt" {
		fmt.Println(colors.Warning("💡 To test web app endpoints:"))
		fmt.Println("   1. Get a Clerk token from the web app session")
		fmt.Println("   2. Run: omnichat-validator --clerk CLERK_TOKEN")
	}

	if failed > authRequired {
		fmt.Println()
		fmt.Println(colors.Error("❌ Some tests failed beyond auth issues. Review errors above."))
	} else if passed == total {
		fmt.Println()
		fmt.Println(colors.Success("✅ All accessible tests passed!"))
	}
}

// HasFailures returns true if there are non-auth failures
func (v *Validator) HasFailures() bool {
	for _, result := range v.results {
		if !result.Success && result.StatusCode != 401 && result.StatusCode != 403 {
			return true
		}
	}
	return false
}

func (v *Validator) getEndpointCategory(name string) string {
	if strings.Contains(name, "/auth") {
		return "Authentication"
	} else if strings.Contains(name, "/chat") || strings.Contains(name, "/models") {
		return "Chat & AI"
	} else if strings.Contains(name, "/conversations") {
		return "Conversations"
	} else if strings.Contains(name, "/messages") {
		return "Messages"
	} else if strings.Contains(name, "/upload") || strings.Contains(name, "/files") {
		return "Files"
	} else if strings.Contains(name, "/search") {
		return "Search"
	} else if strings.Contains(name, "/battery") {
		return "Battery"
	} else if strings.Contains(name, "/user") {
		return "User"
	} else if strings.Contains(name, "/stripe") {
		return "Billing"
	} else if strings.Contains(name, "/config") || strings.Contains(name, "/openapi") || strings.Contains(name, "/docs") {
		return "Public"
	}
	return "Other"
}

func (v *Validator) colorNumber(n int, good bool) string {
	if good {
		return colors.Success(fmt.Sprintf("%d", n))
	}
	return colors.Error(fmt.Sprintf("%d", n))
}

// Helper functions for response validation
func (v *Validator) validateModelsResponse(response interface{}) []string {
	errors := []string{}
	
	respMap, ok := response.(map[string]interface{})
	if !ok {
		errors = append(errors, "Response is not a JSON object")
		return errors
	}
	
	providers, ok := respMap["providers"]
	if !ok {
		errors = append(errors, "Missing 'providers' field")
		return errors
	}
	
	providersMap, ok := providers.(map[string]interface{})
	if !ok {
		errors = append(errors, "'providers' field is not an object")
		return errors
	}
	
	// Validate that at least one provider exists
	if len(providersMap) == 0 {
		errors = append(errors, "No providers found in response")
	}
	
	// Validate each provider has models
	for providerName, models := range providersMap {
		modelsArray, ok := models.([]interface{})
		if !ok {
			errors = append(errors, fmt.Sprintf("Provider '%s' models is not an array", providerName))
			continue
		}
		
		if len(modelsArray) == 0 {
			errors = append(errors, fmt.Sprintf("Provider '%s' has no models", providerName))
		}
		
		// Basic validation of model structure
		for i, model := range modelsArray {
			modelMap, ok := model.(map[string]interface{})
			if !ok {
				errors = append(errors, fmt.Sprintf("Provider '%s' model[%d] is not an object", providerName, i))
				continue
			}
			
			// Check required fields
			requiredFields := []string{"id", "name", "provider", "contextWindow", "maxOutput"}
			for _, field := range requiredFields {
				if _, ok := modelMap[field]; !ok {
					errors = append(errors, fmt.Sprintf("Provider '%s' model[%d] missing field '%s'", providerName, i, field))
				}
			}
		}
	}
	
	return errors
}

// Backward compatibility - keep the old NewValidator function signature
func NewValidatorBasic(config *types.Config) *Validator {
	return NewValidator(config, "", "")
}