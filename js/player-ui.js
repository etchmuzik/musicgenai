/**
 * Enhanced Player UI Components
 * Adds advanced player features like download, queue management, and visualizations
 */

class PlayerUI {
    constructor(audioPlayer) {
        this.audioPlayer = audioPlayer;
        this.isQueueVisible = false;
        this.isFullscreenPlayer = false;
        
        this.enhancePlayerBar();
        this.createFullscreenPlayer();
        this.initializeEventListeners();
    }
    
    enhancePlayerBar() {
        // Add enhanced controls to existing player bar
        const playerBar = document.querySelector('.player-bar');
        if (!playerBar) return;
        
        // Add track actions menu
        const playerTrack = playerBar.querySelector('.player-track');
        if (playerTrack) {
            const actionsHTML = `
                <div class="player-actions">
                    <button class="player-action-btn" id="downloadBtn" title="Download Track">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="player-action-btn" id="addToLibraryBtn" title="Add to Library">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="player-action-btn" id="shareBtn" title="Share Track">
                        <i class="fas fa-share"></i>
                    </button>
                    <button class="player-action-btn" id="queueBtn" title="Show Queue">
                        <i class="fas fa-list"></i>
                    </button>
                    <button class="player-action-btn" id="fullscreenBtn" title="Full Player">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
            `;
            playerTrack.insertAdjacentHTML('afterend', actionsHTML);
        }
        
        // Add styles for enhanced player
        this.addPlayerStyles();
    }
    
    createFullscreenPlayer() {
        const fullscreenHTML = `
            <div class="fullscreen-player" id="fullscreenPlayer">
                <div class="fullscreen-background"></div>
                <div class="fullscreen-content">
                    <div class="fullscreen-header">
                        <button class="close-fullscreen" id="closeFullscreen">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="fullscreen-main">
                        <div class="fullscreen-artwork">
                            <div class="artwork-container" id="fullscreenArtwork">
                                <div class="vinyl-animation">
                                    <div class="vinyl-disc"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="fullscreen-info">
                            <h1 class="fullscreen-title" id="fullscreenTitle">Track Title</h1>
                            <h2 class="fullscreen-artist" id="fullscreenArtist">Artist Name</h2>
                        </div>
                        
                        <div class="fullscreen-controls">
                            <div class="fullscreen-progress">
                                <div class="time-display">
                                    <span id="fullscreenCurrentTime">0:00</span>
                                    <span id="fullscreenTotalTime">0:00</span>
                                </div>
                                <div class="fullscreen-progress-bar" id="fullscreenProgressBar">
                                    <div class="fullscreen-progress-fill" id="fullscreenProgressFill"></div>
                                </div>
                            </div>
                            
                            <div class="fullscreen-buttons">
                                <button class="fullscreen-btn" id="fullscreenPrevBtn">
                                    <i class="fas fa-backward"></i>
                                </button>
                                <button class="fullscreen-btn play-large" id="fullscreenPlayBtn">
                                    <i class="fas fa-play"></i>
                                </button>
                                <button class="fullscreen-btn" id="fullscreenNextBtn">
                                    <i class="fas fa-forward"></i>
                                </button>
                            </div>
                            
                            <div class="fullscreen-extras">
                                <button class="fullscreen-extra-btn" id="fullscreenShuffleBtn">
                                    <i class="fas fa-random"></i>
                                </button>
                                <button class="fullscreen-extra-btn" id="fullscreenRepeatBtn">
                                    <i class="fas fa-redo"></i>
                                </button>
                                <div class="fullscreen-volume">
                                    <button class="fullscreen-extra-btn" id="fullscreenVolumeBtn">
                                        <i class="fas fa-volume-up"></i>
                                    </button>
                                    <input type="range" class="fullscreen-volume-slider" 
                                           id="fullscreenVolumeSlider" min="0" max="100" value="70">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="queue-panel" id="queuePanel">
                        <h3>Queue</h3>
                        <div class="queue-list" id="queueList">
                            <!-- Queue items will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', fullscreenHTML);
    }
    
    addPlayerStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Enhanced Player Bar */
            .player-actions {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-left: 1rem;
            }
            
            .player-action-btn {
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 0.25rem;
                transition: all 0.2s ease;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .player-action-btn:hover {
                color: var(--text-primary);
                background: rgba(255, 255, 255, 0.1);
            }
            
            /* Fullscreen Player */
            .fullscreen-player {
                position: fixed;
                inset: 0;
                background: var(--bg-primary);
                z-index: 9999;
                display: none;
                overflow: hidden;
            }
            
            .fullscreen-player.active {
                display: block;
            }
            
            .fullscreen-background {
                position: absolute;
                inset: 0;
                background: radial-gradient(circle at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
            }
            
            .fullscreen-content {
                position: relative;
                height: 100vh;
                display: flex;
                flex-direction: column;
            }
            
            .fullscreen-header {
                display: flex;
                justify-content: flex-end;
                padding: 2rem;
            }
            
            .close-fullscreen {
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                font-size: 1.5rem;
                padding: 0.5rem;
                border-radius: 0.5rem;
                transition: all 0.2s ease;
            }
            
            .close-fullscreen:hover {
                color: var(--text-primary);
                background: rgba(255, 255, 255, 0.1);
            }
            
            .fullscreen-main {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 2rem;
                gap: 2rem;
            }
            
            .fullscreen-artwork {
                margin-bottom: 2rem;
            }
            
            .artwork-container {
                width: 300px;
                height: 300px;
                border-radius: 1rem;
                overflow: hidden;
                background: var(--primary-gradient);
                position: relative;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            
            .vinyl-animation {
                width: 100%;
                height: 100%;
                position: relative;
                animation: vinyl-spin 3s linear infinite;
            }
            
            .vinyl-disc {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: 
                    radial-gradient(circle at center, transparent 25%, rgba(0,0,0,0.8) 26%, rgba(0,0,0,0.8) 30%, transparent 31%),
                    radial-gradient(circle at center, transparent 45%, rgba(0,0,0,0.6) 46%, rgba(0,0,0,0.6) 50%, transparent 51%),
                    var(--primary-gradient);
                position: relative;
            }
            
            .vinyl-disc::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 20px;
                height: 20px;
                background: #000;
                border-radius: 50%;
            }
            
            @keyframes vinyl-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .fullscreen-info {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .fullscreen-title {
                font-size: 2.5rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
                background: linear-gradient(135deg, #fff 0%, #a78bfa 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            .fullscreen-artist {
                font-size: 1.25rem;
                color: var(--text-secondary);
                font-weight: 400;
            }
            
            .fullscreen-controls {
                width: 100%;
                max-width: 600px;
            }
            
            .fullscreen-progress {
                margin-bottom: 2rem;
            }
            
            .time-display {
                display: flex;
                justify-content: space-between;
                margin-bottom: 1rem;
                font-size: 0.875rem;
                color: var(--text-secondary);
            }
            
            .fullscreen-progress-bar {
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                cursor: pointer;
                position: relative;
            }
            
            .fullscreen-progress-fill {
                height: 100%;
                background: var(--primary-gradient);
                border-radius: 4px;
                width: 0%;
                transition: width 0.1s ease;
            }
            
            .fullscreen-buttons {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 2rem;
                margin-bottom: 2rem;
            }
            
            .fullscreen-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                color: var(--text-primary);
                cursor: pointer;
                width: 60px;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.25rem;
                transition: all 0.2s ease;
            }
            
            .fullscreen-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.05);
            }
            
            .play-large {
                width: 80px;
                height: 80px;
                font-size: 1.5rem;
                background: var(--primary-gradient);
                border: none;
            }
            
            .fullscreen-extras {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 1rem;
            }
            
            .fullscreen-extra-btn {
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                padding: 0.75rem;
                border-radius: 0.5rem;
                transition: all 0.2s ease;
            }
            
            .fullscreen-extra-btn:hover {
                color: var(--text-primary);
                background: rgba(255, 255, 255, 0.1);
            }
            
            .fullscreen-extra-btn.active {
                color: var(--primary);
            }
            
            .fullscreen-volume {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .fullscreen-volume-slider {
                width: 100px;
                height: 4px;
                -webkit-appearance: none;
                appearance: none;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 2px;
                outline: none;
                cursor: pointer;
            }
            
            .fullscreen-volume-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                background: var(--primary);
                border-radius: 50%;
                cursor: pointer;
            }
            
            /* Queue Panel */
            .queue-panel {
                position: absolute;
                right: 0;
                top: 0;
                bottom: 0;
                width: 350px;
                background: rgba(20, 20, 20, 0.95);
                backdrop-filter: blur(20px);
                border-left: 1px solid rgba(255, 255, 255, 0.1);
                padding: 2rem;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                overflow-y: auto;
            }
            
            .queue-panel.active {
                transform: translateX(0);
            }
            
            .queue-list {
                margin-top: 1rem;
            }
            
            .queue-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                border-radius: 0.5rem;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            
            .queue-item:hover {
                background: rgba(255, 255, 255, 0.05);
            }
            
            .queue-item.current {
                background: rgba(139, 92, 246, 0.2);
            }
            
            .queue-item-cover {
                width: 50px;
                height: 50px;
                border-radius: 0.5rem;
                background: var(--primary-gradient);
                flex-shrink: 0;
            }
            
            .queue-item-info {
                flex: 1;
                min-width: 0;
            }
            
            .queue-item-title {
                font-weight: 500;
                margin-bottom: 0.25rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .queue-item-artist {
                font-size: 0.875rem;
                color: var(--text-secondary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            /* Mobile Responsive */
            @media (max-width: 768px) {
                .player-actions {
                    display: none;
                }
                
                .fullscreen-main {
                    padding: 1rem;
                    gap: 1rem;
                }
                
                .artwork-container {
                    width: 250px;
                    height: 250px;
                }
                
                .fullscreen-title {
                    font-size: 2rem;
                }
                
                .fullscreen-buttons {
                    gap: 1rem;
                }
                
                .fullscreen-btn {
                    width: 50px;
                    height: 50px;
                    font-size: 1rem;
                }
                
                .play-large {
                    width: 70px;
                    height: 70px;
                }
                
                .queue-panel {
                    width: 100vw;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    initializeEventListeners() {
        // Download button
        document.getElementById('downloadBtn')?.addEventListener('click', () => {
            this.downloadCurrentTrack();
        });
        
        // Add to library button
        document.getElementById('addToLibraryBtn')?.addEventListener('click', () => {
            this.addToLibrary();
        });
        
        // Share button
        document.getElementById('shareBtn')?.addEventListener('click', () => {
            this.shareTrack();
        });
        
        // Queue button
        document.getElementById('queueBtn')?.addEventListener('click', () => {
            this.toggleQueue();
        });
        
        // Fullscreen button
        document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        // Fullscreen controls
        document.getElementById('closeFullscreen')?.addEventListener('click', () => {
            this.closeFullscreen();
        });
        
        document.getElementById('fullscreenPlayBtn')?.addEventListener('click', () => {
            this.audioPlayer.togglePlayPause();
        });
        
        document.getElementById('fullscreenPrevBtn')?.addEventListener('click', () => {
            this.audioPlayer.playPrevious();
        });
        
        document.getElementById('fullscreenNextBtn')?.addEventListener('click', () => {
            this.audioPlayer.playNext();
        });
        
        // Fullscreen progress bar
        document.getElementById('fullscreenProgressBar')?.addEventListener('click', (e) => {
            this.audioPlayer.seek(e);
        });
        
        // Fullscreen volume
        document.getElementById('fullscreenVolumeSlider')?.addEventListener('input', (e) => {
            this.audioPlayer.setVolume(e.target.value / 100);
        });
        
        // Listen to audio player events
        if (this.audioPlayer.audio) {
            this.audioPlayer.audio.addEventListener('timeupdate', () => {
                this.updateFullscreenProgress();
            });
            
            this.audioPlayer.audio.addEventListener('play', () => {
                this.updateFullscreenPlayButton();
            });
            
            this.audioPlayer.audio.addEventListener('pause', () => {
                this.updateFullscreenPlayButton();
            });
        }
    }
    
    downloadCurrentTrack() {
        const track = this.audioPlayer.getCurrentTrack();
        if (!track || !track.audio_url || track.audio_url === '#') {
            alert('No track available for download');
            return;
        }
        
        const link = document.createElement('a');
        link.href = track.audio_url;
        link.download = `${track.title || 'track'}.mp3`;
        link.click();
    }
    
    addToLibrary() {
        const track = this.audioPlayer.getCurrentTrack();
        if (!track) return;
        
        let library = JSON.parse(localStorage.getItem('musicLibrary') || '[]');
        
        // Check if already in library
        if (library.find(t => t.id === track.id)) {
            alert('Track already in library');
            return;
        }
        
        // Add to library
        const libraryTrack = {
            ...track,
            id: track.id || Date.now().toString(),
            created_at: new Date().toISOString()
        };
        
        library.unshift(libraryTrack);
        localStorage.setItem('musicLibrary', JSON.stringify(library));
        alert('Track added to library!');
    }
    
    shareTrack() {
        const track = this.audioPlayer.getCurrentTrack();
        if (!track) return;
        
        const shareText = `Check out "${track.title}" by ${track.artist || 'AI Generated'} on MusicGen AI!`;
        const shareUrl = window.location.origin;
        
        if (navigator.share) {
            navigator.share({
                title: track.title,
                text: shareText,
                url: shareUrl
            });
        } else {
            navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
            alert('Share link copied to clipboard!');
        }
    }
    
    toggleQueue() {
        const queuePanel = document.getElementById('queuePanel');
        if (!queuePanel) return;
        
        this.isQueueVisible = !this.isQueueVisible;
        queuePanel.classList.toggle('active', this.isQueueVisible);
        
        if (this.isQueueVisible) {
            this.updateQueue();
        }
    }
    
    updateQueue() {
        const queueList = document.getElementById('queueList');
        const playlist = this.audioPlayer.getPlaylist();
        const currentTrack = this.audioPlayer.getCurrentTrack();
        
        if (!queueList || !playlist.length) return;
        
        queueList.innerHTML = playlist.map((track, index) => {
            const isCurrentTrack = currentTrack && track.id === currentTrack.id;
            return `
                <div class="queue-item ${isCurrentTrack ? 'current' : ''}" 
                     onclick="window.audioPlayer.setPlaylist(window.audioPlayer.getPlaylist(), ${index})">
                    <div class="queue-item-cover" 
                         style="${track.image_url ? `background-image: url(${track.image_url}); background-size: cover;` : ''}">
                    </div>
                    <div class="queue-item-info">
                        <div class="queue-item-title">${track.title}</div>
                        <div class="queue-item-artist">${track.artist || 'AI Generated'}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    toggleFullscreen() {
        const fullscreenPlayer = document.getElementById('fullscreenPlayer');
        if (!fullscreenPlayer) return;
        
        this.isFullscreenPlayer = !this.isFullscreenPlayer;
        fullscreenPlayer.classList.toggle('active', this.isFullscreenPlayer);
        
        if (this.isFullscreenPlayer) {
            this.updateFullscreenPlayer();
        }
    }
    
    closeFullscreen() {
        this.isFullscreenPlayer = false;
        document.getElementById('fullscreenPlayer')?.classList.remove('active');
    }
    
    updateFullscreenPlayer() {
        const track = this.audioPlayer.getCurrentTrack();
        if (!track) return;
        
        // Update fullscreen UI
        document.getElementById('fullscreenTitle').textContent = track.title || 'Unknown Track';
        document.getElementById('fullscreenArtist').textContent = track.artist || 'AI Generated';
        
        // Update artwork
        const artwork = document.getElementById('fullscreenArtwork');
        if (track.image_url) {
            artwork.style.backgroundImage = `url(${track.image_url})`;
            artwork.style.backgroundSize = 'cover';
        } else {
            artwork.style.background = 'var(--primary-gradient)';
        }
        
        this.updateFullscreenPlayButton();
        this.updateQueue();
    }
    
    updateFullscreenProgress() {
        if (!this.isFullscreenPlayer) return;
        
        const audio = this.audioPlayer.audio;
        const progressFill = document.getElementById('fullscreenProgressFill');
        const currentTime = document.getElementById('fullscreenCurrentTime');
        const totalTime = document.getElementById('fullscreenTotalTime');
        
        if (progressFill && !isNaN(audio.duration)) {
            const percent = (audio.currentTime / audio.duration) * 100;
            progressFill.style.width = `${percent}%`;
        }
        
        if (currentTime) {
            currentTime.textContent = this.formatTime(audio.currentTime);
        }
        
        if (totalTime) {
            totalTime.textContent = this.formatTime(audio.duration);
        }
    }
    
    updateFullscreenPlayButton() {
        const playBtn = document.getElementById('fullscreenPlayBtn');
        if (!playBtn) return;
        
        const icon = playBtn.querySelector('i');
        if (icon) {
            icon.className = this.audioPlayer.isPlaying ? 'fas fa-pause' : 'fas fa-play';
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Initialize enhanced player UI when audio player is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.audioPlayer) {
        window.playerUI = new PlayerUI(window.audioPlayer);
    }
});

export default PlayerUI;