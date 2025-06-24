package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/omnichat/validator/internal/types"
	"github.com/omnichat/validator/pkg/colors"
)

type AppleAuthTestCase struct {
	Name           string
	Request        interface{}
	ExpectedStatus int
	Description    string
}

func main() {
	// Parse command-line arguments
	baseURL := flag.String("url", "http://localhost:3002", "Base URL of the API")
	flag.Parse()

	fmt.Printf("%s\n\n", colors.Header("🍎", fmt.Sprintf("Testing Sign in with Apple endpoint at %s", *baseURL)))

	// Define test cases
	testCases := []AppleAuthTestCase{
		{
			Name:           "Missing idToken",
			Request:        map[string]interface{}{},
			ExpectedStatus: 400,
			Description:    "Should return 400 when idToken is missing",
		},
		{
			Name: "Invalid idToken",
			Request: map[string]interface{}{
				"idToken": "invalid-token-12345",
			},
			ExpectedStatus: 401,
			Description:    "Should return 401 when idToken is invalid",
		},
		{
			Name: "Valid idToken format (would need real token)",
			Request: types.AppleAuthRequest{
				IDToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
				User: &types.AppleUserData{
					Email: "test@example.com",
					Name: &types.AppleUserName{
						FirstName: "Test",
						LastName:  "User",
					},
				},
			},
			ExpectedStatus: 401, // Will still fail without valid Apple token
			Description:    "Shows the expected request format for Sign in with Apple",
		},
	}

	// Run tests
	client := &http.Client{Timeout: 10 * time.Second}
	
	for _, tc := range testCases {
		runTest(client, *baseURL, tc)
		fmt.Println()
	}

	// Print integration notes
	printIntegrationNotes()
}

func runTest(client *http.Client, baseURL string, tc AppleAuthTestCase) {
	fmt.Printf("%s Test: %s\n", colors.Info("📝"), tc.Name)
	fmt.Printf("   Description: %s\n", tc.Description)
	
	// Pretty print request
	reqJSON, _ := json.MarshalIndent(tc.Request, "   ", "  ")
	fmt.Printf("   Request body: %s\n", string(reqJSON))

	// Create request
	body, err := json.Marshal(tc.Request)
	if err != nil {
		fmt.Printf("   %s Error marshaling request: %v\n", colors.Error("❌"), err)
		return
	}

	req, err := http.NewRequest("POST", baseURL+"/api/v1/auth/apple", bytes.NewBuffer(body))
	if err != nil {
		fmt.Printf("   %s Error creating request: %v\n", colors.Error("❌"), err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	// Send request
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("   %s Error sending request: %v\n", colors.Error("❌"), err)
		return
	}
	defer resp.Body.Close()

	// Read response
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("   %s Error reading response: %v\n", colors.Error("❌"), err)
		return
	}

	fmt.Printf("   Response status: %d %s\n", resp.StatusCode, http.StatusText(resp.StatusCode))

	// Check if status matches expected
	if resp.StatusCode == tc.ExpectedStatus {
		fmt.Printf("   %s Status matches expected: %d\n", colors.Success("✅"), tc.ExpectedStatus)
	} else {
		fmt.Printf("   %s Expected status %d, got %d\n", colors.Error("❌"), tc.ExpectedStatus, resp.StatusCode)
	}

	// Pretty print response if JSON
	if resp.Header.Get("Content-Type") == "application/json" && len(respBody) > 0 {
		var prettyJSON bytes.Buffer
		if err := json.Indent(&prettyJSON, respBody, "   ", "  "); err == nil {
			fmt.Printf("   Response: %s\n", prettyJSON.String())
		} else {
			fmt.Printf("   Response: %s\n", string(respBody))
		}
	}
}

func printIntegrationNotes() {
	fmt.Printf("\n%s\n", colors.Header("📚", "Sign in with Apple Integration Notes:"))
	fmt.Println("\n1. The endpoint expects a POST request with:")
	fmt.Println("   - idToken: The JWT token from Apple Sign In")
	fmt.Println("   - user: Optional user data from first-time sign in")
	fmt.Println("\n2. The idToken is verified against Apple's public keys")
	fmt.Println("\n3. On success, returns:")
	fmt.Println("   - accessToken: JWT for API access")
	fmt.Println("   - refreshToken: Token to refresh access")
	fmt.Println("   - user: User profile information")
	fmt.Println("\n4. The endpoint creates or updates user records in the database")
}