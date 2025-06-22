// Advanced Music Generation System with Extended Features
class AdvancedMusicGeneration {
    constructor() {
        this.isInitialized = false;
        this.generationQueue = [];
        this.activeGenerations = new Map();
        
        // Extended genre catalog with sub-genres and moods
        this.genreCatalog = {
            electronic: {
                name: 'Electronic',
                icon: '🎛️',
                subGenres: {
                    'house': { name: 'House', bpm: [120, 130], mood: 'energetic' },
                    'techno': { name: 'Techno', bpm: [125, 135], mood: 'hypnotic' },
                    'dubstep': { name: 'Dubstep', bpm: [140, 150], mood: 'heavy' },
                    'ambient': { name: 'Ambient', bpm: [60, 90], mood: 'atmospheric' },
                    'drum_and_bass': { name: 'Drum & Bass', bpm: [160, 180], mood: 'intense' },
                    'trance': { name: 'Trance', bpm: [130, 140], mood: 'euphoric' },
                    'synthwave': { name: 'Synthwave', bpm: [100, 120], mood: 'nostalgic' },
                    'future_bass': { name: 'Future Bass', bpm: [140, 160], mood: 'melodic' }
                }
            },
            rock: {
                name: 'Rock',
                icon: '🎸',
                subGenres: {
                    'classic_rock': { name: 'Classic Rock', bpm: [110, 140], mood: 'powerful' },
                    'indie_rock': { name: 'Indie Rock', bpm: [120, 140], mood: 'alternative' },
                    'metal': { name: 'Metal', bpm: [140, 200], mood: 'aggressive' },
                    'punk': { name: 'Punk', bpm: [150, 180], mood: 'rebellious' },
                    'progressive': { name: 'Progressive', bpm: [100, 150], mood: 'complex' },
                    'grunge': { name: 'Grunge', bpm: [100, 130], mood: 'raw' },
                    'psychedelic': { name: 'Psychedelic', bpm: [90, 130], mood: 'trippy' },
                    'alternative': { name: 'Alternative', bpm: [100, 140], mood: 'experimental' }
                }
            },
            hiphop: {
                name: 'Hip Hop',
                icon: '🎤',
                subGenres: {
                    'boom_bap': { name: 'Boom Bap', bpm: [85, 95], mood: 'classic' },
                    'trap': { name: 'Trap', bpm: [130, 170], mood: 'modern' },
                    'lofi_hip_hop': { name: 'Lo-Fi Hip Hop', bpm: [70, 90], mood: 'chill' },
                    'drill': { name: 'Drill', bpm: [140, 145], mood: 'dark' },
                    'jazz_hop': { name: 'Jazz Hop', bpm: [80, 100], mood: 'smooth' },
                    'experimental_hip_hop': { name: 'Experimental', bpm: [60, 140], mood: 'avant-garde' },
                    'cloud_rap': { name: 'Cloud Rap', bpm: [120, 140], mood: 'ethereal' },
                    'west_coast': { name: 'West Coast', bpm: [90, 100], mood: 'laid-back' }
                }
            },
            jazz: {
                name: 'Jazz',
                icon: '🎷',
                subGenres: {
                    'bebop': { name: 'Bebop', bpm: [120, 280], mood: 'virtuosic' },
                    'smooth_jazz': { name: 'Smooth Jazz', bpm: [90, 120], mood: 'relaxed' },
                    'fusion': { name: 'Fusion', bpm: [120, 160], mood: 'energetic' },
                    'swing': { name: 'Swing', bpm: [120, 180], mood: 'danceable' },
                    'latin_jazz': { name: 'Latin Jazz', bpm: [100, 180], mood: 'rhythmic' },
                    'free_jazz': { name: 'Free Jazz', bpm: [60, 200], mood: 'experimental' },
                    'cool_jazz': { name: 'Cool Jazz', bpm: [100, 140], mood: 'sophisticated' },
                    'modal_jazz': { name: 'Modal Jazz', bpm: [80, 140], mood: 'exploratory' }
                }
            },
            classical: {
                name: 'Classical',
                icon: '🎼',
                subGenres: {
                    'baroque': { name: 'Baroque', bpm: [60, 120], mood: 'ornate' },
                    'romantic': { name: 'Romantic', bpm: [60, 140], mood: 'emotional' },
                    'modern': { name: 'Modern', bpm: [40, 180], mood: 'innovative' },
                    'minimalist': { name: 'Minimalist', bpm: [60, 120], mood: 'meditative' },
                    'orchestral': { name: 'Orchestral', bpm: [60, 180], mood: 'grand' },
                    'chamber': { name: 'Chamber', bpm: [60, 140], mood: 'intimate' },
                    'symphony': { name: 'Symphony', bpm: [60, 160], mood: 'epic' },
                    'concerto': { name: 'Concerto', bpm: [80, 160], mood: 'virtuosic' }
                }
            },
            world: {
                name: 'World',
                icon: '🌍',
                subGenres: {
                    'afrobeat': { name: 'Afrobeat', bpm: [100, 120], mood: 'groovy' },
                    'reggae': { name: 'Reggae', bpm: [60, 90], mood: 'relaxed' },
                    'latin': { name: 'Latin', bpm: [90, 180], mood: 'passionate' },
                    'celtic': { name: 'Celtic', bpm: [80, 160], mood: 'spirited' },
                    'indian_classical': { name: 'Indian Classical', bpm: [60, 180], mood: 'spiritual' },
                    'middle_eastern': { name: 'Middle Eastern', bpm: [100, 140], mood: 'mystical' },
                    'flamenco': { name: 'Flamenco', bpm: [100, 180], mood: 'intense' },
                    'bossa_nova': { name: 'Bossa Nova', bpm: [110, 130], mood: 'smooth' }
                }
            },
            pop: {
                name: 'Pop',
                icon: '🎵',
                subGenres: {
                    'synth_pop': { name: 'Synth Pop', bpm: [110, 130], mood: 'catchy' },
                    'indie_pop': { name: 'Indie Pop', bpm: [100, 140], mood: 'quirky' },
                    'dance_pop': { name: 'Dance Pop', bpm: [120, 130], mood: 'upbeat' },
                    'art_pop': { name: 'Art Pop', bpm: [80, 140], mood: 'experimental' },
                    'k_pop': { name: 'K-Pop', bpm: [120, 140], mood: 'energetic' },
                    'electropop': { name: 'Electropop', bpm: [120, 140], mood: 'electronic' },
                    'dream_pop': { name: 'Dream Pop', bpm: [80, 120], mood: 'ethereal' },
                    'bubblegum_pop': { name: 'Bubblegum Pop', bpm: [120, 140], mood: 'playful' }
                }
            },
            folk: {
                name: 'Folk',
                icon: '🪕',
                subGenres: {
                    'traditional': { name: 'Traditional', bpm: [80, 120], mood: 'authentic' },
                    'indie_folk': { name: 'Indie Folk', bpm: [90, 130], mood: 'intimate' },
                    'folk_rock': { name: 'Folk Rock', bpm: [100, 140], mood: 'energetic' },
                    'bluegrass': { name: 'Bluegrass', bpm: [120, 180], mood: 'lively' },
                    'country': { name: 'Country', bpm: [80, 120], mood: 'storytelling' },
                    'acoustic': { name: 'Acoustic', bpm: [60, 120], mood: 'organic' },
                    'americana': { name: 'Americana', bpm: [80, 140], mood: 'rootsy' },
                    'singer_songwriter': { name: 'Singer-Songwriter', bpm: [60, 120], mood: 'personal' }
                }
            }
        };
        
        // Style modifiers for advanced customization
        this.styleModifiers = {
            energy: ['calm', 'relaxed', 'moderate', 'energetic', 'intense'],
            complexity: ['simple', 'standard', 'complex', 'intricate', 'virtuosic'],
            mood: ['dark', 'melancholic', 'neutral', 'uplifting', 'euphoric'],
            era: ['vintage', 'classic', 'modern', 'futuristic', 'timeless'],
            instrumentation: ['minimal', 'acoustic', 'electronic', 'orchestral', 'hybrid']
        };
        
        // Lyrics generation templates
        this.lyricsTemplates = {
            verse: {
                lines: 4,
                structure: 'AABB',
                syllables: [8, 8, 8, 8]
            },
            chorus: {
                lines: 4,
                structure: 'ABAB',
                syllables: [6, 6, 6, 6]
            },
            bridge: {
                lines: 2,
                structure: 'AA',
                syllables: [10, 10]
            }
        };
        
        // Remix and extension capabilities
        this.remixModes = {
            tempo: { min: 0.5, max: 2.0, default: 1.0 },
            pitch: { min: -12, max: 12, default: 0 },
            style: ['acoustic', 'electronic', 'orchestral', 'minimal', 'maximal'],
            structure: ['extended', 'radio_edit', 'club_mix', 'ambient_version', 'instrumental']
        };
        
        this.init();
    }
    
    async init() {
        try {
            // Initialize PiAPI connection
            this.piApiKey = await this.loadApiKey();
            this.piApiEndpoint = 'https://api.piapi.ai/api/v1/task';
            
            // Set up real-time progress tracking
            this.setupProgressTracking();
            
            // Initialize generation history
            this.generationHistory = this.loadGenerationHistory();
            
            this.isInitialized = true;
            console.log('Advanced Music Generation initialized');
        } catch (error) {
            console.error('Failed to initialize Advanced Music Generation:', error);
        }
    }
    
    async loadApiKey() {
        // In production, this would fetch from secure storage
        return localStorage.getItem('piapi_key') || 'demo_key';
    }
    
    loadGenerationHistory() {
        const saved = localStorage.getItem('musicgen_generation_history');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveGenerationHistory() {
        localStorage.setItem('musicgen_generation_history', JSON.stringify(this.generationHistory));
    }
    
    // Enhanced generation with all parameters
    async generateMusic(params) {
        const generation = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            status: 'initializing',
            progress: 0,
            params: this.normalizeParams(params),
            result: null,
            error: null
        };
        
        this.activeGenerations.set(generation.id, generation);
        this.emit('generationStarted', generation);
        
        try {
            // Validate parameters
            this.validateParams(generation.params);
            
            // Build generation prompt
            const prompt = this.buildGenerationPrompt(generation.params);
            
            // Submit to PiAPI
            const taskId = await this.submitGeneration(prompt, generation.params);
            generation.taskId = taskId;
            generation.status = 'processing';
            
            // Track progress
            const result = await this.trackGenerationProgress(taskId, generation.id);
            
            // Process result
            generation.result = result;
            generation.status = 'completed';
            generation.progress = 100;
            
            // Save to history
            this.generationHistory.unshift(generation);
            this.saveGenerationHistory();
            
            this.emit('generationCompleted', generation);
            return generation;
            
        } catch (error) {
            generation.status = 'failed';
            generation.error = error.message;
            this.emit('generationFailed', generation);
            throw error;
        } finally {
            this.activeGenerations.delete(generation.id);
        }
    }
    
    normalizeParams(params) {
        return {
            genre: params.genre || 'electronic',
            subGenre: params.subGenre || null,
            mood: params.mood || 'neutral',
            energy: params.energy || 'moderate',
            complexity: params.complexity || 'standard',
            duration: params.duration || 30,
            tempo: params.tempo || null,
            key: params.key || null,
            timeSignature: params.timeSignature || '4/4',
            instruments: params.instruments || [],
            lyrics: params.lyrics || null,
            lyricsTheme: params.lyricsTheme || null,
            lyricsStyle: params.lyricsStyle || null,
            reference: params.reference || null,
            customPrompt: params.customPrompt || ''
        };
    }
    
    validateParams(params) {
        if (params.duration < 5 || params.duration > 300) {
            throw new Error('Duration must be between 5 and 300 seconds');
        }
        
        if (params.tempo && (params.tempo < 40 || params.tempo > 300)) {
            throw new Error('Tempo must be between 40 and 300 BPM');
        }
        
        if (params.lyrics && params.lyrics.length > 1000) {
            throw new Error('Lyrics must be under 1000 characters');
        }
    }
    
    buildGenerationPrompt(params) {
        let prompt = [];
        
        // Genre and style
        if (params.subGenre) {
            const genre = this.genreCatalog[params.genre];
            const subGenre = genre.subGenres[params.subGenre];
            prompt.push(`${subGenre.name} style`);
        } else {
            prompt.push(`${params.genre} music`);
        }
        
        // Mood and energy
        prompt.push(`${params.mood} mood`);
        prompt.push(`${params.energy} energy`);
        
        // Musical parameters
        if (params.tempo) {
            prompt.push(`${params.tempo} BPM`);
        }
        
        if (params.key) {
            prompt.push(`in ${params.key}`);
        }
        
        if (params.timeSignature !== '4/4') {
            prompt.push(`${params.timeSignature} time signature`);
        }
        
        // Instruments
        if (params.instruments.length > 0) {
            prompt.push(`featuring ${params.instruments.join(', ')}`);
        }
        
        // Lyrics
        if (params.lyrics) {
            prompt.push(`with lyrics: "${params.lyrics}"`);
        } else if (params.lyricsTheme) {
            prompt.push(`with ${params.lyricsStyle || 'modern'} lyrics about ${params.lyricsTheme}`);
        }
        
        // Custom additions
        if (params.customPrompt) {
            prompt.push(params.customPrompt);
        }
        
        return prompt.join(', ');
    }
    
    async submitGeneration(prompt, params) {
        const response = await fetch(this.piApiEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.piApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'music-u',
                task_type: 'music_generation',
                input: {
                    prompt: prompt,
                    duration: params.duration,
                    instrumental: !params.lyrics && !params.lyricsTheme
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`Generation failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.task_id;
    }
    
    async trackGenerationProgress(taskId, generationId) {
        const generation = this.activeGenerations.get(generationId);
        
        while (generation && generation.status === 'processing') {
            const status = await this.checkTaskStatus(taskId);
            
            if (status.status === 'completed') {
                return status.result;
            } else if (status.status === 'failed') {
                throw new Error(status.error || 'Generation failed');
            } else {
                // Update progress
                generation.progress = status.progress || 0;
                this.emit('generationProgress', {
                    generationId,
                    progress: generation.progress,
                    status: status.status
                });
            }
            
            // Wait before next check
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    async checkTaskStatus(taskId) {
        const response = await fetch(`${this.piApiEndpoint}/${taskId}`, {
            headers: {
                'Authorization': `Bearer ${this.piApiKey}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Status check failed: ${response.statusText}`);
        }
        
        return response.json();
    }
    
    // Lyrics generation
    async generateLyrics(params) {
        const prompt = this.buildLyricsPrompt(params);
        
        try {
            const response = await fetch(this.piApiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.piApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'lyrics-ai',
                    task_type: 'lyrics_generation',
                    input: {
                        prompt: prompt,
                        style: params.style,
                        structure: params.structure || 'verse-chorus-verse-chorus-bridge-chorus',
                        language: params.language || 'english'
                    }
                })
            });
            
            const data = await response.json();
            return this.formatLyrics(data.result);
        } catch (error) {
            console.error('Lyrics generation failed:', error);
            throw error;
        }
    }
    
    buildLyricsPrompt(params) {
        let prompt = [`Write ${params.style || 'modern'} song lyrics`];
        
        if (params.theme) {
            prompt.push(`about ${params.theme}`);
        }
        
        if (params.mood) {
            prompt.push(`with a ${params.mood} mood`);
        }
        
        if (params.genre) {
            prompt.push(`for ${params.genre} music`);
        }
        
        if (params.keywords) {
            prompt.push(`incorporating: ${params.keywords.join(', ')}`);
        }
        
        return prompt.join(' ');
    }
    
    formatLyrics(rawLyrics) {
        // Parse and format lyrics into structured sections
        const sections = rawLyrics.split(/\n\n+/);
        const formatted = {
            title: '',
            sections: [],
            fullText: rawLyrics
        };
        
        sections.forEach(section => {
            const lines = section.trim().split('\n');
            if (lines.length > 0) {
                const sectionType = this.detectSectionType(lines[0]);
                formatted.sections.push({
                    type: sectionType,
                    lines: lines
                });
            }
        });
        
        return formatted;
    }
    
    detectSectionType(firstLine) {
        const line = firstLine.toLowerCase();
        if (line.includes('[verse') || line.includes('verse')) return 'verse';
        if (line.includes('[chorus') || line.includes('chorus')) return 'chorus';
        if (line.includes('[bridge') || line.includes('bridge')) return 'bridge';
        if (line.includes('[outro') || line.includes('outro')) return 'outro';
        if (line.includes('[intro') || line.includes('intro')) return 'intro';
        return 'verse';
    }
    
    // Remix functionality
    async remixTrack(originalTrackId, remixParams) {
        const original = await this.getTrackDetails(originalTrackId);
        
        const remixRequest = {
            id: this.generateId(),
            originalId: originalTrackId,
            timestamp: new Date().toISOString(),
            params: remixParams,
            status: 'processing'
        };
        
        this.emit('remixStarted', remixRequest);
        
        try {
            const remixPrompt = this.buildRemixPrompt(original, remixParams);
            const taskId = await this.submitRemix(original.url, remixPrompt, remixParams);
            
            const result = await this.trackGenerationProgress(taskId, remixRequest.id);
            
            remixRequest.status = 'completed';
            remixRequest.result = result;
            
            this.emit('remixCompleted', remixRequest);
            return remixRequest;
            
        } catch (error) {
            remixRequest.status = 'failed';
            remixRequest.error = error.message;
            this.emit('remixFailed', remixRequest);
            throw error;
        }
    }
    
    buildRemixPrompt(original, params) {
        let prompt = [`Remix this ${original.genre} track`];
        
        if (params.style) {
            prompt.push(`in ${params.style} style`);
        }
        
        if (params.tempo !== 1.0) {
            prompt.push(`at ${Math.round(params.tempo * 100)}% tempo`);
        }
        
        if (params.pitch !== 0) {
            prompt.push(`pitched ${params.pitch > 0 ? 'up' : 'down'} ${Math.abs(params.pitch)} semitones`);
        }
        
        if (params.structure) {
            prompt.push(`as ${params.structure}`);
        }
        
        return prompt.join(' ');
    }
    
    async submitRemix(originalUrl, prompt, params) {
        const response = await fetch(this.piApiEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.piApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'music-remix',
                task_type: 'audio_remix',
                input: {
                    audio_url: originalUrl,
                    prompt: prompt,
                    tempo_factor: params.tempo || 1.0,
                    pitch_shift: params.pitch || 0
                }
            })
        });
        
        const data = await response.json();
        return data.task_id;
    }
    
    // Track extension
    async extendTrack(trackId, extensionParams) {
        const track = await this.getTrackDetails(trackId);
        
        const extensionRequest = {
            id: this.generateId(),
            trackId: trackId,
            timestamp: new Date().toISOString(),
            params: extensionParams,
            status: 'processing'
        };
        
        try {
            const prompt = this.buildExtensionPrompt(track, extensionParams);
            const taskId = await this.submitExtension(track.url, prompt, extensionParams);
            
            const result = await this.trackGenerationProgress(taskId, extensionRequest.id);
            
            extensionRequest.status = 'completed';
            extensionRequest.result = result;
            
            return extensionRequest;
            
        } catch (error) {
            extensionRequest.status = 'failed';
            extensionRequest.error = error.message;
            throw error;
        }
    }
    
    buildExtensionPrompt(track, params) {
        let prompt = [`Extend this ${track.genre} track`];
        
        if (params.duration) {
            prompt.push(`by ${params.duration} seconds`);
        }
        
        if (params.section) {
            prompt.push(`with a new ${params.section}`);
        }
        
        if (params.variation) {
            prompt.push(`creating a ${params.variation} variation`);
        }
        
        return prompt.join(' ');
    }
    
    async submitExtension(trackUrl, prompt, params) {
        const response = await fetch(this.piApiEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.piApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'music-extend',
                task_type: 'audio_extension',
                input: {
                    audio_url: trackUrl,
                    prompt: prompt,
                    extension_duration: params.duration || 30,
                    seamless: true
                }
            })
        });
        
        const data = await response.json();
        return data.task_id;
    }
    
    // Smart recommendations
    async getGenerationRecommendations(userHistory) {
        const analysis = this.analyzeUserPreferences(userHistory);
        
        return {
            genres: this.recommendGenres(analysis),
            moods: this.recommendMoods(analysis),
            styles: this.recommendStyles(analysis),
            collaborations: this.suggestCollaborations(analysis)
        };
    }
    
    analyzeUserPreferences(history) {
        const preferences = {
            genres: {},
            moods: {},
            tempos: [],
            energy: [],
            complexity: []
        };
        
        history.forEach(generation => {
            // Count genres
            preferences.genres[generation.params.genre] = 
                (preferences.genres[generation.params.genre] || 0) + 1;
            
            // Count moods
            preferences.moods[generation.params.mood] = 
                (preferences.moods[generation.params.mood] || 0) + 1;
            
            // Collect numeric values
            if (generation.params.tempo) {
                preferences.tempos.push(generation.params.tempo);
            }
            preferences.energy.push(generation.params.energy);
            preferences.complexity.push(generation.params.complexity);
        });
        
        return preferences;
    }
    
    recommendGenres(analysis) {
        const topGenres = Object.entries(analysis.genres)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([genre]) => genre);
        
        // Find complementary genres
        const recommendations = [];
        topGenres.forEach(genre => {
            const related = this.getRelatedGenres(genre);
            recommendations.push(...related);
        });
        
        return [...new Set(recommendations)].slice(0, 5);
    }
    
    getRelatedGenres(genre) {
        const relations = {
            electronic: ['synthwave', 'ambient', 'techno'],
            rock: ['indie_rock', 'alternative', 'metal'],
            hiphop: ['trap', 'lofi_hip_hop', 'jazz_hop'],
            jazz: ['fusion', 'smooth_jazz', 'bebop'],
            classical: ['modern', 'minimalist', 'romantic'],
            pop: ['indie_pop', 'synth_pop', 'dance_pop']
        };
        
        return relations[genre] || [];
    }
    
    recommendMoods(analysis) {
        // Suggest moods that complement user's typical choices
        const userMoods = Object.keys(analysis.moods);
        const moodSpectrum = ['dark', 'melancholic', 'neutral', 'uplifting', 'euphoric'];
        
        return moodSpectrum.filter(mood => !userMoods.includes(mood)).slice(0, 3);
    }
    
    recommendStyles(analysis) {
        const avgTempo = analysis.tempos.reduce((a, b) => a + b, 0) / analysis.tempos.length;
        const styles = [];
        
        if (avgTempo < 100) {
            styles.push('ambient', 'downtempo', 'chill');
        } else if (avgTempo > 140) {
            styles.push('energetic', 'dance', 'uptempo');
        } else {
            styles.push('groovy', 'melodic', 'rhythmic');
        }
        
        return styles;
    }
    
    suggestCollaborations(analysis) {
        // Suggest genre combinations based on user history
        const topGenres = Object.keys(analysis.genres).slice(0, 2);
        
        return {
            fusion: `${topGenres[0]}-${topGenres[1]} fusion`,
            crossover: `${topGenres[0]} with ${topGenres[1]} elements`,
            experimental: `experimental ${topGenres[0]}`
        };
    }
    
    // Progress tracking setup
    setupProgressTracking() {
        // WebSocket connection for real-time updates
        if ('WebSocket' in window) {
            try {
                this.progressSocket = new WebSocket('wss://api.piapi.ai/ws/progress');
                
                this.progressSocket.onmessage = (event) => {
                    const update = JSON.parse(event.data);
                    this.handleProgressUpdate(update);
                };
                
                this.progressSocket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                };
            } catch (error) {
                console.log('WebSocket not available, using polling');
            }
        }
    }
    
    handleProgressUpdate(update) {
        const generation = this.activeGenerations.get(update.generationId);
        if (generation) {
            generation.progress = update.progress;
            generation.status = update.status;
            
            this.emit('generationProgress', {
                generationId: update.generationId,
                progress: update.progress,
                status: update.status,
                eta: update.eta
            });
        }
    }
    
    // Utility methods
    async getTrackDetails(trackId) {
        // Fetch track details from storage or API
        const history = this.generationHistory.find(g => g.id === trackId);
        if (history) {
            return {
                id: history.id,
                genre: history.params.genre,
                url: history.result.url,
                duration: history.params.duration,
                metadata: history.result.metadata
            };
        }
        throw new Error('Track not found');
    }
    
    generateId() {
        return 'gen_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Event system
    on(event, callback) {
        if (!this.callbacks) this.callbacks = {};
        if (!this.callbacks[event]) this.callbacks[event] = [];
        this.callbacks[event].push(callback);
    }
    
    off(event, callback) {
        if (this.callbacks && this.callbacks[event]) {
            this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
        }
    }
    
    emit(event, data) {
        if (this.callbacks && this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    }
    
    // Public API
    getGenreCatalog() {
        return this.genreCatalog;
    }
    
    getStyleModifiers() {
        return this.styleModifiers;
    }
    
    getGenerationHistory() {
        return this.generationHistory;
    }
    
    getActiveGenerations() {
        return Array.from(this.activeGenerations.values());
    }
    
    cancelGeneration(generationId) {
        const generation = this.activeGenerations.get(generationId);
        if (generation) {
            generation.status = 'cancelled';
            this.activeGenerations.delete(generationId);
            this.emit('generationCancelled', generation);
            return true;
        }
        return false;
    }
}

export { AdvancedMusicGeneration };