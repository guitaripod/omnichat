import Foundation

protocol AuthServiceProtocol {
    var authToken: String? { get }
    var currentUser: User? { get }
    var isAuthenticated: Bool { get }
    func setAuthToken(_ token: String?)
    func setCurrentUser(_ user: User?)
    func logout()
}

class AuthService: AuthServiceProtocol {
    static let shared = AuthService()

    private let defaults = UserDefaults.standard
    private let authTokenKey = "authToken"
    private let currentUserKey = "currentUser"

    var authToken: String? {
        get { defaults.string(forKey: authTokenKey) }
        set { defaults.set(newValue, forKey: authTokenKey) }
    }

    var currentUser: User? {
        get {
            guard let data = defaults.data(forKey: currentUserKey) else { return nil }
            return try? JSONDecoder().decode(User.self, from: data)
        }
        set {
            if let user = newValue,
                let data = try? JSONEncoder().encode(user)
            {
                defaults.set(data, forKey: currentUserKey)
            } else {
                defaults.removeObject(forKey: currentUserKey)
            }
        }
    }

    var isAuthenticated: Bool {
        return authToken != nil
    }

    func setAuthToken(_ token: String?) {
        authToken = token
    }

    func setCurrentUser(_ user: User?) {
        currentUser = user
    }

    func logout() {
        authToken = nil
        currentUser = nil
    }

    // For development/testing
    func loginAsTestUser() {
        authToken = "test-token"
        currentUser = User(
            id: "test-user-123",
            email: "beast@test.com",
            name: "Beast",
            imageUrl: nil,
            clerkId: nil,
            tier: .free,
            subscriptionStatus: nil
        )
    }
}

