/**
 * MusicGen AI - Production Music Generation Service
 * Handles real PiAPI integration, queue management, and progress tracking
 */

class MusicGenerationService {
    constructor() {
        // Try different endpoints in order of preference
        this.possibleEndpoints = [
            'http://localhost:5679/webhook/generate-music-ai', // n8n on alternate port
            'http://localhost:5678/webhook/generate-music-ai', // n8n default port
            'http://127.0.0.1:5678/webhook/generate-music-ai', // Alternative localhost
            'https://your-n8n-domain.com/webhook/generate-music-ai' // Production n8n (update this)
        ];
        this.apiBaseUrl = this.possibleEndpoints[0]; // Start with first endpoint
        this.apiKey = null; // Not needed for n8n webhook
        this.generationQueue = [];
        this.activeGenerations = new Map();
        this.maxConcurrentGenerations = 3;
        this.websocketUrl = null; // n8n handles this synchronously
        this.eventListeners = new Map();
        
        // Initialize queue processor
        this.startQueueProcessor();
    }

    /**
     * Set API credentials
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * Add generation request to queue
     */
    async generateMusic(params, onProgress, onComplete, onError) {
        const generationId = this.generateId();
        
        const request = {
            id: generationId,
            params: {
                prompt: params.prompt,
                genre: params.genre,
                mood: params.mood,
                duration: params.duration,
                instrumental: params.instrumental,
                bpm: params.bpm || null,
                key: params.key || null,
                style: params.style || null,
                energy: params.energy || 'medium',
                creativity: params.creativity || 0.7,
                quality: params.quality || 'high'
            },
            callbacks: {
                onProgress,
                onComplete,
                onError
            },
            status: 'queued',
            createdAt: new Date().toISOString(),
            priority: params.priority || 'normal'
        };

        // Add to queue (priority queue implementation)
        this.addToQueue(request);
        
        // Trigger queue processing
        this.processQueue();
        
        return generationId;
    }

    /**
     * Add request to priority queue
     */
    addToQueue(request) {
        if (request.priority === 'high') {
            this.generationQueue.unshift(request);
        } else {
            this.generationQueue.push(request);
        }
        
        this.emitEvent('queueUpdated', {
            queueLength: this.generationQueue.length,
            activeCount: this.activeGenerations.size
        });
    }

    /**
     * Process generation queue
     */
    async processQueue() {
        while (this.generationQueue.length > 0 && 
               this.activeGenerations.size < this.maxConcurrentGenerations) {
            
            const request = this.generationQueue.shift();
            this.activeGenerations.set(request.id, request);
            
            // Start generation
            this.executeGeneration(request);
        }
    }

    /**
     * Execute actual music generation
     */
    async executeGeneration(request) {
        try {
            request.status = 'processing';
            request.callbacks.onProgress?.(0, 'Connecting to generation service...');

            // Step 1: Submit generation request to n8n (synchronous response)
            request.callbacks.onProgress?.(20, 'Submitting generation request...');
            const result = await this.submitGenerationJob(request.params);

            // n8n returns complete result with audio_url, image_url, extended_audio_url
            request.callbacks.onProgress?.(90, 'Processing results...');

            // Step 2: Process result directly from n8n
            const processedTrack = await this.processGenerationResult(result, request.params);

            request.status = 'completed';
            request.callbacks.onProgress?.(100, 'Generation complete!');
            request.callbacks.onComplete?.(processedTrack);

        } catch (error) {
            request.status = 'failed';
            request.callbacks.onError?.(error);
        } finally {
            this.activeGenerations.delete(request.id);
            this.processQueue(); // Process next in queue
        }
    }

    /**
     * Submit generation job to n8n webhook
     */
    async submitGenerationJob(params) {
        const requestData = {
            prompt: params.prompt,
            artworkPrompt: `${params.genre} music artwork, ${params.mood} mood, ${params.style || 'modern'} style`,
            genre: params.genre,
            duration: params.duration,
            quality: params.quality || 'high'
        };

        console.log('🚀 Sending request to n8n:', requestData);
        console.log('📡 Endpoint:', this.apiBaseUrl);

        try {
            const response = await fetch(this.apiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            console.log('📥 Response status:', response.status);
            console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                throw new Error(`n8n Webhook Error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Success response:', result);
            return result;

        } catch (error) {
            console.error('❌ Fetch failed:', error);
            
            // Check if it's a network/CORS error
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Connection failed: Please check if n8n is running and CORS is configured');
            }
            
            throw error;
        }
    }


    /**
     * Process generation result and create track object
     */
    async processGenerationResult(result, params) {
        console.log('✅ Generation completed:', result);
        console.log('Audio:', result.audio_url);
        console.log('Image:', result.image_url);
        console.log('Extended Audio:', result.extended_audio_url);

        const track = {
            id: this.generateId(),
            title: this.generateTrackTitle(params),
            prompt: params.prompt,
            genre: params.genre || 'Electronic',
            mood: params.mood || 'Neutral',
            duration: params.duration,
            instrumental: params.instrumental,
            audioURL: result.audio_url,
            imageURL: result.image_url,
            extendedAudioURL: result.extended_audio_url,
            artworkPrompt: result.artworkPrompt,
            metadata: {
                quality: params.quality,
                generatedAt: new Date().toISOString(),
                source: 'n8n-piapi'
            },
            createdAt: new Date().toISOString(),
            status: 'ready'
        };

        // Download and cache audio file
        await this.cacheAudioFile(track);

        return track;
    }

    /**
     * Cache audio file for faster playback
     */
    async cacheAudioFile(track) {
        try {
            // Create blob URL for local caching
            const response = await fetch(track.audioURL);
            const blob = await response.blob();
            track.localURL = URL.createObjectURL(blob);
            track.cached = true;
        } catch (error) {
            console.warn('Failed to cache audio file:', error);
            track.cached = false;
        }
    }

    /**
     * Generate smart track titles
     */
    generateTrackTitle(params) {
        const adjectives = ['Epic', 'Dreamy', 'Powerful', 'Smooth', 'Wild', 'Cosmic', 'Deep', 'Bright'];
        const nouns = ['Journey', 'Vibes', 'Dreams', 'Pulse', 'Flow', 'Waves', 'Storm', 'Light'];
        
        if (params.genre) {
            return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${params.genre} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
        }
        
        return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
    }

    /**
     * Cancel generation
     */
    async cancelGeneration(generationId) {
        const request = this.activeGenerations.get(generationId);
        if (!request) return false;

        try {
            // Note: n8n webhooks can't be cancelled mid-execution
            // But we can remove from our local queue/tracking
            
            // Remove from active generations
            this.activeGenerations.delete(generationId);
            
            // Continue processing queue
            this.processQueue();
            
            console.log('🚫 Generation cancelled locally:', generationId);
            return true;
        } catch (error) {
            console.error('Failed to cancel generation:', error);
            return false;
        }
    }

    /**
     * Get queue status
     */
    getQueueStatus() {
        return {
            queued: this.generationQueue.length,
            active: this.activeGenerations.size,
            total: this.generationQueue.length + this.activeGenerations.size,
            maxConcurrent: this.maxConcurrentGenerations
        };
    }

    /**
     * Start automatic queue processor
     */
    startQueueProcessor() {
        // Process queue every 10 seconds
        setInterval(() => {
            this.processQueue();
        }, 10000);
    }

    /**
     * Event system for UI updates
     */
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emitEvent(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    }

    /**
     * Test n8n connection
     */
    async testConnection() {
        console.log('🔍 Testing n8n connection...');
        
        try {
            // Simple ping test
            const response = await fetch(this.apiBaseUrl, {
                method: 'OPTIONS' // CORS preflight
            });
            
            console.log('OPTIONS response:', response.status);
            
            // Try a simple POST
            const testResponse = await fetch(this.apiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    test: true,
                    prompt: 'Test connection'
                })
            });
            
            console.log('Test POST response:', testResponse.status);
            return true;
            
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            return false;
        }
    }

    /**
     * Utility: Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Get API usage statistics
     */
    async getUsageStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/usage`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return response.json();
        } catch (error) {
            console.error('Failed to fetch usage stats:', error);
            return null;
        }
    }

    /**
     * Validate generation parameters
     */
    validateParams(params) {
        const errors = [];

        if (!params.prompt || params.prompt.trim().length < 10) {
            errors.push('Prompt must be at least 10 characters long');
        }

        if (params.duration < 10 || params.duration > 300) {
            errors.push('Duration must be between 10 and 300 seconds');
        }

        if (params.prompt.length > 500) {
            errors.push('Prompt must be less than 500 characters');
        }

        return errors;
    }
}

// Export for use in main app
window.MusicGenerationService = MusicGenerationService;