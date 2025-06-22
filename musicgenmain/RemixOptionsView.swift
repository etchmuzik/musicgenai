import SwiftUI

struct RemixOptionsView: View {
    @EnvironmentObject var appSettings: AppSettings
    @EnvironmentObject var universalAPI: UniversalPiAPI
    @EnvironmentObject var firebaseManager: FirebaseManager
    @Environment(\.presentationMode) var presentationMode
    
    let originalTrack: TrackData
    
    @State private var selectedGenre = "Techno"
    @State private var selectedMood = "Energetic"
    @State private var remixPrompt = ""
    @State private var isRemixing = false
    
    let genres = ["Techno", "House", "Chill", "Trance", "Industrial", "Hip Hop", "Pop", "Rock", "Jazz", "Classical"]
    let moods = ["Energetic", "Euphoric", "Dark", "Minimal", "Dreamy", "Aggressive", "Romantic", "Melancholic", "Uplifting"]
    
    var moodGradient: [Color] {
        switch selectedMood {
        case "Energetic": return [.orange, .red]
        case "Euphoric": return [.purple, .pink]
        case "Dark": return [.black, .gray]
        case "Minimal": return [.gray, .white]
        case "Dreamy": return [.blue, .purple]
        default: return [.green, .blue]
        }
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 25) {
                    // Header
                    VStack(spacing: 15) {
                        Text("🎛️ Remix Track")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)
                        
                        VStack(spacing: 8) {
                            Text("Original: \(originalTrack.title)")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            Text("\(originalTrack.genre) • \(originalTrack.mood)")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        .padding()
                        .background(Color(UIColor.secondarySystemBackground))
                        .cornerRadius(12)
                    }
                    
                    // Remix prompt
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Remix Style", systemImage: "waveform.badge.plus")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        TextField("Describe your remix style (optional)", text: $remixPrompt, axis: .vertical)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .lineLimit(3, reservesSpace: true)
                        
                        Text("Example: \"Make it more aggressive with heavy bass\" or \"Add jazz elements\"")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(12)
                    
                    // Genre selection
                    VStack(alignment: .leading, spacing: 12) {
                        Label("New Genre", systemImage: "music.note")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(genres, id: \.self) { genre in
                                    genreButton(for: genre)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    .padding()
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(12)
                    
                    // Mood selection
                    VStack(alignment: .leading, spacing: 12) {
                        Label("New Mood", systemImage: "heart.fill")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(moods, id: \.self) { mood in
                                    moodButton(for: mood)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    .padding()
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(12)
                    
                    // Remix button
                    Button(action: startRemix) {
                        HStack {
                            if isRemixing {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle())
                                    .scaleEffect(0.8)
                            } else {
                                Image(systemName: "waveform.badge.plus")
                                    .font(.title2)
                            }
                            
                            Text(isRemixing ? "Creating Remix..." : "Create Remix")
                                .font(.headline)
                                .fontWeight(.semibold)
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(
                            LinearGradient(
                                colors: moodGradient,
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .cornerRadius(15)
                        .shadow(color: moodGradient.first?.opacity(0.3) ?? .clear, radius: 10)
                    }
                    .disabled(isRemixing)
                    .opacity(isRemixing ? 0.7 : 1.0)
                    
                    Spacer(minLength: 100)
                }
                .padding()
            }
            .navigationTitle("Remix Track")
            .navigationBarItems(
                leading: Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                }
            )
        }
        .onAppear {
            // Set default values different from original
            if originalTrack.genre != "House" {
                selectedGenre = "House"
            } else {
                selectedGenre = "Techno"
            }
            
            if originalTrack.mood != "Energetic" {
                selectedMood = "Energetic"
            } else {
                selectedMood = "Euphoric"
            }
        }
    }
    
    // MARK: - Helper Views
    
    @ViewBuilder
    private func genreButton(for genre: String) -> some View {
        Button(action: { selectedGenre = genre }) {
            Text(genre)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(selectedGenre == genre ? .white : .primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(
                    selectedGenre == genre ?
                    LinearGradient(colors: moodGradient, startPoint: .leading, endPoint: .trailing) :
                    LinearGradient(colors: [Color(UIColor.tertiarySystemBackground)], startPoint: .leading, endPoint: .trailing)
                )
                .cornerRadius(20)
        }
    }
    
    @ViewBuilder
    private func moodButton(for mood: String) -> some View {
        Button(action: { selectedMood = mood }) {
            Text(mood)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(selectedMood == mood ? .white : .primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(
                    selectedMood == mood ?
                    LinearGradient(colors: moodGradient, startPoint: .leading, endPoint: .trailing) :
                    LinearGradient(colors: [Color(UIColor.tertiarySystemBackground)], startPoint: .leading, endPoint: .trailing)
                )
                .cornerRadius(20)
        }
    }
    
    // MARK: - Actions
    
    private func startRemix() {
        isRemixing = true
        
        Task {
            do {
                // Show starting notification
                await MainActor.run {
                    universalAPI.addNotification(InAppNotification(
                        id: UUID().uuidString,
                        type: .info,
                        title: "Creating Remix... 🎛️",
                        message: "Remixing \(originalTrack.title) as \(selectedGenre)",
                        timestamp: Date()
                    ))
                }
                
                // Check points first
                let validation = firebaseManager.canUserGenerate()
                if !validation.canGenerate {
                    await MainActor.run {
                        isRemixing = false
                        firebaseManager.errorMessage = validation.reason
                        universalAPI.addNotification(InAppNotification(
                            id: UUID().uuidString,
                            type: .error,
                            title: "Remix Failed ❌",
                            message: validation.reason,
                            timestamp: Date()
                        ))
                    }
                    return
                }
                
                // Consume point for remix operation
                try await firebaseManager.consumePoint()
                
                // Convert TrackData to GeneratedTrack for Universal API
                guard let audioURL = originalTrack.audioURL, let url = URL(string: audioURL) else {
                    await MainActor.run {
                        isRemixing = false
                        firebaseManager.errorMessage = "Invalid audio file for remix"
                    }
                    return
                }
                
                let originalGeneratedTrack = GeneratedTrack(
                    title: originalTrack.title,
                    localURL: url,
                    originalURL: audioURL,
                    imageURL: originalTrack.imageURL,
                    lyrics: nil,
                    duration: originalTrack.duration,
                    tags: [originalTrack.genre.lowercased(), originalTrack.mood.lowercased()]
                )
                
                // Show progress indicator
                await MainActor.run {
                    universalAPI.isGenerating = true
                    universalAPI.generationProgress = 0.1
                }
                
                let remixedTracks = try await universalAPI.remixTrack(
                    originalTrack: originalGeneratedTrack,
                    newGenre: selectedGenre,
                    newMood: selectedMood,
                    remixPrompt: remixPrompt.isEmpty ? nil : remixPrompt
                )
                
                // Update progress while saving
                await MainActor.run {
                    universalAPI.generationProgress = 0.8
                }
                
                // Save remixed tracks to Firebase
                for (_, remixedTrack) in remixedTracks.enumerated() {
                    let trackData = TrackData(
                        title: "Remix: \(originalTrack.title) (\(selectedGenre))",
                        genre: selectedGenre,
                        mood: selectedMood,
                        prompt: "Remix of '\(originalTrack.title)' as \(selectedGenre) \(selectedMood). \(remixPrompt)",
                        duration: remixedTrack.duration,
                        audioURL: remixedTrack.localURL.absoluteString,
                        taskId: UUID().uuidString,
                        createdAt: Date(),
                        isPublished: false,
                        isFavorite: false,
                        plays: 0,
                        likes: 0,
                        imageURL: remixedTrack.imageURL,
                        tags: remixedTrack.tags + ["remix"]
                    )
                    
                    try await firebaseManager.saveTrack(trackData)
                }
                
                // Complete progress and refresh library
                await MainActor.run {
                    universalAPI.isGenerating = false
                    universalAPI.generationProgress = 1.0
                }
                
                // Refresh library to show new tracks
                try await firebaseManager.refreshUserLibrary()
                
                // Dismiss modal after brief delay to let user see completion
                try await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
                
                await MainActor.run {
                    isRemixing = false
                    presentationMode.wrappedValue.dismiss()
                }
                
                print("✅ Remix completed: \(remixedTracks.count) tracks created")
                
            } catch {
                await MainActor.run {
                    isRemixing = false
                    universalAPI.isGenerating = false
                    universalAPI.generationProgress = 0.0
                    firebaseManager.errorMessage = "Failed to create remix: \(error.localizedDescription)"
                    
                    // Show error notification
                    universalAPI.addNotification(InAppNotification(
                        id: UUID().uuidString,
                        type: .error,
                        title: "Remix Failed ❌",
                        message: "Could not remix \(originalTrack.title)",
                        timestamp: Date()
                    ))
                }
                print("❌ Error creating remix: \(error)")
            }
        }
    }
}

struct RemixOptionsView_Previews: PreviewProvider {
    static var previews: some View {
        RemixOptionsView(originalTrack: TrackData(
            title: "Test Track",
            genre: "Techno",
            mood: "Energetic",
            prompt: "Test prompt",
            duration: 30.0,
            audioURL: "test.mp3",
            taskId: "test",
            createdAt: Date(),
            isPublished: false,
            isFavorite: false,
            plays: 0,
            likes: 0,
            imageURL: nil,
            tags: []
        ))
        .environmentObject(AppSettings())
        .environmentObject(UniversalPiAPI.shared)
        .environmentObject(FirebaseManager.shared)
    }
}