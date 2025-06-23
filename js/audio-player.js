/**
 * Audio Player Manager
 * Handles all audio playback functionality for MusicGen AI
 */

class AudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.currentTrack = null;
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isSeeking = false;
        
        // Player elements
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.currentTimeEl = document.getElementById('currentTime');
        this.totalTimeEl = document.getElementById('totalTime');
        this.playerTitle = document.getElementById('playerTitle');
        this.playerArtist = document.getElementById('playerArtist');
        this.playerCover = document.getElementById('playerCover');
        
        // Volume elements (create if not exist)
        this.createVolumeControl();
        
        // Initialize
        this.initializeEventListeners();
        this.loadSavedState();
    }
    
    initializeEventListeners() {
        // Play/Pause button
        this.playBtn?.addEventListener('click', () => this.togglePlayPause());
        
        // Previous/Next buttons
        this.prevBtn?.addEventListener('click', () => this.playPrevious());
        this.nextBtn?.addEventListener('click', () => this.playNext());
        
        // Progress bar seeking
        this.progressBar?.addEventListener('click', (e) => this.seek(e));
        this.progressBar?.addEventListener('mousedown', () => this.isSeeking = true);
        document.addEventListener('mouseup', () => this.isSeeking = false);
        this.progressBar?.addEventListener('mousemove', (e) => {
            if (this.isSeeking) this.seek(e);
        });
        
        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.onTrackEnded());
        this.audio.addEventListener('error', (e) => this.handleError(e));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    createVolumeControl() {
        // Add volume control to player bar if not exists
        const playerProgress = document.querySelector('.player-progress');
        if (playerProgress && !document.querySelector('.volume-control')) {
            const volumeHTML = `
                <div class="volume-control">
                    <button class="volume-btn" id="volumeBtn">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <div class="volume-slider-container">
                        <input type="range" class="volume-slider" id="volumeSlider" 
                               min="0" max="100" value="70">
                    </div>
                </div>
            `;
            playerProgress.insertAdjacentHTML('afterend', volumeHTML);
            
            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .volume-control {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-left: 1rem;
                }
                
                .volume-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 0.5rem;
                    transition: color 0.2s ease;
                }
                
                .volume-btn:hover {
                    color: var(--text-primary);
                }
                
                .volume-slider-container {
                    width: 100px;
                    position: relative;
                }
                
                .volume-slider {
                    width: 100%;
                    height: 4px;
                    -webkit-appearance: none;
                    appearance: none;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    outline: none;
                    cursor: pointer;
                }
                
                .volume-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    background: var(--primary);
                    border-radius: 50%;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }
                
                .volume-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                }
                
                .volume-slider::-moz-range-thumb {
                    width: 12px;
                    height: 12px;
                    background: var(--primary);
                    border-radius: 50%;
                    cursor: pointer;
                    border: none;
                }
                
                @media (max-width: 768px) {
                    .volume-control {
                        display: none;
                    }
                }
            `;
            document.head.appendChild(style);
            
            // Volume control events
            this.volumeSlider = document.getElementById('volumeSlider');
            this.volumeBtn = document.getElementById('volumeBtn');
            
            this.volumeSlider?.addEventListener('input', (e) => {
                this.setVolume(e.target.value / 100);
            });
            
            this.volumeBtn?.addEventListener('click', () => {
                this.toggleMute();
            });
        }
    }
    
    // Core playback functions
    play(track, playlist = null, index = 0) {
        if (!track) return;
        
        this.currentTrack = track;
        if (playlist) {
            this.playlist = playlist;
            this.currentIndex = index;
        }
        
        // Set audio source
        this.audio.src = track.audio_url || track.url;
        
        // Update UI
        this.updatePlayerUI(track);
        
        // Play
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.saveState();
        }).catch(error => {
            console.error('Playback error:', error);
            this.handleError(error);
        });
    }
    
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.resume();
        }
    }
    
    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton();
    }
    
    resume() {
        if (this.currentTrack) {
            this.audio.play().then(() => {
                this.isPlaying = true;
                this.updatePlayButton();
            });
        }
    }
    
    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        this.updatePlayButton();
        this.updateProgress();
    }
    
    // Navigation
    playNext() {
        if (this.playlist.length > 0) {
            this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
            this.play(this.playlist[this.currentIndex], this.playlist, this.currentIndex);
        }
    }
    
    playPrevious() {
        if (this.audio.currentTime > 3) {
            // If more than 3 seconds in, restart current track
            this.audio.currentTime = 0;
        } else if (this.playlist.length > 0) {
            // Otherwise go to previous track
            this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
            this.play(this.playlist[this.currentIndex], this.playlist, this.currentIndex);
        }
    }
    
    // Seeking
    seek(event) {
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        const time = percent * this.audio.duration;
        
        if (!isNaN(time)) {
            this.audio.currentTime = time;
            this.updateProgress();
        }
    }
    
    // Volume control
    setVolume(value) {
        this.audio.volume = Math.max(0, Math.min(1, value));
        if (this.volumeSlider) {
            this.volumeSlider.value = value * 100;
        }
        this.updateVolumeIcon();
        localStorage.setItem('playerVolume', value);
    }
    
    toggleMute() {
        if (this.audio.volume > 0) {
            this.previousVolume = this.audio.volume;
            this.setVolume(0);
        } else {
            this.setVolume(this.previousVolume || 0.7);
        }
    }
    
    updateVolumeIcon() {
        if (!this.volumeBtn) return;
        
        const icon = this.volumeBtn.querySelector('i');
        if (!icon) return;
        
        if (this.audio.volume === 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (this.audio.volume < 0.5) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }
    
    // UI Updates
    updatePlayerUI(track) {
        if (this.playerTitle) {
            this.playerTitle.textContent = track.title || 'Unknown Track';
        }
        
        if (this.playerArtist) {
            this.playerArtist.textContent = track.artist || track.genre || 'AI Generated';
        }
        
        if (this.playerCover) {
            if (track.image_url || track.artwork_url) {
                this.playerCover.style.backgroundImage = `url(${track.image_url || track.artwork_url})`;
                this.playerCover.style.backgroundSize = 'cover';
                this.playerCover.style.backgroundPosition = 'center';
            } else {
                this.playerCover.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)';
                this.playerCover.style.backgroundImage = '';
            }
        }
        
        // Update page title
        document.title = `${track.title || 'Playing'} - MusicGen AI`;
    }
    
    updatePlayButton() {
        if (!this.playBtn) return;
        
        const icon = this.playBtn.querySelector('i');
        if (icon) {
            icon.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
        }
    }
    
    updateProgress() {
        if (!this.progressFill || !this.currentTimeEl || this.isSeeking) return;
        
        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        this.progressFill.style.width = `${percent}%`;
        this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
    }
    
    updateDuration() {
        if (this.totalTimeEl) {
            this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
        }
    }
    
    // Utilities
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    onTrackEnded() {
        if (this.playlist.length > 0) {
            this.playNext();
        } else {
            this.isPlaying = false;
            this.updatePlayButton();
            this.updateProgress();
        }
    }
    
    handleError(error) {
        console.error('Audio player error:', error);
        
        // Try to recover
        if (this.currentTrack && error.type === 'error') {
            // Network error, try again after a delay
            setTimeout(() => {
                if (this.currentTrack) {
                    this.play(this.currentTrack, this.playlist, this.currentIndex);
                }
            }, 2000);
        }
    }
    
    // Keyboard shortcuts
    handleKeyboard(event) {
        // Only handle if not typing in an input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
        
        switch(event.code) {
            case 'Space':
                event.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.audio.currentTime = Math.max(0, this.audio.currentTime - 10);
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 10);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.setVolume(Math.min(1, this.audio.volume + 0.1));
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.setVolume(Math.max(0, this.audio.volume - 0.1));
                break;
        }
    }
    
    // State management
    saveState() {
        const state = {
            currentTrack: this.currentTrack,
            currentTime: this.audio.currentTime,
            volume: this.audio.volume,
            isPlaying: this.isPlaying
        };
        localStorage.setItem('playerState', JSON.stringify(state));
    }
    
    loadSavedState() {
        try {
            const state = JSON.parse(localStorage.getItem('playerState') || '{}');
            
            // Restore volume
            const savedVolume = localStorage.getItem('playerVolume');
            if (savedVolume) {
                this.setVolume(parseFloat(savedVolume));
            }
            
            // Restore last track (but don't autoplay)
            if (state.currentTrack) {
                this.currentTrack = state.currentTrack;
                this.updatePlayerUI(state.currentTrack);
            }
        } catch (error) {
            console.error('Error loading player state:', error);
        }
    }
    
    // Public methods for external control
    playTrackById(trackId) {
        const library = JSON.parse(localStorage.getItem('musicLibrary') || '[]');
        const track = library.find(t => t.id === trackId);
        
        if (track) {
            this.play(track, library, library.indexOf(track));
        }
    }
    
    setPlaylist(tracks, startIndex = 0) {
        if (tracks.length > 0) {
            this.playlist = tracks;
            this.currentIndex = startIndex;
            this.play(tracks[startIndex], tracks, startIndex);
        }
    }
    
    addToQueue(track) {
        this.playlist.push(track);
    }
    
    clearQueue() {
        this.playlist = [];
        this.currentIndex = 0;
    }
    
    getCurrentTrack() {
        return this.currentTrack;
    }
    
    getPlaylist() {
        return this.playlist;
    }
}

// Initialize global player instance
window.audioPlayer = new AudioPlayer();

// Export for use in other modules
export default AudioPlayer;