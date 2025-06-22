import Foundation

// MARK: - API Configuration
struct APIConfiguration {
    // PRODUCTION: Real PiAPI Configuration
    static let piApiBaseURL = "https://api.piapi.ai"
    static let piApiKey = "d3a513bec58ea7c7e60eebf377fbbfb806f2304f12e1ef208cd701139658c088"
    
    // MARK: - Generation Settings
    static let maxGenerationAttempts = 4
    static let generationTimeout: TimeInterval = 300 // 5 minutes
    static let pollingInterval: TimeInterval = 5 // 5 seconds
    static let maxRetries = 60 // 5 minutes max wait
    
    // MARK: - PiAPI Model Configuration
    static let defaultModel = "music-s"  // Changed to working model
    static let defaultTaskType = "generate_music"
    static let extendTaskType = "generate_music_custom"  // For extensions
    static let uploadTaskType = "upload_audio"  // For audio uploads
    static let defaultLyricsType = "instrumental"
    static let defaultSeed = -1
    
    // MARK: - Test Mode Configuration
    static let isTestMode = false // REAL API ONLY - No test mode
    static let testModeDelay: TimeInterval = 3.0 // Simulate generation time
    
    // MARK: - Error Handling
    static let enableDetailedErrorLogging = true
    static let enableAnalytics = true
    
    // MARK: - Supported Features
    static let supportedGenres = [
        "Techno", "House", "Chill", "Trance", "Industrial", 
        "Hip Hop", "Pop", "Rock", "Jazz", "Classical",
        "Electronic", "Ambient", "Dubstep", "Trap"
    ]
    
    static let supportedMoods = [
        "Energetic", "Euphoric", "Dark", "Minimal", "Dreamy", 
        "Aggressive", "Romantic", "Melancholic", "Uplifting",
        "Intense", "Relaxing", "Mysterious"
    ]
    
    static let supportedKeys = [
        "C Major", "G Major", "D Major", "A Major", "E Major", 
        "F Major", "Bb Major", "Eb Major", "Ab Major", "Db Major", 
        "A Minor", "E Minor", "B Minor", "F# Minor", "C# Minor", 
        "D Minor", "G Minor", "C Minor", "F Minor", "Bb Minor"
    ]
    
    // MARK: - Generation Quality Settings
    enum GenerationQuality: String, CaseIterable {
        case standard = "standard"
        case high = "high"
        case ultra = "ultra"
        
        var maxDuration: Double {
            switch self {
            case .standard: return 30
            case .high: return 60
            case .ultra: return 120
            }
        }
        
        var estimatedTime: TimeInterval {
            switch self {
            case .standard: return 30
            case .high: return 60
            case .ultra: return 120
            }
        }
    }
    
    // MARK: - Helper Methods
    static func buildPrompt(genre: String, mood: String, prompt: String?, bpm: Int?, key: String?) -> String {
        var fullPrompt = prompt ?? ""
        
        if fullPrompt.isEmpty {
            fullPrompt = "A \(genre.lowercased()) track with \(mood.lowercased()) vibes"
        }
        
        if let bpm = bpm {
            fullPrompt += " at \(bpm) BPM"
        }
        
        if let key = key {
            fullPrompt += " in the key of \(key)"
        }
        
        return fullPrompt
    }
    
    static func validateInputs(genre: String, mood: String, duration: Double) -> Bool {
        return supportedGenres.contains(genre) && 
               supportedMoods.contains(mood) && 
               duration >= 10 && duration <= 300
    }
    
    static func logGenerationRequest(genre: String, mood: String, prompt: String?) {
        if enableDetailedErrorLogging {
            print("🎵 API Request: Genre=\(genre), Mood=\(mood), Prompt=\(prompt ?? "auto")")
        }
    }
    
    static func logGenerationResponse(success: Bool, duration: TimeInterval?, error: Error?) {
        if enableDetailedErrorLogging {
            if success {
                print("✅ Generation successful in \(duration ?? 0)s")
            } else {
                print("❌ Generation failed: \(error?.localizedDescription ?? "Unknown error")")
            }
        }
    }
}