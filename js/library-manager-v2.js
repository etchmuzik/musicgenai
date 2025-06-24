// Library Manager V2 - Works with new MusicGenerator
class LibraryManagerV2 {
    constructor() {
        this.musicGenerator = window.musicGenerator || new MusicGenerator();
        this.currentSort = 'date';
        this.currentFilter = 'all';
    }

    // Render the library
    renderLibrary(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const library = this.getFilteredLibrary();
        
        if (library.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        container.innerHTML = library.map(track => this.createTrackCard(track)).join('');
        this.attachEventListeners();
    }

    // Get filtered library
    getFilteredLibrary() {
        let library = this.musicGenerator.getLibrary();
        
        // Apply filters
        if (this.currentFilter !== 'all') {
            library = library.filter(track => {
                if (this.currentFilter === 'instrumental') {
                    return track.genre === 'Instrumental' || track.description.includes('instrumental');
                } else {
                    return track.genre.toLowerCase().includes(this.currentFilter.toLowerCase());
                }
            });
        }

        // Apply sorting
        library.sort((a, b) => {
            switch (this.currentSort) {
                case 'date':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'duration':
                    return (b.duration || 0) - (a.duration || 0);
                default:
                    return 0;
            }
        });

        return library;
    }

    // Create track card HTML
    createTrackCard(track) {
        const duration = this.formatDuration(track.duration || 120);
        const timeAgo = this.getTimeAgo(new Date(track.createdAt));
        
        return `
            <div class="song-card" data-track-id="${track.id}">
                <div class="song-cover">
                    <div class="song-cover-gradient" style="background: linear-gradient(135deg, ${this.getRandomGradient()})">
                        <i class="fas fa-music"></i>
                    </div>
                    <div class="play-overlay" onclick="libraryManager.playTrack('${track.id}')">
                        <i class="fas fa-play-circle"></i>
                    </div>
                </div>
                <div class="song-info">
                    <h3 class="song-title">${this.escapeHtml(track.title)}</h3>
                    <div class="song-meta">
                        <span class="song-artist">AI Generated</span>
                        <span class="song-duration">${duration}</span>
                    </div>
                    <div class="song-description">${this.escapeHtml(track.description)}</div>
                    <div class="song-actions">
                        <button class="action-btn" onclick="libraryManager.downloadTrack('${track.id}')" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="action-btn" onclick="libraryManager.shareTrack('${track.id}')" title="Share">
                            <i class="fas fa-share"></i>
                        </button>
                        <button class="action-btn" onclick="libraryManager.deleteTrack('${track.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="song-footer">
                        <span class="song-tag">${track.genre}</span>
                        <span class="song-time">${timeAgo}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Get empty state HTML
    getEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-music"></i>
                </div>
                <h3>No tracks yet</h3>
                <p>Create your first AI-generated song to see it here</p>
                <a href="/create" class="btn btn-primary">
                    <i class="fas fa-plus"></i>
                    Create Music
                </a>
            </div>
        `;
    }

    // Play track
    playTrack(trackId) {
        const track = this.musicGenerator.getLibrary().find(t => t.id === trackId);
        if (!track) return;

        if (window.audioPlayer) {
            window.audioPlayer.play({
                id: track.id,
                audio_url: track.audioUrl,
                title: track.title,
                artist: 'AI Generated',
                genre: track.genre
            });
        } else {
            // Fallback to simple audio playback
            const audio = new Audio(track.audioUrl);
            audio.play();
        }
    }

    // Download track
    downloadTrack(trackId) {
        const track = this.musicGenerator.getLibrary().find(t => t.id === trackId);
        if (!track) return;

        const a = document.createElement('a');
        a.href = track.audioUrl;
        a.download = `${track.title}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Share track
    shareTrack(trackId) {
        const track = this.musicGenerator.getLibrary().find(t => t.id === trackId);
        if (!track) return;

        if (navigator.share) {
            navigator.share({
                title: track.title,
                text: `Check out this AI-generated song: ${track.title}`,
                url: window.location.origin + `/track/${trackId}`
            }).catch(console.error);
        } else {
            // Fallback to copy link
            const url = window.location.origin + `/track/${trackId}`;
            navigator.clipboard.writeText(url).then(() => {
                this.showNotification('Link copied to clipboard!', 'success');
            });
        }
    }

    // Delete track
    deleteTrack(trackId) {
        if (!confirm('Are you sure you want to delete this track?')) return;

        this.musicGenerator.deleteFromLibrary(trackId);
        this.renderLibrary('songsGrid');
        this.showNotification('Track deleted', 'info');
    }

    // Set sort
    setSort(sort) {
        this.currentSort = sort;
        this.renderLibrary('songsGrid');
    }

    // Set filter
    setFilter(filter) {
        this.currentFilter = filter;
        this.renderLibrary('songsGrid');
    }

    // Utility functions
    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
        if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago';
        return date.toLocaleDateString();
    }

    getRandomGradient() {
        const gradients = [
            '#f74c4c, #ff6b6b',
            '#4c7ff7, #6b8fff',
            '#f7f74c, #ffff6b',
            '#4cf774, #6bff8f',
            '#f74cf7, #ff6bff',
            '#4cf7f7, #6bffff'
        ];
        return gradients[Math.floor(Math.random() * gradients.length)];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    // Attach event listeners
    attachEventListeners() {
        // Add hover effects, click handlers, etc.
        document.querySelectorAll('.song-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }
}

// Create global instance
window.libraryManager = new LibraryManagerV2();

// Add styles for library
const libraryStyles = `
<style>
.empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--text-secondary);
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.3;
}

.empty-state h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
}

.empty-state p {
    margin-bottom: 2rem;
}

.song-cover-gradient {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 3rem;
}

.song-description {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0.5rem 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.song-actions {
    display: flex;
    gap: 0.5rem;
    margin: 0.75rem 0;
}

.action-btn {
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0.5rem;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 0.875rem;
}

.action-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--border-hover);
}

.song-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: var(--text-muted);
}

.song-time {
    font-size: 0.75rem;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', libraryStyles);