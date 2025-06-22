import Foundation

protocol ChatServiceProtocol {
    func sendMessage(content: String, model: String, conversationId: String?, onStream: @escaping (String) -> Void) async throws -> Message
    func createConversation(title: String, model: String) async throws -> Conversation
    func getConversations() async throws -> [Conversation]
    func getMessages(for conversationId: String) async throws -> [Message]
}

class ChatService: ChatServiceProtocol {
    private let networkService: NetworkServiceProtocol
    
    init(networkService: NetworkServiceProtocol = NetworkService.shared) {
        self.networkService = networkService
    }
    
    func sendMessage(content: String, model: String, conversationId: String?, onStream: @escaping (String) -> Void) async throws -> Message {
        // If no conversation ID, create a new conversation first
        let actualConversationId: String
        if let conversationId = conversationId {
            actualConversationId = conversationId
        } else {
            let conversation = try await createConversation(title: String(content.prefix(50)), model: model)
            actualConversationId = conversation.id
        }
        
        // Create the message in the database
        let messageEndpoint = APIEndpoint.createMessage(
            conversationId: actualConversationId,
            content: content,
            role: "user"
        )
        let userMessage: Message = try await networkService.request(messageEndpoint)
        
        // Send to chat API with streaming
        let messages: [[String: Any]] = [
            ["role": "user", "content": content]
        ]
        
        let chatEndpoint = APIEndpoint.chat(messages: messages, model: model, stream: true)
        
        var assistantContent = ""
        let messageId = UUID().uuidString
        
        try await networkService.streamRequest(chatEndpoint) { data in
            // Parse the streaming response
            if let jsonData = data.data(using: .utf8),
               let json = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] {
                
                if let choices = json["choices"] as? [[String: Any]],
                   let delta = choices.first?["delta"] as? [String: Any],
                   let content = delta["content"] as? String {
                    assistantContent += content
                    onStream(content)
                }
                
                // Handle usage data at the end
                if let usage = json["usage"] as? [String: Any] {
                    // Usage data would be handled here
                    print("Token usage: \(usage)")
                }
            }
        }
        
        // Create assistant message
        let assistantMessage = Message(
            id: messageId,
            conversationId: actualConversationId,
            role: .assistant,
            content: assistantContent,
            model: model,
            parentId: userMessage.id,
            attachments: nil,
            isComplete: true,
            streamState: "completed",
            tokensGenerated: nil,
            totalTokens: nil,
            streamId: nil,
            createdAt: Date()
        )
        
        return assistantMessage
    }
    
    func createConversation(title: String, model: String) async throws -> Conversation {
        let endpoint = APIEndpoint.createConversation(title: title, model: model)
        return try await networkService.request(endpoint)
    }
    
    func getConversations() async throws -> [Conversation] {
        let endpoint = APIEndpoint.conversations
        return try await networkService.request(endpoint)
    }
    
    func getMessages(for conversationId: String) async throws -> [Message] {
        let endpoint = APIEndpoint.messages(conversationId: conversationId)
        return try await networkService.request(endpoint)
    }
}