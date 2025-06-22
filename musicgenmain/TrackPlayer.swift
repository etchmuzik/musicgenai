import Foundation
import AVFoundation
import SwiftUI

@MainActor
class TrackPlayer: NSObject, ObservableObject {
    static let shared = TrackPlayer()
    
    @Published var isPlaying = false {
        didSet {
            NotificationCenter.default.post(name: .init("TrackPlayerStateChanged"), object: nil)
        }
    }
    @Published var currentTrack: TrackData?
    @Published var currentTime: Double = 0
    @Published var duration: Double = 0
    @Published var isLoading = false
    @Published var volume: Float = 1.0
    @Published var playbackSpeed: Float = 1.0
    
    private var player: AVPlayer?
    private var timeObserver: Any?
    private var playerStatusObserver: NSKeyValueObservation?
    
    override init() {
        super.init()
        setupAudioSession()
        setupNotifications()
    }
    
    deinit {
        // Synchronous cleanup for deinit
        if let timeObserver = timeObserver {
            player?.removeTimeObserver(timeObserver)
            self.timeObserver = nil
        }
        
        playerStatusObserver?.invalidate()
        playerStatusObserver = nil
        
        player = nil
    }
    
    // MARK: - Setup
    
    // MARK: - Audio File Validation
    
    func validateAudioFile(at url: URL) async -> Bool {
        guard FileManager.default.fileExists(atPath: url.path) else {
            return false
        }
        
        do {
            let asset = AVAsset(url: url)
            let duration = try await asset.load(.duration)
            return duration.seconds > 0
        } catch {
            print("❌ Invalid audio file: \(url.lastPathComponent) - \(error)")
            return false
        }
    }
    
    func cleanCorruptedAudioFiles() async {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        
        do {
            let files = try FileManager.default.contentsOfDirectory(at: documentsPath, includingPropertiesForKeys: nil)
            let audioFiles = files.filter { ["mp3", "wav", "m4a"].contains($0.pathExtension.lowercased()) }
            
            for file in audioFiles {
                let isValid = await validateAudioFile(at: file)
                if !isValid {
                    try? FileManager.default.removeItem(at: file)
                    print("🗑️ Removed corrupted audio file: \(file.lastPathComponent)")
                }
            }
        } catch {
            print("❌ Error cleaning audio files: \(error)")
        }
    }
    
    private func setupAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("❌ Audio session setup failed: \(error)")
        }
    }
    
    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.handleTrackEnded()
            }
        }
    }
    
    // MARK: - Playback Control
    
    func play(track: TrackData) {
        guard let audioURL = track.audioURL, let url = URL(string: audioURL) else {
            print("❌ Invalid audio URL for track: \(track.title)")
            isLoading = false
            return
        }
        
        // If same track, just resume
        if currentTrack?.id == track.id && player != nil {
            resume()
            return
        }
        
        print("🎵 Playing track: \(track.title)")
        
        // Set new track and loading state
        currentTrack = track
        isLoading = true
        isPlaying = false
        currentTime = 0
        duration = 0
        
        // Create new player
        cleanup()
        
        let playerItem = AVPlayerItem(url: url)
        player = AVPlayer(playerItem: playerItem)
        player?.volume = volume
        
        // Setup observers before starting playback
        setupPlayerObservers()
        
        // Preload the asset
        playerItem.asset.loadValuesAsynchronously(forKeys: ["playable", "duration"]) { [weak self] in
            DispatchQueue.main.async {
                guard let self = self else { return }
                
                Task {
                    do {
                        let isPlayable = try await playerItem.asset.load(.isPlayable)
                        if isPlayable {
                            print("✅ Track ready to play")
                            self.isLoading = false
                            
                            // Auto-play once loaded
                            self.player?.play()
                            self.isPlaying = true
                            
                            // Update play count
                            await self.incrementPlayCount(for: track)
                        } else {
                            print("❌ Track not playable")
                            self.isLoading = false
                            self.currentTrack = nil
                        }
                    } catch {
                        print("❌ Track failed to load: \(error.localizedDescription)")
                        self.isLoading = false
                        self.currentTrack = nil
                    }
                }
            }
        }
    }
    
    func pause() {
        player?.pause()
        isPlaying = false
        print("⏸️ Playback paused")
    }
    
    func resume() {
        player?.play()
        isPlaying = true
        print("▶️ Playback resumed")
    }
    
    func stop() {
        player?.pause()
        player?.seek(to: .zero)
        isPlaying = false
        currentTime = 0
        print("⏹️ Playback stopped")
    }
    
    func seek(to time: Double) {
        let cmTime = CMTime(seconds: time, preferredTimescale: 1000)
        player?.seek(to: cmTime)
        currentTime = time
    }
    
    func skipForward(_ seconds: Double = 10) {
        let newTime = min(currentTime + seconds, duration)
        seek(to: newTime)
    }
    
    func skipBackward(_ seconds: Double = 10) {
        let newTime = max(currentTime - seconds, 0)
        seek(to: newTime)
    }
    
    func setVolume(_ newVolume: Float) {
        volume = newVolume
        player?.volume = volume
    }
    
    func setPlaybackSpeed(_ speed: Float) {
        playbackSpeed = speed
        player?.rate = isPlaying ? speed : 0
    }
    
    // MARK: - Player Observers
    
    private func setupPlayerObservers() {
        guard let player = player else { return }
        
        // Time observer
        let timeScale = CMTimeScale(NSEC_PER_SEC)
        let time = CMTime(seconds: 0.1, preferredTimescale: timeScale)
        
        timeObserver = player.addPeriodicTimeObserver(forInterval: time, queue: .main) { [weak self] time in
            Task { @MainActor in
                self?.currentTime = time.seconds
            }
        }
        
        // Status observer
        playerStatusObserver = player.observe(\.currentItem?.status, options: [.new]) { [weak self] _, _ in
            DispatchQueue.main.async {
                self?.handleStatusChange()
            }
        }
        
        // Duration observer
        if let item = player.currentItem {
            Task {
                do {
                    let duration = try await item.asset.load(.duration)
                    DispatchQueue.main.async {
                        self.duration = duration.seconds
                        self.isLoading = false
                    }
                } catch {
                    print("❌ Error loading duration: \(error)")
                    DispatchQueue.main.async {
                        self.isLoading = false
                    }
                }
            }
        }
    }
    
    private func handleStatusChange() {
        guard let player = player, let item = player.currentItem else { return }
        
        switch item.status {
        case .readyToPlay:
            isLoading = false
            print("✅ Track ready to play")
            
        case .failed:
            isLoading = false
            isPlaying = false
            print("❌ Track failed to load: \(item.error?.localizedDescription ?? "Unknown error")")
            
        case .unknown:
            isLoading = true
            
        @unknown default:
            break
        }
    }
    
    private func handleTrackEnded() {
        isPlaying = false
        currentTime = 0
        print("🏁 Track ended")
        
        // Auto-seek to beginning for replay
        seek(to: 0)
    }
    
    // MARK: - Firebase Integration
    
    private func incrementPlayCount(for track: TrackData) async {
        do {
            // Use FirebaseManager shared instance
            try await FirebaseManager.shared.incrementPlayCount(for: track)
            print("📊 Play count incremented for: \(track.title)")
        } catch {
            print("❌ Failed to increment play count: \(error)")
        }
    }
    
    // MARK: - Cleanup
    
    private func cleanup() {
        if let timeObserver = timeObserver {
            player?.removeTimeObserver(timeObserver)
            self.timeObserver = nil
        }
        
        playerStatusObserver?.invalidate()
        playerStatusObserver = nil
        
        player = nil
    }
}

// MARK: - Track Data Extensions

extension TrackData {
    // formattedDuration is already defined in UserModels.swift
    
    var isPlayable: Bool {
        return audioURL != nil && !audioURL!.isEmpty
    }
}

// MARK: - Player Controls View

struct PlayerControlsView: View {
    @ObservedObject var player = TrackPlayer.shared
    let track: TrackData
    @State private var isDragging = false
    @State private var dragValue: Double = 0
    
    var body: some View {
        VStack(spacing: 16) {
            // Progress bar
            VStack(spacing: 8) {
                HStack {
                    Text(formatTime(isDragging ? dragValue : player.currentTime))
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Text(formatTime(player.duration))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Slider(
                    value: isDragging ? $dragValue : Binding(
                        get: { player.currentTime },
                        set: { player.seek(to: $0) }
                    ),
                    in: 0...max(player.duration, 1),
                    onEditingChanged: { editing in
                        isDragging = editing
                        if !editing {
                            player.seek(to: dragValue)
                        }
                    }
                )
                .accentColor(.blue)
            }
            
            // Control buttons
            HStack(spacing: 30) {
                Button(action: { player.skipBackward() }) {
                    Image(systemName: "gobackward.10")
                        .font(.title2)
                        .foregroundColor(.primary)
                }
                
                Button(action: togglePlayback) {
                    ZStack {
                        Circle()
                            .fill(Color.blue)
                            .frame(width: 60, height: 60)
                        
                        if player.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Image(systemName: player.isPlaying ? "pause.fill" : "play.fill")
                                .font(.title2)
                                .foregroundColor(.white)
                                .offset(x: player.isPlaying ? 0 : 2)
                        }
                    }
                }
                .disabled(player.isLoading)
                
                Button(action: { player.skipForward() }) {
                    Image(systemName: "goforward.10")
                        .font(.title2)
                        .foregroundColor(.primary)
                }
            }
            
            // Volume control
            HStack {
                Image(systemName: "speaker.fill")
                    .foregroundColor(.secondary)
                
                Slider(value: Binding(
                    get: { player.volume },
                    set: { player.setVolume($0) }
                ), in: 0...1)
                .accentColor(.blue)
                
                Image(systemName: "speaker.wave.3.fill")
                    .foregroundColor(.secondary)
            }
            .font(.caption)
        }
        .onAppear {
            dragValue = player.currentTime
        }
    }
    
    private func togglePlayback() {
        if player.currentTrack?.id == track.id {
            if player.isPlaying {
                player.pause()
            } else {
                player.resume()
            }
        } else {
            player.play(track: track)
        }
    }
    
    private func formatTime(_ time: Double) -> String {
        let minutes = Int(time) / 60
        let seconds = Int(time) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}