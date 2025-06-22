import Foundation
import SwiftUI
import FirebaseFirestore

// MARK: - User Profile
struct MusicGenUserProfile: Codable, Identifiable {
    let uid: String
    let email: String
    let displayName: String
    let createdAt: Date
    var currentPlan: UserPackage
    var totalPoints: Int
    var usedPointsToday: Int
    var usedPointsThisWeek: Int
    var lastPointRefresh: Date
    var subscriptionStatus: SubscriptionStatus
    var tracks: [TrackData]
    var totalGenerations: Int
    var totalPlays: Int
    var profileImageURL: String?
    var preferences: UserPreferences?
    
    // Use uid as the id for Identifiable
    var id: String { uid }
    
    // Computed properties
    var remainingPoints: Int {
        max(0, totalPoints - usedPointsToday)
    }
    
    var dailyProgress: Double {
        Double(usedPointsToday) / Double(currentPlan.dailyLimit)
    }
    
    var weeklyProgress: Double {
        Double(usedPointsThisWeek) / Double(currentPlan.pointsIncluded)
    }
    
    var canGenerateToday: Bool {
        usedPointsToday < currentPlan.dailyLimit && totalPoints > 0
    }
    
    func toDictionary() -> [String: Any] {
        [
            "uid": uid,
            "email": email,
            "displayName": displayName,
            "createdAt": Timestamp(date: createdAt),
            "currentPlan": currentPlan.rawValue,
            "totalPoints": totalPoints,
            "usedPointsToday": usedPointsToday,
            "usedPointsThisWeek": usedPointsThisWeek,
            "lastPointRefresh": Timestamp(date: lastPointRefresh),
            "subscriptionStatus": subscriptionStatus.rawValue,
            "totalGenerations": totalGenerations,
            "totalPlays": totalPlays,
            "profileImageURL": profileImageURL as Any,
            "preferences": preferences?.toDictionary() as Any
        ]
    }
    
    static func fromDictionary(_ data: [String: Any]) -> MusicGenUserProfile? {
        guard let uid = data["uid"] as? String,
              let email = data["email"] as? String,
              let displayName = data["displayName"] as? String,
              let createdAtTimestamp = data["createdAt"] as? Timestamp,
              let currentPlanRaw = data["currentPlan"] as? String,
              let currentPlan = UserPackage(rawValue: currentPlanRaw),
              let totalPoints = data["totalPoints"] as? Int,
              let usedPointsToday = data["usedPointsToday"] as? Int,
              let usedPointsThisWeek = data["usedPointsThisWeek"] as? Int,
              let lastPointRefreshTimestamp = data["lastPointRefresh"] as? Timestamp,
              let subscriptionStatusRaw = data["subscriptionStatus"] as? String,
              let subscriptionStatus = SubscriptionStatus(rawValue: subscriptionStatusRaw),
              let totalGenerations = data["totalGenerations"] as? Int,
              let totalPlays = data["totalPlays"] as? Int else {
            return nil
        }
        
        let profileImageURL = data["profileImageURL"] as? String
        let preferences = UserPreferences.fromDictionary(data["preferences"] as? [String: Any] ?? [:])
        
        return MusicGenUserProfile(
            uid: uid,
            email: email,
            displayName: displayName,
            createdAt: createdAtTimestamp.dateValue(),
            currentPlan: currentPlan,
            totalPoints: totalPoints,
            usedPointsToday: usedPointsToday,
            usedPointsThisWeek: usedPointsThisWeek,
            lastPointRefresh: lastPointRefreshTimestamp.dateValue(),
            subscriptionStatus: subscriptionStatus,
            tracks: [], // Tracks loaded separately
            totalGenerations: totalGenerations,
            totalPlays: totalPlays,
            profileImageURL: profileImageURL,
            preferences: preferences
        )
    }
}

// MARK: - User Packages with 70% Profit Margin
enum UserPackage: String, CaseIterable, Codable {
    case free = "free"
    case starter = "starter"
    case pro = "pro"
    case unlimited = "unlimited"
    
    var displayName: String {
        switch self {
        case .free: return "Free"
        case .starter: return "Starter"
        case .pro: return "Pro"
        case .unlimited: return "Unlimited"
        }
    }
    
    var pointsIncluded: Int {
        switch self {
        case .free: return 5        // 5 free generations to try
        case .starter: return 50    // ~$3.50 value for $9.99
        case .pro: return 150       // ~$10.50 value for $24.99
        case .unlimited: return 500 // ~$35 value for $79.99
        }
    }
    
    var dailyLimit: Int {
        switch self {
        case .free: return 2        // Max 2 per day
        case .starter: return 10    // Max 10 per day
        case .pro: return 25        // Max 25 per day
        case .unlimited: return 100 // Max 100 per day
        }
    }
    
    var monthlyPrice: Decimal {
        switch self {
        case .free: return 0.00
        case .starter: return 9.99
        case .pro: return 24.99
        case .unlimited: return 79.99
        }
    }
    
    var costPerGeneration: Decimal {
        switch self {
        case .free: return 0.00
        case .starter: return 0.20   // $9.99 / 50 = $0.20 (285% markup)
        case .pro: return 0.17       // $24.99 / 150 = $0.17 (240% markup)
        case .unlimited: return 0.16 // $79.99 / 500 = $0.16 (227% markup)
        }
    }
    
    var features: [String] {
        switch self {
        case .free:
            return [
                "5 free AI generations",
                "2 generations per day",
                "Basic music genres",
                "Standard quality"
            ]
        case .starter:
            return [
                "50 AI generations/month",
                "10 generations per day",
                "All music genres & moods",
                "High quality exports",
                "Save to library",
                "Basic sharing"
            ]
        case .pro:
            return [
                "150 AI generations/month",
                "25 generations per day",
                "All music genres & moods",
                "Highest quality exports",
                "Unlimited library storage",
                "Advanced sharing & export",
                "Track extension features",
                "Priority generation speed"
            ]
        case .unlimited:
            return [
                "500 AI generations/month",
                "100 generations per day",
                "All premium features",
                "Commercial usage rights",
                "API access for developers",
                "White-label options",
                "Dedicated support",
                "Early access to new features"
            ]
        }
    }
    
    var color: Color {
        switch self {
        case .free: return .gray
        case .starter: return .blue
        case .pro: return .purple
        case .unlimited: return .orange
        }
    }
    
    var icon: String {
        switch self {
        case .free: return "hand.wave"
        case .starter: return "star"
        case .pro: return "crown"
        case .unlimited: return "infinity"
        }
    }
    
    var isPopular: Bool {
        return self == .pro
    }
}

// MARK: - Subscription Status
enum SubscriptionStatus: String, Codable, CaseIterable {
    case active = "active"
    case expired = "expired"
    case cancelled = "cancelled"
    case trial = "trial"
    
    var displayName: String {
        switch self {
        case .active: return "Active"
        case .expired: return "Expired"
        case .cancelled: return "Cancelled"
        case .trial: return "Free Trial"
        }
    }
    
    var color: Color {
        switch self {
        case .active: return .green
        case .expired: return .red
        case .cancelled: return .orange
        case .trial: return .blue
        }
    }
}

// MARK: - User Preferences
struct UserPreferences: Codable {
    var preferredGenres: [String]
    var preferredMoods: [String]
    var autoSave: Bool
    var highQualityExports: Bool
    var notificationsEnabled: Bool
    var analyticsEnabled: Bool
    
    static let defaultPreferences = UserPreferences(
        preferredGenres: ["Techno", "House"],
        preferredMoods: ["Energetic", "Euphoric"],
        autoSave: true,
        highQualityExports: true,
        notificationsEnabled: true,
        analyticsEnabled: true
    )
    
    func toDictionary() -> [String: Any] {
        [
            "preferredGenres": preferredGenres,
            "preferredMoods": preferredMoods,
            "autoSave": autoSave,
            "highQualityExports": highQualityExports,
            "notificationsEnabled": notificationsEnabled,
            "analyticsEnabled": analyticsEnabled
        ]
    }
    
    static func fromDictionary(_ data: [String: Any]) -> UserPreferences? {
        guard let preferredGenres = data["preferredGenres"] as? [String],
              let preferredMoods = data["preferredMoods"] as? [String],
              let autoSave = data["autoSave"] as? Bool,
              let highQualityExports = data["highQualityExports"] as? Bool,
              let notificationsEnabled = data["notificationsEnabled"] as? Bool,
              let analyticsEnabled = data["analyticsEnabled"] as? Bool else {
            return defaultPreferences
        }
        
        return UserPreferences(
            preferredGenres: preferredGenres,
            preferredMoods: preferredMoods,
            autoSave: autoSave,
            highQualityExports: highQualityExports,
            notificationsEnabled: notificationsEnabled,
            analyticsEnabled: analyticsEnabled
        )
    }
}

// MARK: - Track Data (Firebase-compatible)
struct TrackData: Codable, Identifiable {
    var id: String = UUID().uuidString
    let title: String
    let genre: String
    let mood: String
    let prompt: String
    let duration: Double
    let audioURL: String?
    let taskId: String?
    let createdAt: Date
    var isPublished: Bool
    var isFavorite: Bool
    var plays: Int
    var likes: Int
    var imageURL: String?
    var tags: [String]
    
    var formattedDuration: String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
    
    var formattedCreatedAt: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: createdAt)
    }
    
    func toDictionary() -> [String: Any] {
        [
            "id": id,
            "title": title,
            "genre": genre,
            "mood": mood,
            "prompt": prompt,
            "duration": duration,
            "audioURL": audioURL as Any,
            "taskId": taskId as Any,
            "createdAt": Timestamp(date: createdAt),
            "isPublished": isPublished,
            "isFavorite": isFavorite,
            "plays": plays,
            "likes": likes,
            "imageURL": imageURL as Any,
            "tags": tags
        ]
    }
    
    static func fromDictionary(_ data: [String: Any]) -> TrackData? {
        guard let id = data["id"] as? String,
              let title = data["title"] as? String,
              let genre = data["genre"] as? String,
              let mood = data["mood"] as? String,
              let prompt = data["prompt"] as? String,
              let duration = data["duration"] as? Double,
              let createdAtTimestamp = data["createdAt"] as? Timestamp,
              let isPublished = data["isPublished"] as? Bool,
              let isFavorite = data["isFavorite"] as? Bool,
              let plays = data["plays"] as? Int,
              let likes = data["likes"] as? Int,
              let tags = data["tags"] as? [String] else {
            return nil
        }
        
        return TrackData(
            id: id,
            title: title,
            genre: genre,
            mood: mood,
            prompt: prompt,
            duration: duration,
            audioURL: data["audioURL"] as? String,
            taskId: data["taskId"] as? String,
            createdAt: createdAtTimestamp.dateValue(),
            isPublished: isPublished,
            isFavorite: isFavorite,
            plays: plays,
            likes: likes,
            imageURL: data["imageURL"] as? String,
            tags: tags
        )
    }
}

// MARK: - Pricing Analytics
struct PricingAnalytics {
    static let apiCostPerGeneration: Decimal = 0.02  // PiAPI cost
    static let targetProfitMargin: Decimal = 0.70    // 70% profit
    
    static var minimumPricePerGeneration: Decimal {
        apiCostPerGeneration / (1 - targetProfitMargin)  // $0.067
    }
    
    static var recommendedPricePerGeneration: Decimal {
        0.07  // Rounded up for simplicity
    }
    
    static func calculateProfit(for package: UserPackage) -> Decimal {
        let revenue = package.monthlyPrice
        let costs = Decimal(package.pointsIncluded) * apiCostPerGeneration
        return revenue - costs
    }
    
    static func calculateProfitMargin(for package: UserPackage) -> Decimal {
        let profit = calculateProfit(for: package)
        return profit / package.monthlyPrice
    }
}

// MARK: - Firebase Extensions

extension Timestamp {
    convenience init(date: Date) {
        self.init(seconds: Int64(date.timeIntervalSince1970), nanoseconds: 0)
    }
}