import SwiftUI
import UniformTypeIdentifiers

struct ContentView: View {
    @EnvironmentObject var appSettings: AppSettings
    @EnvironmentObject var firebaseManager: FirebaseManager
    @EnvironmentObject var universalAPI: UniversalPiAPI
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @State private var showingSubscriptionView = false
    @State private var selectedGenre = "Techno"
    @State private var selectedMood = "Energetic"
    @State private var promptText = ""
    @State private var duration = 30.0
    @State private var isInstrumental = true
    @State private var customLyrics = ""
    @State private var enableExtended = false
    @State private var showingLyricsTemplates = false
    @State private var styleAudioURL: URL?
    @State private var showingAudioPicker = false
    
    let genres = ["Techno", "House", "Chill", "Trance", "Industrial", "Hip Hop", "Pop", "Rock", "Jazz", "Classical"]
    let moods = ["Energetic", "Euphoric", "Dark", "Minimal", "Dreamy", "Aggressive", "Romantic", "Melancholic", "Uplifting"]
    
    var genreIcon: String {
        switch selectedGenre {
        case "Techno": return "waveform.circle.fill"
        case "House": return "house.fill"
        case "Chill": return "leaf.fill"
        case "Trance": return "sparkles"
        case "Industrial": return "gearshape.2.fill"
        default: return "music.note"
        }
    }
    
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
            ZStack {
                // Background
                LinearGradient(
                    colors: moodGradient.map { $0.opacity(0.1) },
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                // Content
                ScrollView {
                    LazyVStack(spacing: 20) {
                        headerSection
                        
                        // Subscription status section
                        subscriptionStatusSection
                        
                        // Queue status (if any tasks)
                        QueueStatusView()
                            .environmentObject(universalAPI)
                            .environmentObject(appSettings)
                        
                        promptSection
                        lyricsSection
                        styleAudioSection
                        selectionSection
                        durationSection
                        generateButton
                    }
                    .padding(.top, 20)
                    .padding(.bottom, 100)
                }
            }
            .navigationBarHidden(true)
        }
        .sheet(isPresented: $showingLyricsTemplates) {
            LyricsTemplatesView(selectedLyrics: $customLyrics, isPresented: $showingLyricsTemplates)
                .environmentObject(appSettings)
        }
        .sheet(isPresented: $showingAudioPicker) {
            AudioPickerView(selectedAudioURL: $styleAudioURL, isPresented: $showingAudioPicker)
                .environmentObject(appSettings)
        }
        .sheet(isPresented: $showingSubscriptionView) {
            SubscriptionView()
                .environmentObject(firebaseManager)
        }
    }
    
    // MARK: - UI Sections
    
    @ViewBuilder
    private var headerSection: some View {
        VStack(spacing: 15) {
            HStack {
                Image(systemName: genreIcon)
                    .font(.system(size: 40))
                    .foregroundColor(.primary)
                
                VStack(alignment: .leading) {
                    Text("Create Music")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                    
                    Text("AI-powered music generation")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            .padding(.horizontal)
        }
    }
    
    @ViewBuilder
    private var subscriptionStatusSection: some View {
        if let userProfile = firebaseManager.userProfile {
            VStack(spacing: 12) {
                HStack {
                    // Plan status
                    HStack(spacing: 8) {
                        Image(systemName: userProfile.currentPlan.icon)
                            .foregroundColor(userProfile.currentPlan.color)
                            .font(.system(size: 16, weight: .medium))
                        
                        Text(userProfile.currentPlan.displayName)
                            .font(.headline)
                            .fontWeight(.semibold)
                            .foregroundColor(userProfile.currentPlan.color)
                        
                        if userProfile.currentPlan != .free {
                            Text("ACTIVE")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.green)
                                .cornerRadius(4)
                        }
                    }
                    
                    Spacer()
                    
                    // Remaining generations
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("\(userProfile.remainingPoints)")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(userProfile.remainingPoints > 10 ? .primary : .orange)
                        
                        Text("remaining")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                // Progress bar for daily usage
                if userProfile.currentPlan.dailyLimit > 0 {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text("Today: \(userProfile.usedPointsToday)/\(userProfile.currentPlan.dailyLimit)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            Spacer()
                            
                            if userProfile.usedPointsToday >= userProfile.currentPlan.dailyLimit {
                                Text("Daily limit reached")
                                    .font(.caption)
                                    .foregroundColor(.red)
                            }
                        }
                        
                        ProgressView(value: userProfile.dailyProgress)
                            .progressViewStyle(LinearProgressViewStyle(tint: userProfile.currentPlan.color))
                            .scaleEffect(y: 0.8)
                    }
                }
                
                // Upgrade prompt for free users or low credits
                if userProfile.currentPlan == .free || userProfile.remainingPoints <= 5 {
                    Button(action: {
                        showingSubscriptionView = true
                    }) {
                        HStack {
                            Image(systemName: userProfile.currentPlan == .free ? "crown.fill" : "bolt.fill")
                                .foregroundColor(.white)
                            
                            Text(userProfile.currentPlan == .free ? "Upgrade to Premium" : "Get More Credits")
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                            
                            Spacer()
                            
                            Image(systemName: "arrow.right")
                                .foregroundColor(.white)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(
                            LinearGradient(
                                colors: [.purple, .blue],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .cornerRadius(12)
                    }
                }
            }
            .padding()
            .background(Color(UIColor.secondarySystemBackground))
            .cornerRadius(15)
            .padding(.horizontal)
        }
    }
    
    @ViewBuilder
    private var promptSection: some View {
        VStack(alignment: .leading, spacing: 15) {
            Label("Describe Your Music", systemImage: "text.quote")
                .font(.headline)
                .foregroundColor(.primary)
            
            TextField("Enter a description (optional)", text: $promptText, axis: .vertical)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .lineLimit(3, reservesSpace: true)
            
            Text("Example: \"Heavy bass with dark industrial vibes\"")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(12)
        .padding(.horizontal)
    }
    
    @ViewBuilder
    private var lyricsSection: some View {
        VStack(alignment: .leading, spacing: 15) {
            HStack {
                Label("Lyrics", systemImage: "music.mic")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Spacer()
                
                if !isInstrumental && !customLyrics.isEmpty {
                    Text("\(customLyrics.count) chars")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Toggle("Instrumental (no vocals)", isOn: $isInstrumental)
                .toggleStyle(SwitchToggleStyle())
                .onChange(of: isInstrumental) { newValue in
                    if newValue {
                        // Clear lyrics when switching to instrumental
                        customLyrics = ""
                    }
                }
            
            if !isInstrumental {
                VStack(alignment: .leading, spacing: 10) {
                    // Lyrics input with enhanced UI
                    ZStack(alignment: .topLeading) {
                        TextEditor(text: $customLyrics)
                            .scrollContentBackground(.hidden)
                            .padding(8)
                            .background(Color(UIColor.tertiarySystemBackground))
                            .cornerRadius(10)
                            .frame(minHeight: 100, maxHeight: 200)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                            )
                        
                        // Placeholder text
                        if customLyrics.isEmpty {
                            Text("Enter your lyrics here...\nOr leave empty for AI-generated lyrics")
                                .foregroundColor(.gray.opacity(0.5))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 16)
                                .allowsHitTesting(false)
                        }
                    }
                    
                    // Lyrics helper buttons
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            LyricsHelperButton(title: "Clear", systemImage: "xmark.circle") {
                                customLyrics = ""
                            }
                            .disabled(customLyrics.isEmpty)
                            
                            LyricsHelperButton(title: "Verse", systemImage: "text.alignleft") {
                                customLyrics += "\n\n[Verse]\n"
                            }
                            
                            LyricsHelperButton(title: "Chorus", systemImage: "repeat") {
                                customLyrics += "\n\n[Chorus]\n"
                            }
                            
                            LyricsHelperButton(title: "Bridge", systemImage: "link") {
                                customLyrics += "\n\n[Bridge]\n"
                            }
                            
                            if enableExtended {
                                LyricsHelperButton(title: "Timed", systemImage: "timer") {
                                    showTimedLyricsInfo()
                                }
                            }
                            
                            LyricsHelperButton(title: "Templates", systemImage: "doc.text") {
                                showingLyricsTemplates = true
                            }
                        }
                    }
                    
                    // Info text
                    VStack(alignment: .leading, spacing: 4) {
                        if customLyrics.isEmpty {
                            Text("💡 Leave empty for AI-generated lyrics")
                                .font(.caption)
                                .foregroundColor(.blue)
                        } else {
                            Text("✅ Using custom lyrics")
                                .font(.caption)
                                .foregroundColor(.green)
                        }
                        
                        if enableExtended {
                            Text("Extended mode supports timed lyrics for precise placement")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(12)
        .padding(.horizontal)
    }
    
    @ViewBuilder
    private var styleAudioSection: some View {
        VStack(alignment: .leading, spacing: 15) {
            HStack {
                Label("Style Reference Audio", systemImage: "waveform")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Spacer()
                
                if !enableExtended {
                    Text("Extended mode only")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.orange.opacity(0.1))
                        .cornerRadius(8)
                }
            }
            
            if !enableExtended {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Style reference audio is only available in extended mode for longer tracks.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    Text("Enable extended mode below to upload a reference audio file that will guide the style of your generated music.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            } else {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Upload an audio file to guide the style of your generated music. The system will analyze the reference and create music with similar characteristics.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    if let styleAudioURL = styleAudioURL {
                        // Show selected audio file
                        HStack {
                            Image(systemName: "music.note")
                                .foregroundColor(.blue)
                                .frame(width: 30)
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text(styleAudioURL.lastPathComponent)
                                    .font(.subheadline)
                                    .foregroundColor(.primary)
                                    .lineLimit(1)
                                
                                Text("Style reference selected")
                                    .font(.caption)
                                    .foregroundColor(.green)
                            }
                            
                            Spacer()
                            
                            Button("Remove") {
                                self.styleAudioURL = nil
                            }
                            .font(.caption)
                            .foregroundColor(.red)
                        }
                        .padding()
                        .background(Color(UIColor.tertiarySystemBackground))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.blue.opacity(0.3), lineWidth: 1)
                        )
                    } else {
                        // Upload button
                        Button(action: {
                            showingAudioPicker = true
                        }) {
                            HStack {
                                Image(systemName: "plus.circle.fill")
                                    .font(.title2)
                                    .foregroundColor(.blue)
                                
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Upload Style Reference")
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                        .foregroundColor(.primary)
                                    
                                    Text("MP3, WAV, M4A supported")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                
                                Spacer()
                                
                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                            .padding()
                            .background(Color(UIColor.tertiarySystemBackground))
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                            )
                        }
                    }
                    
                    // Info text
                    VStack(alignment: .leading, spacing: 4) {
                        Text("💡 Tip: Use a 15-30 second clip of music with the style you want to replicate")
                            .font(.caption)
                            .foregroundColor(.blue)
                        
                        Text("🎵 AI will analyze tempo, key, and musical characteristics")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(12)
        .padding(.horizontal)
    }
    
    @ViewBuilder
    private var selectionSection: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Genre Selection
            VStack(alignment: .leading, spacing: 12) {
                Label("Genre", systemImage: "music.note")
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
            
            // Mood Selection
            VStack(alignment: .leading, spacing: 12) {
                Label("Mood", systemImage: "heart.fill")
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
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(12)
        .padding(.horizontal)
    }
    
    @ViewBuilder
    private var durationSection: some View {
        VStack(alignment: .leading, spacing: 15) {
            Label("Duration & Options", systemImage: "clock")
                .font(.headline)
                .foregroundColor(.primary)
            
            // Extended mode selection
            Toggle("Extended mode (longer & more creative)", isOn: $enableExtended)
                .toggleStyle(SwitchToggleStyle())
                .onChange(of: enableExtended) { newValue in
                    // Auto-adjust duration when switching modes
                    if newValue && duration < 60 {
                        duration = 81.0 // Default to extended length
                    } else if !newValue && duration > 120 {
                        duration = 30.0 // Default to standard length
                        // Clear style audio when switching away from extended mode
                        styleAudioURL = nil
                    }
                }
            
            if enableExtended {
                Text("Extended: Generate full-length songs (1.3-4.5 min) with advanced options")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.top, -10)
            } else {
                Text("Standard: Quick generation for shorter tracks (30s-2min)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.top, -10)
            }
            
            // Duration Selection
            if enableExtended {
                HStack(spacing: 12) {
                    durationButton(81, "1.3m", subtitle: "Short")
                    durationButton(285, "4.5m", subtitle: "Full")
                }
            } else {
                HStack(spacing: 12) {
                    durationButton(30, "30s")
                    durationButton(60, "1m")
                    durationButton(120, "2m")
                }
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(12)
        .padding(.horizontal)
    }
    
    @ViewBuilder
    private var generateButton: some View {
        let userProfile = firebaseManager.userProfile
        let canGenerate = userProfile?.canGenerateToday ?? false
        let isAtDailyLimit = userProfile?.usedPointsToday ?? 0 >= userProfile?.currentPlan.dailyLimit ?? 0
        
        if canGenerate && !isAtDailyLimit {
            // Normal generate button
            NavigationLink(destination: PreviewTracksView(
                genre: selectedGenre,
                mood: selectedMood,
                prompt: buildFinalPrompt(),
                duration: duration,
                enableExtended: enableExtended,
                styleAudioURL: styleAudioURL
            ).environmentObject(firebaseManager)) {
                HStack {
                    Image(systemName: "wand.and.stars")
                        .font(.title2)
                    Text("Generate Tracks")
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
            .padding(.horizontal)
            .padding(.top, 10)
        } else {
            // Upgrade prompt button
            Button(action: {
                showingSubscriptionView = true
            }) {
                VStack(spacing: 8) {
                    HStack {
                        Image(systemName: isAtDailyLimit ? "clock.fill" : "lock.fill")
                            .font(.title2)
                            .foregroundColor(.white)
                        
                        Text(isAtDailyLimit ? "Daily Limit Reached" : "Unlock Music Generation")
                            .font(.headline)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                    }
                    
                    Text(isAtDailyLimit ? "Upgrade for unlimited daily generations" : "Subscribe to start creating AI music")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.9))
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(
                    LinearGradient(
                        colors: [.purple, .blue],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(15)
                .overlay(
                    RoundedRectangle(cornerRadius: 15)
                        .stroke(Color.white.opacity(0.3), lineWidth: 1)
                )
            }
            .padding(.horizontal)
            .padding(.top, 10)
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
    
    @ViewBuilder
    private func durationButton(_ time: Double, _ label: String, subtitle: String? = nil) -> some View {
        Button(action: { duration = time }) {
            VStack(spacing: 4) {
                Text(label)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(duration == time ? .white : .primary)
                
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.caption2)
                        .foregroundColor(duration == time ? .white.opacity(0.8) : .secondary)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                duration == time ? 
                LinearGradient(colors: moodGradient, startPoint: .leading, endPoint: .trailing) :
                LinearGradient(colors: [Color(UIColor.tertiarySystemBackground)], startPoint: .leading, endPoint: .trailing)
            )
            .cornerRadius(10)
        }
    }
    
    // MARK: - Helper Functions
    
    private func buildFinalPrompt() -> String {
        var fullPrompt = promptText.isEmpty ? "" : promptText
        
        if !isInstrumental && !customLyrics.isEmpty {
            fullPrompt += fullPrompt.isEmpty ? "" : " "
            fullPrompt += "Lyrics: \(customLyrics)"
        }
        
        if enableExtended && styleAudioURL != nil {
            fullPrompt += fullPrompt.isEmpty ? "" : " "
            fullPrompt += "StyleAudio: \(styleAudioURL!.lastPathComponent)"
        }
        
        return fullPrompt
    }
    
    // Helper function for timed lyrics info
    private func showTimedLyricsInfo() {
        // For now, just add a template to the lyrics
        customLyrics += """
        
        
        [Timed Lyrics Example]
        [00:00] Intro starts here
        [00:15] First verse begins
        [00:30] Chorus kicks in
        [00:45] Second verse
        [01:00] Final chorus
        
        Note: Use [MM:SS] format for timing
        """
    }
}

// MARK: - Helper Components

struct LyricsHelperButton: View {
    let title: String
    let systemImage: String
    let action: () -> Void
    @Environment(\.isEnabled) private var isEnabled
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Image(systemName: systemImage)
                    .font(.caption)
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .foregroundColor(isEnabled ? .blue : .gray)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(
                isEnabled ? Color.blue.opacity(0.1) : Color.gray.opacity(0.1)
            )
            .cornerRadius(15)
        }
    }
}

// MARK: - Lyrics Templates View

struct LyricsTemplatesView: View {
    @Binding var selectedLyrics: String
    @Binding var isPresented: Bool
    @EnvironmentObject var appSettings: AppSettings
    
    let templates = [
        LyricsTemplate(
            title: "Pop Song Structure",
            icon: "music.note",
            content: """
            [Verse 1]
            (Your verse lyrics here)
            
            [Pre-Chorus]
            (Build up to the chorus)
            
            [Chorus]
            (Main hook/message)
            
            [Verse 2]
            (Second verse)
            
            [Pre-Chorus]
            (Build up again)
            
            [Chorus]
            (Repeat main hook)
            
            [Bridge]
            (Something different)
            
            [Chorus]
            (Final chorus)
            """
        ),
        LyricsTemplate(
            title: "Electronic/Dance",
            icon: "waveform",
            content: """
            [Intro]
            (Atmospheric opening)
            
            [Build Up]
            Feel the rhythm rising
            Energy is climbing
            
            [Drop]
            (Main beat drops here)
            
            [Breakdown]
            (Stripped back section)
            
            [Build Up]
            Coming back stronger
            
            [Drop]
            (Final drop)
            """
        ),
        LyricsTemplate(
            title: "Hip Hop Structure",
            icon: "mic.fill",
            content: """
            [Intro]
            Yeah, yeah
            Let's go
            
            [Verse 1]
            (16 bars)
            
            [Hook]
            (Catchy repeated phrase)
            
            [Verse 2]
            (16 bars)
            
            [Hook]
            (Repeat)
            
            [Verse 3]
            (16 bars)
            
            [Outro]
            (Fade out)
            """
        ),
        LyricsTemplate(
            title: "Timed Lyrics (DiffRhythm)",
            icon: "timer",
            content: """
            [00:00] (Intro begins)
            [00:15] First verse starts here
            [00:30] Moving to the chorus now
            [00:45] This is the main hook
            [01:00] Second verse begins
            [01:15] Building up again
            [01:30] Back to the chorus
            [01:45] Bridge section
            [02:00] Final chorus
            [02:15] Outro fading out
            """
        ),
        LyricsTemplate(
            title: "Romantic Ballad",
            icon: "heart.fill",
            content: """
            [Verse 1]
            When I first saw you
            My heart knew
            
            [Chorus]
            You're my everything
            My heart sings
            
            [Verse 2]
            Every moment with you
            Feels so true
            
            [Chorus]
            You're my everything
            My heart sings
            
            [Bridge]
            Forever and always
            Through all our days
            """
        )
    ]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    ForEach(templates) { template in
                        TemplateCard(template: template) {
                            selectedLyrics = template.content
                            isPresented = false
                        }
                        .environmentObject(appSettings)
                    }
                }
                .padding()
            }
            .navigationTitle("Lyrics Templates")
            .navigationBarItems(trailing: Button("Cancel") {
                isPresented = false
            })
        }
    }
}

struct LyricsTemplate: Identifiable {
    let id = UUID()
    let title: String
    let icon: String
    let content: String
}

struct TemplateCard: View {
    @EnvironmentObject var appSettings: AppSettings
    let template: LyricsTemplate
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: template.icon)
                        .font(.title2)
                        .foregroundColor(.blue)
                    
                    Text(template.title)
                        .font(.headline)
                        .foregroundColor(appSettings.isDarkMode ? .white : .black)
                    
                    Spacer()
                    
                    Image(systemName: "arrow.right.circle.fill")
                        .font(.title3)
                        .foregroundColor(.blue)
                }
                
                Text(template.content)
                    .font(.caption)
                    .foregroundColor(.gray)
                    .lineLimit(3)
                    .multilineTextAlignment(.leading)
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(appSettings.isDarkMode ? Color.white.opacity(0.1) : Color.black.opacity(0.05))
            )
        }
    }
}

// MARK: - Audio Picker View

struct AudioPickerView: View {
    @Binding var selectedAudioURL: URL?
    @Binding var isPresented: Bool
    @EnvironmentObject var appSettings: AppSettings
    @State private var showingDocumentPicker = false
    @State private var showingMusicLibraryPicker = false
    @State private var showingAlert = false
    @State private var alertMessage = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                VStack(spacing: 10) {
                    Image(systemName: "waveform.circle.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.blue)
                    
                    Text("Select Style Reference")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text("Choose an audio file to guide the style of your generated music")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                
                VStack(spacing: 20) {
                    // Document picker for local files
                    Button(action: {
                        showingDocumentPicker = true
                    }) {
                        PickerOptionView(
                            icon: "folder.fill",
                            title: "Choose from Files",
                            subtitle: "Import audio file from your device",
                            color: .blue
                        )
                    }
                    
                    // Music library picker
                    Button(action: {
                        showingMusicLibraryPicker = true
                    }) {
                        PickerOptionView(
                            icon: "music.note.list",
                            title: "Choose from Music Library",
                            subtitle: "Select from your Apple Music library",
                            color: .green
                        )
                    }
                }
                .padding(.horizontal)
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("📋 Supported formats:")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                    
                    Text("MP3, WAV, M4A, AAC")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("💡 Best results with 15-30 second clips")
                        .font(.caption)
                        .foregroundColor(.blue)
                        .padding(.top, 4)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal)
                
                Spacer()
            }
            .padding()
            .navigationTitle("Style Reference")
            .navigationBarItems(
                trailing: Button("Cancel") {
                    isPresented = false
                }
            )
        }
        .sheet(isPresented: $showingDocumentPicker) {
            DocumentPickerView(
                allowedTypes: ["public.audio"],
                onFileSelected: { url in
                    handleSelectedFile(url)
                }
            )
        }
        .sheet(isPresented: $showingMusicLibraryPicker) {
            MusicLibraryPickerView(
                onFileSelected: { url in
                    handleSelectedFile(url)
                }
            )
        }
        .alert("Audio Selection", isPresented: $showingAlert) {
            Button("OK") { }
        } message: {
            Text(alertMessage)
        }
    }
    
    private func handleSelectedFile(_ url: URL) {
        // Validate file
        let supportedExtensions = ["mp3", "wav", "m4a", "aac"]
        let fileExtension = url.pathExtension.lowercased()
        
        guard supportedExtensions.contains(fileExtension) else {
            alertMessage = "Unsupported file format. Please select an MP3, WAV, M4A, or AAC file."
            showingAlert = true
            return
        }
        
        // Copy file to app's documents directory for persistent access
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileName = "style_reference_\(UUID().uuidString).\(fileExtension)"
        let destinationURL = documentsPath.appendingPathComponent(fileName)
        
        do {
            // Remove existing style reference if any
            if let existingURL = selectedAudioURL {
                try? FileManager.default.removeItem(at: existingURL)
            }
            
            if url.startAccessingSecurityScopedResource() {
                defer { url.stopAccessingSecurityScopedResource() }
                try FileManager.default.copyItem(at: url, to: destinationURL)
            } else {
                try FileManager.default.copyItem(at: url, to: destinationURL)
            }
            
            selectedAudioURL = destinationURL
            isPresented = false
            
        } catch {
            alertMessage = "Failed to import audio file: \(error.localizedDescription)"
            showingAlert = true
        }
    }
}

struct PickerOptionView: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 15) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
                .frame(width: 40)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.gray)
        }
        .padding()
        .background(Color(UIColor.tertiarySystemBackground))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(color.opacity(0.3), lineWidth: 1)
        )
    }
}

// MARK: - Document Picker

struct DocumentPickerView: UIViewControllerRepresentable {
    let allowedTypes: [String]
    let onFileSelected: (URL) -> Void
    
    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: allowedTypes.compactMap { UTType($0) })
        picker.delegate = context.coordinator
        picker.allowsMultipleSelection = false
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIDocumentPickerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(onFileSelected: onFileSelected)
    }
    
    class Coordinator: NSObject, UIDocumentPickerDelegate {
        let onFileSelected: (URL) -> Void
        
        init(onFileSelected: @escaping (URL) -> Void) {
            self.onFileSelected = onFileSelected
        }
        
        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            guard let url = urls.first else { return }
            onFileSelected(url)
        }
    }
}

// MARK: - Music Library Picker

struct MusicLibraryPickerView: UIViewControllerRepresentable {
    let onFileSelected: (URL) -> Void
    
    func makeUIViewController(context: Context) -> UIViewController {
        let controller = UIViewController()
        
        // For now, show a simple message that this feature requires MediaPlayer framework
        DispatchQueue.main.async {
            let alert = UIAlertController(
                title: "Music Library Access",
                message: "Music library import is not yet implemented. Please use 'Choose from Files' to import audio files from your device.",
                preferredStyle: .alert
            )
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            controller.present(alert, animated: true)
        }
        
        return controller
    }
    
    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(AppSettings())
            .environmentObject(FirebaseManager())
    }
}