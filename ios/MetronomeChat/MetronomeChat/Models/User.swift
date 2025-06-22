import Foundation

struct User: Codable {
    let id: String
    let email: String
    let name: String?
    let imageUrl: String?
    let clerkId: String?
    let tier: UserTier
    let subscriptionStatus: SubscriptionStatus?
    
    enum UserTier: String, Codable {
        case free
        case paid
    }
    
    enum SubscriptionStatus: String, Codable {
        case active
        case canceled
        case pastDue = "past_due"
        case trialing
    }
}