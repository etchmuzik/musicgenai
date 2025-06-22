import Foundation
import AVFoundation

// MARK: - MusicGen Streaming API
struct MusicGenAPI {
    static let base = URL(string: "\(APIConfiguration.piApiBaseURL)/api/v1/task")!
    static let apiKey = APIConfiguration.piApiKey
    
    // MARK: - API Models
    enum APIModel: String {
        case udioMusicU = "music-u"
        case diffRhythm = "Qubico/diffrhythm"
    }
    
    enum TaskType: String {
        case generateMusic = "generate_music"
        case txt2audioBase = "txt2audio-base"    // DiffRhythm 1.35 min
        case txt2audioFull = "txt2audio-full"    // DiffRhythm 4.45 min
    }
    
    static func streamMultiple(genre: String, mood: String, prompt: String? = nil, duration: Double = 30.0, isInstrumental: Bool = true, customLyrics: String? = nil) async throws -> [GeneratedTrack] {
        print("🚀 MusicGenAPI.stream called with:")
        print("   Genre: \(genre)")
        print("   Mood: \(mood)")
        print("   Prompt: \(prompt ?? "none")")
        print("   Duration: \(duration)s")
        print("   Instrumental: \(isInstrumental)")
        print("   Custom Lyrics: \(customLyrics != nil ? "yes" : "no")")
        print("   API URL: \(base)")
        print("   API Key: \(apiKey.prefix(10))...")
        
        // Check if test mode is enabled
        if APIConfiguration.isTestMode {
            print("🧪 TEST MODE ENABLED - Using demo audio instead of PiAPI")
            return try await generateTestAudioMultiple(genre: genre, mood: mood, count: 2)
        }
        
        var req = URLRequest(url: base)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        
        // Build the simplified prompt for PiAPI
        let fullPrompt = buildSimplifiedPrompt(
            genre: genre,
            mood: mood,
            prompt: prompt,
            isInstrumental: isInstrumental,
            customLyrics: customLyrics
        )
        
        print("🎵 Full prompt generated: \(fullPrompt)")
        
        // Log the request
        APIConfiguration.logGenerationRequest(genre: genre, mood: mood, prompt: prompt)
        
        // Determine correct lyrics_type based on PiAPI docs
        let lyricsType: String
        if isInstrumental {
            lyricsType = "instrumental"
        } else if customLyrics != nil && !customLyrics!.isEmpty {
            lyricsType = "user"
        } else {
            lyricsType = "generate"
        }
        
        let requestBody = PiAPIUdioMusicRequest(
            model: APIConfiguration.defaultModel,
            taskType: APIConfiguration.defaultTaskType,
            input: PiAPIUdioInput(
                gptDescriptionPrompt: fullPrompt,
                negativeTags: "",
                lyricsType: lyricsType,
                seed: APIConfiguration.defaultSeed,
                lyrics: customLyrics
            ),
            config: PiAPITaskConfig(
                serviceMode: "public", // PAYG mode
                webhookConfig: PiAPIWebhookConfig(
                    endpoint: "",
                    secret: ""
                )
            )
        )
        
        let requestBodyData = try JSONEncoder().encode(requestBody)
        req.httpBody = requestBodyData
        
        print("📦 Request body size: \(requestBodyData.count) bytes")
        if let bodyString = String(data: requestBodyData, encoding: .utf8) {
            print("📦 Request body: \(bodyString)")
        }
        
        // First, create the generation task
        print("📡 Sending request to PiAPI...")
        let (data, response) = try await URLSession.shared.data(for: req)
        
        print("📨 Response received:")
        print("   Status code: \((response as? HTTPURLResponse)?.statusCode ?? 0)")
        print("   Data size: \(data.count) bytes")
        
        if let responseString = String(data: data, encoding: .utf8) {
            print("   Response body: \(responseString)")
        }
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            print("❌ HTTP Error: \((response as? HTTPURLResponse)?.statusCode ?? 0)")
            if let errorString = String(data: data, encoding: .utf8) {
                print("❌ Error response: \(errorString)")
            }
            throw APIError.serverError
        }
        
        let taskResponse = try JSONDecoder().decode(PiAPITaskResponse.self, from: data)
        let taskId = taskResponse.data.taskId
        
        print("✅ Task created successfully with ID: \(taskId)")
        
        // Poll for completion using configuration
        var audioURL: String?
        var attempts = 0
        let maxAttempts = APIConfiguration.maxRetries
        let pollingInterval = UInt64(APIConfiguration.pollingInterval * 1_000_000_000) // Convert to nanoseconds
        
        print("🔄 Starting polling for task completion...")
        print("   Max attempts: \(maxAttempts)")
        print("   Polling interval: \(APIConfiguration.pollingInterval) seconds")
        
        while audioURL == nil && attempts < maxAttempts {
            try await Task.sleep(nanoseconds: pollingInterval)
            attempts += 1
            
            print("🔄 Polling attempt \(attempts)/\(maxAttempts)...")
            
            let statusURL = URL(string: "\(APIConfiguration.piApiBaseURL)/api/v1/task/\(taskId)")!
            var statusReq = URLRequest(url: statusURL)
            statusReq.setValue(apiKey, forHTTPHeaderField: "x-api-key")
            
            let (statusData, _) = try await URLSession.shared.data(for: statusReq)
            
            // Debug: Print raw response
            if let responseString = String(data: statusData, encoding: .utf8) {
                print("   Raw status response: \(responseString)")
            }
            
            do {
                let statusResponse = try JSONDecoder().decode(PiAPITaskResponse.self, from: statusData)
                
                print("   Status: \(statusResponse.data.status)")
                print("   Output songs count: \(statusResponse.data.output.songs?.count ?? 0)")
                
                // Check for completion - try different status values
                if ["completed", "success", "finished"].contains(statusResponse.data.status.lowercased()) {
                    if let songs = statusResponse.data.output.songs, !songs.isEmpty {
                        for (index, song) in songs.enumerated() {
                            print("   Song \(index): audioUrl=\(song.audioUrl ?? "nil"), songPath=\(song.songPath ?? "nil"), title=\(song.title ?? "nil")")
                        }
                        
                        if let firstSong = songs.first {
                            // Try songPath first (PiAPI's actual field), then fallback to audioUrl
                            let url = firstSong.songPath ?? firstSong.audioUrl
                            if let url = url, !url.isEmpty {
                                audioURL = url
                                print("✅ Generation completed! Audio URL: \(url)")
                                break
                            } else {
                                print("⚠️ Completed but no valid audio URL found")
                            }
                        } else {
                            print("⚠️ Completed but no songs in output")
                        }
                    } else {
                        print("⚠️ Completed but no songs in output")
                    }
                } else if ["failed", "error"].contains(statusResponse.data.status.lowercased()) {
                    print("❌ Generation failed according to API")
                    if let error = statusResponse.data.error {
                        print("❌ Error details: \(error)")
                    }
                    throw APIError.serverError
                } else {
                    print("   Still processing... (status: \(statusResponse.data.status))")
                }
            } catch {
                print("❌ Failed to decode status response: \(error)")
                print("❌ This might be a JSON structure mismatch")
                // Continue polling - don't throw error yet
            }
        }
        
        // Collect all generated tracks instead of just the first one
        var generatedTracks: [GeneratedTrack] = []
        
        // Get the final status response to collect all tracks
        let finalStatusURL = URL(string: "\(APIConfiguration.piApiBaseURL)/api/v1/task/\(taskId)")!
        var finalStatusReq = URLRequest(url: finalStatusURL)
        finalStatusReq.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        
        let (finalStatusData, _) = try await URLSession.shared.data(for: finalStatusReq)
        let finalStatusResponse = try JSONDecoder().decode(PiAPITaskResponse.self, from: finalStatusData)
        
        guard let songs = finalStatusResponse.data.output.songs, !songs.isEmpty else {
            print("❌ No songs found in final response")
            throw APIError.noData
        }
        
        print("🎵 Processing \(songs.count) generated tracks...")
        
        for (index, song) in songs.enumerated() {
            guard let songPath = song.songPath ?? song.audioUrl, !songPath.isEmpty else {
                print("⚠️ Skipping song \(index): no valid audio URL")
                continue
            }
            
            guard let url = URL(string: songPath) else {
                print("⚠️ Skipping song \(index): invalid URL format")
                continue
            }
            
            do {
                print("📥 Downloading track \(index + 1): \(song.title ?? "Untitled")")
                let startTime = Date()
                let (tempURL, _) = try await URLSession.shared.download(from: url)
                
                // Create a proper MP3 file path in Documents directory
                let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
                let trackTitle = song.title ?? "Generated Track \(index + 1)"
                let safeTitle = trackTitle.replacingOccurrences(of: "[^A-Za-z0-9 ]", with: "", options: .regularExpression)
                let mp3FileName = "\(safeTitle)_\(UUID().uuidString).mp3"
                let mp3URL = documentsPath.appendingPathComponent(mp3FileName)
                
                // Move the temp file to the MP3 file with proper extension
                try FileManager.default.moveItem(at: tempURL, to: mp3URL)
                
                let downloadDuration = Date().timeIntervalSince(startTime)
                print("✅ Track \(index + 1) downloaded in \(downloadDuration)s: \(mp3URL)")
                
                // Create GeneratedTrack object
                let generatedTrack = GeneratedTrack(
                    title: trackTitle,
                    localURL: mp3URL,
                    originalURL: songPath,
                    imageURL: song.imageUrl ?? song.imagePath,
                    lyrics: song.lyrics,
                    duration: duration, // Use the requested duration as default
                    tags: [genre.lowercased(), mood.lowercased()] // Create tags from genre and mood
                )
                
                generatedTracks.append(generatedTrack)
                
            } catch {
                print("❌ Failed to download track \(index + 1): \(error)")
                // Continue with other tracks even if one fails
            }
        }
        
        guard !generatedTracks.isEmpty else {
            print("❌ No tracks were successfully downloaded")
            throw APIError.noData
        }
        
        print("✅ Successfully processed \(generatedTracks.count) tracks")
        
        // Log successful generation
        APIConfiguration.logGenerationResponse(success: true, duration: nil, error: nil)
        
        return generatedTracks
    }
    
    // MARK: - DiffRhythm API Integration
    
    static func generateWithDiffRhythm(
        genre: String,
        mood: String,
        prompt: String? = nil,
        duration: Double = 30.0,
        customLyrics: String? = nil,
        styleAudio: String? = nil
    ) async throws -> [GeneratedTrack] {
        print("🎵 DiffRhythm API called with:")
        print("   Genre: \(genre)")
        print("   Mood: \(mood)")
        print("   Prompt: \(prompt ?? "none")")
        print("   Duration: \(duration)s")
        print("   Custom Lyrics: \(customLyrics != nil ? "yes" : "no")")
        print("   Style Audio: \(styleAudio != nil ? "yes" : "no")")
        
        // Check if test mode is enabled
        if APIConfiguration.isTestMode {
            print("🧪 TEST MODE ENABLED - Using demo audio instead of DiffRhythm API")
            return try await generateTestAudioMultiple(genre: genre, mood: mood, count: 1)
        }
        
        var req = URLRequest(url: base)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        
        // Determine task type based on duration
        let taskType: TaskType = duration > 90 ? .txt2audioFull : .txt2audioBase
        let expectedDuration = taskType == .txt2audioFull ? 285.0 : 81.0 // 4.45min vs 1.35min
        
        // Build style prompt
        let stylePrompt = buildDiffRhythmStylePrompt(genre: genre, mood: mood, prompt: prompt)
        
        print("🎵 DiffRhythm task type: \(taskType.rawValue)")
        print("🎵 Expected duration: \(expectedDuration)s")
        print("🎵 Style prompt: \(stylePrompt)")
        
        // Log the request
        APIConfiguration.logGenerationRequest(genre: genre, mood: mood, prompt: prompt)
        
        // Process style audio if provided
        var processedStyleAudio: String? = nil
        if let styleAudio = styleAudio, !styleAudio.isEmpty {
            // For DiffRhythm, we need to handle local file URLs
            if let styleURL = URL(string: styleAudio), styleURL.isFileURL {
                // Upload the file to a temporary location or encode it
                // For now, we'll pass the file path and let the API handle it
                processedStyleAudio = styleURL.path
                print("🎵 Using style audio file: \(styleURL.path)")
            } else {
                processedStyleAudio = styleAudio
            }
        }
        
        let requestBody = DiffRhythmRequest(
            model: APIModel.diffRhythm.rawValue,
            taskType: taskType.rawValue,
            input: DiffRhythmInput(
                lyrics: customLyrics,
                stylePrompt: stylePrompt,
                styleAudio: processedStyleAudio
            )
        )
        
        let requestBodyData = try JSONEncoder().encode(requestBody)
        req.httpBody = requestBodyData
        
        print("📦 DiffRhythm request body size: \(requestBodyData.count) bytes")
        if let bodyString = String(data: requestBodyData, encoding: .utf8) {
            print("📦 DiffRhythm request body: \(bodyString)")
        }
        
        // First, create the generation task
        print("📡 Sending DiffRhythm request...")
        let (data, response) = try await URLSession.shared.data(for: req)
        
        print("📨 DiffRhythm response received:")
        print("   Status code: \((response as? HTTPURLResponse)?.statusCode ?? 0)")
        print("   Data size: \(data.count) bytes")
        
        if let responseString = String(data: data, encoding: .utf8) {
            print("   Response body: \(responseString)")
        }
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            print("❌ DiffRhythm HTTP Error: \((response as? HTTPURLResponse)?.statusCode ?? 0)")
            if let errorString = String(data: data, encoding: .utf8) {
                print("❌ DiffRhythm Error response: \(errorString)")
            }
            throw APIError.serverError
        }
        
        let taskResponse = try JSONDecoder().decode(DiffRhythmTaskResponse.self, from: data)
        let taskId = taskResponse.data.taskId
        
        print("✅ DiffRhythm task created successfully with ID: \(taskId)")
        
        // Poll for completion - DiffRhythm may take longer than Udio
        var audioURL: String?
        var attempts = 0
        let maxAttempts = duration > 90 ? 60 : 30 // More attempts for longer tracks
        let pollingInterval = UInt64(APIConfiguration.pollingInterval * 1_000_000_000)
        
        print("🔄 Starting DiffRhythm polling for task completion...")
        print("   Max attempts: \(maxAttempts)")
        print("   Polling interval: \(APIConfiguration.pollingInterval) seconds")
        
        while audioURL == nil && attempts < maxAttempts {
            try await Task.sleep(nanoseconds: pollingInterval)
            attempts += 1
            
            print("🔄 DiffRhythm polling attempt \(attempts)/\(maxAttempts)...")
            
            let statusURL = URL(string: "\(APIConfiguration.piApiBaseURL)/api/v1/task/\(taskId)")!
            var statusReq = URLRequest(url: statusURL)
            statusReq.setValue(apiKey, forHTTPHeaderField: "x-api-key")
            
            let (statusData, _) = try await URLSession.shared.data(for: statusReq)
            
            if let responseString = String(data: statusData, encoding: .utf8) {
                print("   DiffRhythm status response: \(responseString)")
            }
            
            do {
                let statusResponse = try JSONDecoder().decode(DiffRhythmTaskResponse.self, from: statusData)
                
                print("   Status: \(statusResponse.data.status)")
                print("   Output available: \(statusResponse.data.output != nil)")
                
                // Check for completion
                if ["completed", "success", "finished"].contains(statusResponse.data.status.lowercased()) {
                    if let output = statusResponse.data.output,
                       let audioURLString = output.audioURL, !audioURLString.isEmpty {
                        audioURL = audioURLString
                        print("✅ DiffRhythm generation completed! Audio URL: \(audioURLString)")
                        break
                    } else {
                        print("⚠️ DiffRhythm completed but no audio URL found")
                    }
                } else if ["failed", "error"].contains(statusResponse.data.status.lowercased()) {
                    print("❌ DiffRhythm generation failed according to API")
                    if let error = statusResponse.data.error {
                        print("❌ Error details: \(error)")
                    }
                    throw APIError.serverError
                } else {
                    print("   Still processing... (status: \(statusResponse.data.status))")
                }
            } catch {
                print("❌ Failed to decode DiffRhythm status response: \(error)")
                // Continue polling - don't throw error yet
            }
        }
        
        guard let finalAudioURL = audioURL else {
            print("❌ DiffRhythm generation timed out after \(attempts) attempts")
            throw APIError.noData
        }
        
        // Download the generated track
        guard let url = URL(string: finalAudioURL) else {
            print("❌ Invalid DiffRhythm audio URL: \(finalAudioURL)")
            throw APIError.invalidURL
        }
        
        print("📥 Downloading DiffRhythm track...")
        let startTime = Date()
        let (tempURL, _) = try await URLSession.shared.download(from: url)
        
        // Create proper MP3 file path
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let trackTitle = "DiffRhythm \(genre) Track"
        let safeTitle = trackTitle.replacingOccurrences(of: "[^A-Za-z0-9 ]", with: "", options: .regularExpression)
        let mp3FileName = "\(safeTitle)_\(UUID().uuidString).mp3"
        let mp3URL = documentsPath.appendingPathComponent(mp3FileName)
        
        // Move the temp file to the MP3 file with proper extension
        try FileManager.default.moveItem(at: tempURL, to: mp3URL)
        
        let downloadDuration = Date().timeIntervalSince(startTime)
        print("✅ DiffRhythm track downloaded in \(downloadDuration)s: \(mp3URL)")
        
        // Create GeneratedTrack object
        let generatedTrack = GeneratedTrack(
            title: trackTitle,
            localURL: mp3URL,
            originalURL: finalAudioURL,
            imageURL: nil,
            lyrics: customLyrics,
            duration: expectedDuration,
            tags: [genre.lowercased(), mood.lowercased(), "diffrhythm"]
        )
        
        print("✅ DiffRhythm track successfully processed")
        
        // Log successful generation
        APIConfiguration.logGenerationResponse(success: true, duration: downloadDuration, error: nil)
        
        return [generatedTrack]
    }
    
    // MARK: - DiffRhythm Helper Functions
    
    private static func buildDiffRhythmStylePrompt(genre: String, mood: String, prompt: String?) -> String {
        var stylePrompt = "\(genre) music"
        
        // Add mood description
        switch mood.lowercased() {
        case "energetic": stylePrompt += ", upbeat and driving"
        case "euphoric": stylePrompt += ", uplifting and euphoric"
        case "dark": stylePrompt += ", dark and atmospheric"
        case "minimal": stylePrompt += ", minimal and clean"
        case "dreamy": stylePrompt += ", dreamy and ambient"
        case "aggressive": stylePrompt += ", aggressive and intense"
        case "romantic": stylePrompt += ", romantic and gentle"
        case "melancholic": stylePrompt += ", melancholic and emotional"
        case "uplifting": stylePrompt += ", uplifting and positive"
        default: stylePrompt += ", \(mood.lowercased())"
        }
        
        // Add user prompt if provided
        if let prompt = prompt, !prompt.isEmpty {
            stylePrompt += ". \(prompt)"
        }
        
        return stylePrompt
    }
    
    // Compatibility function for single track (returns first track)
    static func stream(genre: String, mood: String, prompt: String? = nil, duration: Double = 30.0, isInstrumental: Bool = true, customLyrics: String? = nil) async throws -> URL {
        let tracks = try await streamMultiple(genre: genre, mood: mood, prompt: prompt, duration: duration, isInstrumental: isInstrumental, customLyrics: customLyrics)
        guard let firstTrack = tracks.first else {
            throw APIError.noData
        }
        return firstTrack.localURL
    }
    
    // MARK: - Simplified Prompt Builder
    private static func buildSimplifiedPrompt(genre: String, mood: String, prompt: String?, isInstrumental: Bool, customLyrics: String?) -> String {
        var fullPrompt = ""
        
        // Start with genre and mood
        fullPrompt += "\(genre) music with \(mood.lowercased()) vibes"
        
        // Add user prompt if provided
        if let prompt = prompt, !prompt.isEmpty {
            fullPrompt += ". \(prompt)"
        }
        
        // Add lyrics instruction
        if !isInstrumental {
            if let lyrics = customLyrics, !lyrics.isEmpty {
                fullPrompt += ". Use these lyrics: \(lyrics)"
            } else {
                fullPrompt += ". Generate appropriate lyrics for this style."
            }
        } else {
            fullPrompt += ". Instrumental only, no vocals."
        }
        
        return fullPrompt
    }
    
    // MARK: - Test Mode Audio Generation
    static func generateTestAudio(genre: String, mood: String) async throws -> URL {
        print("🧪 Generating test audio for \(genre) \(mood)")
        
        // Simulate realistic generation time
        let generationTime = APIConfiguration.testModeDelay
        print("🧪 Sleeping for \(generationTime) seconds...")
        try await Task.sleep(nanoseconds: UInt64(generationTime * 1_000_000_000))
        print("🧪 Sleep completed, creating audio file...")
        
        // Create a simple sine wave audio file for testing
        let testAudioURL = try createTestAudioFile(genre: genre, mood: mood)
        
        print("✅ Test audio generated: \(testAudioURL)")
        return testAudioURL
    }
    
    static func generateTestAudioMultiple(genre: String, mood: String, count: Int = 2) async throws -> [GeneratedTrack] {
        print("🧪 Generating \(count) test audio tracks for \(genre) \(mood)")
        
        // Simulate realistic generation time
        let generationTime = APIConfiguration.testModeDelay
        print("🧪 Sleeping for \(generationTime) seconds...")
        try await Task.sleep(nanoseconds: UInt64(generationTime * 1_000_000_000))
        print("🧪 Sleep completed, creating audio files...")
        
        var testTracks: [GeneratedTrack] = []
        
        for i in 1...count {
            let testAudioURL = try createTestAudioFile(genre: genre, mood: mood, suffix: "_\(i)")
            let testTrack = GeneratedTrack(
                title: "Test \(genre) Track \(i)",
                localURL: testAudioURL,
                originalURL: testAudioURL.absoluteString,
                imageURL: nil,
                lyrics: nil,
                duration: 30.0,
                tags: [genre.lowercased(), mood.lowercased()]
            )
            testTracks.append(testTrack)
        }
        
        print("✅ Generated \(testTracks.count) test audio tracks")
        return testTracks
    }
    
    private static func createTestAudioFile(genre: String, mood: String, suffix: String = "") throws -> URL {
        print("🧪 Creating test audio file...")
        
        // Create a 30-second test audio file
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileName = "test_\(genre.lowercased())_\(mood.lowercased())\(suffix)_\(UUID().uuidString).m4a"
        let audioURL = documentsPath.appendingPathComponent(fileName)
        
        print("🧪 Audio file path: \(audioURL)")
        
        // Use a bundled test audio file or create a simple tone
        if let bundleAudioPath = Bundle.main.path(forResource: "test_audio", ofType: "mp3") {
            print("🧪 Found bundled audio file, copying...")
            let bundleURL = URL(fileURLWithPath: bundleAudioPath)
            try FileManager.default.copyItem(at: bundleURL, to: audioURL)
        } else {
            print("🧪 No bundled audio found, creating sine wave...")
            // Create a simple audio file using AVAudioEngine
            try createSineWaveAudioFile(at: audioURL, duration: 30.0)
        }
        
        print("🧪 Test audio file created successfully at: \(audioURL)")
        return audioURL
    }
    
    private static func createSineWaveAudioFile(at url: URL, duration: Double) throws {
        print("🧪 Creating sine wave audio file...")
        print("🧪 Duration: \(duration) seconds")
        
        // Simple implementation: create a basic audio file
        // For production, you'd want proper audio generation
        let sampleRate: Double = 44100
        let frequency: Double = 440 // A4 note
        let amplitude: Float = 0.3
        
        let frameCount = AVAudioFrameCount(sampleRate * duration)
        print("🧪 Frame count: \(frameCount)")
        
        let audioFormat = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1)!
        
        guard let audioFile = try? AVAudioFile(forWriting: url, settings: audioFormat.settings) else {
            print("❌ Failed to create audio file")
            throw APIError.serverError
        }
        
        guard let buffer = AVAudioPCMBuffer(pcmFormat: audioFormat, frameCapacity: frameCount) else {
            print("❌ Failed to create audio buffer")
            throw APIError.noData
        }
        
        buffer.frameLength = frameCount
        
        // Generate sine wave
        let floatChannelData = buffer.floatChannelData![0]
        for frame in 0..<Int(frameCount) {
            let value = sin(2.0 * Double.pi * frequency * Double(frame) / sampleRate) * Double(amplitude)
            floatChannelData[frame] = Float(value)
        }
        
        try audioFile.write(from: buffer)
        
        print("✅ Created test sine wave audio: \(url)")
    }
}

// MARK: - Original PiAPI Music Generation Integration (for compatibility)
class MusicGenAPI_Legacy: ObservableObject {
    private let baseURL = "https://api.piapi.ai"
    private let apiKey = "64bf26d29c8d994898fd745fddf6eeeac34d7b6cec246e7d5cc025be27852dcf"
    private var preferredProvider: MusicProvider = .suno
    
    // Production mode - using real PiAPI with fallback to test mode if needed
    private let testMode = false // Set to true for immediate testing without API calls
    
    enum MusicProvider {
        case suno, udio
    }
    
    func generateMusic(prompt: String, genre: String, mood: String, duration: Double) async throws -> MusicGenerationResponse {
        print("🎵 Generating music with: prompt='\(prompt)', genre=\(genre), mood=\(mood), duration=\(duration)s")
        
        // Emergency test mode for immediate results
        if testMode {
            print("🧪 TEST MODE: Using curated demo tracks for immediate testing")
            return try await self.generateTestMusic(prompt: prompt, genre: genre, mood: mood, duration: duration)
        }
        
        // Try Udio first (music-u model), then Suno as fallback
        var lastError: Error?
        
        // Attempt 1: Udio with instrumental
        do {
            print("🎹 Trying Udio (instrumental)...")
            return try await generateWithUdio(prompt: prompt, genre: genre, mood: mood, duration: duration, lyricsType: "instrumental")
        } catch {
            print("❌ Udio instrumental failed: \(error)")
            lastError = error
        }
        
        // Attempt 2: Udio with generated lyrics
        do {
            print("🎤 Trying Udio (with lyrics)...")
            return try await generateWithUdio(prompt: prompt, genre: genre, mood: mood, duration: duration, lyricsType: "generate")
        } catch {
            print("❌ Udio with lyrics failed: \(error)")
            lastError = error
        }
        
        // Attempt 3: Very simple prompt for guaranteed success
        do {
            print("🎯 Trying ultra-simple prompt for reliability...")
            let ultraSimplePrompt = "\(genre) beat"
            return try await generateWithUdio(prompt: ultraSimplePrompt, genre: genre, mood: mood, duration: 15, lyricsType: "instrumental")
        } catch {
            print("❌ Ultra-simple prompt failed: \(error)")
            lastError = error
        }
        
        // Attempt 4: Generic fallback (most likely to succeed)
        do {
            print("🔄 Trying generic music generation...")
            return try await generateWithUdio(prompt: "upbeat electronic music", genre: "Electronic", mood: "Energetic", duration: 15, lyricsType: "instrumental")
        } catch {
            print("❌ Generic fallback failed: \(error)")
            lastError = error
        }
        
        // If all attempts fail, throw the last error
        throw lastError ?? APIError.serverError
    }
    
    private func generateWithSuno(prompt: String, genre: String, mood: String, duration: Double) async throws -> MusicGenerationResponse {
        // Note: Using Udio ("music-u") as primary since Suno endpoint requires different access
        let url = URL(string: "\(baseURL)/api/v1/task")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        
        let requestBody = PiAPIUdioMusicRequest(
            model: "music-u",
            taskType: "generate_music",
            input: PiAPIUdioInput(
                gptDescriptionPrompt: "\(prompt). Genre: \(genre), Mood: \(mood)",
                negativeTags: "",
                lyricsType: "instrumental",
                seed: -1
            ),
            config: PiAPITaskConfig(
                serviceMode: "public",
                webhookConfig: PiAPIWebhookConfig(
                    endpoint: "",
                    secret: ""
                )
            )
        )
        
        request.httpBody = try JSONEncoder().encode(requestBody)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.serverError
        }
        
        let piAPIResponse = try JSONDecoder().decode(PiAPITaskResponse.self, from: data)
        
        // Convert PiAPI response to our app's format
        return MusicGenerationResponse(
            taskId: piAPIResponse.data.taskId,
            status: piAPIResponse.data.status,
            audioUrl: nil,
            progress: 0.0,
            estimatedTime: 60,
            createdAt: piAPIResponse.data.meta?.createdAt ?? ""
        )
    }
    
    private func generateWithUdio(prompt: String, genre: String, mood: String, duration: Double, lyricsType: String = "instrumental") async throws -> MusicGenerationResponse {
        let url = URL(string: "\(baseURL)/api/v1/task")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        
        let requestBody = PiAPIUdioMusicRequest(
            model: "music-u",
            taskType: "generate_music",
            input: PiAPIUdioInput(
                gptDescriptionPrompt: "\(prompt). Genre: \(genre), Mood: \(mood)",
                negativeTags: "",
                lyricsType: lyricsType,
                seed: -1
            ),
            config: PiAPITaskConfig(
                serviceMode: "public",
                webhookConfig: PiAPIWebhookConfig(
                    endpoint: "",
                    secret: ""
                )
            )
        )
        
        request.httpBody = try JSONEncoder().encode(requestBody)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.serverError
        }
        
        let piAPIResponse = try JSONDecoder().decode(PiAPITaskResponse.self, from: data)
        
        return MusicGenerationResponse(
            taskId: piAPIResponse.data.taskId,
            status: piAPIResponse.data.status,
            audioUrl: nil,
            progress: 0.0,
            estimatedTime: 60,
            createdAt: piAPIResponse.data.meta?.createdAt ?? ""
        )
    }
    
    func checkGenerationStatus(taskId: String) async throws -> MusicGenerationResponse {
        let url = URL(string: "\(baseURL)/api/v1/task/\(taskId)")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.serverError
        }
        
        let piAPIResponse = try JSONDecoder().decode(PiAPITaskResponse.self, from: data)
        
        // Convert PiAPI status response to our app's format
        return MusicGenerationResponse(
            taskId: taskId,
            status: piAPIResponse.data.status,
            audioUrl: piAPIResponse.data.output.songs?.first?.audioUrl,
            progress: 0.0,
            estimatedTime: nil,
            createdAt: piAPIResponse.data.meta?.createdAt ?? ""
        )
    }
    
    func extendTrack(trackId: String, duration: Int, direction: String) async throws -> MusicGenerationResponse {
        let url = URL(string: "\(baseURL)/api/v1/task")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        
        // For PiAPI Udio music extension - using the same model as generation
        let requestBody = PiAPIUdioMusicRequest(
            model: "music-u",
            taskType: "generate_music", // Note: Extension may not be directly supported
            input: PiAPIUdioInput(
                gptDescriptionPrompt: "Continue and extend this music track with similar style and energy",
                negativeTags: "",
                lyricsType: "instrumental",
                seed: -1
            ),
            config: PiAPITaskConfig(
                serviceMode: "public",
                webhookConfig: PiAPIWebhookConfig(
                    endpoint: "",
                    secret: ""
                )
            )
        )
        
        request.httpBody = try JSONEncoder().encode(requestBody)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.serverError
        }
        
        let piAPIResponse = try JSONDecoder().decode(PiAPITaskResponse.self, from: data)
        
        return MusicGenerationResponse(
            taskId: piAPIResponse.data.taskId,
            status: piAPIResponse.data.status,
            audioUrl: nil,
            progress: 0.0,
            estimatedTime: 60,
            createdAt: piAPIResponse.data.meta?.createdAt ?? ""
        )
    }
    
    // MARK: - Test Mode Implementation
    private func generateTestMusic(prompt: String, genre: String, mood: String, duration: Double) async throws -> MusicGenerationResponse {
        print("🧪 Generating test music for: \(genre) \(mood)")
        
        // Simulate realistic generation time (2-4 seconds)
        let generationTime = Double.random(in: 2.0...4.0)
        try await Task.sleep(nanoseconds: UInt64(generationTime * 1_000_000_000))
        
        // Select appropriate demo track based on genre/mood
        let demoURL = selectTestTrack(for: genre, mood: mood)
        
        let response = MusicGenerationResponse(
            taskId: "test-\(UUID().uuidString)",
            status: "completed",
            audioUrl: demoURL,
            progress: 1.0,
            estimatedTime: 0,
            createdAt: ISO8601DateFormatter().string(from: Date())
        )
        
        print("✅ Test generation completed with URL: \(demoURL)")
        return response
    }
    
    private func selectTestTrack(for genre: String, mood: String) -> String {
        // High-quality royalty-free demo tracks for different genres/moods
        let testTracks = [
            // Electronic/Techno tracks
            "techno_energetic": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            "techno_dark": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
            "electronic_euphoric": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
            
            // House tracks  
            "house_energetic": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
            "house_euphoric": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
            
            // Ambient/Chill
            "ambient_dreamy": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
            "chill_minimal": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
            
            // Trance
            "trance_euphoric": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
            "trance_dreamy": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
            
            // Default fallback
            "default": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        ]
        
        let key = "\(genre.lowercased())_\(mood.lowercased())"
        let selectedURL = testTracks[key] ?? testTracks["default"]!
        
        print("🎵 Selected test track for \(genre) \(mood): \(selectedURL)")
        return selectedURL
    }
}

// MARK: - Voice Synthesis API (Admin-managed)
class VoiceSynthesisAPI: ObservableObject {
    private let baseURL = "https://api.yourdomain.com/v1" // Replace with your backend URL
    
    func synthesizeVoice(text: String, voiceStyle: String = "natural") async throws -> VoiceSynthesisResponse {
        let url = URL(string: "\(baseURL)/voice/synthesize")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let requestBody = VoiceSynthesisRequest(
            text: text,
            voiceStyle: voiceStyle
        )
        
        request.httpBody = try JSONEncoder().encode(requestBody)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.serverError
        }
        
        return try JSONDecoder().decode(VoiceSynthesisResponse.self, from: data)
    }
}

// MARK: - User Management API
class UserAPI: ObservableObject {
    private let baseURL = "https://api.yourdomain.com/v1" // Replace with your backend URL
    
    func getUserProfile() async throws -> MusicGenUserProfile {
        let url = URL(string: "\(baseURL)/user/profile")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        // Add authentication headers if needed
        // request.setValue("Bearer \(userToken)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.serverError
        }
        
        return try JSONDecoder().decode(MusicGenUserProfile.self, from: data)
    }
    
    func getUserTracks() async throws -> [UserTrack] {
        let url = URL(string: "\(baseURL)/user/tracks")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.serverError
        }
        
        let response_data = try JSONDecoder().decode(UserTracksResponse.self, from: data)
        return response_data.tracks
    }
    
    func saveTrack(track: SaveTrackRequest) async throws -> SaveTrackResponse {
        let url = URL(string: "\(baseURL)/user/tracks/save")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        request.httpBody = try JSONEncoder().encode(track)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.serverError
        }
        
        return try JSONDecoder().decode(SaveTrackResponse.self, from: data)
    }
}

// MARK: - Data Models

// PiAPI Udio Music Request Models
struct PiAPIUdioMusicRequest: Codable {
    let model: String
    let taskType: String
    let input: PiAPIUdioInput
    let config: PiAPITaskConfig
    
    enum CodingKeys: String, CodingKey {
        case model
        case taskType = "task_type"
        case input
        case config
    }
}

struct PiAPIUdioInput: Codable {
    let gptDescriptionPrompt: String
    let negativeTags: String
    let lyricsType: String
    let seed: Int
    let lyrics: String?
    
    enum CodingKeys: String, CodingKey {
        case gptDescriptionPrompt = "gpt_description_prompt"
        case negativeTags = "negative_tags"
        case lyricsType = "lyrics_type"
        case seed, lyrics
    }
    
    init(gptDescriptionPrompt: String, negativeTags: String = "", lyricsType: String, seed: Int, lyrics: String? = nil) {
        self.gptDescriptionPrompt = gptDescriptionPrompt
        self.negativeTags = negativeTags
        self.lyricsType = lyricsType
        self.seed = seed
        self.lyrics = lyrics
    }
}

// PiAPI Task Response Models (based on actual API response)
struct PiAPITaskResponse: Codable {
    let code: Int
    let data: PiAPITaskData
    let message: String
}

struct PiAPITaskData: Codable {
    let taskId: String
    let model: String
    let taskType: String
    let status: String
    let config: PiAPITaskConfig
    let input: PiAPIUdioInput
    let output: PiAPITaskOutput
    let meta: PiAPITaskMeta?
    let detail: String?
    let logs: String?
    let error: PiAPITaskError?
    
    enum CodingKeys: String, CodingKey {
        case taskId = "task_id"
        case model
        case taskType = "task_type"
        case status, config, input, output, meta, detail, logs, error
    }
}

struct PiAPITaskConfig: Codable {
    let serviceMode: String
    let webhookConfig: PiAPIWebhookConfig
    
    enum CodingKeys: String, CodingKey {
        case serviceMode = "service_mode"
        case webhookConfig = "webhook_config"
    }
}

struct PiAPIWebhookConfig: Codable {
    let endpoint: String
    let secret: String
}

struct PiAPITaskOutput: Codable {
    let generationId: String?
    let songs: [PiAPITaskSong]?
    
    enum CodingKeys: String, CodingKey {
        case generationId = "generation_id"
        case songs
    }
}

struct PiAPITaskSong: Codable {
    let audioUrl: String?
    let videoUrl: String?
    let imageUrl: String?
    let title: String?
    let lyrics: String?
    let songPath: String?
    let imagePath: String?
    
    enum CodingKeys: String, CodingKey {
        case audioUrl = "audio_url"
        case videoUrl = "video_url"
        case imageUrl = "image_url"
        case songPath = "song_path"
        case imagePath = "image_path"
        case title, lyrics
    }
}

struct PiAPITaskMeta: Codable {
    let createdAt: String?
    let startedAt: String?
    let endedAt: String?
    let usage: PiAPITaskUsage?
    let isUsingPrivatePool: Bool?
    
    enum CodingKeys: String, CodingKey {
        case createdAt = "created_at"
        case startedAt = "started_at"
        case endedAt = "ended_at"
        case usage
        case isUsingPrivatePool = "is_using_private_pool"
    }
}

struct PiAPITaskUsage: Codable {
    let type: String
    let frozen: Int
    let consume: Int
}

struct PiAPITaskError: Codable {
    let code: Int
    let rawMessage: String
    let message: String
    let detail: String?
    
    enum CodingKeys: String, CodingKey {
        case code
        case rawMessage = "raw_message"
        case message, detail
    }
}

// Legacy Music Generation (for backward compatibility)
struct MusicGenerationRequest: Codable {
    let prompt: String
    let genre: String
    let mood: String
    let duration: Int
}

struct MusicGenerationResponse: Codable {
    let taskId: String
    let status: String
    let audioUrl: String?
    let progress: Double?
    let estimatedTime: Int?
    let createdAt: String
}

struct ExtendTrackRequest: Codable {
    let trackId: String
    let duration: Int
    let direction: String // "beginning", "end", "both"
}

// Voice Synthesis
struct VoiceSynthesisRequest: Codable {
    let text: String
    let voiceStyle: String
}

struct VoiceSynthesisResponse: Codable {
    let taskId: String
    let status: String
    let audioUrl: String?
    let duration: Double?
}

// User Management
struct APIUserProfile: Codable {
    let id: String
    let name: String
    let email: String
    let tracksCount: Int
    let publishedCount: Int
    let totalPlays: Int
    let createdAt: String
}

struct UserTrack: Codable {
    let id: String
    let title: String
    let genre: String
    let mood: String
    let duration: String
    let audioUrl: String
    let isPublished: Bool
    let plays: Int
    let likes: Int
    let createdAt: String
}

struct UserTracksResponse: Codable {
    let tracks: [UserTrack]
    let total: Int
}

struct SaveTrackRequest: Codable {
    let title: String
    let genre: String
    let mood: String
    let prompt: String
    let audioUrl: String
    let duration: Double
}

struct SaveTrackResponse: Codable {
    let trackId: String
    let success: Bool
    let message: String
}

// MARK: - Error Handling

enum APIError: Error, LocalizedError {
    case invalidURL
    case noData
    case serverError
    case unauthorized
    case networkError
    case serviceUnavailable
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .noData:
            return "No data received"
        case .serverError:
            return "Server error occurred"
        case .unauthorized:
            return "Unauthorized access"
        case .networkError:
            return "Network connection error"
        case .serviceUnavailable:
            return "Music generation service is temporarily unavailable"
        }
    }
}

// MARK: - Generated Track Model
struct GeneratedTrack {
    let title: String
    let localURL: URL
    let originalURL: String
    let imageURL: String?
    let lyrics: String?
    let duration: Double
    let tags: [String]
}

// MARK: - DiffRhythm API Models

struct DiffRhythmRequest: Codable {
    let model: String
    let taskType: String
    let input: DiffRhythmInput
    
    enum CodingKeys: String, CodingKey {
        case model
        case taskType = "task_type"
        case input
    }
}

struct DiffRhythmInput: Codable {
    let lyrics: String?
    let stylePrompt: String?
    let styleAudio: String?
    
    enum CodingKeys: String, CodingKey {
        case lyrics
        case stylePrompt = "style_prompt"
        case styleAudio = "style_audio"
    }
}

struct DiffRhythmTaskResponse: Codable {
    let code: Int
    let data: DiffRhythmTaskData
    let message: String
}

struct DiffRhythmTaskData: Codable {
    let taskId: String
    let model: String
    let taskType: String
    let status: String
    let input: DiffRhythmInput
    let output: DiffRhythmOutput?
    let error: String?
    
    enum CodingKeys: String, CodingKey {
        case taskId = "task_id"
        case model
        case taskType = "task_type"
        case status
        case input
        case output
        case error
    }
}

struct DiffRhythmOutput: Codable {
    let audioURL: String?
    let duration: Double?
    
    enum CodingKeys: String, CodingKey {
        case audioURL = "audio_url"
        case duration
    }
}
