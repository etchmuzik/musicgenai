import SwiftUI
import AVFoundation
import Combine

struct DualTrackGenerationView: View {
    @EnvironmentObject var appSettings: AppSettings
    @EnvironmentObject var firebaseManager: FirebaseManager
    let genre: String
    let mood: String
    let prompt: String
    let duration: Double
    let enableExtended: Bool
    let styleAudioURL: URL?
    
    @State private var standardTracks: [GeneratedTrack] = []
    @State private var extendedTracks: [GeneratedTrack] = []
    @State private var standardState: TrackState = .generating
    @State private var extendedState: TrackState = .generating
    @State private var showingError = false
    @State private var errorMessage = ""
    @Environment(\.presentationMode) var presentationMode
    
    enum TrackState {
        case generating
        case downloading
        case ready
        case error
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
            
            VStack(spacing: 20) {
                // Header
                VStack(spacing: 15) {
                    Text("Your Generated Tracks")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                    
                    VStack(spacing: 5) {
                        Text("\(genre) • \(mood)")
                            .font(.title3)
                            .foregroundColor(.white.opacity(0.8))
                        
                        Text("Generating all variations...")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.6))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 4)
                            .background(Color.white.opacity(0.2))
                            .cornerRadius(8)
                    }
                }
                
                // All Tracks Display
                ScrollView {
                    LazyVStack(spacing: 20) {
                        // Standard Tracks Section
                        TrackSectionView(
                            title: "Standard Tracks",
                            tracks: standardTracks,
                            state: standardState,
                            moodGradient: moodGradient,
                            enableExtended: enableExtended,
                            onExtend: { track in
                                extendTrack(track)
                            }
                        )
                        
                        // Extended Tracks Section (if enabled)
                        if enableExtended {
                            TrackSectionView(
                                title: "Extended Tracks",
                                tracks: extendedTracks,
                                state: extendedState,
                                moodGradient: moodGradient,
                                enableExtended: false, // No extend on extended tracks
                                onExtend: { _ in }
                            )
                        }
                    }
                    .padding(.horizontal)
                }
                
                // Action buttons
                if !standardTracks.isEmpty || !extendedTracks.isEmpty {
                    VStack(spacing: 15) {
                        Button("Back to Create") {
                            presentationMode.wrappedValue.dismiss()
                        }
                        .buttonStyle(SecondaryButtonStyle())
                    }
                    .padding(.horizontal)
                }
            }
            .padding()
        }
        .navigationTitle("")
        .navigationBarHidden(true)
        .onAppear {
            startDualGeneration()
        }
        .alert("Generation Error", isPresented: $showingError) {
            Button("Retry") {
                startDualGeneration()
            }
            Button("Cancel", role: .cancel) {
                presentationMode.wrappedValue.dismiss()
            }
        } message: {
            Text(errorMessage)
        }
    }
    
    // MARK: - Generation Logic
    
    private func startDualGeneration() {
        // Check if user can generate
        let validation = firebaseManager.canUserGenerate()
        
        if !validation.canGenerate {
            errorMessage = validation.reason
            showingError = true
            return
        }
        
        // Only generate standard tracks initially
        Task {
            await generateStandardTracks()
            
            // Generate extended tracks only if extended mode is enabled
            if enableExtended {
                await generateExtendedTracks()
            }
        }
    }
    
    private func generateStandardTracks() async {
        print("🎵 Starting standard tracks generation...")
        
        do {
            // Consume point for standard generation
            try await firebaseManager.consumePoint()
            
            await MainActor.run {
                standardState = .downloading
            }
            
            // Generate using standard Udio API (returns multiple tracks)
            let tracks = try await MusicGenAPI.streamMultiple(
                genre: genre,
                mood: mood,
                prompt: prompt.isEmpty ? nil : prompt,
                duration: min(duration, 120), // Cap standard at 2min
                isInstrumental: !prompt.contains("Lyrics:"),
                customLyrics: extractCustomLyrics()
            )
            
            await MainActor.run {
                standardTracks = tracks
                standardState = .ready
                
                // Auto-save all standard tracks
                for (index, track) in tracks.enumerated() {
                    saveTrackToLibrary(track, variant: "Standard \(index + 1)")
                }
            }
            
        } catch {
            print("❌ Standard tracks generation failed: \(error)")
            await MainActor.run {
                standardState = .error
            }
        }
    }
    
    private func generateExtendedTracks() async {
        print("🎵 Starting extended tracks generation...")
        
        do {
            // Small delay to stagger API calls
            try await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds
            
            // Consume point for extended generation
            try await firebaseManager.consumePoint()
            
            await MainActor.run {
                extendedState = .downloading
            }
            
            // Use DiffRhythm for extended tracks
            let tracks = try await MusicGenAPI.generateWithDiffRhythm(
                genre: genre,
                mood: mood,
                prompt: prompt.isEmpty ? nil : prompt,
                duration: duration,
                customLyrics: extractCustomLyrics(),
                styleAudio: styleAudioURL?.absoluteString
            )
            
            await MainActor.run {
                extendedTracks = tracks
                extendedState = .ready
                
                // Auto-save all extended tracks
                for (index, track) in tracks.enumerated() {
                    saveTrackToLibrary(track, variant: "Extended \(index + 1)")
                }
            }
            
        } catch {
            print("❌ Extended tracks generation failed: \(error)")
            await MainActor.run {
                extendedState = .error
            }
        }
    }
    
    // User-triggered extend functionality
    private func extendTrack(_ sourceTrack: GeneratedTrack) {
        print("🎵 User requested extend for track: \(sourceTrack.title)")
        
        Task {
            do {
                // Check if user can generate
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
                
                // Generate extended version based on the source track
                let extendedTracks = try await MusicGenAPI.generateWithDiffRhythm(
                    genre: genre,
                    mood: mood,
                    prompt: "Extended version of: \(sourceTrack.title)",
                    duration: max(duration * 2, 240), // Make it longer
                    customLyrics: extractCustomLyrics(),
                    styleAudio: sourceTrack.localURL.absoluteString // Use source as style reference
                )
                
                await MainActor.run {
                    // Add extended tracks to the extended section
                    self.extendedTracks.append(contentsOf: extendedTracks)
                    
                    // Save extended tracks
                    for (index, track) in extendedTracks.enumerated() {
                        saveTrackToLibrary(track, variant: "Extended from \(sourceTrack.title) \(index + 1)")
                    }
                }
                
            } catch {
                print("❌ Extend track failed: \(error)")
                await MainActor.run {
                    errorMessage = "Failed to extend track: \(error.localizedDescription)"
                    showingError = true
                }
            }
        }
    }
    
    private func extractCustomLyrics() -> String? {
        if let lyricsRange = prompt.range(of: "Lyrics: ") {
            let lyricsStart = prompt.index(lyricsRange.upperBound, offsetBy: 0)
            return String(prompt[lyricsStart...])
        }
        return nil
    }
    
    private func saveTrackToLibrary(_ track: GeneratedTrack, variant: String) {
        let trackData = TrackData(
            title: "\(track.title) (\(variant))",
            genre: genre,
            mood: mood,
            prompt: prompt,
            duration: track.duration,
            audioURL: track.localURL.absoluteString,
            taskId: "dual-\(UUID().uuidString)",
            createdAt: Date(),
            isPublished: false,
            isFavorite: false,
            plays: 0,
            likes: 0,
            imageURL: track.imageURL,
            tags: track.tags
        )
        
        Task {
            do {
                try await firebaseManager.saveTrack(trackData)
                print("✅ Track \(variant) auto-saved to library: \(track.title)")
            } catch {
                print("❌ Error auto-saving track \(variant): \(error)")
            }
        }
    }
    
}

// MARK: - Track Section View

struct TrackSectionView: View {
    let title: String
    let tracks: [GeneratedTrack]
    let state: DualTrackGenerationView.TrackState
    let moodGradient: [Color]
    let enableExtended: Bool
    let onExtend: (GeneratedTrack) -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            // Section Header
            HStack {
                Text(title)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Spacer()
                
                // State indicator
                if tracks.isEmpty {
                    Text(stateText)
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.white.opacity(0.2))
                        .cornerRadius(6)
                }
            }
            
            // Tracks Display
            if tracks.isEmpty {
                // Show loading state
                TrackPlaceholderCard(
                    state: state,
                    moodGradient: moodGradient
                )
            } else {
                // Show all tracks
                ForEach(Array(tracks.enumerated()), id: \.offset) { index, track in
                    TrackPreviewCard(
                        title: "Track \(index + 1)",
                        subtitle: track.title,
                        track: track,
                        state: .ready,
                        moodGradient: moodGradient,
                        showExtendButton: enableExtended,
                        onExtend: {
                            onExtend(track)
                        }
                    )
                }
            }
        }
    }
    
    private var stateText: String {
        switch state {
        case .generating: return "Generating..."
        case .downloading: return "Downloading..."
        case .ready: return "Ready"
        case .error: return "Failed"
        }
    }
}

// MARK: - Track Placeholder Card

struct TrackPlaceholderCard: View {
    let state: DualTrackGenerationView.TrackState
    let moodGradient: [Color]
    
    var body: some View {
        HStack(spacing: 15) {
            // Loading artwork
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        LinearGradient(
                            colors: moodGradient.map { $0.opacity(0.5) },
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 70, height: 70)
                
                Group {
                    switch state {
                    case .generating:
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    case .downloading:
                        Image(systemName: "arrow.down.circle")
                            .font(.title)
                            .foregroundColor(.white)
                    case .error:
                        Image(systemName: "exclamationmark.triangle")
                            .font(.title)
                            .foregroundColor(.red)
                    case .ready:
                        Image(systemName: "music.note")
                            .font(.title)
                            .foregroundColor(.white)
                    }
                }
            }
            
            // Loading info
            VStack(alignment: .leading, spacing: 4) {
                Text(stateText)
                    .font(.headline)
                    .foregroundColor(.white)
                
                Text("Please wait...")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.8))
                
                if state == .generating {
                    Text("This may take a few minutes")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                }
            }
            
            Spacer()
        }
        .padding()
        .background(Color.white.opacity(0.1))
        .cornerRadius(15)
        .overlay(
            RoundedRectangle(cornerRadius: 15)
                .stroke(Color.white.opacity(0.2), lineWidth: 1)
        )
    }
    
    private var stateText: String {
        switch state {
        case .generating: return "Generating Tracks"
        case .downloading: return "Downloading"
        case .ready: return "Ready"
        case .error: return "Generation Failed"
        }
    }
}

// MARK: - Track Preview Card

struct TrackPreviewCard: View {
    let title: String
    let subtitle: String
    let track: GeneratedTrack?
    let state: DualTrackGenerationView.TrackState
    let moodGradient: [Color]
    let showExtendButton: Bool
    let onExtend: () -> Void
    
    var body: some View {
        HStack(spacing: 15) {
            // Track artwork/state indicator
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        LinearGradient(
                            colors: moodGradient,
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 70, height: 70)
                
                Group {
                    switch state {
                    case .generating:
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    case .downloading:
                        Image(systemName: "arrow.down.circle.fill")
                            .font(.title)
                            .foregroundColor(.white)
                    case .ready:
                        Button(action: playTrack) {
                            Image(systemName: "play.circle.fill")
                                .font(.title)
                                .foregroundColor(.white)
                        }
                    case .error:
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.title)
                            .foregroundColor(.red)
                    }
                }
            }
            
            // Track info
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.white)
                
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.8))
                
                // State text
                Text(stateText)
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.6))
                
                // Duration (if available)
                if let track = track {
                    Text(formatTime(track.duration))
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.8))
                }
            }
            
            Spacer()
            
            // Actions
            if state == .ready {
                VStack(spacing: 8) {
                    Button(action: shareTrack) {
                        Image(systemName: "square.and.arrow.up")
                            .font(.title2)
                            .foregroundColor(.white)
                    }
                    
                    Button(action: addToFavorites) {
                        Image(systemName: "heart")
                            .font(.title2)
                            .foregroundColor(.white)
                    }
                    
                    // Extend button (only show if enabled)
                    if showExtendButton {
                        Button(action: onExtend) {
                            Image(systemName: "plus.circle")
                                .font(.title2)
                                .foregroundColor(.blue)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color.white.opacity(0.1))
        .cornerRadius(15)
        .overlay(
            RoundedRectangle(cornerRadius: 15)
                .stroke(Color.white.opacity(0.2), lineWidth: 1)
        )
    }
    
    private var stateText: String {
        switch state {
        case .generating: return "Generating..."
        case .downloading: return "Downloading..."
        case .ready: return "Ready to play"
        case .error: return "Generation failed"
        }
    }
    
    private func playTrack() {
        guard let track = track else { return }
        
        // Convert GeneratedTrack to TrackData for global player
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
    }
    
    private func shareTrack() {
        guard let track = track else { return }
        
        let shareText = "Check out this AI-generated track: \(track.title)"
        let items: [Any] = [shareText, track.localURL]
        
        let activityViewController = UIActivityViewController(activityItems: items, applicationActivities: nil)
        
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first {
            window.rootViewController?.present(activityViewController, animated: true)
        }
    }
    
    private func addToFavorites() {
        // TODO: Implement favorites functionality
        print("Added to favorites: \(track?.title ?? "Unknown")")
    }
    
    private func formatTime(_ time: Double) -> String {
        let minutes = Int(time) / 60
        let seconds = Int(time) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}

// MARK: - Button Styles

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundColor(.black)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.white)
            .cornerRadius(15)
            .scaleEffect(configuration.isPressed ? 0.95 : 1)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
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
            .scaleEffect(configuration.isPressed ? 0.95 : 1)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

struct DualTrackGenerationView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            DualTrackGenerationView(
                genre: "Techno",
                mood: "Energetic", 
                prompt: "Heavy bass with dark vibes",
                duration: 30.0,
                enableExtended: false,
                styleAudioURL: nil
            )
            .environmentObject(AppSettings())
            .environmentObject(FirebaseManager())
        }
    }
}