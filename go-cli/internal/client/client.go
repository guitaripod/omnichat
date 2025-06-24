package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/omnichat/validator/internal/types"
)

// APIClient handles HTTP requests to the API
type APIClient struct {
	baseURL    string
	authToken  string
	httpClient *http.Client
}

// NewAPIClient creates a new API client
func NewAPIClient(config *types.Config) *APIClient {
	return &APIClient{
		baseURL:   config.BaseURL,
		authToken: config.AuthToken,
		httpClient: &http.Client{
			Timeout: config.Timeout,
		},
	}
}

// Request performs an HTTP request and returns the response
func (c *APIClient) Request(method, path string, body interface{}) (*http.Response, error) {
	url := c.baseURL + path

	var reqBody io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonBody)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if c.authToken != "" {
		req.Header.Set("Authorization", "Bearer "+c.authToken)
	}

	return c.httpClient.Do(req)
}

// Get performs a GET request
func (c *APIClient) Get(path string) (*http.Response, error) {
	return c.Request("GET", path, nil)
}

// Post performs a POST request
func (c *APIClient) Post(path string, body interface{}) (*http.Response, error) {
	return c.Request("POST", path, body)
}

// TestEndpoint tests a single endpoint and returns the result
func (c *APIClient) TestEndpoint(name, method, path string, body interface{}) types.TestResult {
	start := time.Now()
	
	resp, err := c.Request(method, path, body)
	duration := time.Since(start)
	
	if err != nil {
		return types.TestResult{
			Name:     name,
			Success:  false,
			Error:    err.Error(),
			Duration: duration,
		}
	}
	defer resp.Body.Close()

	// Read response body
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return types.TestResult{
			Name:       name,
			Success:    false,
			Error:      fmt.Sprintf("failed to read response: %v", err),
			Duration:   duration,
			StatusCode: resp.StatusCode,
		}
	}

	// Parse JSON response if applicable
	var responseData interface{}
	if resp.Header.Get("Content-Type") == "application/json" && len(respBody) > 0 {
		if err := json.Unmarshal(respBody, &responseData); err != nil {
			responseData = string(respBody) // Fall back to string if not valid JSON
		}
	} else {
		responseData = string(respBody)
	}

	result := types.TestResult{
		Name:       name,
		Success:    resp.StatusCode >= 200 && resp.StatusCode < 300,
		Duration:   duration,
		StatusCode: resp.StatusCode,
		Response:   responseData,
	}

	if !result.Success {
		result.Error = fmt.Sprintf("HTTP %d: %s", resp.StatusCode, http.StatusText(resp.StatusCode))
	}

	return result
}