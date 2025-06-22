//
//  musicgenmainTests.swift
//  musicgenmainTests
//
//  Created by ETCH on 15/06/2025.
//

import Testing
@testable import musicgenmain

struct musicgenmainTests {

    // MARK: - User Model Tests
    
    @Test func userProfileCreation() async throws {
        let userProfile = MusicGenUserProfile(
            id: "test-id",
            email: "test@example.com",
            username: "testuser",
            currentPlan: .free,
            remainingPoints: 10,
            usedPointsToday: 0,
            totalPointsUsed: 0,
            createdAt: Date(),
            lastActiveAt: Date(),
            streakDays: 1,
            favoriteGenres: ["Techno"],
            isEmailVerified: true,
            profileImageURL: nil,
            bio: nil,
            socialLinks: [:],
            lastDailyReset: Date()
        )
        
        #expect(userProfile.email == "test@example.com")
        #expect(userProfile.currentPlan == .free)
        #expect(userProfile.remainingPoints == 10)
        #expect(userProfile.canGenerateToday == true)
    }
    
    @Test func subscriptionPlanProperties() async throws {
        let freePlan = SubscriptionPlan.free
        #expect(freePlan.dailyLimit == 3)
        #expect(freePlan.maxPoints == 10)
        #expect(freePlan.price == 0)
        
        let proPlan = SubscriptionPlan.pro
        #expect(proPlan.dailyLimit == 100)
        #expect(proPlan.maxPoints == 2000)
        #expect(proPlan.price == 29.99)
    }
    
    @Test func dailyLimitCalculation() async throws {
        var userProfile = MusicGenUserProfile(
            id: "test-id",
            email: "test@example.com",
            username: "testuser",
            currentPlan: .free,
            remainingPoints: 10,
            usedPointsToday: 3,
            totalPointsUsed: 0,
            createdAt: Date(),
            lastActiveAt: Date(),
            streakDays: 1,
            favoriteGenres: [],
            isEmailVerified: true,
            profileImageURL: nil,
            bio: nil,
            socialLinks: [:],
            lastDailyReset: Date()
        )
        
        // Should reach daily limit for free plan (3/3 used)
        #expect(userProfile.canGenerateToday == false)
        
        // Upgrade to pro plan
        userProfile.currentPlan = .pro
        #expect(userProfile.canGenerateToday == true)
    }
    
    // MARK: - Track Model Tests
    
    @Test func trackCreation() async throws {
        let track = MusicTrack(
            id: "track-1",
            title: "Test Track",
            duration: 120,
            genre: "Techno",
            mood: "Energetic",
            isInstrumental: true,
            audioURL: URL(string: "https://example.com/track.mp3")!,
            imageURL: URL(string: "https://example.com/image.jpg")!,
            createdAt: Date(),
            prompt: "Test prompt",
            lyrics: nil,
            bpm: 128,
            key: "C",
            tags: ["electronic", "techno"],
            isPublic: false,
            createdBy: "user-id",
            playCount: 0,
            likeCount: 0,
            downloadCount: 0,
            extendedFromTrackId: nil,
            remixedFromTrackId: nil
        )
        
        #expect(track.title == "Test Track")
        #expect(track.genre == "Techno")
        #expect(track.duration == 120)
        #expect(track.isInstrumental == true)
        #expect(track.isPublic == false)
    }
    
    // MARK: - Validation Tests
    
    @Test func emailValidation() async throws {
        // Test valid emails
        #expect(isValidEmail("test@example.com") == true)
        #expect(isValidEmail("user.name@domain.co.uk") == true)
        #expect(isValidEmail("123@test.org") == true)
        
        // Test invalid emails
        #expect(isValidEmail("invalid-email") == false)
        #expect(isValidEmail("@domain.com") == false)
        #expect(isValidEmail("test@") == false)
        #expect(isValidEmail("") == false)
    }
    
    @Test func usernameValidation() async throws {
        // Test valid usernames
        #expect(isValidUsername("validuser") == true)
        #expect(isValidUsername("user123") == true)
        #expect(isValidUsername("user_name") == true)
        
        // Test invalid usernames
        #expect(isValidUsername("ab") == false) // too short
        #expect(isValidUsername("toolongusernamethatexceedslimit") == false) // too long
        #expect(isValidUsername("user name") == false) // spaces
        #expect(isValidUsername("user@name") == false) // special chars
    }
    
    // MARK: - Performance Tests
    
    @Test func performanceUserCreation() async throws {
        // Test performance of creating multiple user profiles
        let startTime = Date()
        
        for i in 0..<1000 {
            let _ = MusicGenUserProfile(
                id: "user-\(i)",
                email: "user\(i)@example.com",
                username: "user\(i)",
                currentPlan: .free,
                remainingPoints: 10,
                usedPointsToday: 0,
                totalPointsUsed: 0,
                createdAt: Date(),
                lastActiveAt: Date(),
                streakDays: 1,
                favoriteGenres: [],
                isEmailVerified: true,
                profileImageURL: nil,
                bio: nil,
                socialLinks: [:],
                lastDailyReset: Date()
            )
        }
        
        let executionTime = Date().timeIntervalSince(startTime)
        #expect(executionTime < 1.0) // Should complete in under 1 second
    }
}

// MARK: - Helper Functions

private func isValidEmail(_ email: String) -> Bool {
    let emailRegex = "^[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
    return emailPredicate.evaluate(with: email)
}

private func isValidUsername(_ username: String) -> Bool {
    let minLength = 3
    let maxLength = 20
    let usernameRegex = "^[a-zA-Z0-9_]+$"
    
    guard username.count >= minLength && username.count <= maxLength else {
        return false
    }
    
    let usernamePredicate = NSPredicate(format: "SELF MATCHES %@", usernameRegex)
    return usernamePredicate.evaluate(with: username)
}
