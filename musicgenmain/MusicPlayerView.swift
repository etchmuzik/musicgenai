import SwiftUI
import AVFoundation

struct MusicPlayerView: View {
    @EnvironmentObject var appSettings: AppSettings
    @EnvironmentObject var firebaseManager: FirebaseManager
    @StateObject private var trackPlayer = TrackPlayer.shared
    @Environment(\.presentationMode) var presentationMode
    
    let track: TrackData
    
    @State private var showingLyrics = false
    @State private var showingTrackOptions = false
    @State private var showingShareSheet = false
    @State private var showingExtendOptions = false
    @State private var animateWaveform = false
    
    var body: some View {
        ZStack {
            // Background
            backgroundView
            
            // Content
            VStack(spacing: 0) {
                // Header
                headerSection
                
                // Track artwork and info
                trackInfoSection
                
                // Waveform visualization
                waveformSection
                
                // Player controls
                PlayerControlsView(track: track)
                    .padding(.horizontal, 30)
                    .padding(.vertical, 20)
                
                // Action buttons
                actionButtonsSection
                
                Spacer()
            }
        }
        .onAppear {
            animateWaveform = true
            if trackPlayer.currentTrack?.id != track.id {
                trackPlayer.play(track: track)
            }
        }
        .sheet(isPresented: $showingLyrics) {
            LyricsView(track: track)
        }
        .sheet(isPresented: $showingTrackOptions) {
            TrackOptionsView(track: track)
                .environmentObject(appSettings)
                .environmentObject(firebaseManager)
        }
        .sheet(isPresented: $showingShareSheet) {
            ShareTrackView(track: track)
        }
        .sheet(isPresented: $showingExtendOptions) {
            ExtendOptionsView(originalTrack: track)
                .environmentObject(appSettings)
                .environmentObject(UniversalPiAPI.shared)
                .environmentObject(firebaseManager)
        }
    }
    
    @ViewBuilder
    private var backgroundView: some View {
        // Dynamic gradient based on genre
        LinearGradient(
            colors: getGenreColors(track.genre).map { $0.opacity(0.6) },
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .ignoresSafeArea()
        
        // Overlay for readability
        Rectangle()
            .fill(appSettings.isDarkMode ? Color.black.opacity(0.7) : Color.white.opacity(0.85))
            .ignoresSafeArea()
    }
    
    @ViewBuilder
    private var headerSection: some View {
        HStack {
            Button("Cancel") {
                presentationMode.wrappedValue.dismiss()
            }
            .foregroundColor(.primary)
            
            Spacer()
            
            Text("Now Playing")
                .font(.headline)
                .fontWeight(.medium)
            
            Spacer()
            
            Button(action: { showingTrackOptions = true }) {
                Image(systemName: "ellipsis.circle")
                    .font(.title2)
                    .foregroundColor(.primary)
            }
        }
        .padding()
    }
    
    @ViewBuilder
    private var trackInfoSection: some View {
        VStack(spacing: 20) {
            // Album artwork
            RoundedRectangle(cornerRadius: 20)
                .fill(
                    LinearGradient(
                        colors: getGenreColors(track.genre),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 250, height: 250)
                .overlay(
                    VStack {
                        Image(systemName: track.isFavorite ? "heart.fill" : "music.note")
                            .font(.system(size: 60))
                            .foregroundColor(.white)
                            .shadow(radius: 10)
                        
                        if trackPlayer.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(1.5)
                                .padding(.top, 10)
                        }
                    }
                )
                .shadow(color: .black.opacity(0.3), radius: 20, x: 0, y: 10)
            
            // Track info
            VStack(spacing: 8) {
                Text(track.title)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
                
                HStack {
                    Text(track.genre)
                    Text("•")
                    Text(track.mood)
                }
                .font(.subheadline)
                .foregroundColor(.secondary)
                
                // Stats
                HStack(spacing: 20) {
                    HStack {
                        Image(systemName: "play.fill")
                        Text("\(track.plays)")
                    }
                    
                    HStack {
                        Image(systemName: "heart.fill")
                        Text("\(track.likes)")
                    }
                    
                    HStack {
                        Image(systemName: "clock")
                        Text(track.formattedDuration)
                    }
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }
        }
        .padding(.horizontal, 30)
    }
    
    @ViewBuilder
    private var waveformSection: some View {
        VStack(spacing: 10) {
            Text("Audio Waveform")
                .font(.caption)
                .foregroundColor(.secondary)
            
            HStack(spacing: 3) {
                ForEach(0..<50, id: \.self) { index in
                    RoundedRectangle(cornerRadius: 2)
                        .fill(trackPlayer.isPlaying ? Color.blue : Color.gray)
                        .frame(width: 4, height: trackPlayer.isPlaying ? CGFloat.random(in: 10...40) : 15)
                        .animation(
                            trackPlayer.isPlaying ? 
                            .easeInOut(duration: 0.3)
                                .repeatForever()
                                .delay(Double(index) * 0.02) : 
                            .default,
                            value: trackPlayer.isPlaying
                        )
                }
            }
            .frame(height: 50)
            .onAppear {
                animateWaveform = true
            }
        }
        .padding(.vertical, 20)
    }
    
    @ViewBuilder
    private var actionButtonsSection: some View {
        HStack(spacing: 30) {
            // Favorite button
            Button(action: toggleFavorite) {
                VStack(spacing: 5) {
                    Image(systemName: track.isFavorite ? "heart.fill" : "heart")
                        .font(.title2)
                        .foregroundColor(track.isFavorite ? .red : .secondary)
                    Text("Favorite")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Lyrics button (if available)
            if !track.prompt.isEmpty {
                Button(action: { showingLyrics = true }) {
                    VStack(spacing: 5) {
                        Image(systemName: "text.quote")
                            .font(.title2)
                            .foregroundColor(.secondary)
                        Text("Lyrics")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            // Share button
            Button(action: { showingShareSheet = true }) {
                VStack(spacing: 5) {
                    Image(systemName: "square.and.arrow.up")
                        .font(.title2)
                        .foregroundColor(.secondary)
                    Text("Share")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Extend button
            Button(action: {
                showingExtendOptions = true
            }) {
                VStack(spacing: 5) {
                    Image(systemName: "waveform.badge.plus")
                        .font(.title2)
                        .foregroundColor(.secondary)
                    Text("Extend")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Remix button
            NavigationLink(destination: RemixView()) {
                VStack(spacing: 5) {
                    Image(systemName: "waveform.badge.magnifyingglass")
                        .font(.title2)
                        .foregroundColor(.secondary)
                    Text("Remix")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.horizontal, 30)
        .padding(.vertical, 15)
    }
    
    private func toggleFavorite() {
        Task {
            do {
                try await firebaseManager.toggleTrackFavorite(track)
                print("❤️ Toggled favorite for: \(track.title)")
            } catch {
                print("❌ Error toggling favorite: \(error)")
            }
        }
    }
    
    private func getGenreColors(_ genre: String) -> [Color] {
        switch genre {
        case "Techno": return [.orange, .red]
        case "House": return [.blue, .purple]
        case "Minimal": return [.gray, .black]
        case "Trance": return [.purple, .pink]
        case "Chill": return [.green, .blue]
        case "Industrial": return [.black, .gray]
        case "Hip Hop": return [.yellow, .orange]
        case "Pop": return [.pink, .purple]
        case "Rock": return [.red, .black]
        case "Jazz": return [.brown, .orange]
        case "Classical": return [.indigo, .blue]
        default: return [.green, .blue]
        }
    }
}

// MARK: - Lyrics View
struct LyricsView: View {
    let track: TrackData
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Track info
                    VStack(alignment: .leading, spacing: 8) {
                        Text(track.title)
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Text("\(track.genre) • \(track.mood)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    Divider()
                    
                    // Prompt/Lyrics content
                    if !track.prompt.isEmpty {
                        VStack(alignment: .leading, spacing: 15) {
                            Text("Track Description")
                                .font(.headline)
                            
                            Text(track.prompt)
                                .font(.body)
                                .lineSpacing(4)
                        }
                    } else {
                        VStack(spacing: 20) {
                            Image(systemName: "text.quote")
                                .font(.system(size: 50))
                                .foregroundColor(.secondary)
                            
                            Text("No lyrics or description available for this track")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Lyrics")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(trailing: Button("Done") {
                presentationMode.wrappedValue.dismiss()
            })
        }
    }
}

// MARK: - Share Track View
struct ShareTrackView: View {
    let track: TrackData
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        VStack(spacing: 30) {
            Text("Share Track")
                .font(.title2)
                .fontWeight(.bold)
            
            // Track info
            HStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(LinearGradient(colors: [.blue, .purple], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 60, height: 60)
                    .overlay(
                        Image(systemName: "music.note")
                            .foregroundColor(.white)
                    )
                
                VStack(alignment: .leading) {
                    Text(track.title)
                        .font(.headline)
                    Text("\(track.genre) • \(track.mood)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(15)
            
            // Share options
            VStack(spacing: 15) {
                ShareButton(
                    icon: "message.fill",
                    title: "Messages",
                    action: { shareViaMessages() }
                )
                
                ShareButton(
                    icon: "envelope.fill",
                    title: "Email",
                    action: { shareViaEmail() }
                )
                
                ShareButton(
                    icon: "square.and.arrow.up.fill",
                    title: "More Options",
                    action: { shareViaActivitySheet() }
                )
            }
            
            Button("Cancel") {
                presentationMode.wrappedValue.dismiss()
            }
            .padding(.top, 20)
        }
        .padding()
    }
    
    private func shareViaMessages() {
        // Implement Messages sharing
        shareViaActivitySheet()
    }
    
    private func shareViaEmail() {
        // Implement Email sharing
        shareViaActivitySheet()
    }
    
    private func shareViaActivitySheet() {
        guard let audioURL = track.audioURL else { return }
        
        let shareText = "Check out this AI-generated \(track.genre) track: \(track.title)"
        let items: [Any] = [shareText, URL(string: audioURL) as Any].compactMap { $0 }
        
        let activityViewController = UIActivityViewController(activityItems: items, applicationActivities: nil)
        
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first {
            window.rootViewController?.present(activityViewController, animated: true)
        }
        
        presentationMode.wrappedValue.dismiss()
    }
}

struct ShareButton: View {
    let icon: String
    let title: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(.blue)
                    .frame(width: 30)
                
                Text(title)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(12)
        }
    }
}

struct MusicPlayerView_Previews: PreviewProvider {
    static var previews: some View {
        MusicPlayerView(track: TrackData(
            title: "Epic Techno Journey",
            genre: "Techno",
            mood: "Energetic",
            prompt: "High energy techno track",
            duration: 180,
            audioURL: "https://example.com/audio.mp3",
            taskId: "test",
            createdAt: Date(),
            isPublished: false,
            isFavorite: true,
            plays: 42,
            likes: 12,
            imageURL: nil,
            tags: ["techno", "energetic"]
        ))
        .environmentObject(AppSettings())
    }
}