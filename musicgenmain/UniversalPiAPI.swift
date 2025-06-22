import Foundation
import AVFoundation

// MARK: - Universal PiAPI Manager
@MainActor
class UniversalPiAPI: ObservableObject {
    static let shared = UniversalPiAPI()
    
    // MARK: - Published Properties
    @Published var isGenerating = false
    @Published var generationProgress: Double = 0.0
    @Published var currentTaskIds: Set<String> = []
    @Published var availableModels: [PiAPIModel] = []
    @Published var capabilities: PiAPICapabilities?
    @Published var generationQueue: [GenerationTask] = []
    @Published var notifications: [InAppNotification] = []
    
    // MARK: - Configuration
    private let baseURL: String
    private let apiKey: String
    private let maxConcurrentTasks = 3
    private let streamingEnabled = true
    
    init() {
        self.baseURL = APIConfiguration.piApiBaseURL
        self.apiKey = APIConfiguration.piApiKey
        
        Task {
            await loadCapabilities()
            await loadAvailableModels()
        }
    }
    
    // MARK: - 1. Universal Music Generation
    
    /// Generate music using PiAPI - returns ALL tracks from ALL available models
    func generateMusic(
        genre: String,
        mood: String,
        prompt: String? = nil,
        duration: Double = 30.0,
        isInstrumental: Bool = true,
        customLyrics: String? = nil,
        styleAudio: URL? = nil,
        enableExtended: Bool = false
    ) async throws -> [GeneratedTrack] {
        
        print("🎵 Universal PiAPI generation started")
        
        // REAL API ONLY - No test mode fallback
        print("🎵 Using REAL PiAPI - no test mode")
        
        isGenerating = true
        generationProgress = 0.0
        
        defer {
            isGenerating = false
            generationProgress = 0.0
        }
        
        var allTracks: [GeneratedTrack] = []
        let taskId = UUID().uuidString
        
        do {
            // Generate with standard model (Udio)
            generationProgress = 0.1
            let standardTracks = try await generateWithModel(
                model: "music-u",
                taskType: "generate_music",
                genre: genre,
                mood: mood,
                prompt: prompt,
                duration: duration,
                isInstrumental: isInstrumental,
                customLyrics: customLyrics,
                styleAudio: styleAudio,
                sessionId: taskId
            )
            allTracks.append(contentsOf: standardTracks)
            
            generationProgress = 0.8
            
            // Generate with extended model if enabled
            if enableExtended {
                let extendedTracks = try await generateWithModel(
                    model: "Qubico/diffrhythm",
                    taskType: duration > 90 ? "txt2audio-full" : "txt2audio-base",
                    genre: genre,
                    mood: mood,
                    prompt: prompt,
                    duration: duration,
                    isInstrumental: isInstrumental,
                    customLyrics: customLyrics,
                    styleAudio: styleAudio,
                    sessionId: taskId
                )
                allTracks.append(contentsOf: extendedTracks)
            }
            
            generationProgress = 1.0
            
            // Show completion notification
            addNotification(InAppNotification(
                id: UUID().uuidString,
                type: .success,
                title: "Generation Complete! 🎵",
                message: "Generated \(allTracks.count) tracks",
                timestamp: Date()
            ))
            
            print("✅ Universal generation completed: \(allTracks.count) tracks")
            return allTracks
            
        } catch {
            let userFriendlyMessage = if let apiError = error as? APIError {
                apiError.userFriendlyMessage
            } else {
                "Music generation temporarily unavailable. Please try again."
            }
            
            addNotification(InAppNotification(
                id: UUID().uuidString,
                type: .error,
                title: "Generation Failed",
                message: userFriendlyMessage,
                timestamp: Date()
            ))
            throw error
        }
    }
    
    // MARK: - 2. Real-time Streaming Support
    
    /// Stream generation progress using /task/stream endpoint
    func streamGenerationProgress(taskId: String) -> AsyncStream<StreamProgress> {
        return AsyncStream { continuation in
            Task {
                do {
                    if streamingEnabled {
                        try await streamWithWebSocket(taskId: taskId, continuation: continuation)
                    } else {
                        try await pollForProgress(taskId: taskId, continuation: continuation)
                    }
                } catch {
                    continuation.yield(StreamProgress(progress: 0.0, status: "error", error: error.localizedDescription))
                    continuation.finish()
                }
            }
        }
    }
    
    private func streamWithWebSocket(taskId: String, continuation: AsyncStream<StreamProgress>.Continuation) async throws {
        // Try WebSocket streaming first (if supported by PiAPI)
        let _ = URL(string: "\(baseURL)/api/v1/task/stream/\(taskId)")!
        
        // For now, fall back to enhanced polling since WebSocket may not be available
        try await pollForProgress(taskId: taskId, continuation: continuation)
    }
    
    private func pollForProgress(taskId: String, continuation: AsyncStream<StreamProgress>.Continuation) async throws {
        let maxAttempts = 60
        var attempts = 0
        
        while attempts < maxAttempts {
            try await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds
            attempts += 1
            
            let status = try await checkTaskStatus(taskId: taskId)
            
            let progress = StreamProgress(
                progress: Double(attempts) / Double(maxAttempts),
                status: status.data.status,
                eta: max(0, (maxAttempts - attempts) * 2)
            )
            
            continuation.yield(progress)
            
            if ["completed", "success", "finished", "failed", "error"].contains(status.data.status.lowercased()) {
                continuation.finish()
                break
            }
        }
    }
    
    // MARK: - 3. Extend & Remix Functionality
    
    /// Extend a track by generating a longer version with similar style
    func extendTrack(
        originalTrack: GeneratedTrack,
        additionalDuration: Double = 30.0,
        direction: ExtendDirection = .end
    ) async throws -> [GeneratedTrack] {
        
        print("🔄 Extending track: \(originalTrack.title) by generating longer version")
        
        // Since PiAPI doesn't have a direct extend endpoint, we'll generate new tracks
        // with longer duration using the original track's style
        let extendedDuration = originalTrack.duration + additionalDuration
        
        // Extract genre and mood from tags, or use defaults
        let genre = originalTrack.tags.first { APIConfiguration.supportedGenres.contains($0.capitalized) }?.capitalized ?? "Electronic"
        let mood = originalTrack.tags.first { APIConfiguration.supportedMoods.contains($0.capitalized) }?.capitalized ?? "Energetic"
        
        let extendPrompt = "Extended version of \(originalTrack.title). Similar style and energy."
        
        // Generate new tracks with extended duration
        let newTracks = try await generateMusic(
            genre: genre,
            mood: mood,
            prompt: extendPrompt,
            duration: min(extendedDuration, 120.0), // Cap at 2 minutes
            isInstrumental: originalTrack.lyrics == nil,
            customLyrics: originalTrack.lyrics,
            styleAudio: originalTrack.localURL,
            enableExtended: false
        )
        
        // Rename tracks to indicate they're extended versions
        var extendedTracks: [GeneratedTrack] = []
        for (index, track) in newTracks.enumerated() {
            let extendedTrack = GeneratedTrack(
                title: "Extended: \(originalTrack.title) (\(index + 1))",
                localURL: track.localURL,
                originalURL: track.originalURL,
                imageURL: track.imageURL,
                lyrics: track.lyrics,
                duration: track.duration,
                tags: originalTrack.tags + ["extended"]
            )
            extendedTracks.append(extendedTrack)
        }
        
        addNotification(InAppNotification(
            id: UUID().uuidString,
            type: .success,
            title: "Track Extended! 🔄",
            message: "Created \(extendedTracks.count) extended version(s) • Saved to Library",
            timestamp: Date()
        ))
        
        return extendedTracks
    }
    
    /// Remix a track with new style
    func remixTrack(
        originalTrack: GeneratedTrack,
        newGenre: String,
        newMood: String,
        remixPrompt: String? = nil
    ) async throws -> [GeneratedTrack] {
        
        print("🎛️ Remixing track: \(originalTrack.title)")
        
        // Use the original track as style reference for the remix
        let remixedTracks = try await generateMusic(
            genre: newGenre,
            mood: newMood,
            prompt: "Remix of \(originalTrack.title). \(remixPrompt ?? "")",
            duration: originalTrack.duration,
            isInstrumental: originalTrack.lyrics == nil,
            customLyrics: originalTrack.lyrics,
            styleAudio: originalTrack.localURL,
            enableExtended: false
        )
        
        addNotification(InAppNotification(
            id: UUID().uuidString,
            type: .success,
            title: "Track Remixed! 🎛️",
            message: "Created \(remixedTracks.count) \(newGenre) remix(es) • Saved to Library",
            timestamp: Date()
        ))
        
        return remixedTracks
    }
    
    // MARK: - 4. Batch & Queue Support
    
    /// Add generation task to queue
    func queueGeneration(
        genre: String,
        mood: String,
        prompt: String? = nil,
        duration: Double = 30.0,
        isInstrumental: Bool = true,
        customLyrics: String? = nil,
        styleAudio: URL? = nil,
        enableExtended: Bool = false
    ) -> String {
        
        let taskId = UUID().uuidString
        let task = GenerationTask(
            id: taskId,
            genre: genre,
            mood: mood,
            prompt: prompt,
            duration: duration,
            isInstrumental: isInstrumental,
            customLyrics: customLyrics,
            styleAudio: styleAudio,
            enableExtended: enableExtended,
            status: .queued,
            createdAt: Date()
        )
        
        generationQueue.append(task)
        
        // Start processing queue if not already running
        Task {
            await processQueue()
        }
        
        return taskId
    }
    
    private func processQueue() async {
        guard !isGenerating && !generationQueue.isEmpty else { return }
        
        // Process up to maxConcurrentTasks
        let tasksToProcess = Array(generationQueue.prefix(maxConcurrentTasks))
        
        for task in tasksToProcess {
            Task {
                await processQueuedTask(task)
            }
        }
    }
    
    private func processQueuedTask(_ task: GenerationTask) async {
        // Update task status
        if let index = generationQueue.firstIndex(where: { $0.id == task.id }) {
            generationQueue[index].status = .processing
        }
        
        do {
            let tracks = try await generateMusic(
                genre: task.genre,
                mood: task.mood,
                prompt: task.prompt,
                duration: task.duration,
                isInstrumental: task.isInstrumental,
                customLyrics: task.customLyrics,
                styleAudio: task.styleAudio,
                enableExtended: task.enableExtended
            )
            
            // Update task with results
            if let index = generationQueue.firstIndex(where: { $0.id == task.id }) {
                generationQueue[index].status = .completed
                generationQueue[index].tracks = tracks
            }
            
        } catch {
            // Update task with error
            if let index = generationQueue.firstIndex(where: { $0.id == task.id }) {
                generationQueue[index].status = .failed
                generationQueue[index].error = error.localizedDescription
            }
        }
        
        // Continue processing queue
        await processQueue()
    }
    
    // MARK: - 5. Dynamic Models & Capabilities
    
    /// Load available models - using hardcoded models since /models endpoint not available
    func loadAvailableModels() async {
        // Use known working models for PiAPI
        availableModels = [
            PiAPIModel(id: "music-u", name: "Standard", description: "Fast generation", capabilities: ["generate"]),
            PiAPIModel(id: "Qubico/diffrhythm", name: "Extended", description: "High quality, longer tracks", capabilities: ["generate", "extend"])
        ]
        print("✅ Loaded \(availableModels.count) available models (hardcoded)")
    }
    
    /// Load platform capabilities - using hardcoded capabilities since /capabilities endpoint not available
    func loadCapabilities() async {
        // Use known capabilities for PiAPI
        capabilities = PiAPICapabilities(
            streaming: false, // PiAPI doesn't support real-time streaming
            extending: false, // Extend functionality via re-generation
            remixing: true,
            styleAudio: true,
            maxDuration: 300,
            supportedFormats: ["mp3", "wav", "m4a"]
        )
        print("✅ Loaded platform capabilities (hardcoded)")
    }
    
    // MARK: - 6. Notification System
    
    func addNotification(_ notification: InAppNotification) {
        notifications.append(notification)
        
        // Auto-remove after 5 seconds
        Task {
            try await Task.sleep(nanoseconds: 5_000_000_000)
            removeNotification(notification.id)
        }
    }
    
    func removeNotification(_ id: String) {
        notifications.removeAll { $0.id == id }
    }
    
    func clearAllNotifications() {
        notifications.removeAll()
    }
    
    
    // MARK: - Private Helper Methods
    
    private func generateWithModel(
        model: String,
        taskType: String,
        genre: String,
        mood: String,
        prompt: String?,
        duration: Double,
        isInstrumental: Bool,
        customLyrics: String?,
        styleAudio: URL?,
        sessionId: String
    ) async throws -> [GeneratedTrack] {
        
        let taskURL = URL(string: "\(baseURL)/api/v1/task")!
        var request = URLRequest(url: taskURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.timeoutInterval = 30.0
        
        // Build the correct PiAPI request format
        let gptPrompt = buildStylePrompt(genre: genre, mood: mood, prompt: prompt)
        
        // Determine correct lyrics_type based on working API format
        let lyricsType: String
        if isInstrumental {
            lyricsType = "instrumental"
        } else if customLyrics != nil && !customLyrics!.isEmpty {
            lyricsType = "user"
        } else {
            lyricsType = "generate"
        }
        
        let piApiRequest = PiAPIUdioMusicRequest(
            model: model,
            taskType: taskType,
            input: PiAPIUdioInput(
                gptDescriptionPrompt: gptPrompt,
                negativeTags: "",
                lyricsType: lyricsType,
                seed: -1,
                lyrics: customLyrics
            ),
            config: PiAPITaskConfig(
                serviceMode: "public",
                webhookConfig: PiAPIWebhookConfig(
                    endpoint: "",
                    secret: ""
                )
            )
        )
        
        let requestBody = try JSONEncoder().encode(piApiRequest)
        
        request.httpBody = requestBody
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        // Log response for debugging
        if let httpResponse = response as? HTTPURLResponse {
            print("📡 PiAPI Response Status: \(httpResponse.statusCode)")
            if httpResponse.statusCode != 200 {
                if let responseString = String(data: data, encoding: .utf8) {
                    print("📡 Error Response: \(responseString.prefix(500))")
                    
                    // Check for specific maintenance message
                    if responseString.contains("Service is under maintenance") {
                        throw APIError.serviceUnavailable
                    }
                }
            }
        }
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            // Handle specific error codes
            if let httpResponse = response as? HTTPURLResponse {
                switch httpResponse.statusCode {
                case 503:
                    throw APIError.serviceUnavailable
                case 401, 403:
                    throw APIError.unauthorized
                default:
                    throw APIError.serverError
                }
            }
            throw APIError.serverError
        }
        
        let taskResponse = try JSONDecoder().decode(PiAPITaskResponse.self, from: data)
        let taskId = taskResponse.data.taskId
        
        currentTaskIds.insert(taskId)
        defer { currentTaskIds.remove(taskId) }
        
        // Wait for completion and download tracks
        let finalResponse = try await waitForCompletion(taskId: taskId)
        
        guard let songs = finalResponse.data.output.songs, !songs.isEmpty else {
            throw APIError.noData
        }
        
        var tracks: [GeneratedTrack] = []
        
        for (index, song) in songs.enumerated() {
            if let audioURL = song.songPath ?? song.audioUrl,
               let url = URL(string: audioURL) {
                
                let localURL = try await downloadTrack(from: url, filename: "\(genre)_\(mood)_\(index + 1)")
                
                let track = GeneratedTrack(
                    title: song.title ?? "Generated Track \(index + 1)",
                    localURL: localURL,
                    originalURL: audioURL,
                    imageURL: song.imageUrl ?? song.imagePath,
                    lyrics: song.lyrics,
                    duration: duration,
                    tags: [genre.lowercased(), mood.lowercased()]
                )
                
                tracks.append(track)
            }
        }
        
        return tracks
    }
    
    private func waitForCompletion(taskId: String) async throws -> PiAPITaskResponse {
        let maxAttempts = 60
        var attempts = 0
        
        while attempts < maxAttempts {
            try await Task.sleep(nanoseconds: 3_000_000_000) // 3 seconds
            attempts += 1
            
            let statusResponse = try await checkTaskStatus(taskId: taskId)
            
            // Update progress based on attempts
            await MainActor.run {
                let progressIncrement = 0.6 / Double(maxAttempts) // Progress from 0.1 to 0.7
                generationProgress = min(0.1 + (Double(attempts) * progressIncrement), 0.7)
            }
            
            if ["completed", "success", "finished"].contains(statusResponse.data.status.lowercased()) {
                return statusResponse
            } else if ["failed", "error"].contains(statusResponse.data.status.lowercased()) {
                throw APIError.serverError
            }
        }
        
        throw APIError.networkError
    }
    
    private func checkTaskStatus(taskId: String) async throws -> PiAPITaskResponse {
        let statusURL = URL(string: "\(baseURL)/api/v1/task/\(taskId)")!
        var request = URLRequest(url: statusURL)
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(PiAPITaskResponse.self, from: data)
    }
    
    private func downloadTrack(from url: URL, filename: String) async throws -> URL {
        let (tempURL, response) = try await URLSession.shared.download(from: url)
        
        // Determine file extension from response or URL
        var fileExtension = "mp3"
        if let httpResponse = response as? HTTPURLResponse,
           let contentType = httpResponse.value(forHTTPHeaderField: "Content-Type") {
            if contentType.contains("wav") {
                fileExtension = "wav"
            } else if contentType.contains("m4a") || contentType.contains("aac") {
                fileExtension = "m4a"
            }
        } else {
            // Try to get extension from URL
            let urlExtension = url.pathExtension.lowercased()
            if ["mp3", "wav", "m4a", "aac"].contains(urlExtension) {
                fileExtension = urlExtension
            }
        }
        
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let safeFilename = filename.replacingOccurrences(of: "[^A-Za-z0-9_\\s]", with: "", options: .regularExpression)
        let finalURL = documentsPath.appendingPathComponent("\(safeFilename)_\(UUID().uuidString).\(fileExtension)")
        
        try FileManager.default.moveItem(at: tempURL, to: finalURL)
        
        // Verify the file exists and has content
        let attributes = try FileManager.default.attributesOfItem(atPath: finalURL.path)
        let fileSize = attributes[.size] as? Int ?? 0
        
        if fileSize == 0 {
            throw APIError.noData
        }
        
        print("✅ Downloaded track: \(finalURL.lastPathComponent) (\(fileSize) bytes)")
        return finalURL
    }
    
    private func buildStylePrompt(genre: String, mood: String, prompt: String?) -> String {
        var stylePrompt = "\(genre) music with \(mood.lowercased()) vibes"
        
        if let prompt = prompt, !prompt.isEmpty {
            stylePrompt += ". \(prompt)"
        }
        
        return stylePrompt
    }
    
    private func generateTestTracks(genre: String, mood: String, count: Int) async throws -> [GeneratedTrack] {
        try await Task.sleep(nanoseconds: 3_000_000_000) // 3 seconds
        
        var tracks: [GeneratedTrack] = []
        
        for i in 1...count {
            let testURL = try createTestAudioFile(genre: genre, mood: mood, index: i)
            
            let track = GeneratedTrack(
                title: "Test \(genre) Track \(i)",
                localURL: testURL,
                originalURL: testURL.absoluteString,
                imageURL: nil,
                lyrics: nil,
                duration: 30.0,
                tags: [genre.lowercased(), mood.lowercased(), "test"]
            )
            
            tracks.append(track)
        }
        
        return tracks
    }
    
    private func createTestAudioFile(genre: String, mood: String, index: Int) throws -> URL {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileName = "test_\(genre.lowercased())_\(mood.lowercased())_\(index)_\(UUID().uuidString).m4a"
        let audioURL = documentsPath.appendingPathComponent(fileName)
        
        // Create simple test audio file
        try createSineWaveAudio(at: audioURL, duration: 30.0, frequency: 440.0 + Double(index * 100))
        
        return audioURL
    }
    
    private func createSineWaveAudio(at url: URL, duration: Double, frequency: Double) throws {
        let sampleRate: Double = 44100
        let amplitude: Float = 0.3
        let frameCount = AVAudioFrameCount(sampleRate * duration)
        
        let audioFormat = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1)!
        
        guard let audioFile = try? AVAudioFile(forWriting: url, settings: audioFormat.settings),
              let buffer = AVAudioPCMBuffer(pcmFormat: audioFormat, frameCapacity: frameCount) else {
            throw APIError.serverError
        }
        
        buffer.frameLength = frameCount
        let floatChannelData = buffer.floatChannelData![0]
        
        for frame in 0..<Int(frameCount) {
            let value = sin(2.0 * Double.pi * frequency * Double(frame) / sampleRate) * Double(amplitude)
            floatChannelData[frame] = Float(value)
        }
        
        try audioFile.write(from: buffer)
    }
}

// MARK: - Data Models

enum ExtendDirection: String, CaseIterable {
    case beginning = "beginning"
    case end = "end"
    case both = "both"
}

struct ExtendRequest: Codable {
    let originalAudioURL: String
    let duration: Double
    let direction: String
    let maintainStyle: Bool
    
    enum CodingKeys: String, CodingKey {
        case originalAudioURL = "original_audio_url"
        case duration, direction
        case maintainStyle = "maintain_style"
    }
}

struct StreamProgress {
    let progress: Double
    let status: String
    let eta: Int?
    let error: String?
    
    init(progress: Double, status: String, eta: Int? = nil, error: String? = nil) {
        self.progress = progress
        self.status = status
        self.eta = eta
        self.error = error
    }
}

struct GenerationTask: Identifiable {
    let id: String
    let genre: String
    let mood: String
    let prompt: String?
    let duration: Double
    let isInstrumental: Bool
    let customLyrics: String?
    let styleAudio: URL?
    let enableExtended: Bool
    var status: TaskStatus
    let createdAt: Date
    var tracks: [GeneratedTrack]?
    var error: String?
    
    enum TaskStatus {
        case queued, processing, completed, failed
    }
}

struct InAppNotification: Identifiable {
    let id: String
    let type: NotificationType
    let title: String
    let message: String
    let timestamp: Date
    
    enum NotificationType {
        case success, error, info, warning
    }
}

struct PiAPIModel: Codable, Identifiable {
    let id: String
    let name: String
    let description: String
    let capabilities: [String]
}

struct ModelsResponse: Codable {
    let models: [PiAPIModel]
}

struct PiAPICapabilities: Codable {
    let streaming: Bool
    let extending: Bool
    let remixing: Bool
    let styleAudio: Bool
    let maxDuration: Int
    let supportedFormats: [String]
}

// MARK: - Correct PiAPI Request Models

struct PiAPIMusicRequest: Codable {
    let model: String
    let taskType: String
    let input: PiAPIMusicInput
    let config: PiAPIConfig
    
    enum CodingKeys: String, CodingKey {
        case model
        case taskType = "task_type"
        case input, config
    }
}

struct PiAPIMusicInput: Codable {
    let gptDescriptionPrompt: String
    let makeInstrumental: Bool
    let title: String?
    let tags: String
    let negativeTags: String
    let lyrics: String?
    
    enum CodingKeys: String, CodingKey {
        case gptDescriptionPrompt = "gpt_description_prompt"
        case makeInstrumental = "make_instrumental"
        case title, tags
        case negativeTags = "negative_tags"
        case lyrics
    }
}

struct PiAPIConfig: Codable {
    let serviceMode: String
    
    enum CodingKeys: String, CodingKey {
        case serviceMode = "service_mode"
    }
}

// MARK: - Extend Request Models

struct PiAPIExtendRequest: Codable {
    let model: String
    let taskType: String
    let input: PiAPIExtendInput
    let config: PiAPIConfig
    
    enum CodingKeys: String, CodingKey {
        case model
        case taskType = "task_type"
        case input, config
    }
}

struct PiAPIExtendInput: Codable {
    let continueClipId: String
    let continueAt: Int
    let prompt: String
    let tags: String?
    
    enum CodingKeys: String, CodingKey {
        case continueClipId = "continue_clip_id"
        case continueAt = "continue_at"
        case prompt, tags
    }
}