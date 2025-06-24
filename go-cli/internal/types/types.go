package types

import "time"

// TestResult represents the result of a single API test
type TestResult struct {
	Name        string        `json:"name"`
	Success     bool          `json:"success"`
	Error       string        `json:"error,omitempty"`
	Response    interface{}   `json:"response,omitempty"`
	Duration    time.Duration `json:"duration"`
	StatusCode  int           `json:"status_code"`
}

// Config holds the configuration for the validator
type Config struct {
	BaseURL   string
	AuthToken string
	Verbose   bool
	Timeout   time.Duration
}

// ModelsResponse represents the response from GET /api/models
type ModelsResponse struct {
	Providers map[string][]AIModel `json:"providers"`
}

// AIModel represents an AI model
type AIModel struct {
	ID                      string `json:"id"`
	Name                    string `json:"name"`
	Provider                string `json:"provider"`
	ContextWindow           int    `json:"contextWindow"`
	MaxOutput               int    `json:"maxOutput"`
	SupportsVision          bool   `json:"supportsVision,omitempty"`
	SupportsTools           bool   `json:"supportsTools,omitempty"`
	SupportsWebSearch       bool   `json:"supportsWebSearch,omitempty"`
	SupportsImageGeneration bool   `json:"supportsImageGeneration,omitempty"`
	Description             string `json:"description,omitempty"`
}

// ConfigResponse represents the response from GET /api/config
type ConfigResponse struct {
	StripePublishableKey string `json:"stripePublishableKey"`
	ClerkPublishableKey  string `json:"clerkPublishableKey"`
	AppURL               string `json:"appUrl"`
}

// OpenAPISpec represents the OpenAPI specification response
type OpenAPISpec struct {
	OpenAPI string                 `json:"openapi"`
	Info    map[string]interface{} `json:"info"`
	Paths   map[string]interface{} `json:"paths"`
}

// AppleAuthRequest represents the request body for Apple authentication
type AppleAuthRequest struct {
	IDToken string         `json:"idToken"`
	User    *AppleUserData `json:"user,omitempty"`
}

// AppleUserData represents optional user data from Apple
type AppleUserData struct {
	Email string         `json:"email,omitempty"`
	Name  *AppleUserName `json:"name,omitempty"`
}

// AppleUserName represents the user's name from Apple
type AppleUserName struct {
	FirstName string `json:"firstName,omitempty"`
	LastName  string `json:"lastName,omitempty"`
}

// ErrorResponse represents an API error response
type ErrorResponse struct {
	Error string `json:"error"`
}