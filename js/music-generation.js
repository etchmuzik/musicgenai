// Music Generation Module - Core functionality for MusicGen AI
// Uses PiAPI exclusively for all music generation

class MusicGenerator {
    constructor() {
        this.piapi = new PiAPIMusic();
        this.currentTask = null;
        this.generationCallbacks = {
            onProgress: null,
            onComplete: null,
            onError: null
        };
    }

    // Set callbacks for generation events
    setCallbacks(callbacks) {
        this.generationCallbacks = { ...this.generationCallbacks, ...callbacks };
    }

    // Generate music from description
    async generateFromDescription(description, options = {}) {
        try {
            // Show initial progress
            this._updateProgress(5, 'Initializing music generation...');

            // Create the music task
            const result = await this.piapi.createMusic({
                prompt: description,
                make_instrumental: options.instrumental || false,
                song_style: options.genre || '',
                custom_lyrics: options.lyrics || '',
                title: options.title || '',
                model: 'music-u'
            });

            if (!result.success) {
                throw new Error(result.error || 'Failed to create music task');
            }

            this.currentTask = result.taskId;
            this._updateProgress(10, `Task created: ${result.taskId}`);

            // Poll for completion
            const completedTask = await this._pollForCompletion(result.taskId);
            
            // Extract audio URL
            const audioUrl = this.piapi.extractAudioUrl(completedTask);
            if (!audioUrl) {
                throw new Error('No audio URL in response');
            }

            // Save to library
            const savedTrack = this._saveToLibrary({
                id: result.taskId,
                title: options.title || this._generateTitle(description),
                description: description,
                audioUrl: audioUrl,
                genre: options.genre || 'Unknown',
                duration: completedTask.output?.songs?.[0]?.duration || 0,
                createdAt: new Date().toISOString(),
                credits: 10 // Cost of generation
            });

            this._updateProgress(100, 'Music generated successfully!');
            
            if (this.generationCallbacks.onComplete) {
                this.generationCallbacks.onComplete(savedTrack);
            }

            return savedTrack;

        } catch (error) {
            console.error('Generation error:', error);
            if (this.generationCallbacks.onError) {
                this.generationCallbacks.onError(error.message);
            }
            throw error;
        }
    }

    // Generate with custom lyrics
    async generateWithLyrics(lyrics, style, options = {}) {
        return this.generateFromDescription(style || 'Modern pop song', {
            ...options,
            lyrics: lyrics,
            instrumental: false
        });
    }

    // Poll for task completion
    async _pollForCompletion(taskId, maxAttempts = 60) {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const status = await this.piapi.getTask(taskId);
            const progress = Math.min(10 + (i / maxAttempts * 80), 90);
            
            this._updateProgress(progress, `Processing... (${status.status})`);
            
            if (status && status.status === 'completed' && status.output) {
                return status;
            } else if (status && status.status === 'failed') {
                throw new Error(status.error || 'Generation failed');
            }
        }
        
        throw new Error('Generation timeout');
    }

    // Update progress
    _updateProgress(percent, message) {
        if (this.generationCallbacks.onProgress) {
            this.generationCallbacks.onProgress(percent, message);
        }
    }

    // Generate title from description
    _generateTitle(description) {
        const words = description.split(' ').slice(0, 3);
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // Save track to local storage
    _saveToLibrary(track) {
        const library = this.getLibrary();
        library.unshift(track); // Add to beginning
        localStorage.setItem('musicgen_library', JSON.stringify(library));
        return track;
    }

    // Get library from local storage
    getLibrary() {
        const stored = localStorage.getItem('musicgen_library');
        return stored ? JSON.parse(stored) : [];
    }

    // Delete track from library
    deleteFromLibrary(trackId) {
        const library = this.getLibrary();
        const filtered = library.filter(track => track.id !== trackId);
        localStorage.setItem('musicgen_library', JSON.stringify(filtered));
        return filtered;
    }

    // Get recent generations
    getRecentGenerations(limit = 5) {
        return this.getLibrary().slice(0, limit);
    }

    // Cancel current generation
    cancelGeneration() {
        if (this.currentTask) {
            this.piapi.cancelTask(this.currentTask);
            this.currentTask = null;
        }
    }
}

// Credits Manager
class CreditsManager {
    constructor() {
        this.FREE_CREDITS = 10;
        this.COSTS = {
            generate: 10,
            extend: 5,
            remix: 8,
            lyrics: 3
        };
    }

    // Get current credits
    getCredits() {
        const stored = localStorage.getItem('musicgen_credits');
        if (!stored) {
            // Initialize with free credits
            this.setCredits(this.FREE_CREDITS);
            return this.FREE_CREDITS;
        }
        return parseInt(stored);
    }

    // Set credits
    setCredits(amount) {
        localStorage.setItem('musicgen_credits', amount.toString());
        this.updateUI(amount);
    }

    // Use credits
    useCredits(operation = 'generate') {
        const current = this.getCredits();
        const cost = this.COSTS[operation] || 10;
        
        if (current < cost) {
            throw new Error(`Insufficient credits. You need ${cost} credits but only have ${current}.`);
        }
        
        const newBalance = current - cost;
        this.setCredits(newBalance);
        
        // Track usage
        this._trackUsage(operation, cost);
        
        return newBalance;
    }

    // Add credits
    addCredits(amount) {
        const current = this.getCredits();
        this.setCredits(current + amount);
    }

    // Check if user can afford operation
    canAfford(operation = 'generate') {
        return this.getCredits() >= this.COSTS[operation];
    }

    // Update UI elements
    updateUI(credits) {
        // Update all credit displays
        document.querySelectorAll('[data-credits-display]').forEach(el => {
            el.textContent = credits;
        });
        
        // Update credit badges
        document.querySelectorAll('.credits-value').forEach(el => {
            el.textContent = credits;
        });
    }

    // Track usage for analytics
    _trackUsage(operation, cost) {
        const usage = JSON.parse(localStorage.getItem('musicgen_usage') || '[]');
        usage.push({
            operation,
            cost,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('musicgen_usage', JSON.stringify(usage));
    }

    // Get usage statistics
    getUsageStats() {
        const usage = JSON.parse(localStorage.getItem('musicgen_usage') || '[]');
        const total = usage.reduce((sum, u) => sum + u.cost, 0);
        const byOperation = {};
        
        usage.forEach(u => {
            byOperation[u.operation] = (byOperation[u.operation] || 0) + 1;
        });
        
        return { total, byOperation, history: usage };
    }
}

// Export for use
window.MusicGenerator = MusicGenerator;
window.CreditsManager = CreditsManager;