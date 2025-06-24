// Enhanced Music Generator with more styles and better progress tracking
import { piapi } from './piapi-client.js';
import { authManager } from './firebase-config-safe.js';

class MusicGenerator {
    constructor() {
        this.isGenerating = false;
        this.currentTaskId = null;
        this.progressInterval = null;
        
        // Extended music styles and genres
        this.musicStyles = {
            // Main Genres
            'pop': { model: 'music-u', tags: ['catchy', 'mainstream', 'radio-friendly'] },
            'rock': { model: 'music-u', tags: ['guitar', 'drums', 'powerful'] },
            'hip hop': { model: 'music-u', tags: ['beats', 'rap', 'urban'] },
            'jazz': { model: 'music-u', tags: ['improvisation', 'swing', 'smooth'] },
            'electronic': { model: 'music-u', tags: ['synth', 'digital', 'dance'] },
            'classical': { model: 'music-u', tags: ['orchestral', 'symphony', 'elegant'] },
            'r&b': { model: 'music-u', tags: ['soul', 'groove', 'smooth'] },
            'country': { model: 'music-u', tags: ['acoustic', 'storytelling', 'americana'] },
            'reggae': { model: 'music-u', tags: ['caribbean', 'laid-back', 'rhythm'] },
            'blues': { model: 'music-u', tags: ['emotional', 'guitar', 'soulful'] },
            'folk': { model: 'music-u', tags: ['acoustic', 'storytelling', 'traditional'] },
            'metal': { model: 'music-u', tags: ['heavy', 'aggressive', 'distorted'] },
            'indie': { model: 'music-u', tags: ['alternative', 'creative', 'unique'] },
            'funk': { model: 'music-u', tags: ['groovy', 'bass', 'rhythmic'] },
            'latin': { model: 'music-u', tags: ['spanish', 'rhythmic', 'passionate'] },
            'world': { model: 'music-u', tags: ['ethnic', 'cultural', 'diverse'] },
            
            // Sub-genres and Moods
            'lo-fi': { model: 'music-u', tags: ['chill', 'relaxed', 'nostalgic'] },
            'trap': { model: 'music-u', tags: ['808', 'hi-hats', 'modern hip hop'] },
            'edm': { model: 'music-u', tags: ['dance', 'festival', 'energetic'] },
            'ambient': { model: 'music-u', tags: ['atmospheric', 'calm', 'meditative'] },
            'synthwave': { model: 'music-u', tags: ['80s', 'retro', 'neon'] },
            'dubstep': { model: 'music-u', tags: ['bass', 'wobble', 'electronic'] },
            'house': { model: 'music-u', tags: ['4/4', 'dance', 'club'] },
            'techno': { model: 'music-u', tags: ['repetitive', 'electronic', 'dance'] },
            'disco': { model: 'music-u', tags: ['70s', 'dance', 'groovy'] },
            'gospel': { model: 'music-u', tags: ['spiritual', 'choir', 'uplifting'] },
            'soul': { model: 'music-u', tags: ['emotional', 'powerful', 'vocals'] },
            'punk': { model: 'music-u', tags: ['rebellious', 'fast', 'raw'] },
            'ska': { model: 'music-u', tags: ['upbeat', 'brass', 'jamaican'] },
            'grunge': { model: 'music-u', tags: ['90s', 'alternative', 'distorted'] },
            'psychedelic': { model: 'music-u', tags: ['trippy', 'experimental', 'spacey'] },
            'chillout': { model: 'music-u', tags: ['relaxing', 'downtempo', 'peaceful'] },
            'orchestral': { model: 'music-u', tags: ['cinematic', 'epic', 'grand'] },
            'acoustic': { model: 'music-u', tags: ['unplugged', 'intimate', 'organic'] }
        };
        
        // Mood descriptors
        this.moods = [
            'happy', 'sad', 'energetic', 'calm', 'aggressive', 'peaceful',
            'nostalgic', 'romantic', 'mysterious', 'uplifting', 'dark', 'dreamy',
            'intense', 'relaxing', 'melancholic', 'euphoric', 'anxious', 'hopeful',
            'playful', 'serious', 'ethereal', 'gritty', 'smooth', 'raw'
        ];
    }
    
    // Generate music with enhanced progress tracking
    async generateMusic(params) {
        if (this.isGenerating) {
            return { success: false, error: 'Generation already in progress' };
        }
        
        // Check credits
        const creditCost = authManager.getCreditCost('generate');
        if (!authManager.canAfford(creditCost)) {
            return { 
                success: false, 
                error: 'Insufficient credits. Please upgrade your plan.',
                creditsNeeded: creditCost
            };
        }
        
        try {
            this.isGenerating = true;
            
            // Start progress tracking
            this.startProgressTracking();
            
            // Enhance prompt with style tags
            const enhancedParams = this.enhancePrompt(params);
            
            // Use credits
            const creditResult = await authManager.useCredits(creditCost, 'Music generation');
            if (!creditResult.success) {
                this.stopProgressTracking();
                return creditResult;
            }
            
            // Generate music
            const result = await piapi.createMusic(enhancedParams);
            
            if (result.success && result.taskId) {
                this.currentTaskId = result.taskId;
                
                // Update progress to polling phase
                this.updateProgress(30, 'Processing your music...');
                
                // Poll for completion with progress updates
                const finalResult = await this.pollWithProgress(result.taskId);
                
                this.stopProgressTracking();
                return {
                    success: true,
                    result: finalResult,
                    creditsUsed: creditCost,
                    creditsRemaining: creditResult.remainingCredits
                };
            } else {
                this.stopProgressTracking();
                return { success: false, error: result.error || 'Generation failed' };
            }
        } catch (error) {
            console.error('Music generation error:', error);
            this.stopProgressTracking();
            return { success: false, error: error.message };
        } finally {
            this.isGenerating = false;
            this.currentTaskId = null;
        }
    }
    
    // Enhance prompt with style-specific tags
    enhancePrompt(params) {
        const enhanced = { ...params };
        
        // Extract styles from prompt or tags
        const styles = params.tags || [];
        const prompt = params.prompt || params.gpt_description_prompt || '';
        
        // Find matching styles
        const matchedStyles = [];
        for (const [style, config] of Object.entries(this.musicStyles)) {
            if (styles.includes(style) || prompt.toLowerCase().includes(style)) {
                matchedStyles.push(config.tags);
            }
        }
        
        // Add style tags to prompt
        if (matchedStyles.length > 0) {
            const styleTags = matchedStyles.flat().join(', ');
            enhanced.gpt_description_prompt = `${prompt} [Style: ${styleTags}]`;
        }
        
        // Use extended model for complex requests
        if (params.custom_mode || params.mv || matchedStyles.length > 2) {
            enhanced.model = 'Qubico/diffrhythm';
        }
        
        return enhanced;
    }
    
    // Poll for completion with progress updates
    async pollWithProgress(taskId) {
        let progress = 30;
        const maxAttempts = 60; // 2 minutes max
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const status = await piapi.getTaskStatus(taskId);
            
            if (status.success) {
                if (status.status === 'completed' && status.output) {
                    this.updateProgress(100, 'Your music is ready!');
                    return status;
                } else if (status.status === 'failed') {
                    throw new Error(status.error || 'Generation failed');
                }
                
                // Update progress based on status
                if (status.status === 'processing') {
                    progress = Math.min(90, progress + 5);
                    this.updateProgress(progress, 'Creating your masterpiece...');
                } else if (status.status === 'queued') {
                    progress = Math.min(40, progress + 2);
                    this.updateProgress(progress, 'Waiting in queue...');
                }
            }
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
        
        throw new Error('Generation timed out. Please try again.');
    }
    
    // Extend an existing track
    async extendTrack(trackId, duration = 30) {
        const creditCost = authManager.getCreditCost('extend');
        if (!authManager.canAfford(creditCost)) {
            return { 
                success: false, 
                error: 'Insufficient credits for extending track.',
                creditsNeeded: creditCost
            };
        }
        
        try {
            this.isGenerating = true;
            this.startProgressTracking();
            
            // Get original track data
            const track = await this.getTrackData(trackId);
            if (!track) {
                throw new Error('Track not found');
            }
            
            // Use credits
            const creditResult = await authManager.useCredits(creditCost, 'Track extension');
            if (!creditResult.success) {
                this.stopProgressTracking();
                return creditResult;
            }
            
            // Create extension params
            const params = {
                prompt: track.prompt || track.title,
                tags: track.tags || track.genre,
                continue_at: track.duration || 30,
                continue_clip_id: track.audio_url,
                make_instrumental: false,
                model: 'music-u'
            };
            
            // Generate extension
            const result = await piapi.createMusic(params);
            
            if (result.success && result.taskId) {
                this.currentTaskId = result.taskId;
                this.updateProgress(30, 'Extending your track...');
                
                const finalResult = await this.pollWithProgress(result.taskId);
                
                this.stopProgressTracking();
                return {
                    success: true,
                    result: finalResult,
                    creditsUsed: creditCost,
                    creditsRemaining: creditResult.remainingCredits
                };
            } else {
                this.stopProgressTracking();
                return { success: false, error: result.error || 'Extension failed' };
            }
        } catch (error) {
            console.error('Track extension error:', error);
            this.stopProgressTracking();
            return { success: false, error: error.message };
        } finally {
            this.isGenerating = false;
            this.currentTaskId = null;
        }
    }
    
    // Remix a track with new style
    async remixTrack(trackId, newStyle, newPrompt) {
        const creditCost = authManager.getCreditCost('remix');
        if (!authManager.canAfford(creditCost)) {
            return { 
                success: false, 
                error: 'Insufficient credits for remixing.',
                creditsNeeded: creditCost
            };
        }
        
        try {
            this.isGenerating = true;
            this.startProgressTracking();
            
            // Get original track data
            const track = await this.getTrackData(trackId);
            if (!track) {
                throw new Error('Track not found');
            }
            
            // Use credits
            const creditResult = await authManager.useCredits(creditCost, 'Track remix');
            if (!creditResult.success) {
                this.stopProgressTracking();
                return creditResult;
            }
            
            // Create remix params
            const params = {
                prompt: newPrompt || `${track.title} ${newStyle} remix`,
                tags: newStyle,
                audio_url: track.audio_url,
                model: 'music-u'
            };
            
            // Enhance with style tags
            const enhancedParams = this.enhancePrompt(params);
            
            // Generate remix
            const result = await piapi.createMusic(enhancedParams);
            
            if (result.success && result.taskId) {
                this.currentTaskId = result.taskId;
                this.updateProgress(30, 'Creating your remix...');
                
                const finalResult = await this.pollWithProgress(result.taskId);
                
                this.stopProgressTracking();
                return {
                    success: true,
                    result: finalResult,
                    creditsUsed: creditCost,
                    creditsRemaining: creditResult.remainingCredits
                };
            } else {
                this.stopProgressTracking();
                return { success: false, error: result.error || 'Remix failed' };
            }
        } catch (error) {
            console.error('Track remix error:', error);
            this.stopProgressTracking();
            return { success: false, error: error.message };
        } finally {
            this.isGenerating = false;
            this.currentTaskId = null;
        }
    }
    
    // Generate music from lyrics
    async generateFromLyrics(lyrics, style, title) {
        const params = {
            prompt: lyrics,
            tags: style || 'auto',
            title: title || 'Lyrical Creation',
            custom_mode: true,
            model: 'music-u'
        };
        
        return await this.generateMusic(params);
    }
    
    // Progress tracking methods
    startProgressTracking() {
        this.updateProgress(0, 'Initializing music generation...');
        
        // Simulate smooth progress
        let progress = 0;
        this.progressInterval = setInterval(() => {
            if (progress < 25) {
                progress += 2;
                this.updateProgress(progress, 'Preparing your request...');
            }
        }, 500);
    }
    
    stopProgressTracking() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }
    
    updateProgress(percentage, message) {
        // Update UI progress
        const progressFill = document.querySelector('.progress-fill');
        const statusElement = document.getElementById('generationStatus');
        const messageElement = document.getElementById('generationMessage');
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (statusElement) {
            statusElement.textContent = message;
        }
        
        if (messageElement && percentage < 100) {
            const timeEstimate = Math.max(30 - Math.floor(percentage / 3), 5);
            messageElement.textContent = `Estimated time remaining: ${timeEstimate} seconds`;
        } else if (messageElement) {
            messageElement.textContent = 'Complete!';
        }
        
        // Dispatch progress event
        window.dispatchEvent(new CustomEvent('generationProgress', {
            detail: { percentage, message, taskId: this.currentTaskId }
        }));
    }
    
    // Get track data from library or Firebase
    async getTrackData(trackId) {
        // First check localStorage
        const library = JSON.parse(localStorage.getItem('musicLibrary') || '[]');
        const localTrack = library.find(t => t.id === trackId);
        if (localTrack) return localTrack;
        
        // Then check Firebase if available
        if (window.isFirebaseConfigured && window.auth?.currentUser) {
            try {
                const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                const trackRef = doc(window.db, 'tracks', trackId);
                const trackDoc = await getDoc(trackRef);
                
                if (trackDoc.exists()) {
                    return { id: trackDoc.id, ...trackDoc.data() };
                }
            } catch (error) {
                console.error('Error fetching track from Firebase:', error);
            }
        }
        
        return null;
    }
    
    // Get available styles
    getAvailableStyles() {
        return Object.keys(this.musicStyles);
    }
    
    // Get style suggestions based on input
    getStyleSuggestions(input) {
        const lowercaseInput = input.toLowerCase();
        return Object.keys(this.musicStyles).filter(style => 
            style.includes(lowercaseInput) || 
            this.musicStyles[style].tags.some(tag => tag.includes(lowercaseInput))
        );
    }
}

// Create global instance
window.musicGenerator = new MusicGenerator();

// Export for module usage
export default MusicGenerator;