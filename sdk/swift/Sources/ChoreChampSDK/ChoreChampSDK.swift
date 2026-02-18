import Foundation

public enum ChoreChampAuth {
    case apiKey(String)
    case accessToken(String)
}

public struct ChoreChampSDK {
    private let baseURL: URL
    private let auth: ChoreChampAuth

    public init(
        baseURL: URL = URL(string: "https://chorechamp-api-u0o9.onrender.com/api/public/v1/")!,
        auth: ChoreChampAuth
    ) {
        self.baseURL = baseURL
        self.auth = auth
    }

    private func authHeaders() -> [String: String] {
        switch auth {
        case .apiKey(let key):
            return ["X-API-Key": key]
        case .accessToken(let token):
            return ["Authorization": "Bearer \(token)"]
        }
    }

    private func request(
        path: String,
        method: String = "GET",
        body: Data? = nil
    ) async throws -> [String: Any] {
        guard let endpoint = URL(string: path, relativeTo: baseURL) else {
            throw NSError(domain: "ChoreChampSDK", code: -1)
        }
        var request = URLRequest(url: endpoint)
        request.httpMethod = method
        request.httpBody = body

        var headers = authHeaders()
        headers["Content-Type"] = "application/json"
        for (key, value) in headers {
            request.setValue(value, forHTTPHeaderField: key)
        }

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw NSError(domain: "ChoreChampSDK", code: -1)
        }

        guard (200...299).contains(http.statusCode) else {
            throw NSError(domain: "ChoreChampSDK", code: http.statusCode)
        }

        let json = try JSONSerialization.jsonObject(with: data, options: [])
        return json as? [String: Any] ?? [:]
    }

    public func getOpenApi() async throws -> [String: Any] {
        try await request(path: "openapi.json")
    }

    public func listHouseholdChores(householdId: String) async throws -> [String: Any] {
        try await request(path: "households/\(householdId)/chores")
    }

    public func listHouseholdMembers(householdId: String) async throws -> [String: Any] {
        try await request(path: "households/\(householdId)/members")
    }

    public func emitEvent(
        householdId: String,
        eventType: String,
        payload: [String: Any]
    ) async throws -> [String: Any] {
        let body = try JSONSerialization.data(withJSONObject: payload, options: [])
        return try await request(
            path: "households/\(householdId)/events/\(eventType)",
            method: "POST",
            body: body
        )
    }
}
