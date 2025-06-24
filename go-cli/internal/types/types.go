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

// Authentication Types
type AuthResponse struct {
	AccessToken  string    `json:"accessToken"`
	RefreshToken string    `json:"refreshToken"`
	ExpiresIn    int       `json:"expiresIn"`
	TokenType    string    `json:"tokenType"`
	User         *AuthUser `json:"user"`
}

type AuthUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken"`
}

// Chat Types
type ChatRequest struct {
	Messages       []ChatMessage `json:"messages"`
	Model          string        `json:"model"`
	ConversationID string        `json:"conversationId,omitempty"`
	Temperature    float64       `json:"temperature,omitempty"`
	MaxTokens      int           `json:"maxTokens,omitempty"`
	Stream         bool          `json:"stream,omitempty"`
	WebSearch      bool          `json:"webSearch,omitempty"`
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatResponse struct {
	ID      string `json:"id"`
	Content string `json:"content"`
	Model   string `json:"model"`
}

// Conversation Types
type ConversationRequest struct {
	Title string `json:"title"`
	Model string `json:"model,omitempty"`
}

type ConversationUpdateRequest struct {
	Title      string `json:"title,omitempty"`
	IsArchived bool   `json:"isArchived,omitempty"`
}

type Conversation struct {
	ID          string       `json:"id"`
	Title       string       `json:"title"`
	Model       string       `json:"model"`
	IsArchived  bool         `json:"isArchived"`
	CreatedAt   string       `json:"createdAt"`
	UpdatedAt   string       `json:"updatedAt"`
	LastMessage *LastMessage `json:"lastMessage,omitempty"`
}

type LastMessage struct {
	ID        string `json:"id"`
	Role      string `json:"role"`
	Content   string `json:"content"`
	CreatedAt string `json:"createdAt"`
}

type ConversationsResponse struct {
	Conversations []Conversation `json:"conversations"`
}

// Message Types
type MessageRequest struct {
	Role          string   `json:"role"`
	Content       string   `json:"content"`
	Model         string   `json:"model,omitempty"`
	ParentID      string   `json:"parentId,omitempty"`
	AttachmentIDs []string `json:"attachmentIds,omitempty"`
}

type V1MessageRequest struct {
	Content       string   `json:"content"`
	AttachmentIDs []string `json:"attachmentIds,omitempty"`
	Stream        bool     `json:"stream,omitempty"`
}

type Message struct {
	ID             string       `json:"id"`
	ConversationID string       `json:"conversationId"`
	Role           string       `json:"role"`
	Content        string       `json:"content"`
	Model          string       `json:"model,omitempty"`
	CreatedAt      string       `json:"createdAt"`
	Attachments    []Attachment `json:"attachments,omitempty"`
}

type MessagesResponse struct {
	Messages []Message `json:"messages"`
	Total    int       `json:"total"`
	HasMore  bool      `json:"hasMore"`
}

// File Types
type Attachment struct {
	ID       string `json:"id"`
	URL      string `json:"url"`
	FileName string `json:"fileName"`
	FileType string `json:"fileType"`
	FileSize int    `json:"fileSize"`
	Key      string `json:"key"`
}

// Search Types
type SearchResponse struct {
	Results []SearchResult `json:"results"`
	Total   int            `json:"total"`
}

type SearchResult struct {
	Type           string  `json:"type"`
	ID             string  `json:"id"`
	Title          string  `json:"title"`
	Content        string  `json:"content"`
	ConversationID string  `json:"conversationId,omitempty"`
	MessageID      string  `json:"messageId,omitempty"`
	CreatedAt      string  `json:"createdAt"`
	Model          string  `json:"model,omitempty"`
	Score          float64 `json:"score"`
}

// Battery Types
type BatteryResponse struct {
	Balance      int               `json:"balance"`
	UsageHistory []BatteryUsage    `json:"usageHistory"`
	Subscription *SubscriptionInfo `json:"subscription,omitempty"`
}

type BatteryUsage struct {
	Date     string `json:"date"`
	Usage    int    `json:"usage"`
	Balance  int    `json:"balance"`
	Messages int    `json:"messages"`
}

type SubscriptionInfo struct {
	Plan         string `json:"plan"`
	Status       string `json:"status"`
	BatteryLimit int    `json:"batteryLimit"`
	ResetDate    string `json:"resetDate"`
}

// User Types
type UserTierResponse struct {
	Tier           string `json:"tier"`
	IsSubscribed   bool   `json:"isSubscribed"`
	SubscriptionID string `json:"subscriptionId,omitempty"`
}

type UserProfile struct {
	ID           string            `json:"id"`
	Email        string            `json:"email"`
	Name         string            `json:"name"`
	ImageURL     string            `json:"imageUrl,omitempty"`
	Tier         string            `json:"tier"`
	CreatedAt    string            `json:"createdAt"`
	Subscription *UserSubscription `json:"subscription,omitempty"`
	Battery      *UserBattery      `json:"battery"`
}

type UserSubscription struct {
	ID               string   `json:"id"`
	PlanID           string   `json:"planId"`
	PlanName         string   `json:"planName"`
	Status           string   `json:"status"`
	CurrentPeriodEnd string   `json:"currentPeriodEnd"`
	BillingInterval  string   `json:"billingInterval"`
	Features         []string `json:"features"`
}

type UserBattery struct {
	TotalBalance   int    `json:"totalBalance"`
	DailyAllowance int    `json:"dailyAllowance"`
	LastDailyReset string `json:"lastDailyReset"`
}

type UserProfileUpdate struct {
	Name     string `json:"name,omitempty"`
	ImageURL string `json:"imageUrl,omitempty"`
}

type UserUsageResponse struct {
	Period struct {
		Start string `json:"start"`
		End   string `json:"end"`
	} `json:"period"`
	Summary struct {
		TotalBatteryUsed   int `json:"totalBatteryUsed"`
		TotalMessages      int `json:"totalMessages"`
		TotalConversations int `json:"totalConversations"`
		TotalUserMessages  int `json:"totalUserMessages"`
		AverageDailyUsage  int `json:"averageDailyUsage"`
	} `json:"summary"`
	DailyUsage []struct {
		Date        string         `json:"date"`
		BatteryUsed int            `json:"batteryUsed"`
		Messages    int            `json:"messages"`
		Models      map[string]int `json:"models"`
	} `json:"dailyUsage"`
	ModelBreakdown []struct {
		Model        string  `json:"model"`
		MessageCount int     `json:"messageCount"`
		Percentage   float64 `json:"percentage"`
	} `json:"modelBreakdown"`
}

// Billing Types
type CheckoutRequest struct {
	Type         string `json:"type"`
	PlanID       string `json:"planId,omitempty"`
	BatteryUnits int    `json:"batteryUnits,omitempty"`
	ReturnURL    string `json:"returnUrl"`
}

type CheckoutResponse struct {
	SessionID  string `json:"sessionId"`
	SessionURL string `json:"sessionUrl"`
}

type SubscriptionStatusResponse struct {
	IsSubscribed     bool   `json:"isSubscribed"`
	SubscriptionID   string `json:"subscriptionId,omitempty"`
	PlanName         string `json:"planName,omitempty"`
	Status           string `json:"status,omitempty"`
	CurrentPeriodEnd string `json:"currentPeriodEnd,omitempty"`
}

type BillingPortalResponse struct {
	URL string `json:"url"`
}

// Success Response
type SuccessResponse struct {
	Success bool `json:"success"`
}