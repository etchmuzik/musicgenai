import SwiftUI
import FirebaseFirestore

enum FeedFilter: String, CaseIterable {
    case latest = "Latest"
    case trending = "Trending"
}

struct ExploreView: View {
    @EnvironmentObject var appSettings: AppSettings
    @EnvironmentObject var firebaseManager: FirebaseManager
    @State private var feed: [TrackData] = []
    @State private var userLikedTracks = Set<String>()  // tracks from Firestore
    @State private var optimisticLikes = Set<String>()  // optimistic UI updates
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var lastDoc: DocumentSnapshot?
    @State private var isFetchingNext = false
    @State private var hasMorePages = true
    @State private var selectedFilter: FeedFilter = .latest
    @State private var feedTask: Task<Void, Never>?
    
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
                
                if isLoading && feed.isEmpty {
                    VStack {
                        ProgressView()
                        Text("Loading tracks...")
                            .foregroundColor(.gray)
                            .padding(.top)
                    }
                } else if feed.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "globe")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        Text("No tracks published yet")
                            .font(.headline)
                            .foregroundColor(.gray)
                        
                        Text("Be the first to share your music!")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                } else {
                    VStack(spacing: 0) {
                        // Filter selector
                        HStack(spacing: 12) {
                            ForEach(FeedFilter.allCases, id: \.self) { filter in
                                Button(action: {
                                    selectedFilter = filter
                                    Task {
                                        await switchFilter()
                                    }
                                }) {
                                    Text(filter.rawValue)
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                        .foregroundColor(selectedFilter == filter ? .white : (appSettings.isDarkMode ? .white : .black))
                                        .padding(.horizontal, 20)
                                        .padding(.vertical, 10)
                                        .background(
                                            selectedFilter == filter ? 
                                            LinearGradient(colors: [.blue, .purple], startPoint: .leading, endPoint: .trailing) :
                                            LinearGradient(colors: [Color.gray.opacity(0.2)], startPoint: .leading, endPoint: .trailing)
                                        )
                                        .cornerRadius(20)
                                }
                            }
                            
                            Spacer()
                        }
                        .padding()
                        .background(appSettings.isDarkMode ? Color.black.opacity(0.5) : Color.white.opacity(0.5))
                        
                        List {
                            ForEach(Array(feed.enumerated()), id: \.element.id) { index, track in
                                FeedTrackRow(
                                    track: track,
                                    isLiked: isTrackLiked(track.id),
                                    likeAction: { likeTapped(track) },
                                    playAction: { playTapped(track) }
                                )
                                .environmentObject(appSettings)
                                .listRowBackground(appSettings.isDarkMode ? Color.white.opacity(0.05) : Color.black.opacity(0.03))
                                .listRowSeparator(.hidden)
                                .onAppear {
                                    // Load next page when reaching last 3 items
                                    if index >= feed.count - 3 && hasMorePages && !isFetchingNext {
                                        Task {
                                            await loadNextPage()
                                        }
                                    }
                                }
                            }
                            
                            // Loading indicator at the bottom
                            if isFetchingNext {
                                HStack {
                                    Spacer()
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle())
                                    Text("Loading more...")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                    Spacer()
                                }
                                .padding()
                                .listRowBackground(Color.clear)
                                .listRowSeparator(.hidden)
                            }
                        }
                        .listStyle(PlainListStyle())
                        .refreshable {
                            await refreshFeed()
                        }
                    }
                }
            }
            .navigationTitle("Explore")
            .navigationBarTitleDisplayMode(.large)
            .task {
                await loadUserLikes()
                await startListening()
            }
        }
    }
    
    private func startListening() async {
        // Cancel previous task if any
        feedTask?.cancel()
        
        isLoading = true
        feed = []
        lastDoc = nil
        hasMorePages = true
        
        feedTask = Task {
            do {
                if selectedFilter == .trending {
                    // For trending, use a single fetch
                    let result = try await firebaseManager.fetchTrending(limit: 25)
                    await MainActor.run {
                        self.feed = result.tracks
                        self.lastDoc = result.lastDocument
                        self.hasMorePages = result.tracks.count == 25
                        self.isLoading = false
                    }
                } else {
                    // For latest, use the listener
                    for try await result in try await firebaseManager.listenForFeed(startAfter: nil, limit: 25) {
                        guard !Task.isCancelled else { break }
                        
                        await MainActor.run {
                            self.feed = result.tracks
                            self.lastDoc = result.lastDocument
                            self.hasMorePages = result.tracks.count == 25
                            self.isLoading = false
                        }
                    }
                }
            } catch {
                guard !Task.isCancelled else { return }
                
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.isLoading = false
                    print("❌ Feed error: \(error)")
                }
            }
        }
    }
    
    private func loadNextPage() async {
        guard hasMorePages && !isFetchingNext else { return }
        
        await MainActor.run {
            self.isFetchingNext = true
        }
        
        do {
            if selectedFilter == .trending {
                // For trending, we don't paginate as it's limited to 24h
                await MainActor.run {
                    self.isFetchingNext = false
                    self.hasMorePages = false
                }
            } else {
                // Create a one-time listener for the next page
                for try await result in try await firebaseManager.listenForFeed(startAfter: lastDoc, limit: 25) {
                    await MainActor.run {
                        self.feed.append(contentsOf: result.tracks)
                        self.lastDoc = result.lastDocument
                        self.hasMorePages = result.tracks.count == 25
                        self.isFetchingNext = false
                    }
                    
                    break // We only want one page
                }
            }
        } catch {
            await MainActor.run {
                self.isFetchingNext = false
                print("❌ Error loading next page: \(error)")
            }
        }
    }
    
    private func refreshFeed() async {
        // Reset everything and reload
        await startListening()
    }
    
    private func switchFilter() async {
        // Cancel current feed task and start fresh
        feedTask?.cancel()
        await startListening()
    }
    
    private func isTrackLiked(_ trackId: String) -> Bool {
        // Check optimistic updates first, then fall back to Firestore data
        if optimisticLikes.contains(trackId) {
            return !userLikedTracks.contains(trackId)
        }
        return userLikedTracks.contains(trackId)
    }
    
    private func loadUserLikes() async {
        do {
            let likedTracks = try await firebaseManager.getUserLikedTracks()
            await MainActor.run {
                self.userLikedTracks = likedTracks
            }
        } catch {
            print("❌ Error loading user likes: \(error)")
        }
    }
    
    private func likeTapped(_ track: TrackData) {
        Task {
            let trackId = track.id
            
            // Optimistic update
            await MainActor.run {
                if optimisticLikes.contains(trackId) {
                    optimisticLikes.remove(trackId)
                } else {
                    optimisticLikes.insert(trackId)
                }
            }
            
            // Update in Firestore with atomic transaction
            do {
                let isNowLiked = try await firebaseManager.toggleFeedLikeSafe(trackID: trackId)
                
                // Update our local state based on server response
                await MainActor.run {
                    optimisticLikes.remove(trackId)
                    if isNowLiked {
                        userLikedTracks.insert(trackId)
                    } else {
                        userLikedTracks.remove(trackId)
                    }
                }
            } catch {
                // Revert optimistic update on error
                _ = await MainActor.run {
                    optimisticLikes.remove(trackId)
                }
                print("❌ Error toggling like: \(error)")
            }
        }
    }
    
    private func playTapped(_ track: TrackData) {
        TrackPlayer.shared.play(track: track)
        Task { 
            await firebaseManager.incrementFeedPlay(trackID: track.id) 
        }
    }
}

// MARK: - Feed Track Row
struct FeedTrackRow: View {
    @EnvironmentObject var appSettings: AppSettings
    let track: TrackData
    let isLiked: Bool
    let likeAction: () -> Void
    let playAction: () -> Void
    @State private var isPlaying = false
    
    var body: some View {
        HStack(spacing: 12) {
            // Album art or placeholder
            ZStack {
                if let imageURL = track.imageURL, !imageURL.isEmpty {
                    AsyncImage(url: URL(string: imageURL)) { img in
                        img
                            .resizable()
                            .scaledToFill()
                    } placeholder: {
                        gradientPlaceholder
                    }
                } else {
                    gradientPlaceholder
                }
            }
            .frame(width: 60, height: 60)
            .cornerRadius(8)
            
            // Track info
            VStack(alignment: .leading, spacing: 4) {
                Text(track.title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(appSettings.isDarkMode ? .white : .black)
                    .lineLimit(1)
                
                Text("\(track.genre) • \(track.mood)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                HStack(spacing: 12) {
                    HStack(spacing: 4) {
                        Image(systemName: "heart.fill")
                            .font(.caption2)
                        Text("\(track.likes)")
                            .font(.caption2)
                    }
                    .foregroundColor(isLiked ? .red : .secondary)
                    
                    HStack(spacing: 4) {
                        Image(systemName: "play.fill")
                            .font(.caption2)
                        Text("\(track.plays)")
                            .font(.caption2)
                    }
                    .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            // Play button
            Button(action: playAction) {
                Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                    .font(.title2)
                    .foregroundColor(.blue)
            }
            .buttonStyle(PlainButtonStyle())
            
            // Like button
            Button(action: likeAction) {
                Image(systemName: isLiked ? "heart.fill" : "heart")
                    .font(.title3)
                    .foregroundColor(isLiked ? .red : .gray)
                    .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isLiked)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 4)
        .onReceive(NotificationCenter.default.publisher(for: .init("TrackPlayerStateChanged"))) { _ in
            isPlaying = TrackPlayer.shared.currentTrack?.id == track.id && TrackPlayer.shared.isPlaying
        }
    }
    
    @ViewBuilder
    private var gradientPlaceholder: some View {
        LinearGradient(
            colors: getGenreColors(track.genre),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .overlay(
            Image(systemName: "music.note")
                .font(.title2)
                .foregroundColor(.white)
        )
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
        default: return [.blue, .purple]
        }
    }
}

struct ExploreView_Previews: PreviewProvider {
    static var previews: some View {
        ExploreView()
            .environmentObject(AppSettings())
            .environmentObject(FirebaseManager.shared)
    }
}