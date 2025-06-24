package main

import (
	"flag"
	"fmt"
	"os"
	"strings"
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
		baseURL    = flag.String("url", defaultURL, "Base URL of the API")
		clerkToken = flag.String("clerk", "", "Clerk session token for web app endpoints")
		jwtToken   = flag.String("bearer", "", "JWT Bearer token for V1 API endpoints")
		timeout    = flag.Duration("timeout", defaultTimeout, "Request timeout")
		verbose    = flag.Bool("verbose", false, "Enable verbose output")
		help       = flag.Bool("help", false, "Show help message")
		
		// Legacy token flag for backward compatibility
		legacyToken = flag.String("token", "", "Bearer token (deprecated, use --clerk or --bearer)")
	)

	// Custom usage message
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "%s\n", colors.BoldText("OmniChat API Validator"))
		fmt.Fprintf(os.Stderr, "Comprehensive testing for all 43 OmniChat API endpoints\n\n")
		fmt.Fprintf(os.Stderr, "Usage: %s [options]\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "Options:\n")
		flag.PrintDefaults()
		fmt.Fprintf(os.Stderr, "\nAuthentication:\n")
		fmt.Fprintf(os.Stderr, "  The OmniChat API uses two authentication methods:\n")
		fmt.Fprintf(os.Stderr, "  • Clerk tokens for web app endpoints (/api/*)\n")
		fmt.Fprintf(os.Stderr, "  • JWT tokens for V1 API endpoints (/api/v1/*)\n")
		fmt.Fprintf(os.Stderr, "\nExamples:\n")
		fmt.Fprintf(os.Stderr, "  # Test without authentication (public endpoints only)\n")
		fmt.Fprintf(os.Stderr, "  %s\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  # Test with Clerk authentication\n")
		fmt.Fprintf(os.Stderr, "  %s --clerk \"your-clerk-token\"\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  # Test V1 API with JWT\n")
		fmt.Fprintf(os.Stderr, "  %s --bearer \"your-jwt-token\"\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  # Full test with both auth types\n")
		fmt.Fprintf(os.Stderr, "  %s --clerk \"token1\" --bearer \"token2\"\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  # Test production API\n")
		fmt.Fprintf(os.Stderr, "  %s --url https://omnichat-7pu.pages.dev --bearer \"jwt\"\n", os.Args[0])
	}

	flag.Parse()

	// Show help if requested
	if *help {
		flag.Usage()
		os.Exit(0)
	}

	// Handle legacy token flag
	if *legacyToken != "" && *clerkToken == "" && *jwtToken == "" {
		fmt.Fprintf(os.Stderr, "%s The --token flag is deprecated. Use --clerk or --bearer instead.\n", colors.Warning("⚠️"))
		*clerkToken = *legacyToken
	}

	// Create configuration
	config := &types.Config{
		BaseURL: *baseURL,
		Timeout: *timeout,
		Verbose: *verbose,
	}

	// Create and run validator
	fmt.Println(colors.BoldText("🚀 OmniChat API Validator"))
	fmt.Printf("📍 Testing %d endpoints across 10 categories\n", 43)
	fmt.Println(strings.Repeat("─", 60))
	fmt.Println()
	
	v := validator.NewValidator(config, *clerkToken, *jwtToken)
	if err := v.RunAllTests(); err != nil {
		fmt.Fprintf(os.Stderr, "%s %s\n", colors.Error("Error:"), err.Error())
		os.Exit(1)
	}

	// Exit with non-zero if tests failed
	if v.HasFailures() {
		os.Exit(1)
	}
}