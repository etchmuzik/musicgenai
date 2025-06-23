// Suno Core - Unified JavaScript for MusicGen AI

class SunoCore {
    constructor() {
        this.currentTab = 'trending';
        this.currentTrack = null;
        this.isPlaying = false;
        this.audio = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSampleSongs();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(tab.dataset.tab);
            });
        });

        // Player controls
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.addEventListener('click', () => this.togglePlay());
        }

        const prevBtn = document.getElementById('prevBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousTrack());
        }

        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextTrack());
        }

        // Progress bar
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => this.seekTo(e));
        }

        // Mobile sidebar toggle
        window.toggleSidebar = () => {
            document.getElementById('sidebar').classList.toggle('active');
        };
    }

    switchTab(tab) {
        // Update active tab
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        this.currentTab = tab;
        this.loadSongsForTab(tab);
    }

    loadSongsForTab(tab) {
        const songsGrid = document.getElementById('songsGrid');
        if (!songsGrid) return;

        // Show loading state
        songsGrid.innerHTML = '<div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 2rem;"></div>';

        // Simulate API call
        setTimeout(() => {
            let songs = [];
            switch(tab) {
                case 'trending':
                    songs = this.getTrendingSongs();
                    break;
                case 'recent':
                    songs = this.getRecentSongs();
                    break;
                case 'following':
                    songs = this.getFollowingSongs();
                    break;
            }
            this.renderSongs(songs);
        }, 500);
    }

    getTrendingSongs() {
        return [
            {
                id: '1',
                title: 'Neon Dreams',
                genre: 'Electronic',
                duration: '3:24',
                tag: 'v3.5',
                gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                plays: 12500
            },
            {
                id: '2',
                title: 'Midnight Jazz',
                genre: 'Jazz',
                duration: '4:12',
                tag: 'v3.5',
                gradient: 'linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)',
                plays: 8900
            },
            {
                id: '3',
                title: 'Summer Vibes',
                genre: 'Pop',
                duration: '2:58',
                tag: 'Remix',
                gradient: 'linear-gradient(135deg, #f59e0b 0%, #10b981 100%)',
                plays: 15200
            },
            {
                id: '4',
                title: 'Epic Orchestra',
                genre: 'Classical',
                duration: '5:45',
                tag: 'v3',
                gradient: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                plays: 6700
            },
            {
                id: '5',
                title: 'Lofi Study Session',
                genre: 'Hip Hop',
                duration: '3:33',
                tag: 'v3.5',
                gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                plays: 22100
            },
            {
                id: '6',
                title: 'Rock Anthem',
                genre: 'Rock',
                duration: '4:20',
                tag: 'Uploaded',
                gradient: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
                plays: 9800
            }
        ];
    }

    getRecentSongs() {
        return [
            {
                id: '7',
                title: 'Digital Sunrise',
                genre: 'Ambient',
                duration: '6:15',
                tag: 'New',
                gradient: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
                plays: 450
            },
            {
                id: '8',
                title: 'Urban Beats',
                genre: 'Hip Hop',
                duration: '2:45',
                tag: 'v3.5',
                gradient: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                plays: 780
            }
        ];
    }

    getFollowingSongs() {
        return [
            {
                id: '9',
                title: 'Following Track 1',
                genre: 'Pop',
                duration: '3:30',
                tag: 'Friend',
                gradient: 'linear-gradient(135deg, #ec4899 0%, #10b981 100%)',
                plays: 320
            }
        ];
    }

    renderSongs(songs) {
        const songsGrid = document.getElementById('songsGrid');
        if (!songsGrid) return;

        songsGrid.innerHTML = songs.map(song => `
            <div class="song-card" data-song-id="${song.id}">
                <div class="song-cover" style="background: ${song.gradient};">
                    <div class="play-overlay">
                        <button class="play-button" onclick="SunoCore.playSong('${song.id}')">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
                <div class="song-info">
                    <h3 class="song-title">${song.title}</h3>
                    <div class="song-meta">
                        <span class="song-tag">${song.tag}</span>
                        <span>${song.genre}</span>
                        <span class="song-duration">${song.duration}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    playSong(songId) {
        // Find the song
        const allSongs = [...this.getTrendingSongs(), ...this.getRecentSongs(), ...this.getFollowingSongs()];
        const song = allSongs.find(s => s.id === songId);
        
        if (!song) return;

        // Update UI
        this.updatePlayerUI(song);
        
        // Reset all play buttons
        document.querySelectorAll('.play-button i').forEach(i => {
            i.classList.remove('fa-pause');
            i.classList.add('fa-play');
        });
        
        // Update current button
        const currentButton = document.querySelector(`[data-song-id="${songId}"] .play-button i`);
        if (currentButton) {
            currentButton.classList.remove('fa-play');
            currentButton.classList.add('fa-pause');
        }

        // Update player button
        const playerBtn = document.querySelector('#playBtn i');
        if (playerBtn) {
            playerBtn.classList.remove('fa-play');
            playerBtn.classList.add('fa-pause');
        }

        this.currentTrack = song;
        this.isPlaying = true;

        // Simulate audio playback
        this.simulatePlayback(song);
    }

    updatePlayerUI(song) {
        const playerTitle = document.getElementById('playerTitle');
        const playerArtist = document.getElementById('playerArtist');
        const playerCover = document.getElementById('playerCover');
        const totalTime = document.getElementById('totalTime');

        if (playerTitle) playerTitle.textContent = song.title;
        if (playerArtist) playerArtist.textContent = song.genre;
        if (totalTime) totalTime.textContent = song.duration;
        
        if (playerCover) {
            playerCover.style.background = song.gradient;
        }
    }

    simulatePlayback(song) {
        // Convert duration to seconds for simulation
        const [minutes, seconds] = song.duration.split(':').map(Number);
        const totalSeconds = minutes * 60 + seconds;
        
        let currentSeconds = 0;
        const progressFill = document.getElementById('progressFill');
        const currentTime = document.getElementById('currentTime');

        const interval = setInterval(() => {
            if (!this.isPlaying) {
                clearInterval(interval);
                return;
            }

            currentSeconds++;
            const progress = (currentSeconds / totalSeconds) * 100;
            
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
            }
            
            if (currentTime) {
                const mins = Math.floor(currentSeconds / 60);
                const secs = currentSeconds % 60;
                currentTime.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            }

            if (currentSeconds >= totalSeconds) {
                clearInterval(interval);
                this.nextTrack();
            }
        }, 1000);
    }

    togglePlay() {
        const playerBtn = document.querySelector('#playBtn i');
        
        if (this.isPlaying) {
            this.isPlaying = false;
            if (playerBtn) {
                playerBtn.classList.remove('fa-pause');
                playerBtn.classList.add('fa-play');
            }
        } else {
            this.isPlaying = true;
            if (playerBtn) {
                playerBtn.classList.remove('fa-play');
                playerBtn.classList.add('fa-pause');
            }
        }
    }

    previousTrack() {
        // Implementation for previous track
        console.log('Previous track');
    }

    nextTrack() {
        // Implementation for next track
        console.log('Next track');
        this.isPlaying = false;
        const playerBtn = document.querySelector('#playBtn i');
        if (playerBtn) {
            playerBtn.classList.remove('fa-pause');
            playerBtn.classList.add('fa-play');
        }
    }

    seekTo(e) {
        // Implementation for seeking
        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${percentage * 100}%`;
        }
    }

    loadSampleSongs() {
        // Load initial trending songs
        this.loadSongsForTab('trending');
    }

    // Static method for global access
    static loadTrendingSongs() {
        if (window.sunoCore) {
            window.sunoCore.loadSongsForTab('trending');
        }
    }

    static playSong(songId) {
        if (window.sunoCore) {
            window.sunoCore.playSong(songId);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sunoCore = new SunoCore();
    window.SunoCore = SunoCore; // For global access
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SunoCore;
}