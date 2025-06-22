import SwiftUI
import AVFoundation

enum LibraryFilter: CaseIterable {
    case all, favorites, published
    
    var displayName: String {
        switch self {
        case .all: return "All"
        case .favorites: return "Favorites"
        case .published: return "Published"
        }
    }
}

struct LibraryView: View {
    @EnvironmentObject var appSettings: AppSettings
    @EnvironmentObject var firebaseManager: FirebaseManager
    @StateObject private var trackPlayer = TrackPlayer.shared
    @State private var selectedFilter: LibraryFilter = .all
    @State private var showingTrackOptions = false
    @State private var selectedTrack: TrackData?
    @State private var searchText = ""
    @State private var isRefreshing = false
    
    var filteredTracks: [TrackData] {
        guard let userProfile = firebaseManager.userProfile else { return [] }
        let tracks = userProfile.tracks
        
        if searchText.isEmpty && selectedFilter == .all {
            return tracks
        }
        
        return tracks.filter { track in
            let matchesSearch = searchText.isEmpty || 
                               track.title.localizedCaseInsensitiveContains(searchText) ||
                               track.genre.localizedCaseInsensitiveContains(searchText) ||
                               track.mood.localizedCaseInsensitiveContains(searchText)
            
            let matchesFilter = selectedFilter == .all ||
                               (selectedFilter == .favorites && track.isFavorite) ||
                               (selectedFilter == .published && track.isPublished)
            
            return matchesSearch && matchesFilter
        }
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background
                LinearGradient(
                    colors: appSettings.isDarkMode ? [Color.black, Color.gray.opacity(0.3)] : [Color.gray.opacity(0.1), Color.white],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Cloud sync status banner
                    if !firebaseManager.isCloudSyncAvailable {
                        CloudSyncBanner()
                            .environmentObject(firebaseManager)
                    }
                    
                    // Header
                    VStack(spacing: 20) {
                        Text("My Library")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(appSettings.isDarkMode ? .white : Color(red: 0.1, green: 0.1, blue: 0.2))
                        
                        // Search bar
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(.gray)
                            TextField("Search tracks...", text: $searchText)
                                .foregroundColor(appSettings.isDarkMode ? .white : .black)
                        }
                        .padding()
                        .background(appSettings.isDarkMode ? Color.white.opacity(0.1) : Color.black.opacity(0.05))
                        .cornerRadius(15)
                        
                        // Filter chips
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(LibraryFilter.allCases, id: \.self) { filter in
                                    FilterChip(
                                        title: filter.displayName,
                                        isSelected: selectedFilter == filter,
                                        action: { selectedFilter = filter }
                                    )
                                    .environmentObject(appSettings)
                                }
                            }
                        }
                    }
                    .padding()
                    
                    // Tracks list
                    if firebaseManager.isLoading {
                        VStack {
                            ProgressView()
                            Text("Loading tracks...")
                                .foregroundColor(.gray)
                                .padding(.top)
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else if filteredTracks.isEmpty {
                        VStack(spacing: 20) {
                            Image(systemName: "music.note")
                                .font(.system(size: 60))
                                .foregroundColor(.gray)
                            
                            Text(searchText.isEmpty ? "No tracks yet" : "No tracks found")
                                .font(.headline)
                                .foregroundColor(.gray)
                            
                            if searchText.isEmpty {
                                Text("Generate your first AI track!")
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                            }
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else {
                        ScrollView {
                            LazyVStack(spacing: 20) {
                                // Library header with visual distinction
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        Circle()
                                            .fill(Color.green)
                                            .frame(width: 8, height: 8)
                                        Text("Saved Library")
                                            .font(.headline)
                                            .fontWeight(.medium)
                                            .foregroundColor(appSettings.isDarkMode ? .white : .black)
                                    }
                                    
                                    Text("Your permanently saved tracks")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                .padding(.horizontal)
                                .padding(.top, 10)
                                
                                // Tracks list
                                LazyVStack(spacing: 15) {
                                    ForEach(filteredTracks) { track in
                                        TrackCard(track: track) {
                                            selectedTrack = track
                                            showingTrackOptions = true
                                        }
                                        .environmentObject(appSettings)
                                    }
                                }
                                .padding(.horizontal)
                                .padding(.bottom, 100)
                            }
                        }
                        .refreshable {
                            await refreshLibrary()
                        }
                    }
                }
            }
            .navigationBarHidden(true)
        }
        .onAppear {
            Task {
                await refreshLibrary()
                
                // Try to sync any pending tracks
                if firebaseManager.isCloudSyncAvailable {
                    await firebaseManager.syncPendingTracks()
                }
            }
        }
        .sheet(isPresented: $showingTrackOptions) {
            if let track = selectedTrack {
                TrackOptionsView(track: track)
                    .environmentObject(appSettings)
                    .environmentObject(firebaseManager)
            }
        }
    }
    
    // MARK: - Helper Functions
    
    private func refreshLibrary() async {
        guard !isRefreshing else { return }
        
        await MainActor.run {
            isRefreshing = true
        }
        
        do {
            try await firebaseManager.refreshUserLibrary()
            print("✅ Library refreshed successfully")
        } catch {
            print("❌ Error refreshing library: \\(error)")
        }
        
        await MainActor.run {
            isRefreshing = false
        }
    }
}

struct FilterChip: View {
    @EnvironmentObject var appSettings: AppSettings
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(isSelected ? (appSettings.isDarkMode ? .black : .white) : (appSettings.isDarkMode ? .white : .black))
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(
                    isSelected ? (appSettings.isDarkMode ? Color.white : Color.black) : (appSettings.isDarkMode ? Color.white.opacity(0.1) : Color.black.opacity(0.05))
                )
                .cornerRadius(20)
        }
    }
}

struct TrackCard: View {
    @EnvironmentObject var appSettings: AppSettings
    @EnvironmentObject var firebaseManager: FirebaseManager
    let track: TrackData
    let action: () -> Void
    
    var body: some View {
        HStack(spacing: 15) {
            // Album art placeholder with play button
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        LinearGradient(
                            colors: getGenreColors(track.genre),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 70, height: 70)
                
                Button(action: {
                    playTrack()
                }) {
                    Image(systemName: "play.circle.fill")
                        .font(.title)
                        .foregroundColor(.white.opacity(0.9))
                        .background(
                            Circle()
                                .fill(Color.black.opacity(0.3))
                                .frame(width: 35, height: 35)
                        )
                }
                
                // Status indicators
                VStack {
                    HStack {
                        Spacer()
                        if track.isFavorite {
                            Image(systemName: "heart.fill")
                                .font(.caption2)
                                .foregroundColor(.red)
                                .padding(4)
                                .background(Circle().fill(Color.white.opacity(0.8)))
                        }
                    }
                    Spacer()
                }
            }
            
            VStack(alignment: .leading, spacing: 5) {
                Text(track.title)
                    .font(.headline)
                    .foregroundColor(appSettings.isDarkMode ? .white : .black)
                    .lineLimit(1)
                
                HStack {
                    Text("\(track.genre) • \(track.mood)")
                        .font(.caption)
                        .foregroundColor(.gray)
                    
                    if track.isPublished {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.caption)
                            .foregroundColor(.green)
                    }
                }
                
                HStack {
                    Label("\(track.plays)", systemImage: "play.fill")
                    Label("\(track.likes)", systemImage: "heart.fill")
                    Spacer()
                    Text(track.formattedDuration)
                }
                .font(.caption2)
                .foregroundColor(.gray)
            }
            
            Spacer()
            
            // Options button
            Button(action: action) {
                VStack(spacing: 4) {
                    Image(systemName: "ellipsis")
                        .font(.title3)
                        .foregroundColor(.gray)
                    
                    Text("Options")
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.gray.opacity(0.1))
                )
            }
        }
        .padding()
        .background(appSettings.isDarkMode ? Color.white.opacity(0.05) : Color.black.opacity(0.03))
        .cornerRadius(15)
    }
    
    private func playTrack() {
        print("🎵 Playing track: \(track.title)")
        
        if track.isPlayable {
            Task {
                do {
                    // Increment play count when track starts playing
                    try await firebaseManager.incrementPlayCount(for: track)
                    await MainActor.run {
                        TrackPlayer.shared.play(track: track)
                    }
                } catch {
                    print("❌ Error incrementing play count: \(error)")
                    // Still play the track even if play count fails
                    TrackPlayer.shared.play(track: track)
                }
            }
        } else {
            print("❌ Track not playable: \(track.title)")
        }
    }
    
    func getGenreColors(_ genre: String) -> [Color] {
        switch genre {
        case "Techno": return [.orange, .red]
        case "House": return [.blue, .purple]
        case "Minimal": return [.gray, .black]
        case "Trance": return [.purple, .pink]
        case "Chill": return [.green, .blue]
        case "Industrial": return [.black, .gray]
        default: return [.green, .blue]
        }
    }
}

struct TrackOptionsView: View {
    @EnvironmentObject var appSettings: AppSettings
    @EnvironmentObject var firebaseManager: FirebaseManager
    @EnvironmentObject var universalAPI: UniversalPiAPI
    let track: TrackData
    @Environment(\.presentationMode) var presentationMode
    @State private var showingRemixOptions = false
    @State private var showingExtendOptions = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Track info header
                VStack(spacing: 10) {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(
                            LinearGradient(
                                colors: getGenreColors(track.genre),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 120, height: 120)
                        .overlay(
                            Image(systemName: track.isFavorite ? "heart.fill" : "music.note")
                                .font(.system(size: 50))
                                .foregroundColor(.white)
                        )
                    
                    Text(track.title)
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text("\(track.genre) • \(track.mood) • \(track.formattedDuration)")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                .padding(.top)
                
                // Options
                VStack(spacing: 15) {
                    // Primary actions section
                    VStack(spacing: 12) {
                        Text("🎵 Playback & Actions")
                            .font(.headline)
                            .foregroundColor(.primary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        
                        OptionButton(icon: "play.circle.fill", title: "Play Now", color: .green) {
                            TrackPlayer.shared.play(track: track)
                            presentationMode.wrappedValue.dismiss()
                        }
                        
                        OptionButton(icon: track.isFavorite ? "heart.fill" : "heart", title: track.isFavorite ? "Remove Favorite" : "Add to Favorites", color: .red) {
                            Task {
                                do {
                                    try await firebaseManager.toggleTrackFavorite(track)
                                    print("❤️ Toggled favorite for: \(track.title)")
                                } catch {
                                    print("❌ Error toggling favorite: \(error)")
                                }
                            }
                        }
                    }
                    
                    // AI Enhancement section
                    VStack(spacing: 12) {
                        Text("🤖 AI Enhancement")
                            .font(.headline)
                            .foregroundColor(.primary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        
                        OptionButton(icon: "arrow.up.right.circle.fill", title: "🔄 Extend Track", color: .cyan) {
                            showingExtendOptions = true
                        }
                        
                        OptionButton(icon: "waveform.badge.plus", title: "🎛️ Remix Track", color: .purple) {
                            showingRemixOptions = true
                        }
                    }
                    
                    // Sharing & Management section
                    VStack(spacing: 12) {
                        Text("📤 Share & Manage")
                            .font(.headline)
                            .foregroundColor(.primary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        
                        if !track.isPublished {
                            OptionButton(icon: "globe", title: "Publish to Community", color: .orange) {
                                Task {
                                    do {
                                        try await firebaseManager.publishTrack(track)
                                        print("🌍 Published track: \(track.title)")
                                        presentationMode.wrappedValue.dismiss()
                                    } catch {
                                        print("❌ Error publishing track: \(error)")
                                    }
                                }
                            }
                        }
                        
                        OptionButton(icon: "square.and.arrow.up", title: "Share Track", color: .indigo) {
                            shareTrack(track)
                        }
                        
                        OptionButton(icon: "square.and.arrow.down", title: "Export Audio", color: .blue) {
                            exportTrack(track)
                        }
                        
                        OptionButton(icon: "trash", title: "Delete Track", color: .red) {
                            Task {
                                do {
                                    try await firebaseManager.deleteTrack(trackId: track.id)
                                    print("🗑️ Deleted track: \(track.title)")
                                    presentationMode.wrappedValue.dismiss()
                                } catch {
                                    print("❌ Error deleting track: \(error)")
                                }
                            }
                        }
                    }
                }
                .padding()
                
                Spacer()
            }
            .navigationBarTitle("Track Options", displayMode: .inline)
            .navigationBarItems(trailing: Button("Done") {
                presentationMode.wrappedValue.dismiss()
            })
        }
        .sheet(isPresented: $showingRemixOptions) {
            RemixOptionsView(originalTrack: track)
                .environmentObject(appSettings)
                .environmentObject(universalAPI)
                .environmentObject(firebaseManager)
        }
        .sheet(isPresented: $showingExtendOptions) {
            ExtendOptionsView(originalTrack: track)
                .environmentObject(appSettings)
                .environmentObject(universalAPI)
                .environmentObject(firebaseManager)
        }
    }
    
    
    private func exportTrack(_ track: TrackData) {
        guard let audioURL = track.audioURL, let url = URL(string: audioURL) else {
            print("❌ No audio URL to export")
            return
        }
        
        // Check if it's a local file
        if url.isFileURL {
            // Share the local file
            let activityViewController = UIActivityViewController(
                activityItems: [url],
                applicationActivities: nil
            )
            
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let window = windowScene.windows.first {
                window.rootViewController?.present(activityViewController, animated: true)
            }
        } else {
            // For remote URLs, we need to download first
            Task {
                do {
                    let (tempURL, _) = try await URLSession.shared.download(from: url)
                    
                    let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
                    let filename = "\(track.title).mp3"
                    let safeFilename = filename.replacingOccurrences(of: "[^A-Za-z0-9._\\s-]", with: "", options: .regularExpression)
                    let exportURL = documentsPath.appendingPathComponent(safeFilename)
                    
                    try FileManager.default.moveItem(at: tempURL, to: exportURL)
                    
                    await MainActor.run {
                        let activityViewController = UIActivityViewController(
                            activityItems: [exportURL],
                            applicationActivities: nil
                        )
                        
                        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                           let window = windowScene.windows.first {
                            window.rootViewController?.present(activityViewController, animated: true)
                        }
                    }
                } catch {
                    print("❌ Error exporting track: \(error)")
                }
            }
        }
    }
    
    func getGenreColors(_ genre: String) -> [Color] {
        switch genre {
        case "Techno": return [.orange, .red]
        case "House": return [.blue, .purple]
        case "Minimal": return [.gray, .black]
        case "Trance": return [.purple, .pink]
        default: return [.green, .blue]
        }
    }
    
    private func shareTrack(_ track: TrackData) {
        guard let audioURL = track.audioURL else { return }
        
        let shareText = "Check out this AI-generated \(track.genre) track: \(track.title)"
        let items: [Any] = [shareText, URL(string: audioURL) as Any].compactMap { $0 }
        
        let activityViewController = UIActivityViewController(activityItems: items, applicationActivities: nil)
        
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first {
            window.rootViewController?.present(activityViewController, animated: true)
        }
    }
}

struct OptionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                    .frame(width: 30)
                
                Text(title)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(12)
        }
    }
}

// MARK: - Cloud Sync Banner

struct CloudSyncBanner: View {
    @EnvironmentObject var firebaseManager: FirebaseManager
    @State private var showingRetrySync = false
    @State private var lastSyncTime: String = ""
    @State private var pendingTracksCount = 0
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: firebaseManager.isCloudSyncAvailable ? "icloud.fill" : "icloud.slash")
                .font(.title3)
                .foregroundColor(firebaseManager.isCloudSyncAvailable ? .green : .orange)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(firebaseManager.isCloudSyncAvailable ? "Cloud sync active" : "Cloud sync offline")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                
                HStack(spacing: 8) {
                    if firebaseManager.isCloudSyncAvailable {
                        if !lastSyncTime.isEmpty {
                            Text("Last sync: \(lastSyncTime)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        } else {
                            Text("Cloud sync active")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    } else {
                        if pendingTracksCount > 0 {
                            Text("\(pendingTracksCount) track\(pendingTracksCount == 1 ? "" : "s") pending")
                                .font(.caption)
                                .foregroundColor(.orange)
                        } else {
                            Text("Connection lost")
                                .font(.caption)
                                .foregroundColor(.orange)
                        }
                    }
                    
                    if !lastSyncTime.isEmpty && firebaseManager.isCloudSyncAvailable {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 6, height: 6)
                    } else if !firebaseManager.isCloudSyncAvailable {
                        Circle()
                            .fill(Color.orange)
                            .frame(width: 6, height: 6)
                    }
                }
            }
            
            Spacer()
            
            if !firebaseManager.isCloudSyncAvailable {
                Button(showingRetrySync ? "Syncing..." : "Retry") {
                    retrySync()
                }
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.blue)
                .disabled(showingRetrySync)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(firebaseManager.isCloudSyncAvailable ? Color.green.opacity(0.1) : Color.orange.opacity(0.1))
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundColor(firebaseManager.isCloudSyncAvailable ? Color.green.opacity(0.3) : Color.orange.opacity(0.3))
                .position(x: UIScreen.main.bounds.width / 2, y: 0)
        )
        .onAppear {
            updateSyncStatus()
        }
        .onReceive(NotificationCenter.default.publisher(for: .init("CloudSyncStatusChanged"))) { _ in
            updateSyncStatus()
        }
    }
    
    private func updateSyncStatus() {
        // Update last sync time
        let userDefaults = UserDefaults.standard
        if let lastSync = userDefaults.object(forKey: "lastSuccessfulSync") as? Date {
            let formatter = RelativeDateTimeFormatter()
            formatter.unitsStyle = .short
            lastSyncTime = formatter.localizedString(for: lastSync, relativeTo: Date())
        } else {
            lastSyncTime = "Never"
        }
        
        // Update pending tracks count
        if let data = userDefaults.data(forKey: "pendingSyncTracks"),
           let tracks = try? JSONDecoder().decode([TrackData].self, from: data) {
            pendingTracksCount = tracks.count
        } else {
            pendingTracksCount = 0
        }
    }
    
    private func retrySync() {
        showingRetrySync = true
        
        Task {
            do {
                // Try to sync pending tracks
                await firebaseManager.syncPendingTracks()
                
                // Test connectivity by trying to refresh user library
                try await firebaseManager.refreshUserLibrary()
                
                // If successful, mark cloud sync as available
                await MainActor.run {
                    firebaseManager.isCloudSyncAvailable = true
                    firebaseManager.lastSyncError = nil
                }
                
            } catch {
                print("❌ Retry sync failed: \(error)")
                await MainActor.run {
                    firebaseManager.lastSyncError = "Sync retry failed: \(error.localizedDescription)"
                }
            }
            
            await MainActor.run {
                showingRetrySync = false
            }
        }
    }
}

struct LibraryView_Previews: PreviewProvider {
    static var previews: some View {
        LibraryView()
            .environmentObject(AppSettings())
    }
}