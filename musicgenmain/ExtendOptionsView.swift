import SwiftUI

struct ExtendOptionsView: View {
    @EnvironmentObject var appSettings: AppSettings
    @EnvironmentObject var universalAPI: UniversalPiAPI
    @EnvironmentObject var firebaseManager: FirebaseManager
    @Environment(\.presentationMode) var presentationMode
    
    let originalTrack: TrackData
    
    @State private var extensionDuration = 60.0
    @State private var extendDirection: ExtendDirection = .end
    @State private var maintainStyle = true
    @State private var addVariation = false
    @State private var customPrompt = ""
    @State private var isExtending = false
    @State private var progressValue = 0.0
    
    // Glass effect gradient based on track genre
    var genreGradient: [Color] {
        switch originalTrack.genre {
        case "Techno": return [.orange.opacity(0.7), .red.opacity(0.7)]
        case "House": return [.blue.opacity(0.7), .purple.opacity(0.7)]
        case "Trance": return [.purple.opacity(0.7), .pink.opacity(0.7)]
        case "Chill": return [.green.opacity(0.7), .blue.opacity(0.7)]
        default: return [.cyan.opacity(0.7), .blue.opacity(0.7)]
        }
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                // iOS 18 Glass Background
                LinearGradient(
                    colors: [
                        genreGradient[0].opacity(0.1),
                        genreGradient[1].opacity(0.05),
                        Color.clear
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 25) {
                        // Header with Glass Effect
                        VStack(spacing: 15) {
                            // Animated icon
                            ZStack {
                                Circle()
                                    .fill(.ultraThinMaterial)
                                    .frame(width: 100, height: 100)
                                    .shadow(color: genreGradient[0].opacity(0.3), radius: 20)
                                
                                Image(systemName: "arrow.up.right.circle.fill")
                                    .font(.system(size: 50))
                                    .foregroundStyle(
                                        LinearGradient(
                                            colors: genreGradient,
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .scaleEffect(isExtending ? 1.1 : 1.0)
                                    .animation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true), value: isExtending)
                            }
                            .padding(.top, 20)
                            
                            Text("🔄 Extend Track")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(.primary)
                            
                            VStack(spacing: 8) {
                                Text("Original: \(originalTrack.title)")
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                
                                Text("\(originalTrack.genre) • \(originalTrack.mood) • \(originalTrack.formattedDuration)")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            .padding(.horizontal, 20)
                            .padding(.vertical, 12)
                            .background(.ultraThinMaterial)
                            .cornerRadius(12)
                        }
                        .padding(.horizontal)
                        
                        // Extension Settings with Glass Effect
                        VStack(spacing: 20) {
                            Text("Extension Settings")
                                .font(.title2)
                                .fontWeight(.semibold)
                                .foregroundColor(.primary)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            
                            // Duration Selector
                            VStack(alignment: .leading, spacing: 12) {
                                HStack {
                                    Text("Extension Length")
                                        .font(.headline)
                                        .foregroundColor(.primary)
                                    Spacer()
                                    Text("\(Int(extensionDuration)) seconds")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(.ultraThinMaterial)
                                        .cornerRadius(8)
                                }
                                
                                // Custom Slider with Glass Effect
                                ZStack {
                                    RoundedRectangle(cornerRadius: 8)
                                        .fill(.ultraThinMaterial)
                                        .frame(height: 6)
                                    
                                    HStack {
                                        RoundedRectangle(cornerRadius: 8)
                                            .fill(
                                                LinearGradient(
                                                    colors: genreGradient,
                                                    startPoint: .leading,
                                                    endPoint: .trailing
                                                )
                                            )
                                            .frame(width: CGFloat(extensionDuration - 30) / 90 * UIScreen.main.bounds.width * 0.7, height: 6)
                                        Spacer()
                                    }
                                }
                                .overlay(
                                    Slider(value: $extensionDuration, in: 30...120, step: 15)
                                        .opacity(0.01) // Make invisible but keep functionality
                                )
                                
                                HStack {
                                    Text("30s")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    Spacer()
                                    Text("120s")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                            .padding(20)
                            .background(.ultraThinMaterial)
                            .cornerRadius(16)
                            
                            // Direction Selector
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Extend Direction")
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                
                                HStack(spacing: 12) {
                                    ForEach([ExtendDirection.beginning, .end, .both], id: \.self) { direction in
                                        directionButton(for: direction)
                                    }
                                }
                            }
                            .padding(20)
                            .background(.ultraThinMaterial)
                            .cornerRadius(16)
                            
                            // Style Options
                            VStack(spacing: 16) {
                                Toggle("Maintain Original Style", isOn: $maintainStyle)
                                    .toggleStyle(SwitchToggleStyle(tint: genreGradient[0]))
                                
                                Toggle("Add Musical Variation", isOn: $addVariation)
                                    .toggleStyle(SwitchToggleStyle(tint: genreGradient[1]))
                            }
                            .padding(20)
                            .background(.ultraThinMaterial)
                            .cornerRadius(16)
                            
                            // Custom Prompt (Optional)
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Custom Instructions (Optional)")
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                
                                TextField("Add specific instructions for the extension...", text: $customPrompt, axis: .vertical)
                                    .textFieldStyle(.plain)
                                    .padding(12)
                                    .background(.ultraThinMaterial)
                                    .cornerRadius(8)
                                    .lineLimit(3, reservesSpace: true)
                            }
                            .padding(20)
                            .background(.ultraThinMaterial)
                            .cornerRadius(16)
                        }
                        .padding(.horizontal)
                        
                        // Extend Button with Glass Effect
                        Button(action: startExtension) {
                            HStack {
                                if isExtending {
                                    // Animated progress indicator
                                    ZStack {
                                        Circle()
                                            .stroke(.white.opacity(0.3), lineWidth: 3)
                                            .frame(width: 24, height: 24)
                                        
                                        Circle()
                                            .trim(from: 0, to: progressValue)
                                            .stroke(.white, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                                            .frame(width: 24, height: 24)
                                            .rotationEffect(.degrees(-90))
                                            .animation(.easeInOut(duration: 0.5), value: progressValue)
                                    }
                                    
                                    Text("Extending... \(Int(progressValue * 100))%")
                                        .font(.headline)
                                        .fontWeight(.semibold)
                                } else {
                                    Image(systemName: "arrow.up.right.circle.fill")
                                        .font(.title2)
                                    
                                    Text("Extend Track")
                                        .font(.headline)
                                        .fontWeight(.semibold)
                                }
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 18)
                            .background(
                                LinearGradient(
                                    colors: genreGradient,
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(16)
                            .shadow(color: genreGradient.first?.opacity(0.4) ?? .clear, radius: 15)
                            .scaleEffect(isExtending ? 0.98 : 1.0)
                            .animation(.easeInOut(duration: 0.1), value: isExtending)
                        }
                        .disabled(isExtending)
                        .padding(.horizontal)
                        
                        Spacer(minLength: 100)
                    }
                    .padding(.vertical)
                }
            }
            .navigationTitle("Extend Track")
            .navigationBarItems(
                leading: Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                }
            )
        }
    }
    
    // MARK: - Helper Views
    
    @ViewBuilder
    private func directionButton(for direction: ExtendDirection) -> some View {
        Button(action: { extendDirection = direction }) {
            VStack(spacing: 8) {
                Image(systemName: direction.iconName)
                    .font(.title2)
                    .foregroundColor(extendDirection == direction ? .white : .primary)
                
                Text(direction.displayName)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(extendDirection == direction ? .white : .primary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                extendDirection == direction ?
                AnyView(LinearGradient(colors: genreGradient, startPoint: .leading, endPoint: .trailing)) :
                AnyView(Color.clear.background(.ultraThinMaterial))
            )
            .cornerRadius(12)
        }
    }
    
    // MARK: - Actions
    
    private func startExtension() {
        isExtending = true
        progressValue = 0.0
        
        Task {
            do {
                // Show starting notification
                await MainActor.run {
                    universalAPI.addNotification(InAppNotification(
                        id: UUID().uuidString,
                        type: .info,
                        title: "Extending Track... ⏳",
                        message: "Creating extended version of \(originalTrack.title)",
                        timestamp: Date()
                    ))
                }
                
                // Check points first
                let validation = firebaseManager.canUserGenerate()
                if !validation.canGenerate {
                    await MainActor.run {
                        isExtending = false
                        firebaseManager.errorMessage = validation.reason
                        universalAPI.addNotification(InAppNotification(
                            id: UUID().uuidString,
                            type: .error,
                            title: "Extension Failed ❌",
                            message: validation.reason,
                            timestamp: Date()
                        ))
                    }
                    return
                }
                
                // Consume point for extend operation
                try await firebaseManager.consumePoint()
                
                // Convert TrackData to GeneratedTrack for Universal API
                guard let audioURL = originalTrack.audioURL, let url = URL(string: audioURL) else {
                    await MainActor.run {
                        isExtending = false
                        firebaseManager.errorMessage = "Invalid audio file for extension"
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
                
                // Show progress indicator with realistic progression
                await MainActor.run {
                    universalAPI.isGenerating = true
                }
                
                // Animate progress realistically
                await animateProgress()
                
                let extendedTracks = try await universalAPI.extendTrack(
                    originalTrack: originalGeneratedTrack,
                    additionalDuration: extensionDuration
                )
                
                // Update progress while saving
                await updateProgress(to: 0.9)
                
                // Save extended tracks to Firebase
                for (index, extendedTrack) in extendedTracks.enumerated() {
                    let trackData = TrackData(
                        title: "Extended: \(originalTrack.title) (\(index + 1))",
                        genre: originalTrack.genre,
                        mood: originalTrack.mood,
                        prompt: "Extended from: \(originalTrack.title). \(customPrompt)",
                        duration: extendedTrack.duration,
                        audioURL: extendedTrack.localURL.absoluteString,
                        taskId: UUID().uuidString,
                        createdAt: Date(),
                        isPublished: false,
                        isFavorite: false,
                        plays: 0,
                        likes: 0,
                        imageURL: extendedTrack.imageURL,
                        tags: extendedTrack.tags + ["extended"]
                    )
                    
                    try await firebaseManager.saveTrack(trackData)
                }
                
                // Complete progress and refresh library
                await updateProgress(to: 1.0)
                
                await MainActor.run {
                    universalAPI.isGenerating = false
                }
                
                // Refresh library to show new tracks
                try await firebaseManager.refreshUserLibrary()
                
                // Dismiss modal after brief delay to let user see completion
                try await Task.sleep(nanoseconds: 800_000_000) // 0.8 seconds
                
                await MainActor.run {
                    isExtending = false
                    presentationMode.wrappedValue.dismiss()
                }
                
                print("✅ Extension completed: \(extendedTracks.count) tracks created")
                
            } catch {
                await MainActor.run {
                    isExtending = false
                    universalAPI.isGenerating = false
                    progressValue = 0.0
                    firebaseManager.errorMessage = "Failed to extend track: \(error.localizedDescription)"
                    
                    // Show error notification
                    universalAPI.addNotification(InAppNotification(
                        id: UUID().uuidString,
                        type: .error,
                        title: "Extension Failed ❌",
                        message: "Could not extend \(originalTrack.title)",
                        timestamp: Date()
                    ))
                }
                print("❌ Error extending track: \(error)")
            }
        }
    }
    
    // MARK: - Progress Animation Helpers
    
    private func animateProgress() async {
        // Simulate realistic progress stages
        await updateProgress(to: 0.1) // Initial setup
        try? await Task.sleep(nanoseconds: 500_000_000)
        
        await updateProgress(to: 0.3) // Processing
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        
        await updateProgress(to: 0.6) // Generation
        try? await Task.sleep(nanoseconds: 2_000_000_000)
        
        await updateProgress(to: 0.8) // Finalizing
    }
    
    private func updateProgress(to value: Double) async {
        await MainActor.run {
            withAnimation(.easeInOut(duration: 0.5)) {
                progressValue = value
            }
        }
    }
}

// MARK: - ExtendDirection Extension

extension ExtendDirection {
    var displayName: String {
        switch self {
        case .beginning: return "Beginning"
        case .end: return "End"
        case .both: return "Both"
        }
    }
    
    var iconName: String {
        switch self {
        case .beginning: return "arrow.left.circle"
        case .end: return "arrow.right.circle"
        case .both: return "arrow.left.and.right.circle"
        }
    }
}

struct ExtendOptionsView_Previews: PreviewProvider {
    static var previews: some View {
        ExtendOptionsView(originalTrack: TrackData(
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
            tags: ["techno"]
        ))
        .environmentObject(AppSettings())
        .environmentObject(UniversalPiAPI.shared)
        .environmentObject(FirebaseManager())
    }
}