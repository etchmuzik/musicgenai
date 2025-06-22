import SwiftUI
import AVFoundation
import Combine

struct GenerationView: View {
    @EnvironmentObject var appSettings: AppSettings
    @EnvironmentObject var firebaseManager: FirebaseManager
    let genre: String
    let mood: String
    let prompt: String
    let duration: Double
    let useDiffRhythm: Bool
    let styleAudioURL: URL?
    
    @State private var isGenerating = true
    @State private var player: AVPlayer?
    @State private var isPlaying = false
    @State private var currentTime: Double = 0
    @State private var trackDuration: Double = 0
    @State private var animateWaveform = false
    @State private var trackTitle = ""
    @State private var progressAnimation = false
    @State private var showSuccess = false
    @State private var generatedAudioURL: String?
    @State private var generationTaskId: String?
    @State private var showingSaveDialog = false
    @State private var showingPointsError = false
    @State private var pointsErrorMessage = ""
    @State private var showingUpgrade = false
    @Environment(\.presentationMode) var presentationMode
    @State private var errorMessage: String?
    
    private let timer = Timer.publish(every: 0.1, on: .main, in: .common).autoconnect()
    
    var moodGradient: [Color] {
        switch mood {
        case "Energetic": return [.orange, .red]
        case "Euphoric": return [.purple, .pink]
        case "Dark": return [.black, .gray]
        case "Minimal": return [.gray, .white]
        case "Dreamy": return [.blue, .purple]
        default: return [.green, .blue]
        }
    }
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: moodGradient.map { $0.opacity(0.8) },
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            if isGenerating {
                // Generation View
                VStack(spacing: 30) {
                    Text("Generating Your Track")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                    
                    VStack(spacing: 5) {
                        Text("\(genre) • \(mood)")
                            .font(.title3)
                            .foregroundColor(.white.opacity(0.8))
                        
                        if useDiffRhythm {
                            Text("DiffRhythm • \(formatTime(duration))")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.6))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 4)
                                .background(Color.white.opacity(0.2))
                                .cornerRadius(8)
                        } else {
                            Text("Udio • \(formatTime(duration))")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.6))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 4)
                                .background(Color.white.opacity(0.2))
                                .cornerRadius(8)
                        }
                    }
                    
                    // Animated waveform during generation
                    HStack(spacing: 4) {
                        ForEach(0..<20, id: \.self) { index in
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color.white)
                                .frame(width: 12, height: CGFloat.random(in: 20...100))
                                .animation(
                                    .easeInOut(duration: 0.5)
                                    .repeatForever()
                                    .delay(Double(index) * 0.05),
                                    value: animateWaveform
                                )
                        }
                    }
                    .frame(height: 100)
                    .onAppear {
                        animateWaveform = true
                    }
                    
                    // Loading messages
                    VStack(spacing: 10) {
                        HStack {
                            Image(systemName: progressAnimation ? "checkmark.circle.fill" : "circle")
                                .foregroundColor(.white)
                            Text("Analyzing parameters...")
                                .foregroundColor(.white.opacity(0.8))
                        }
                        .animation(.spring(), value: progressAnimation)
                        
                        HStack {
                            Image(systemName: showSuccess ? "checkmark.circle.fill" : "circle")
                                .foregroundColor(.white)
                            Text("Creating your \(genre.lowercased()) masterpiece...")
                                .foregroundColor(.white.opacity(0.8))
                        }
                        .animation(.spring(), value: showSuccess)
                        
                        // Show timeout warning after 30 seconds
                        if showSuccess {
                            if useDiffRhythm {
                                Text("🎵 DiffRhythm generating full-length song... Up to 10 minutes for longer tracks")
                                    .font(.caption)
                                    .foregroundColor(.white.opacity(0.6))
                                    .padding(.top, 5)
                                    .multilineTextAlignment(.center)
                            } else {
                                Text("🎵 Generating real AI music... Up to 5 minutes for best quality")
                                    .font(.caption)
                                    .foregroundColor(.white.opacity(0.6))
                                    .padding(.top, 5)
                                    .multilineTextAlignment(.center)
                            }
                        }
                    }
                    .font(.subheadline)
                }
                .padding()
                .onAppear {
                    checkPointsAndGenerate()
                }
            } else {
                // Playback View
                VStack(spacing: 30) {
                    // Track info
                    VStack(spacing: 10) {
                        Image(systemName: "music.note.house.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.white)
                            .shadow(color: .white.opacity(0.5), radius: 10)
                        
                        Text(trackTitle)
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Text("\(genre) • \(mood)")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.8))
                    }
                    
                    // Waveform visualization
                    ZStack {
                        HStack(spacing: 3) {
                            ForEach(0..<40, id: \.self) { index in
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(isPlaying ? Color.white : Color.white.opacity(0.5))
                                    .frame(width: 6, height: isPlaying ? CGFloat.random(in: 10...80) : 20)
                                    .animation(
                                        isPlaying ? .easeInOut(duration: 0.3).repeatForever() : .default,
                                        value: isPlaying
                                    )
                            }
                        }
                        .frame(height: 80)
                        .padding(.horizontal)
                        
                        if !isPlaying {
                            Text("PAUSED")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.white.opacity(0.7))
                                .padding(.horizontal, 10)
                                .padding(.vertical, 4)
                                .background(Color.black.opacity(0.3))
                                .cornerRadius(10)
                        }
                    }
                    
                    // Progress bar
                    VStack(alignment: .leading, spacing: 8) {
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(Color.white.opacity(0.3))
                                    .frame(height: 6)
                                
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(Color.white)
                                    .frame(width: geometry.size.width * (currentTime / max(trackDuration, 1)), height: 6)
                            }
                        }
                        .frame(height: 6)
                        
                        HStack {
                            Text(formatTime(currentTime))
                            Spacer()
                            Text(formatTime(trackDuration))
                        }
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.8))
                    }
                    .padding(.horizontal)
                    
                    // Control buttons
                    HStack(spacing: 30) {
                        Button(action: skipBackward) {
                            Image(systemName: "backward.fill")
                                .font(.title2)
                                .foregroundColor(.white)
                        }
                        
                        Button(action: togglePlayback) {
                            ZStack {
                                Circle()
                                    .fill(Color.white)
                                    .frame(width: 80, height: 80)
                                
                                Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                                    .font(.system(size: 30))
                                    .foregroundColor(.black)
                                    .offset(x: isPlaying ? 0 : 3)
                            }
                            .scaleEffect(isPlaying ? 1.1 : 1)
                            .animation(.spring(response: 0.3), value: isPlaying)
                        }
                        
                        Button(action: skipForward) {
                            Image(systemName: "forward.fill")
                                .font(.title2)
                                .foregroundColor(.white)
                        }
                    }
                    
                    Spacer()
                    
                    // Action buttons
                    VStack(spacing: 15) {
                        Button(action: saveTrack) {
                            HStack {
                                Image(systemName: "heart.fill")
                                Text("Save to Library")
                            }
                            .font(.headline)
                            .foregroundColor(.black)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.white)
                            .cornerRadius(15)
                        }
                        
                        Button(action: shareTrack) {
                            HStack {
                                Image(systemName: "square.and.arrow.up")
                                Text("Share Track")
                            }
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.white.opacity(0.2))
                            .cornerRadius(15)
                            .overlay(
                                RoundedRectangle(cornerRadius: 15)
                                    .stroke(Color.white.opacity(0.3), lineWidth: 1)
                            )
                        }
                        
                        Button(action: generateAnother) {
                            HStack {
                                Image(systemName: "arrow.clockwise")
                                Text("Generate Another")
                            }
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.white.opacity(0.2))
                            .cornerRadius(15)
                            .overlay(
                                RoundedRectangle(cornerRadius: 15)
                                    .stroke(Color.white.opacity(0.3), lineWidth: 1)
                            )
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 30)
                .onReceive(timer) { _ in
                    updateProgress()
                }
            }
        }
        .navigationTitle("")
        .onDisappear {
            player?.pause()
        }
        .alert("Track Saved!", isPresented: $showingSaveDialog) {
            Button("OK") { }
        } message: {
            Text("'\(trackTitle)' has been saved to your library.")
        }
        .alert("Generation Error", isPresented: .init(
            get: { errorMessage != nil || showingPointsError },
            set: { if !$0 { errorMessage = nil; showingPointsError = false } }
        )) {
            if errorMessage != nil {
                Button("Retry") {
                    errorMessage = nil
                    generateTrack()
                }
                Button("Cancel", role: .cancel) {
                    presentationMode.wrappedValue.dismiss()
                }
            } else {
                Button("Upgrade Plan") {
                    showingUpgrade = true
                }
                Button("Go Back", role: .cancel) {
                    presentationMode.wrappedValue.dismiss()
                }
            }
        } message: {
            Text(errorMessage ?? pointsErrorMessage)
        }
        .sheet(isPresented: $showingUpgrade) {
            SubscriptionView()
                .environmentObject(firebaseManager)
        }
    }
    
    func checkPointsAndGenerate() {
        // Check if user can generate
        let validation = firebaseManager.canUserGenerate()
        
        if !validation.canGenerate {
            // Show error and don't start generation
            pointsErrorMessage = validation.reason
            showingPointsError = true
            return
        }
        
        // Start UI animations
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            progressAnimation = true
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            showSuccess = true
        }
        
        // Start generation process
        generateTrack()
    }
    
    func generateTrack() {
        // Generate dynamic track name
        let adjectives = ["Epic", "Cosmic", "Deep", "Electric", "Hypnotic", "Stellar"]
        let nouns = ["Journey", "Pulse", "Wave", "Dream", "Vision", "Flow"]
        trackTitle = "\(adjectives.randomElement()!) \(genre) \(nouns.randomElement()!)"
        
        Task {
            do {
                print("🎵 Starting music generation...")
                print("🎵 Genre: \(genre), Mood: \(mood), Prompt: \(prompt)")
                
                // Consume points first
                print("🎵 About to consume point...")
                try await firebaseManager.consumePoint()
                print("✅ Point consumed successfully")
                
                // Extract lyrics information from prompt (simplified)
                let isInstrumental = !prompt.contains("Lyrics:")
                var customLyrics: String? = nil
                
                // Parse custom lyrics if present
                if let lyricsRange = prompt.range(of: "Lyrics: ") {
                    let lyricsStart = prompt.index(lyricsRange.upperBound, offsetBy: 0)
                    customLyrics = String(prompt[lyricsStart...])
                }
                
                // Process lyrics for DiffRhythm timed format
                if useDiffRhythm, let lyrics = customLyrics, !lyrics.isEmpty {
                    // Check if lyrics contain timing markers
                    let hasTimedLyrics = lyrics.contains("[") && lyrics.contains(":")
                    if hasTimedLyrics {
                        print("🎵 Detected timed lyrics format for DiffRhythm")
                    }
                }
                
                print("🎵 Using \(useDiffRhythm ? "DiffRhythm" : "Udio") API")
                print("🎵 Instrumental: \(isInstrumental), has custom lyrics: \(customLyrics != nil)")
                
                let generatedTracks: [GeneratedTrack]
                
                if useDiffRhythm {
                    // Use DiffRhythm API for longer tracks
                    generatedTracks = try await MusicGenAPI.generateWithDiffRhythm(
                        genre: genre,
                        mood: mood,
                        prompt: prompt.isEmpty ? nil : prompt,
                        duration: duration,
                        customLyrics: isInstrumental ? nil : customLyrics,
                        styleAudio: styleAudioURL?.absoluteString
                    )
                } else {
                    // Use standard Udio API for shorter tracks
                    generatedTracks = try await MusicGenAPI.streamMultiple(
                        genre: genre,
                        mood: mood,
                        prompt: prompt.isEmpty ? nil : prompt,
                        duration: duration,
                        isInstrumental: isInstrumental,
                        customLyrics: customLyrics
                    )
                }
                
                print("✅ Generated \(generatedTracks.count) tracks")
                
                // Use the first track for the current view's player
                guard let firstTrack = generatedTracks.first else {
                    throw APIError.noData
                }
                
                let audioURL = firstTrack.localURL
                
                // Verify file exists before setting up player
                guard FileManager.default.fileExists(atPath: audioURL.path) else {
                    print("❌ Generated audio file does not exist: \(audioURL.path)")
                    throw APIError.noData
                }
                
                print("✅ Audio file verified and ready for playback: \(audioURL.path)")
                
                // Set up player with the verified MP3 file
                await MainActor.run {
                    self.player = AVPlayer(url: audioURL)
                    self.generatedAudioURL = audioURL.absoluteString
                    self.generationTaskId = "stream-\(UUID().uuidString)"
                    self.trackTitle = firstTrack.title
                    self.trackDuration = firstTrack.duration
                    self.isGenerating = false
                    
                    // Auto-save ALL tracks and start global playback with first track
                    self.autoSaveAndPlayMultiple(tracks: generatedTracks)
                }
                
            } catch {
                print("❌ Generation error: \(error)")
                print("❌ Error details: \(error)")
                
                await MainActor.run {
                    // Show user-friendly error message
                    if error.localizedDescription.contains("serverError") {
                        self.errorMessage = "Music generation failed. Please try again."
                    } else if error.localizedDescription.contains("noData") {
                        self.errorMessage = "No music data received. Please try again."
                    } else {
                        self.errorMessage = "Generation failed: \(error.localizedDescription)"
                    }
                    self.isGenerating = false
                    self.showingPointsError = true
                }
            }
        }
    }
    
    
    @MainActor
    func retryGenerationWithFallback() async {
        print("🔄 Retrying generation...")
        generateTrack() // Simply retry the generation
    }
    
    
    func togglePlayback() {
        if isPlaying {
            player?.pause()
        } else {
            player?.play()
        }
        isPlaying.toggle()
    }
    
    func skipBackward() {
        guard let player = player else { return }
        let newTime = max(currentTime - 10, 0)
        player.seek(to: CMTime(seconds: newTime, preferredTimescale: 1))
        currentTime = newTime
    }
    
    func skipForward() {
        guard let player = player else { return }
        let newTime = min(currentTime + 10, trackDuration)
        player.seek(to: CMTime(seconds: newTime, preferredTimescale: 1))
        currentTime = newTime
    }
    
    func updateProgress() {
        guard let player = player else { return }
        if let currentItem = player.currentItem {
            currentTime = CMTimeGetSeconds(currentItem.currentTime())
            
            // Check if track ended
            if currentTime >= trackDuration && trackDuration > 0 {
                isPlaying = false
                currentTime = 0
                player.seek(to: .zero)
            }
        }
    }
    
    func autoSaveAndPlayMultiple(tracks: [GeneratedTrack]) {
        Task {
            var savedTracks: [TrackData] = []
            
            // Save all generated tracks to user's library
            for (index, generatedTrack) in tracks.enumerated() {
                let trackData = TrackData(
                    title: generatedTrack.title,
                    genre: genre,
                    mood: mood,
                    prompt: prompt,
                    duration: generatedTrack.duration,
                    audioURL: generatedTrack.localURL.absoluteString,
                    taskId: "\(generationTaskId ?? "unknown")_\(index)",
                    createdAt: Date(),
                    isPublished: false,
                    isFavorite: false,
                    plays: 0,
                    likes: 0,
                    imageURL: generatedTrack.imageURL,
                    tags: generatedTrack.tags.isEmpty ? [genre.lowercased(), mood.lowercased()] : generatedTrack.tags
                )
                
                do {
                    try await firebaseManager.saveTrack(trackData)
                    savedTracks.append(trackData)
                    print("✅ Track \(index + 1) auto-saved to library: \(generatedTrack.title)")
                } catch {
                    print("❌ Error auto-saving track \(index + 1): \(error)")
                    // Still add to savedTracks for potential playback
                    savedTracks.append(trackData)
                }
            }
            
            // Start playing the first track in global player immediately
            if let firstTrack = savedTracks.first {
                await MainActor.run {
                    TrackPlayer.shared.play(track: firstTrack)
                    print("🎵 Started playback in global player: \(firstTrack.title)")
                    print("📚 Saved \(savedTracks.count) tracks to library")
                }
            }
        }
    }
    
    func autoSaveAndPlay() {
        // Auto-save track and start global playback
        let trackData = TrackData(
            title: trackTitle,
            genre: genre,
            mood: mood,
            prompt: prompt,
            duration: trackDuration > 0 ? trackDuration : duration,
            audioURL: generatedAudioURL,
            taskId: generationTaskId,
            createdAt: Date(),
            isPublished: false,
            isFavorite: false,
            plays: 0,
            likes: 0,
            imageURL: nil,
            tags: [genre.lowercased(), mood.lowercased()]
        )
        
        Task {
            do {
                // Save to user's library
                try await firebaseManager.saveTrack(trackData)
                print("✅ Track auto-saved to library: \(trackTitle)")
                
                // Start playing in global player immediately
                await MainActor.run {
                    TrackPlayer.shared.play(track: trackData)
                    print("🎵 Started playback in global player")
                }
            } catch {
                print("❌ Error auto-saving track: \(error)")
                // Still try to play even if save fails
                await MainActor.run {
                    TrackPlayer.shared.play(track: trackData)
                }
            }
        }
    }
    
    func saveTrack() {
        Task {
            do {
                let trackData = TrackData(
                    title: trackTitle,
                    genre: genre,
                    mood: mood,
                    prompt: prompt,
                    duration: trackDuration > 0 ? trackDuration : duration,
                    audioURL: generatedAudioURL,
                    taskId: generationTaskId,
                    createdAt: Date(),
                    isPublished: false,
                    isFavorite: false,
                    plays: 0,
                    likes: 0,
                    imageURL: nil,
                    tags: [genre.lowercased(), mood.lowercased()]
                )
                
                try await firebaseManager.saveTrack(trackData)
                
                DispatchQueue.main.async {
                    self.showingSaveDialog = true
                    print("✅ Track saved to Firebase: \(self.trackTitle)")
                }
            } catch {
                print("❌ Error saving track: \(error)")
            }
        }
    }
    
    func shareTrack() {
        guard let audioURLString = generatedAudioURL,
              let fileURL = URL(string: audioURLString) else { 
            print("❌ No audio URL available for sharing")
            return 
        }
        
        // Check if file exists before sharing
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            print("❌ Audio file does not exist at path: \(fileURL.path)")
            // Show user-friendly error
            DispatchQueue.main.async {
                self.errorMessage = "Audio file not found. Please try generating the track again."
            }
            return
        }
        
        print("✅ Sharing audio file: \(fileURL.path)")
        
        let items: [Any] = [
            "Check out this AI-generated \(genre) track: \(trackTitle)",
            fileURL
        ]
        
        let activityViewController = UIActivityViewController(activityItems: items, applicationActivities: nil)
        
        // Present the share sheet
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first {
            window.rootViewController?.present(activityViewController, animated: true)
        }
    }
    
    func generateAnother() {
        // Check if user can generate another track
        let validation = firebaseManager.canUserGenerate()
        
        if !validation.canGenerate {
            pointsErrorMessage = validation.reason
            showingPointsError = true
            return
        }
        
        // Go back to create new track
        presentationMode.wrappedValue.dismiss()
    }
    
    func formatTime(_ time: Double) -> String {
        let minutes = Int(time) / 60
        let seconds = Int(time) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}

struct GenerationView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            GenerationView(genre: "Techno", mood: "Energetic", prompt: "A energetic techno beat", duration: 30.0, useDiffRhythm: false, styleAudioURL: nil)
                .environmentObject(AppSettings())
        }
    }
}
