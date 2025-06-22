import Foundation
import Combine

protocol HomeViewModelProtocol {
    var selectedModel: CurrentValueSubject<AIModel?, Never> { get }
    var userName: String { get }
    var greeting: String { get }
    var availableModels: [AIModel] { get }
    var suggestions: [(icon: String, title: String, subtitle: String)] { get }
    
    func selectModel(_ model: AIModel)
    func sendMessage(_ message: String, completion: @escaping (Result<Void, Error>) -> Void)
}

class HomeViewModel: HomeViewModelProtocol {
    // Published properties
    let selectedModel = CurrentValueSubject<AIModel?, Never>(nil)
    
    // Dependencies
    private let authService: AuthServiceProtocol
    private let chatService: ChatServiceProtocol
    
    // Properties
    var userName: String {
        return authService.currentUser?.name ?? "Guest"
    }
    
    var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 0..<12:
            return "Good Morning"
        case 12..<17:
            return "Good Afternoon"
        default:
            return "Good Evening"
        }
    }
    
    var availableModels: [AIModel] {
        return AIModel.allModels
    }
    
    var suggestions: [(icon: String, title: String, subtitle: String)] {
        return [
            ("fork.knife", "List 5 healthy", "breakfast ideas."),
            ("calendar", "What should", "I do in Tokyo?"),
            ("character.bubble", "Translate", "to Spanish")
        ]
    }
    
    init(authService: AuthServiceProtocol = AuthService.shared,
         chatService: ChatServiceProtocol = ChatService()) {
        self.authService = authService
        self.chatService = chatService
        
        // Set default model
        if let defaultModel = AIModel.allModels.first(where: { $0.id == "gemini-2.0-flash-latest" }) {
            selectedModel.send(defaultModel)
        }
    }
    
    func selectModel(_ model: AIModel) {
        selectedModel.send(model)
    }
    
    func sendMessage(_ message: String, completion: @escaping (Result<Void, Error>) -> Void) {
        guard let model = selectedModel.value else {
            completion(.failure(NetworkError.serverError("No model selected")))
            return
        }
        
        Task {
            do {
                _ = try await chatService.sendMessage(
                    content: message,
                    model: model.id,
                    conversationId: nil
                ) { streamContent in
                    // Handle streaming content in the view controller
                    print("Stream: \(streamContent)")
                }
                
                await MainActor.run {
                    completion(.success(()))
                }
            } catch {
                await MainActor.run {
                    completion(.failure(error))
                }
            }
        }
    }
}