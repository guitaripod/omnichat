package main

import (
	"flag"
	"fmt"
	"os"
	"time"

	"github.com/omnichat/validator/internal/types"
	"github.com/omnichat/validator/internal/validator"
	"github.com/omnichat/validator/pkg/colors"
)

const (
	defaultURL     = "http://localhost:3000"
	defaultTimeout = 30 * time.Second
)

func main() {
	// Define command-line flags
	var (
		baseURL   = flag.String("url", defaultURL, "Base URL of the API")
		authToken = flag.String("token", "", "Bearer token for authentication")
		timeout   = flag.Duration("timeout", defaultTimeout, "Request timeout")
		verbose   = flag.Bool("verbose", false, "Enable verbose output")
		help      = flag.Bool("help", false, "Show help message")
	)

	// Custom usage message
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "%s\n\n", colors.BoldText("OmniChat API Validator"))
		fmt.Fprintf(os.Stderr, "Usage: %s [options]\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "Options:\n")
		flag.PrintDefaults()
		fmt.Fprintf(os.Stderr, "\nExamples:\n")
		fmt.Fprintf(os.Stderr, "  # Test local development server\n")
		fmt.Fprintf(os.Stderr, "  %s\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  # Test production with auth token\n")
		fmt.Fprintf(os.Stderr, "  %s -url https://omnichat.app -token \"your-token-here\"\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  # Test with custom timeout\n")
		fmt.Fprintf(os.Stderr, "  %s -timeout 60s\n", os.Args[0])
	}

	flag.Parse()

	// Show help if requested
	if *help {
		flag.Usage()
		os.Exit(0)
	}

	// Create configuration
	config := &types.Config{
		BaseURL:   *baseURL,
		AuthToken: *authToken,
		Timeout:   *timeout,
		Verbose:   *verbose,
	}

	// Create and run validator
	v := validator.NewValidator(config)
	if err := v.RunAllTests(); err != nil {
		fmt.Fprintf(os.Stderr, "%s %s\n", colors.Error("Error:"), err.Error())
		os.Exit(1)
	}
}