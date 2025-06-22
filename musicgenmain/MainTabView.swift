import SwiftUI
import AVFoundation

struct MainTabView: View {
    @EnvironmentObject var appSettings: AppSettings
    @EnvironmentObject var firebaseManager: FirebaseManager
    @StateObject private var trackPlayer = TrackPlayer.shared
    @StateObject private var universalAPI = UniversalPiAPI.shared
    @State private var selectedTab = 0
    @State private var showMiniPlayer = false
    
    var body: some View {
        GeometryReader { geometry in
            VStack(spacing: 0) {
                // Main content area with safe area for mini player
                TabView(selection: $selectedTab) {
                ContentView()
                    .environmentObject(appSettings)
                    .environmentObject(firebaseManager)
                    .environmentObject(universalAPI)
                    .tabItem {
                        Label("Create", systemImage: "wand.and.stars")
                    }
                    .tag(0)
                
                LibraryView()
                    .environmentObject(appSettings)
                    .environmentObject(firebaseManager)
                    .environmentObject(universalAPI)
                    .tabItem {
                        Label("Library", systemImage: "music.note.list")
                    }
                    .tag(1)
                
                ExploreView()
                    .environmentObject(appSettings)
                    .environmentObject(firebaseManager)
                    .environmentObject(universalAPI)
                    .tabItem {
                        Label("Explore", systemImage: "globe")
                    }
                    .tag(2)
                
                ProfileView()
                    .environmentObject(appSettings)
                    .environmentObject(firebaseManager)
                    .environmentObject(universalAPI)
                    .tabItem {
                        Label("Profile", systemImage: "person.circle.fill")
                    }
                    .tag(3)
                }
                .accentColor(appSettings.isDarkMode ? .white : Color(red: 0.1, green: 0.1, blue: 0.2))
                .safeAreaInset(edge: .bottom) {
                    // Reserve space for mini player when visible
                    if showMiniPlayer {
                        Color.clear.frame(height: 80)
                    }
                }
                
                // Docked Mini Player (floating above content, never covering tabs)
                if showMiniPlayer, let currentTrack = trackPlayer.currentTrack {
                    MiniPlayerView(track: currentTrack)
                        .environmentObject(appSettings)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                        .background(
                            Rectangle()
                                .fill(appSettings.isDarkMode ? Color.black : Color.white)
                                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: -2)
                        )
                        .zIndex(1) // Ensure it floats above content
                }
            }
            
            // Notification overlays
            NotificationOverlay()
                .environmentObject(universalAPI)
                .environmentObject(appSettings)
                .zIndex(10)
            
            GenerationProgressOverlay()
                .environmentObject(universalAPI)
                .environmentObject(appSettings)
                .zIndex(5)
        }
        .onReceive(NotificationCenter.default.publisher(for: .init("TrackPlayerStateChanged"))) { _ in
            withAnimation(.easeInOut(duration: 0.3)) {
                showMiniPlayer = trackPlayer.currentTrack != nil
            }
        }
        .onAppear {
            // Ensure proper tab bar appearance
            let tabBarAppearance = UITabBarAppearance()
            tabBarAppearance.configureWithOpaqueBackground()
            tabBarAppearance.backgroundColor = appSettings.isDarkMode ? UIColor.black : UIColor.white
            
            UITabBar.appearance().standardAppearance = tabBarAppearance
            if #available(iOS 15.0, *) {
                UITabBar.appearance().scrollEdgeAppearance = tabBarAppearance
            }
        }
    }
}

// MARK: - Mini Player View

struct MiniPlayerView: View {
    @EnvironmentObject var appSettings: AppSettings
    @ObservedObject var trackPlayer = TrackPlayer.shared
    let track: TrackData
    @State private var showingFullPlayer = false
    
    var body: some View {
        HStack(spacing: 12) {
            // Album art
            RoundedRectangle(cornerRadius: 8)
                .fill(
                    LinearGradient(
                        colors: getGenreColors(track.genre),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 50, height: 50)
                .overlay(
                    Image(systemName: "music.note")
                        .font(.title3)
                        .foregroundColor(.white)
                )
            
            // Track info
            VStack(alignment: .leading, spacing: 2) {
                Text(track.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(appSettings.isDarkMode ? .white : .black)
                    .lineLimit(1)
                
                Text("\(track.genre) • \(track.mood)")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .lineLimit(1)
            }
            
            Spacer()
            
            // Progress indicator
            if trackPlayer.duration > 0 {
                VStack(spacing: 4) {
                    Text("\(formatTime(trackPlayer.currentTime)) / \(formatTime(trackPlayer.duration))")
                        .font(.caption2)
                        .foregroundColor(.gray)
                    
                    ProgressView(value: trackPlayer.currentTime, total: trackPlayer.duration)
                        .progressViewStyle(LinearProgressViewStyle())
                        .frame(width: 60)
                        .accentColor(.blue)
                }
            }
            
            // Control buttons
            HStack(spacing: 16) {
                Button(action: { trackPlayer.skipBackward(10) }) {
                    Image(systemName: "gobackward.10")
                        .font(.title2)
                        .foregroundColor(appSettings.isDarkMode ? .white : .black)
                }
                
                Button(action: togglePlayback) {
                    Image(systemName: trackPlayer.isPlaying ? "pause.fill" : "play.fill")
                        .font(.title2)
                        .foregroundColor(appSettings.isDarkMode ? .white : .black)
                }
                
                Button(action: { trackPlayer.skipForward(10) }) {
                    Image(systemName: "goforward.10")
                        .font(.title2)
                        .foregroundColor(appSettings.isDarkMode ? .white : .black)
                }
            }
            
            // Expand button
            Button(action: { showingFullPlayer = true }) {
                Image(systemName: "chevron.up")
                    .font(.title3)
                    .foregroundColor(.gray)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .onTapGesture {
            showingFullPlayer = true
        }
        .sheet(isPresented: $showingFullPlayer) {
            FullPlayerView(track: track)
                .environmentObject(appSettings)
        }
    }
    
    private func togglePlayback() {
        if trackPlayer.isPlaying {
            trackPlayer.pause()
        } else {
            trackPlayer.resume()
        }
    }
    
    private func formatTime(_ time: Double) -> String {
        let minutes = Int(time) / 60
        let seconds = Int(time) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
    
    private func getGenreColors(_ genre: String) -> [Color] {
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

// MARK: - Full Player View

struct FullPlayerView: View {
    @EnvironmentObject var appSettings: AppSettings
    @ObservedObject var trackPlayer = TrackPlayer.shared
    let track: TrackData
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                // Large album art
                RoundedRectangle(cornerRadius: 20)
                    .fill(
                        LinearGradient(
                            colors: getGenreColors(track.genre),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 280, height: 280)
                    .overlay(
                        Image(systemName: "music.note")
                            .font(.system(size: 80))
                            .foregroundColor(.white)
                    )
                    .shadow(radius: 10)
                
                // Track info
                VStack(spacing: 8) {
                    Text(track.title)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(appSettings.isDarkMode ? .white : .black)
                        .multilineTextAlignment(.center)
                    
                    Text("\(track.genre) • \(track.mood)")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                
                // Progress and controls
                PlayerControlsView(track: track)
                    .padding(.horizontal)
                
                Spacer()
            }
            .padding()
            .navigationBarItems(trailing: Button("Done") {
                presentationMode.wrappedValue.dismiss()
            })
            .navigationBarTitleDisplayMode(.inline)
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
        default: return [.green, .blue]
        }
    }
}

struct MainTabView_Previews: PreviewProvider {
    static var previews: some View {
        MainTabView()
            .environmentObject(AppSettings())
    }
}