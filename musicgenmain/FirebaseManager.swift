import Foundation
@preconcurrency import FirebaseCore
@preconcurrency import FirebaseAuth
@preconcurrency import FirebaseFirestore
import FirebaseFirestoreSwift
#if DEBUG
import FirebaseAppCheck
#endif
import SwiftUI

// MARK: - Firebase Configuration
@MainActor
class FirebaseManager: ObservableObject {
    static let shared = FirebaseManager()
    
    @Published var currentUser: User?
    @Published var userProfile: MusicGenUserProfile?
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var isCloudSyncAvailable = true
    @Published var lastSyncError: String?
    
    private let auth = Auth.auth()
    private let db = Firestore.firestore()
    
    init() {
        // Configure Firebase for Production
        if FirebaseApp.app() == nil {
            // Ensure GoogleService-Info.plist exists for production
            guard Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil else {
                fatalError("⚠️ PRODUCTION ERROR: GoogleService-Info.plist not found. This file is required for production deployment.")
            }
            
            // Temporarily disable AppCheck for development due to registration issue
            #if DEBUG
            // AppCheck.setAppCheckProviderFactory(AppCheckDebugProviderFactory())
            print("🔧 AppCheck temporarily disabled for development")
            #endif
            
            FirebaseApp.configure()
            print("✅ Firebase configured successfully for production")
            
            // Configure Firestore settings for better offline support
            let settings = FirestoreSettings()
            settings.isPersistenceEnabled = true
            settings.cacheSizeBytes = FirestoreCacheSizeUnlimited
            db.settings = settings
            
            // Suppress AppCheck errors in development
            #if DEBUG
            print("🔧 DEBUG MODE: AppCheck errors will be suppressed")
            print("🔧 Firebase Configuration:")
            print("   Project ID: \(FirebaseApp.app()?.options.projectID ?? "nil")")
            print("   Bundle ID: \(Bundle.main.bundleIdentifier ?? "nil")")
            print("   Google App ID: \(FirebaseApp.app()?.options.googleAppID ?? "nil")")
            #endif
            
        } else {
            print("✅ Firebase already configured for production")
        }
        
        // Listen for auth state changes
        _ = auth.addStateDidChangeListener { [weak self] _, user in
            DispatchQueue.main.async {
                self?.currentUser = user
                self?.isAuthenticated = user != nil
                
                if let user = user {
                    self?.loadUserProfile(uid: user.uid)
                } else {
                    self?.userProfile = nil
                }
            }
        }
    }
}

// MARK: - Authentication Methods
extension FirebaseManager {
    
    func signInWithEmail(email: String, password: String) async throws {
        print("🔐 Production sign in with email: \(email)")
        isLoading = true
        errorMessage = nil
        
        do {
            let result = try await auth.signIn(withEmail: email, password: password)
            print("✅ Sign in successful for user: \(result.user.uid)")
            DispatchQueue.main.async {
                self.currentUser = result.user
                self.isLoading = false
            }
        } catch {
            print("❌ Sign in failed: \(error.localizedDescription)")
            DispatchQueue.main.async {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
            throw error
        }
    }
    
    func signUpWithEmail(email: String, password: String, displayName: String) async throws {
        print("📝 Production sign up with email: \(email)")
        isLoading = true
        errorMessage = nil
        
        do {
            let result = try await auth.createUser(withEmail: email, password: password)
            print("✅ User created successfully: \(result.user.uid)")
            
            // Update display name
            let changeRequest = result.user.createProfileChangeRequest()
            changeRequest.displayName = displayName
            try await changeRequest.commitChanges()
            print("✅ Display name updated: \(displayName)")
            
            // Create user profile in Firestore
            try await createUserProfile(user: result.user, displayName: displayName)
            print("✅ User profile created in Firestore")
            
            DispatchQueue.main.async {
                self.currentUser = result.user
                self.isLoading = false
            }
        } catch {
            print("❌ Sign up failed: \(error.localizedDescription)")
            DispatchQueue.main.async {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
            throw error
        }
    }
    
    func signInWithGoogle() async throws {
        // TODO: Implement Google Sign-In
        throw NSError(domain: "NotImplemented", code: 0, userInfo: [NSLocalizedDescriptionKey: "Google Sign-In not implemented yet"])
    }
    
    func signOut() {
        do {
            try auth.signOut()
            DispatchQueue.main.async {
                self.currentUser = nil
                self.userProfile = nil
                self.isAuthenticated = false
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
    
    func resetPassword(email: String) async throws {
        try await auth.sendPasswordReset(withEmail: email)
    }
}

// MARK: - User Profile Management
extension FirebaseManager {
    
    private func createUserProfile(user: User, displayName: String) async throws {
        let userProfile = MusicGenUserProfile(
            uid: user.uid,
            email: user.email ?? "",
            displayName: displayName,
            createdAt: Date(),
            currentPlan: .free,
            totalPoints: UserPackage.free.pointsIncluded,
            usedPointsToday: 0,
            usedPointsThisWeek: 0,
            lastPointRefresh: Date(),
            subscriptionStatus: .active,
            tracks: [],
            totalGenerations: 0,
            totalPlays: 0
        )
        
        try await db.collection("users").document(user.uid).setData(userProfile.toDictionary())
        
        DispatchQueue.main.async {
            self.userProfile = userProfile
        }
    }
    
    func loadUserProfile(uid: String) {
        db.collection("users").document(uid).getDocument { [weak self] document, error in
            if let error = error {
                print("Error loading user profile: \(error)")
                return
            }
            
            guard let document = document, document.exists,
                  let data = document.data() else {
                print("User profile not found")
                return
            }
            
            DispatchQueue.main.async {
                self?.userProfile = MusicGenUserProfile.fromDictionary(data)
            }
        }
    }
    
    func updateUserProfile(_ profile: MusicGenUserProfile) async throws {
        guard let uid = currentUser?.uid else { throw AuthError.notAuthenticated }
        
        try await db.collection("users").document(uid).updateData(profile.toDictionary())
        
        DispatchQueue.main.async {
            self.userProfile = profile
        }
    }
}

// MARK: - Points & Subscription Management
extension FirebaseManager {
    
    func canUserGenerate() -> (canGenerate: Bool, reason: String) {
        guard isAuthenticated else {
            return (false, "Please sign in to generate music")
        }
        
        guard let profile = userProfile else {
            return (false, "User profile not loaded")
        }
        
        print("🔍 Generation Check:")
        print("   - Total Points: \(profile.totalPoints)")
        print("   - Used Today: \(profile.usedPointsToday)")
        print("   - Daily Limit: \(profile.currentPlan.dailyLimit)")
        print("   - Plan: \(profile.currentPlan.displayName)")
        
        // Auto-refresh daily limits if it's a new day
        let calendar = Calendar.current
        let now = Date()
        if !calendar.isDate(now, inSameDayAs: profile.lastPointRefresh) {
            print("🔄 New day detected, resetting daily usage")
            Task {
                try? await refreshDailyLimits()
            }
        }
        
        // Check if user has points
        if profile.totalPoints <= 0 {
            return (false, "No points remaining. Please upgrade your plan.")
        }
        
        // Check daily limit
        let dailyLimit = profile.currentPlan.dailyLimit
        if profile.usedPointsToday >= dailyLimit {
            return (false, "Daily limit reached (\(profile.usedPointsToday)/\(dailyLimit)). Try again tomorrow!")
        }
        
        print("✅ Generation allowed: \(profile.totalPoints) points, \(profile.usedPointsToday)/\(dailyLimit) used today")
        return (true, "")
    }
    
    func consumePoint() async throws {
        guard var profile = userProfile else { throw AuthError.notAuthenticated }
        
        let validation = canUserGenerate()
        if !validation.canGenerate {
            throw PointsError.insufficientPoints(validation.reason)
        }
        
        // Consume point
        profile.totalPoints -= 1
        profile.usedPointsToday += 1
        profile.usedPointsThisWeek += 1
        profile.totalGenerations += 1
        
        try await updateUserProfile(profile)
    }
    
    func refreshWeeklyPoints() async throws {
        guard var profile = userProfile else { throw AuthError.notAuthenticated }
        
        let calendar = Calendar.current
        let now = Date()
        let lastRefresh = profile.lastPointRefresh
        
        // Check if a week has passed
        if calendar.dateInterval(of: .weekOfYear, for: now) != calendar.dateInterval(of: .weekOfYear, for: lastRefresh) {
            profile.totalPoints = profile.currentPlan.pointsIncluded
            profile.usedPointsThisWeek = 0
            profile.lastPointRefresh = now
            
            try await updateUserProfile(profile)
        }
    }
    
    func refreshDailyLimits() async throws {
        guard var profile = userProfile else { throw AuthError.notAuthenticated }
        
        let calendar = Calendar.current
        let now = Date()
        let lastRefresh = profile.lastPointRefresh
        
        // Check if a day has passed
        if !calendar.isDate(now, inSameDayAs: lastRefresh) {
            print("🔄 Refreshing daily limits - resetting used points to 0")
            profile.usedPointsToday = 0
            profile.lastPointRefresh = now
            
            try await updateUserProfile(profile)
        }
    }
    
    // Demo function to reset limits for testing
    func resetDailyLimitsForTesting() async throws {
        guard var profile = userProfile else { throw AuthError.notAuthenticated }
        
        print("🔧 TESTING: Resetting daily limits and restoring points")
        profile.usedPointsToday = 0
        profile.lastPointRefresh = Date()
        
        // For demo mode, restore some points if running low
        if profile.totalPoints < 5 {
            profile.totalPoints = profile.currentPlan.pointsIncluded
        }
        
        try await updateUserProfile(profile)
    }
    
    func upgradeUserPlan(to newPlan: UserPackage) async throws {
        guard var profile = userProfile else { throw AuthError.notAuthenticated }
        
        profile.currentPlan = newPlan
        profile.totalPoints = newPlan.pointsIncluded
        profile.usedPointsToday = 0
        profile.usedPointsThisWeek = 0
        profile.lastPointRefresh = Date()
        profile.subscriptionStatus = .active
        
        try await updateUserProfile(profile)
    }
    
}

// MARK: - Track Management
extension FirebaseManager {
    
    func saveTrack(_ track: TrackData) async throws {
        guard let uid = currentUser?.uid else { throw AuthError.notAuthenticated }
        
        // Generate track with ID
        let trackRef = db.collection("users").document(uid).collection("tracks").document()
        var trackWithId = track
        trackWithId.id = trackRef.documentID
        
        do {
            // Try to save track to Firestore
            try await trackRef.setData(trackWithId.toDictionary())
            
            // Update user profile track count
            if var profile = userProfile {
                profile.tracks.append(trackWithId)
                try await updateUserProfile(profile)
            }
            
            // Mark cloud sync as available if it was previously offline
            if !isCloudSyncAvailable {
                isCloudSyncAvailable = true
                lastSyncError = nil
                print("✅ Cloud sync restored")
            }
            
            // Update last successful sync time
            UserDefaults.standard.set(Date(), forKey: "lastSuccessfulSync")
            NotificationCenter.default.post(name: .init("CloudSyncStatusChanged"), object: nil)
            
        } catch {
            print("❌ Cloud sync failed, saving locally: \(error)")
            
            // Mark cloud sync as offline
            isCloudSyncAvailable = false
            lastSyncError = "Cloud sync offline: \(error.localizedDescription)"
            
            // Save locally anyway (update local profile)
            if var profile = userProfile {
                profile.tracks.append(trackWithId)
                userProfile = profile // Update local state immediately
                
                // Store for later sync
                storeTrackForLaterSync(trackWithId)
            }
            
            // Don't throw the error - we handled it gracefully with local storage
            print("📱 Track saved locally, will sync when connection is restored")
        }
    }
    
    // MARK: - Offline Support
    
    private func storeTrackForLaterSync(_ track: TrackData) {
        let userDefaults = UserDefaults.standard
        var pendingTracks = getPendingSyncTracks()
        pendingTracks.append(track)
        
        if let encoded = try? JSONEncoder().encode(pendingTracks) {
            userDefaults.set(encoded, forKey: "pendingSyncTracks")
            print("💾 Stored track for later sync: \(track.title)")
        }
    }
    
    private func getPendingSyncTracks() -> [TrackData] {
        let userDefaults = UserDefaults.standard
        guard let data = userDefaults.data(forKey: "pendingSyncTracks"),
              let tracks = try? JSONDecoder().decode([TrackData].self, from: data) else {
            return []
        }
        return tracks
    }
    
    func syncPendingTracks() async {
        let pendingTracks = getPendingSyncTracks()
        guard !pendingTracks.isEmpty else { return }
        
        print("🔄 Syncing \(pendingTracks.count) pending tracks...")
        
        var successfulSyncs: [TrackData] = []
        
        for track in pendingTracks {
            do {
                // Try to sync each track
                guard let uid = currentUser?.uid else { continue }
                let trackRef = db.collection("users").document(uid).collection("tracks").document(track.id)
                try await trackRef.setData(track.toDictionary())
                successfulSyncs.append(track)
                print("✅ Synced track: \(track.title)")
            } catch {
                print("❌ Failed to sync track: \(track.title) - \(error)")
                break // Stop syncing if we hit an error
            }
        }
        
        // Remove successfully synced tracks from pending list
        if !successfulSyncs.isEmpty {
            let remainingTracks = pendingTracks.filter { track in
                !successfulSyncs.contains { $0.id == track.id }
            }
            
            let userDefaults = UserDefaults.standard
            if remainingTracks.isEmpty {
                userDefaults.removeObject(forKey: "pendingSyncTracks")
                print("✅ All pending tracks synced successfully")
                
                // Update sync timestamp and notify UI
                userDefaults.set(Date(), forKey: "lastSuccessfulSync")
                NotificationCenter.default.post(name: .init("CloudSyncStatusChanged"), object: nil)
            } else if let encoded = try? JSONEncoder().encode(remainingTracks) {
                userDefaults.set(encoded, forKey: "pendingSyncTracks")
                print("📦 \(remainingTracks.count) tracks still pending sync")
            }
        }
    }
    
    func loadUserTracks() async throws -> [TrackData] {
        guard let uid = currentUser?.uid else { throw AuthError.notAuthenticated }
        
        let snapshot = try await db.collection("users").document(uid).collection("tracks")
            .order(by: "createdAt", descending: true)
            .getDocuments()
        
        return snapshot.documents.compactMap { document in
            TrackData.fromDictionary(document.data())
        }
    }
    
    @MainActor
    func refreshUserLibrary() async throws {
        guard var profile = userProfile else { throw AuthError.notAuthenticated }
        
        print("🔄 Refreshing user library from Firestore...")
        let tracks = try await loadUserTracks()
        profile.tracks = tracks
        
        // Update local profile
        self.userProfile = profile
        
        print("✅ Library refreshed: \(tracks.count) tracks loaded")
    }
    
    func deleteTrack(trackId: String) async throws {
        guard let uid = currentUser?.uid else { throw AuthError.notAuthenticated }
        
        try await db.collection("users").document(uid).collection("tracks").document(trackId).delete()
        
        // Update user profile
        if var profile = userProfile {
            profile.tracks.removeAll { $0.id == trackId }
            try await updateUserProfile(profile)
        }
    }
    
    func toggleTrackFavorite(_ track: TrackData) async throws {
        guard let uid = currentUser?.uid else { throw AuthError.notAuthenticated }
        
        // Update in Firestore
        let trackRef = db.collection("users").document(uid).collection("tracks").document(track.id)
        try await trackRef.updateData(["isFavorite": !track.isFavorite])
        
        // Update local data
        if var profile = userProfile {
            if let index = profile.tracks.firstIndex(where: { $0.id == track.id }) {
                profile.tracks[index].isFavorite = !track.isFavorite
                try await updateUserProfile(profile)
            }
        }
    }
    
    func incrementPlayCount(for track: TrackData) async throws {
        guard let uid = currentUser?.uid else { throw AuthError.notAuthenticated }
        
        // Update in Firestore
        let trackRef = db.collection("users").document(uid).collection("tracks").document(track.id)
        try await trackRef.updateData([
            "plays": FieldValue.increment(Int64(1))
        ])
        
        // Update local data and user stats
        if var profile = userProfile {
            if let index = profile.tracks.firstIndex(where: { $0.id == track.id }) {
                profile.tracks[index].plays += 1
            }
            profile.totalPlays += 1
            try await updateUserProfile(profile)
        }
    }
    
    func publishTrack(_ track: TrackData) async throws {
        guard let uid = currentUser?.uid else { throw AuthError.notAuthenticated }
        
        // Update in user's personal collection
        let trackRef = db.collection("users").document(uid).collection("tracks").document(track.id)
        try await trackRef.updateData(["isPublished": true])
        
        // Add to public published_tracks collection for the feed
        try await db.collection("published_tracks")
            .document(track.id)
            .setData([
                "title": track.title,
                "genre": track.genre,
                "mood": track.mood,
                "audioURL": track.audioURL ?? "",
                "coverURL": track.imageURL ?? "",
                "likes": 0,
                "plays": 0,
                "ownerUID": uid,
                "ownerName": currentUser?.displayName ?? userProfile?.displayName ?? "Anonymous",
                "createdAt": FieldValue.serverTimestamp()
            ])
        
        // Update local data
        if var profile = userProfile {
            if let index = profile.tracks.firstIndex(where: { $0.id == track.id }) {
                profile.tracks[index].isPublished = true
                try await updateUserProfile(profile)
            }
        }
    }
}

// MARK: - Feed
extension FirebaseManager {
    
    @MainActor
    func listenForFeed(startAfter lastDoc: DocumentSnapshot? = nil, limit: Int = 25) async throws -> AsyncThrowingStream<(tracks: [TrackData], lastDocument: DocumentSnapshot?), Error> {
        var query: Query = db.collection("published_tracks")
            .order(by: "createdAt", descending: true)
            .limit(to: limit)
        
        // Add pagination if we have a last document
        if let lastDoc = lastDoc {
            query = query.start(afterDocument: lastDoc)
        }
        
        return AsyncThrowingStream { continuation in
            let listener = query.addSnapshotListener { snap, err in
                if let err = err { 
                    continuation.finish(throwing: err)
                    return 
                }
                
                guard let snap = snap else {
                    continuation.yield((tracks: [], lastDocument: nil))
                    return
                }
                
                let tracks = snap.documents.compactMap { doc -> TrackData? in
                    let data = doc.data()
                    
                    // Map published track data to TrackData
                    return TrackData(
                        id: doc.documentID,
                        title: data["title"] as? String ?? "",
                        genre: data["genre"] as? String ?? "",
                        mood: data["mood"] as? String ?? "",
                        prompt: "",
                        duration: 0,
                        audioURL: data["audioURL"] as? String,
                        taskId: nil,
                        createdAt: (data["createdAt"] as? Timestamp)?.dateValue() ?? Date(),
                        isPublished: true,
                        isFavorite: false,
                        plays: data["plays"] as? Int ?? 0,
                        likes: data["likes"] as? Int ?? 0,
                        imageURL: data["coverURL"] as? String,
                        tags: []
                    )
                }
                
                // Get the last document for pagination
                let lastDocument = snap.documents.last
                
                continuation.yield((tracks: tracks, lastDocument: lastDocument))
            }
            
            continuation.onTermination = { _ in 
                listener.remove() 
            }
        }
    }
    
    @MainActor
    func fetchTrending(limit: Int = 25) async throws -> (tracks: [TrackData], lastDocument: DocumentSnapshot?) {
        // Get tracks from last 24 hours ordered by likes
        let twentyFourHoursAgo = Timestamp(date: Date().addingTimeInterval(-24 * 60 * 60))
        
        let snapshot = try await db.collection("published_tracks")
            .whereField("createdAt", isGreaterThan: twentyFourHoursAgo)
            .order(by: "likes", descending: true)
            .limit(to: limit)
            .getDocuments()
        
        let tracks = snapshot.documents.compactMap { doc -> TrackData? in
            let data = doc.data()
            
            return TrackData(
                id: doc.documentID,
                title: data["title"] as? String ?? "",
                genre: data["genre"] as? String ?? "",
                mood: data["mood"] as? String ?? "",
                prompt: "",
                duration: 0,
                audioURL: data["audioURL"] as? String,
                taskId: nil,
                createdAt: (data["createdAt"] as? Timestamp)?.dateValue() ?? Date(),
                isPublished: true,
                isFavorite: false,
                plays: data["plays"] as? Int ?? 0,
                likes: data["likes"] as? Int ?? 0,
                imageURL: data["coverURL"] as? String,
                tags: []
            )
        }
        
        return (tracks: tracks, lastDocument: snapshot.documents.last)
    }
    
    func toggleFeedLike(trackID: String, isLiked: Bool) async throws {
        // Deprecated - use toggleFeedLikeSafe instead
        let ref = db.collection("published_tracks").document(trackID)
        try await ref.updateData(["likes": FieldValue.increment(Int64(isLiked ? -1 : 1))])
    }
    
    func toggleFeedLikeSafe(trackID: String) async throws -> Bool {
        guard let uid = currentUser?.uid else { throw AuthError.notAuthenticated }
        
        let likeRef = db.collection("users").document(uid)
                        .collection("liked").document(trackID)
        let trackRef = db.collection("published_tracks").document(trackID)
        
        var isNowLiked = false
        
        _ = try await db.runTransaction { transaction, errorPointer in
            do {
                // Check if user already liked this track
                let likeDoc = try transaction.getDocument(likeRef)
                let exists = likeDoc.exists
                
                if exists {
                    // Unlike: Remove like and decrement counter
                    transaction.deleteDocument(likeRef)
                    transaction.updateData(["likes": FieldValue.increment(Int64(-1))], forDocument: trackRef)
                    isNowLiked = false
                } else {
                    // Like: Add like and increment counter
                    transaction.setData([
                        "liked": true,
                        "ts": FieldValue.serverTimestamp()
                    ], forDocument: likeRef)
                    transaction.updateData(["likes": FieldValue.increment(Int64(1))], forDocument: trackRef)
                    isNowLiked = true
                }
                
                return nil
            } catch {
                errorPointer?.pointee = error as NSError
                return nil
            }
        }
        
        return isNowLiked
    }
    
    func getUserLikedTracks() async throws -> Set<String> {
        guard let uid = currentUser?.uid else { throw AuthError.notAuthenticated }
        
        let snapshot = try await db.collection("users").document(uid)
            .collection("liked")
            .getDocuments()
        
        return Set(snapshot.documents.map { $0.documentID })
    }
    
    func incrementFeedPlay(trackID: String) async {
        let ref = db.collection("published_tracks").document(trackID)
        try? await ref.updateData(["plays": FieldValue.increment(Int64(1))])
    }
}

// MARK: - Error Types
enum AuthError: Error, LocalizedError {
    case notAuthenticated
    case profileNotFound
    case invalidCredentials
    
    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "User not authenticated"
        case .profileNotFound:
            return "User profile not found"
        case .invalidCredentials:
            return "Invalid email or password"
        }
    }
}

enum PointsError: Error, LocalizedError {
    case insufficientPoints(String)
    case dailyLimitReached
    case subscriptionExpired
    
    var errorDescription: String? {
        switch self {
        case .insufficientPoints(let reason):
            return reason
        case .dailyLimitReached:
            return "Daily generation limit reached"
        case .subscriptionExpired:
            return "Subscription has expired"
        }
    }
}

