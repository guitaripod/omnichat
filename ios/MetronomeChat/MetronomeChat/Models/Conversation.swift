import Foundation

struct Conversation: Codable {
    let id: String
    let userId: String
    let title: String
    let model: String
    let createdAt: Date
    let updatedAt: Date
    let isArchived: Bool
    
    private enum CodingKeys: String, CodingKey {
        case id, userId, title, model, createdAt, updatedAt, isArchived
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        userId = try container.decode(String.self, forKey: .userId)
        title = try container.decode(String.self, forKey: .title)
        model = try container.decode(String.self, forKey: .model)
        isArchived = try container.decode(Bool.self, forKey: .isArchived)
        
        // Handle date decoding
        if let timestamp = try? container.decode(TimeInterval.self, forKey: .createdAt) {
            createdAt = Date(timeIntervalSince1970: timestamp)
        } else if let dateString = try? container.decode(String.self, forKey: .createdAt) {
            createdAt = ISO8601DateFormatter().date(from: dateString) ?? Date()
        } else {
            createdAt = Date()
        }
        
        if let timestamp = try? container.decode(TimeInterval.self, forKey: .updatedAt) {
            updatedAt = Date(timeIntervalSince1970: timestamp)
        } else if let dateString = try? container.decode(String.self, forKey: .updatedAt) {
            updatedAt = ISO8601DateFormatter().date(from: dateString) ?? Date()
        } else {
            updatedAt = Date()
        }
    }
}