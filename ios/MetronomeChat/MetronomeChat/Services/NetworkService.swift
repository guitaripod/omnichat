import Foundation

enum NetworkError: LocalizedError {
    case invalidURL
    case noData
    case decodingError
    case serverError(String)
    case unauthorized
    case networkError(Error)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .noData:
            return "No data received"
        case .decodingError:
            return "Failed to decode response"
        case .serverError(let message):
            return message
        case .unauthorized:
            return "Unauthorized access"
        case .networkError(let error):
            return error.localizedDescription
        }
    }
}

protocol NetworkServiceProtocol {
    func request<T: Decodable>(_ endpoint: APIEndpoint) async throws -> T
    func requestData(_ endpoint: APIEndpoint) async throws -> Data
    func streamRequest(_ endpoint: APIEndpoint, onData: @escaping (String) -> Void) async throws
}

class NetworkService: NetworkServiceProtocol {
    static let shared = NetworkService()
    
    private let baseURL: String
    private let session: URLSession
    
    init(baseURL: String = "https://omnichat.ai", session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }
    
    func request<T: Decodable>(_ endpoint: APIEndpoint) async throws -> T {
        let request = try createRequest(for: endpoint)
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw NetworkError.serverError("Invalid response")
            }
            
            switch httpResponse.statusCode {
            case 200...299:
                do {
                    let decoder = JSONDecoder()
                    decoder.dateDecodingStrategy = .iso8601
                    return try decoder.decode(T.self, from: data)
                } catch {
                    print("Decoding error: \(error)")
                    throw NetworkError.decodingError
                }
            case 401:
                throw NetworkError.unauthorized
            default:
                let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
                throw NetworkError.serverError(errorMessage)
            }
        } catch let error as NetworkError {
            throw error
        } catch {
            throw NetworkError.networkError(error)
        }
    }
    
    func requestData(_ endpoint: APIEndpoint) async throws -> Data {
        let request = try createRequest(for: endpoint)
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw NetworkError.serverError("Invalid response")
            }
            
            switch httpResponse.statusCode {
            case 200...299:
                return data
            case 401:
                throw NetworkError.unauthorized
            default:
                let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
                throw NetworkError.serverError(errorMessage)
            }
        } catch let error as NetworkError {
            throw error
        } catch {
            throw NetworkError.networkError(error)
        }
    }
    
    func streamRequest(_ endpoint: APIEndpoint, onData: @escaping (String) -> Void) async throws {
        let request = try createRequest(for: endpoint)
        
        let (stream, response) = try await session.bytes(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.serverError("Invalid response")
        }
        
        var buffer = ""
        
        for try await byte in stream {
            buffer.append(Character(UnicodeScalar(byte)))
            
            // Process Server-Sent Events
            if buffer.contains("\n\n") {
                let events = buffer.components(separatedBy: "\n\n")
                for i in 0..<events.count - 1 {
                    let event = events[i]
                    if event.hasPrefix("data: ") {
                        let data = String(event.dropFirst(6))
                        if data != "[DONE]" {
                            onData(data)
                        }
                    }
                }
                buffer = events.last ?? ""
            }
        }
    }
    
    private func createRequest(for endpoint: APIEndpoint) throws -> URLRequest {
        guard let url = URL(string: baseURL + endpoint.path) else {
            throw NetworkError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue
        request.timeoutInterval = 60
        
        // Add headers
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        if let authToken = AuthService.shared.authToken {
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        }
        
        // Add custom headers
        endpoint.headers?.forEach { key, value in
            request.setValue(value, forHTTPHeaderField: key)
        }
        
        // Add body
        if let body = endpoint.body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        
        return request
    }
}