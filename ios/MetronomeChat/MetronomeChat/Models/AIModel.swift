import Foundation

enum AIProvider: String, CaseIterable {
    case openai = "OpenAI"
    case anthropic = "Anthropic"
    case google = "Google"
    case xai = "xAI"
    case deepseek = "DeepSeek"
    case ollama = "Ollama"
    
    var iconName: String {
        switch self {
        case .openai: return "sparkles"
        case .anthropic: return "star.fill"
        case .google: return "sparkle"
        case .xai: return "bolt.fill"
        case .deepseek: return "brain"
        case .ollama: return "cube.fill"
        }
    }
    
    var gradientColors: [String] {
        switch self {
        case .openai: return ["#74AA9C", "#4A7C59"]
        case .anthropic: return ["#D4A574", "#B58863"]
        case .google: return ["#4285F4", "#1A73E8"]
        case .xai: return ["#1DA1F2", "#0C85D0"]
        case .deepseek: return ["#6B46C1", "#553C9A"]
        case .ollama: return ["#374151", "#1F2937"]
        }
    }
}

struct AIModel {
    let id: String
    let name: String
    let provider: AIProvider
    let description: String?
    let isAvailable: Bool
    let supportsStreaming: Bool
    let supportsImages: Bool
    let supportsWebSearch: Bool
    let maxTokens: Int?
    
    static let allModels: [AIModel] = [
        // OpenAI Models
        AIModel(id: "gpt-4.1", name: "GPT-4.1", provider: .openai, description: "Most capable GPT-4 model", isAvailable: true, supportsStreaming: true, supportsImages: false, supportsWebSearch: false, maxTokens: 128000),
        AIModel(id: "gpt-4.1-mini", name: "GPT-4.1 Mini", provider: .openai, description: "Small, fast, and cost-effective", isAvailable: true, supportsStreaming: true, supportsImages: false, supportsWebSearch: false, maxTokens: 128000),
        AIModel(id: "gpt-4.1-nano", name: "GPT-4.1 Nano", provider: .openai, description: "Tiny model for simple tasks", isAvailable: true, supportsStreaming: true, supportsImages: false, supportsWebSearch: false, maxTokens: 128000),
        AIModel(id: "o3", name: "O3", provider: .openai, description: "Reasoning model", isAvailable: true, supportsStreaming: true, supportsImages: false, supportsWebSearch: false, maxTokens: 128000),
        AIModel(id: "o3-mini", name: "O3 Mini", provider: .openai, description: "Fast reasoning model", isAvailable: true, supportsStreaming: true, supportsImages: false, supportsWebSearch: false, maxTokens: 128000),
        AIModel(id: "gpt-4o", name: "GPT-4o", provider: .openai, description: "Multimodal flagship model", isAvailable: true, supportsStreaming: true, supportsImages: true, supportsWebSearch: false, maxTokens: 128000),
        AIModel(id: "gpt-4o-mini", name: "GPT-4o Mini", provider: .openai, description: "Affordable multimodal model", isAvailable: true, supportsStreaming: true, supportsImages: true, supportsWebSearch: false, maxTokens: 128000),
        AIModel(id: "gpt-image-1", name: "GPT Image 1", provider: .openai, description: "Image generation model", isAvailable: true, supportsStreaming: false, supportsImages: true, supportsWebSearch: false, maxTokens: nil),
        AIModel(id: "dall-e-3", name: "DALL-E 3", provider: .openai, description: "Advanced image generation", isAvailable: true, supportsStreaming: false, supportsImages: true, supportsWebSearch: false, maxTokens: nil),
        AIModel(id: "dall-e-2", name: "DALL-E 2", provider: .openai, description: "Image generation model", isAvailable: true, supportsStreaming: false, supportsImages: true, supportsWebSearch: false, maxTokens: nil),
        
        // Anthropic Models
        AIModel(id: "claude-opus-4-20250514", name: "Claude Opus 4", provider: .anthropic, description: "Most powerful Claude model", isAvailable: true, supportsStreaming: true, supportsImages: true, supportsWebSearch: true, maxTokens: 200000),
        AIModel(id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: .anthropic, description: "Balanced performance", isAvailable: true, supportsStreaming: true, supportsImages: true, supportsWebSearch: true, maxTokens: 200000),
        AIModel(id: "claude-3.7-sonnet-20241022", name: "Claude 3.7 Sonnet", provider: .anthropic, description: "Updated Sonnet model", isAvailable: true, supportsStreaming: true, supportsImages: true, supportsWebSearch: true, maxTokens: 200000),
        AIModel(id: "claude-3.5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: .anthropic, description: "Fast and capable", isAvailable: true, supportsStreaming: true, supportsImages: true, supportsWebSearch: true, maxTokens: 200000),
        AIModel(id: "claude-3.5-haiku-20241022", name: "Claude 3.5 Haiku", provider: .anthropic, description: "Fast and affordable", isAvailable: true, supportsStreaming: true, supportsImages: true, supportsWebSearch: false, maxTokens: 200000),
        AIModel(id: "claude-3-opus-20240229", name: "Claude 3 Opus", provider: .anthropic, description: "Previous flagship model", isAvailable: true, supportsStreaming: true, supportsImages: true, supportsWebSearch: false, maxTokens: 200000),
        AIModel(id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet", provider: .anthropic, description: "Balanced Claude 3 model", isAvailable: true, supportsStreaming: true, supportsImages: true, supportsWebSearch: false, maxTokens: 200000),
        
        // Google Models
        AIModel(id: "gemini-2.5-pro-latest", name: "Gemini 2.5 Pro", provider: .google, description: "Next-gen multimodal model", isAvailable: true, supportsStreaming: true, supportsImages: true, supportsWebSearch: true, maxTokens: 2000000),
        AIModel(id: "gemini-2.5-flash-latest", name: "Gemini 2.5 Flash", provider: .google, description: "Fast next-gen model", isAvailable: true, supportsStreaming: true, supportsImages: true, supportsWebSearch: true, maxTokens: 1000000),
        AIModel(id: "gemini-2.0-flash-latest", name: "Gemini 2.0 Flash", provider: .google, description: "Multimodal model", isAvailable: true, supportsStreaming: true, supportsImages: true, supportsWebSearch: true, maxTokens: 1000000),
        AIModel(id: "gemini-1.5-pro-latest", name: "Gemini 1.5 Pro", provider: .google, description: "Advanced reasoning", isAvailable: true, supportsStreaming: true, supportsImages: true, supportsWebSearch: true, maxTokens: 2000000),
        AIModel(id: "gemini-1.5-flash-latest", name: "Gemini 1.5 Flash", provider: .google, description: "Fast and efficient", isAvailable: true, supportsStreaming: true, supportsImages: true, supportsWebSearch: false, maxTokens: 1000000),
        
        // xAI Models
        AIModel(id: "grok-3", name: "Grok 3", provider: .xai, description: "Most capable Grok model", isAvailable: true, supportsStreaming: true, supportsImages: false, supportsWebSearch: false, maxTokens: 131072),
        AIModel(id: "grok-3-fast", name: "Grok 3 Fast", provider: .xai, description: "Fast Grok 3 variant", isAvailable: true, supportsStreaming: true, supportsImages: false, supportsWebSearch: false, maxTokens: 131072),
        AIModel(id: "grok-3-mini", name: "Grok 3 Mini", provider: .xai, description: "Efficient Grok model", isAvailable: true, supportsStreaming: true, supportsImages: false, supportsWebSearch: false, maxTokens: 131072),
        AIModel(id: "grok-2-1212", name: "Grok 2", provider: .xai, description: "Previous generation Grok", isAvailable: true, supportsStreaming: true, supportsImages: false, supportsWebSearch: false, maxTokens: 131072),
        AIModel(id: "grok-2-vision-1212", name: "Grok 2 Vision", provider: .xai, description: "Multimodal Grok model", isAvailable: true, supportsStreaming: true, supportsImages: true, supportsWebSearch: false, maxTokens: 32768),
        
        // DeepSeek Models
        AIModel(id: "deepseek-chat", name: "DeepSeek Chat", provider: .deepseek, description: "General chat model", isAvailable: true, supportsStreaming: true, supportsImages: false, supportsWebSearch: false, maxTokens: 64000),
        AIModel(id: "deepseek-reasoner", name: "DeepSeek Reasoner", provider: .deepseek, description: "Advanced reasoning", isAvailable: true, supportsStreaming: true, supportsImages: false, supportsWebSearch: false, maxTokens: 64000),
        
        // Ollama (Dynamic)
        AIModel(id: "ollama-custom", name: "Ollama Custom", provider: .ollama, description: "Local model", isAvailable: true, supportsStreaming: true, supportsImages: false, supportsWebSearch: false, maxTokens: nil)
    ]
    
    static func model(withId id: String) -> AIModel? {
        return allModels.first { $0.id == id }
    }
}