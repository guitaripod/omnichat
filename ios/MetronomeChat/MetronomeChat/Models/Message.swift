import Foundation

struct Message: Codable {
    let id: String
    let conversationId: String
    let role: MessageRole
    let content: String
    let model: String?
    let parentId: String?
    let attachments: [FileAttachment]?
    let isComplete: Bool?
    let streamState: String?
    let tokensGenerated: Int?
    let totalTokens: Int?
    let streamId: String?
    let createdAt: Date
    
    enum MessageRole: String, Codable {
        case user
        case assistant
        case system
    }
}

struct FileAttachment: Codable {
    let id: String
    let conversationId: String
    let messageId: String
    let fileName: String
    let fileSize: Int
    let mimeType: String
    let uploadedAt: Date
    let r2Key: String
}