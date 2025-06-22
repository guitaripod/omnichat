import Foundation

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
    case patch = "PATCH"
}

struct APIEndpoint {
    let path: String
    let method: HTTPMethod
    let body: [String: Any]?
    let headers: [String: String]?
    
    init(path: String, method: HTTPMethod = .get, body: [String: Any]? = nil, headers: [String: String]? = nil) {
        self.path = path
        self.method = method
        self.body = body
        self.headers = headers
    }
}

extension APIEndpoint {
    // Chat endpoints
    static func chat(messages: [[String: Any]], model: String, stream: Bool = true) -> APIEndpoint {
        return APIEndpoint(
            path: "/api/chat",
            method: .post,
            body: [
                "messages": messages,
                "model": model,
                "stream": stream
            ]
        )
    }
    
    // Conversation endpoints
    static let conversations = APIEndpoint(path: "/api/conversations")
    
    static func createConversation(title: String, model: String) -> APIEndpoint {
        return APIEndpoint(
            path: "/api/conversations",
            method: .post,
            body: [
                "title": title,
                "model": model
            ]
        )
    }
    
    static func conversation(id: String) -> APIEndpoint {
        return APIEndpoint(path: "/api/conversations/\(id)")
    }
    
    static func deleteConversation(id: String) -> APIEndpoint {
        return APIEndpoint(
            path: "/api/conversations/\(id)",
            method: .delete
        )
    }
    
    // Message endpoints
    static func messages(conversationId: String) -> APIEndpoint {
        return APIEndpoint(path: "/api/conversations/\(conversationId)/messages")
    }
    
    static func createMessage(conversationId: String, content: String, role: String, attachments: [[String: Any]]? = nil) -> APIEndpoint {
        var body: [String: Any] = [
            "content": content,
            "role": role
        ]
        if let attachments = attachments {
            body["attachments"] = attachments
        }
        
        return APIEndpoint(
            path: "/api/conversations/\(conversationId)/messages",
            method: .post,
            body: body
        )
    }
    
    // Model endpoints
    static let models = APIEndpoint(path: "/api/models")
    
    // User endpoints
    static let userTier = APIEndpoint(path: "/api/user/tier")
    static let upgradeStatus = APIEndpoint(path: "/api/user/upgrade-status")
    
    // Battery endpoints
    static let battery = APIEndpoint(path: "/api/battery")
    
    static func trackUsage(model: String, inputTokens: Int, outputTokens: Int) -> APIEndpoint {
        return APIEndpoint(
            path: "/api/usage/track",
            method: .post,
            body: [
                "model": model,
                "inputTokens": inputTokens,
                "outputTokens": outputTokens
            ]
        )
    }
    
    // Image endpoints
    static func uploadImage(imageData: Data, fileName: String) -> APIEndpoint {
        return APIEndpoint(
            path: "/api/images/upload",
            method: .post,
            body: [
                "image": imageData.base64EncodedString(),
                "fileName": fileName
            ]
        )
    }
    
    static func getImage(key: String) -> APIEndpoint {
        return APIEndpoint(path: "/api/images/\(key)")
    }
}