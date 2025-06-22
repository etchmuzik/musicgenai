import SwiftUI
import AVFoundation

struct PreviewTracksView: View {
    @EnvironmentObject var appSettings: AppSettings
    @EnvironmentObject var firebaseManager: FirebaseManager
    @EnvironmentObject var universalAPI: UniversalPiAPI
    let genre: String
    let mood: String
    let prompt: String
    let duration: Double
    let enableExtended: Bool
    let styleAudioURL: URL?
    
    @State private var generatedTracks: [GeneratedTrack] = []
    @State private var extendedTracks: [GeneratedTrack] = []
    @State private var generationState: GenerationState = .generating
    @State private var selectedTracks: Set<String> = []
    @State private var showingError = false
    @State private var errorMessage = ""
    @State private var generationProgress: Double = 0.0
    @State private var estimatedTimeRemaining: Int = 180 // seconds
    @State private var currentStep = "Initializing..."
    @Environment(\.presentationMode) var presentationMode
    
    enum GenerationState {
        case generating
        case ready
        case error
        case extending
    }
    
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
            
            VStack(spacing: 0) {
                // Header
                headerSection
                
                // Content based on state
                ScrollView {
                    LazyVStack(spacing: 20) {
                        if generationState == .generating {
                            generatingSection
                        } else if generationState == .ready {
                            previewSection
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 120) // Extra space for docked player
                }
                
                Spacer()
                
                // Bottom action bar
                if generationState == .ready {
                    bottomActionBar
                }
            }
        }
        .navigationTitle("")
        .navigationBarHidden(true)
        .onAppear {
            startGeneration()
        }
        .alert("Generation Error", isPresented: $showingError) {
            Button("Retry") {
                startGeneration()
            }
            Button("Cancel", role: .cancel) {
                presentationMode.wrappedValue.dismiss()
            }
        } message: {
            Text(errorMessage)
        }
    }
    
    // MARK: - UI Sections
    
    private var headerSection: some View {
        VStack(spacing: 15) {
            HStack {
                Button(action: {
                    presentationMode.wrappedValue.dismiss()
                }) {
                    Image(systemName: "chevron.left")
                        .font(.title2)
                        .foregroundColor(.white)
                }
                
                Spacer()
                
                VStack {
                    Text(generationState == .generating ? "Generating..." : "Preview")
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    Text("\(genre) • \(mood)")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.8))
                }
                
                Spacer()
                
                // Placeholder for alignment
                Color.clear
                    .frame(width: 30, height: 30)
            }
            .padding(.horizontal)
            .padding(.top, 10)
        }
    }
    
    private var generatingSection: some View {
        VStack(spacing: 30) {
            // Animated waveform
            HStack(spacing: 4) {
                ForEach(0..<20, id: \.self) { index in
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.white.opacity(generationProgress > Double(index) / 20.0 ? 1.0 : 0.3))
                        .frame(width: 12, height: CGFloat.random(in: 20...100))
                        .animation(
                            .easeInOut(duration: 0.8)
                            .repeatForever()
                            .delay(Double(index) * 0.05),
                            value: generationProgress
                        )
                }
            }
            .frame(height: 100)
            
            VStack(spacing: 15) {
                Text(generationState == .extending ? "Extending track..." : "Creating your tracks...")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                // Progress bar
                VStack(spacing: 8) {
                    ProgressView(value: generationProgress)
                        .progressViewStyle(LinearProgressViewStyle(tint: .white))
                        .scaleEffect(y: 2)
                        .frame(height: 8)
                    
                    HStack {
                        Text("\(Int(generationProgress * 100))%")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.8))
                        
                        Spacer()
                        
                        if estimatedTimeRemaining > 0 {
                            Text("\(estimatedTimeRemaining)s remaining")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.8))
                        }
                    }
                }
                .padding(.horizontal, 20)
                
                // Current step
                Text(currentStep)
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.9))
                    .padding(.horizontal, 20)
                    .multilineTextAlignment(.center)
                
                // Generation tips
                VStack(spacing: 8) {
                    Text("💡 Generation Tips")
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text("• AI analyzes your prompt and preferences")
                        Text("• Higher quality takes a bit longer")
                        Text("• Extended mode creates full-length songs")
                        if styleAudioURL != nil {
                            Text("• Style reference is being analyzed")
                        }
                    }
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.8))
                }
                .padding()
                .background(Color.white.opacity(0.1))
                .cornerRadius(12)
                .padding(.horizontal, 20)
            }
        }
        .padding(.top, 30)
    }
    
    private var previewSection: some View {
        VStack(spacing: 30) {
            // Preview header
            VStack(spacing: 10) {
                Text("🎵 Your Generated Tracks")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Text("Preview and select tracks to save to your library")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.8))
                    .multilineTextAlignment(.center)
            }
            
            // Current generation batch
            if !generatedTracks.isEmpty {
                trackGridSection(
                    title: "🎵 Generated Tracks", 
                    subtitle: "Select tracks to save to your library",
                    tracks: generatedTracks, 
                    showExtend: true,
                    isPreview: true
                )
            }
            
            // Extended tracks from this session
            if !extendedTracks.isEmpty {
                trackGridSection(
                    title: "🔄 Extended Tracks", 
                    subtitle: "Longer versions created from your selection",
                    tracks: extendedTracks, 
                    showExtend: false,
                    isPreview: true
                )
            }
        }
    }
    
    private func trackGridSection(title: String, subtitle: String? = nil, tracks: [GeneratedTrack], showExtend: Bool, isPreview: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 15) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.white)
                
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                }
                
                if isPreview {
                    HStack {
                        Circle()
                            .fill(Color.blue)
                            .frame(width: 8, height: 8)
                        Text("Preview Mode")
                            .font(.caption2)
                            .fontWeight(.medium)
                            .foregroundColor(.blue)
                    }
                }
            }
            .padding(.horizontal)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 15) {
                ForEach(Array(tracks.enumerated()), id: \.offset) { index, track in
                    TrackThumbnailCard(
                        track: track,
                        index: index + 1,
                        isSelected: selectedTracks.contains(track.localURL.absoluteString),
                        showExtendButton: showExtend,
                        moodGradient: moodGradient,
                        onToggleSelection: {
                            toggleTrackSelection(track)
                        },
                        onExtend: {
                            extendTrack(track)
                        }
                    )
                }
            }
            .padding(.horizontal)
        }
    }
    
    private var bottomActionBar: some View {
        VStack(spacing: 15) {
            // Selection info
            if !selectedTracks.isEmpty {
                Text("\(selectedTracks.count) track\(selectedTracks.count == 1 ? "" : "s") selected")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.8))
            }
            
            HStack(spacing: 15) {
                // Save selected button
                Button(action: saveSelectedTracks) {
                    HStack {
                        Image(systemName: "heart.fill")
                        Text("Save Selected")
                    }
                    .font(.headline)
                    .foregroundColor(.black)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.white)
                    .cornerRadius(15)
                }
                .disabled(selectedTracks.isEmpty)
                .opacity(selectedTracks.isEmpty ? 0.6 : 1.0)
                
                // Save all button
                Button(action: saveAllTracks) {
                    HStack {
                        Image(systemName: "square.and.arrow.down")
                        Text("Save All")
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
        .padding(.bottom, 20)
        .background(
            LinearGradient(
                colors: [Color.clear, Color.black.opacity(0.3)],
                startPoint: .top,
                endPoint: .bottom
            )
        )
    }
    
    // MARK: - Actions
    
    private func startGeneration() {
        generationState = .generating
        generatedTracks = []
        extendedTracks = []
        generationProgress = 0.0
        estimatedTimeRemaining = enableExtended ? 300 : 180
        
        // Start progress simulation
        startProgressSimulation()
        
        Task {
            do {
                // Check points
                await updateProgress(0.1, "Validating subscription...")
                let validation = firebaseManager.canUserGenerate()
                if !validation.canGenerate {
                    throw PointsError.insufficientPoints(validation.reason)
                }
                
                // Consume point
                await updateProgress(0.2, "Preparing generation...")
                try await firebaseManager.consumePoint()
                
                // Analyze style audio if provided
                if styleAudioURL != nil {
                    await updateProgress(0.3, "Analyzing style reference...")
                    try await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
                }
                
                await updateProgress(0.4, "Sending request to AI...")
                
                // Generate tracks using Universal API
                let tracks = try await universalAPI.generateMusic(
                    genre: genre,
                    mood: mood,
                    prompt: prompt.isEmpty ? nil : prompt,
                    duration: duration,
                    isInstrumental: !prompt.contains("Lyrics:"),
                    customLyrics: extractCustomLyrics(),
                    styleAudio: styleAudioURL,
                    enableExtended: enableExtended
                )
                
                await updateProgress(1.0, "Generation complete!")
                
                await MainActor.run {
                    generatedTracks = tracks
                    generationState = .ready
                    
                    // Auto-select first track
                    if let firstTrack = tracks.first {
                        selectedTracks.insert(firstTrack.localURL.absoluteString)
                    }
                }
                
            } catch {
                await MainActor.run {
                    errorMessage = "Generation failed: \(error.localizedDescription)"
                    showingError = true
                    generationState = .error
                }
            }
        }
    }
    
    private func startProgressSimulation() {
        Task {
            let steps = [
                (0.1, "Connecting to AI servers..."),
                (0.2, "Processing your request..."),
                (0.3, "Analyzing \(genre) \(mood) patterns..."),
                (0.4, "AI is composing..."),
                (0.5, "Generating melodies..."),
                (0.6, "Adding instrumentation..."),
                (0.7, "Fine-tuning audio quality..."),
                (0.8, "Applying final effects..."),
                (0.9, "Preparing download..."),
                (1.0, "Almost ready!")
            ]
            
            for (progress, step) in steps {
                await updateProgress(progress, step)
                
                // Simulate realistic timing
                let delay = enableExtended ? 30_000_000_000 : 15_000_000_000 // 30s or 15s per step
                try? await Task.sleep(nanoseconds: UInt64(delay))
                
                // Break if generation is complete
                if generationState != .generating {
                    break
                }
            }
        }
    }
    
    private func updateProgress(_ progress: Double, _ step: String) async {
        await MainActor.run {
            withAnimation(.easeInOut(duration: 0.5)) {
                generationProgress = progress
                currentStep = step
                estimatedTimeRemaining = Int((1.0 - progress) * Double(enableExtended ? 300 : 180))
            }
        }
    }
    
    private func toggleTrackSelection(_ track: GeneratedTrack) {
        let trackId = track.localURL.absoluteString
        if selectedTracks.contains(trackId) {
            selectedTracks.remove(trackId)
        } else {
            selectedTracks.insert(trackId)
        }
    }
    
    private func extendTrack(_ sourceTrack: GeneratedTrack) {
        print("🎵 User requested extend for: \(sourceTrack.title)")
        
        Task {
            do {
                // Check points for extend
                let validation = firebaseManager.canUserGenerate()
                if !validation.canGenerate {
                    await MainActor.run {
                        errorMessage = validation.reason
                        showingError = true
                    }
                    return
                }
                
                // Consume point for extend
                try await firebaseManager.consumePoint()
                
                // Generate extended version using Universal API
                let extended = try await universalAPI.extendTrack(
                    originalTrack: sourceTrack,
                    additionalDuration: max(duration, 60)
                )
                
                await MainActor.run {
                    extendedTracks.append(contentsOf: extended)
                }
                
            } catch {
                await MainActor.run {
                    errorMessage = "Extend failed: \(error.localizedDescription)"
                    showingError = true
                }
            }
        }
    }
    
    private func saveSelectedTracks() {
        let tracksToSave = getAllTracks().filter { track in
            selectedTracks.contains(track.localURL.absoluteString)
        }
        
        saveTracks(tracksToSave)
    }
    
    private func saveAllTracks() {
        saveTracks(getAllTracks())
    }
    
    private func saveTracks(_ tracks: [GeneratedTrack]) {
        Task {
            for (index, track) in tracks.enumerated() {
                let trackData = TrackData(
                    title: track.title,
                    genre: genre,
                    mood: mood,
                    prompt: prompt,
                    duration: track.duration,
                    audioURL: track.localURL.absoluteString,
                    taskId: "preview-\(UUID().uuidString)",
                    createdAt: Date(),
                    isPublished: false,
                    isFavorite: false,
                    plays: 0,
                    likes: 0,
                    imageURL: track.imageURL,
                    tags: track.tags
                )
                
                try? await firebaseManager.saveTrack(trackData)
            }
            
            await MainActor.run {
                presentationMode.wrappedValue.dismiss()
            }
        }
    }
    
    private func getAllTracks() -> [GeneratedTrack] {
        return generatedTracks + extendedTracks
    }
    
    private func extractCustomLyrics() -> String? {
        if let lyricsRange = prompt.range(of: "Lyrics: ") {
            let lyricsStart = prompt.index(lyricsRange.upperBound, offsetBy: 0)
            return String(prompt[lyricsStart...])
        }
        return nil
    }
}

// MARK: - Track Thumbnail Card

struct TrackThumbnailCard: View {
    let track: GeneratedTrack
    let index: Int
    let isSelected: Bool
    let showExtendButton: Bool
    let moodGradient: [Color]
    let onToggleSelection: () -> Void
    let onExtend: () -> Void
    
    @State private var isPlaying = false
    
    var body: some View {
        VStack(spacing: 12) {
            // Thumbnail artwork with play button
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        LinearGradient(
                            colors: moodGradient,
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(height: 120)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(isSelected ? Color.white : Color.clear, lineWidth: 3)
                    )
                
                // Play button
                Button(action: playTrack) {
                    ZStack {
                        Circle()
                            .fill(Color.black.opacity(0.6))
                            .frame(width: 50, height: 50)
                        
                        Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                            .font(.title2)
                            .foregroundColor(.white)
                            .offset(x: isPlaying ? 0 : 2)
                    }
                }
                
                // Selection indicator
                VStack {
                    HStack {
                        Spacer()
                        
                        Button(action: onToggleSelection) {
                            Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                                .font(.title3)
                                .foregroundColor(.white)
                                .background(
                                    Circle()
                                        .fill(Color.black.opacity(0.3))
                                        .frame(width: 30, height: 30)
                                )
                        }
                        .padding(8)
                    }
                    Spacer()
                }
            }
            
            // Track info
            VStack(spacing: 4) {
                Text("Track \(index)")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                
                Text(formatTime(track.duration))
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.8))
            }
            
            // Action buttons
            HStack(spacing: 8) {
                Button(action: shareTrack) {
                    Image(systemName: "square.and.arrow.up")
                        .font(.caption)
                        .foregroundColor(.white)
                        .padding(8)
                        .background(Color.white.opacity(0.2))
                        .clipShape(Circle())
                }
                
                if showExtendButton {
                    Button(action: onExtend) {
                        Image(systemName: "plus.circle")
                            .font(.caption)
                            .foregroundColor(.blue)
                            .padding(8)
                            .background(Color.white.opacity(0.2))
                            .clipShape(Circle())
                    }
                }
            }
        }
        .background(Color.white.opacity(0.1))
        .cornerRadius(15)
    }
    
    private func playTrack() {
        // Convert to TrackData for global player
        let trackData = TrackData(
            title: track.title,
            genre: "",
            mood: "",
            prompt: "",
            duration: track.duration,
            audioURL: track.localURL.absoluteString,
            taskId: UUID().uuidString,
            createdAt: Date(),
            isPublished: false,
            isFavorite: false,
            plays: 0,
            likes: 0,
            imageURL: track.imageURL,
            tags: track.tags
        )
        
        TrackPlayer.shared.play(track: trackData)
        isPlaying = true
        
        // Reset after a delay (or listen to player notifications)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            isPlaying = false
        }
    }
    
    private func shareTrack() {
        let shareText = "Check out this AI-generated track!"
        let items: [Any] = [shareText, track.localURL]
        
        let activityViewController = UIActivityViewController(activityItems: items, applicationActivities: nil)
        
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first {
            window.rootViewController?.present(activityViewController, animated: true)
        }
    }
    
    private func formatTime(_ time: Double) -> String {
        let minutes = Int(time) / 60
        let seconds = Int(time) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}

struct PreviewTracksView_Previews: PreviewProvider {
    static var previews: some View {
        PreviewTracksView(
            genre: "Techno",
            mood: "Energetic",
            prompt: "Heavy bass beats",
            duration: 30.0,
            enableExtended: false,
            styleAudioURL: nil
        )
        .environmentObject(AppSettings())
        .environmentObject(FirebaseManager())
    }
}
