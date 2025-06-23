// PiAPI Music Generation System
// Supports: Create, Edit, Remix, Lyrics, Artwork generation

class PiAPIMusic {
    constructor(apiKey) {
        this.apiKey = apiKey || 'd3a513bec58ea7c7e60eebf377fbbfb806f2304f12e1ef208cd701139658c088';
        this.baseURL = 'https://api.piapi.ai';
        this.models = {
            suno: 'suno-v3.5',
            music: 'music-u',
            lyrics: 'lyrics-ai',
            diffrhythm: 'Qubico/diffrhythm',
            aceStep: 'ace-step'
        };
    }

    // Create music generation task
    async createMusic(params) {
        const {
            prompt,
            lyrics,
            style,
            duration = 60,
            instrumental = false,
            model = 'suno-v3.5'
        } = params;

        const payload = {
            model: model,
            task_type: 'text_to_music',
            input: {
                prompt: prompt,
                lyrics: lyrics,
                style: style,
                duration: duration,
                instrumental: instrumental,
                quality: 'high',
                format: 'mp3'
            }
        };

        return this.createTask(payload);
    }

    // Extend existing music
    async extendMusic(params) {
        const {
            audio_url,
            prompt,
            extend_duration = 30,
            continuation_type = 'smooth' // smooth, creative, match
        } = params;

        const payload = {
            model: this.models.suno,
            task_type: 'music_extend',
            input: {
                audio_url: audio_url,
                prompt: prompt,
                extend_duration: extend_duration,
                continuation_type: continuation_type
            }
        };

        return this.createTask(payload);
    }

    // Remix existing music
    async remixMusic(params) {
        const {
            audio_url,
            style,
            strength = 0.7, // 0-1, how much to change
            preserve_vocals = true
        } = params;

        const payload = {
            model: this.models.suno,
            task_type: 'music_remix',
            input: {
                audio_url: audio_url,
                style: style,
                strength: strength,
                preserve_vocals: preserve_vocals
            }
        };

        return this.createTask(payload);
    }

    // Generate lyrics
    async generateLyrics(params) {
        const {
            topic,
            genre,
            mood,
            language = 'english',
            verse_count = 2,
            include_chorus = true
        } = params;

        const payload = {
            model: this.models.lyrics,
            task_type: 'generate_lyrics',
            input: {
                topic: topic,
                genre: genre,
                mood: mood,
                language: language,
                structure: {
                    verses: verse_count,
                    chorus: include_chorus,
                    bridge: verse_count > 2
                }
            }
        };

        return this.createTask(payload);
    }

    // Create from lyrics (text to music with custom lyrics)
    async createFromLyrics(params) {
        const {
            lyrics,
            style,
            tempo = 'medium',
            voice_type = 'auto' // auto, male, female, duet
        } = params;

        const payload = {
            model: this.models.suno,
            task_type: 'lyrics_to_music',
            input: {
                lyrics: lyrics,
                style: style,
                tempo: tempo,
                voice_type: voice_type,
                quality: 'high'
            }
        };

        return this.createTask(payload);
    }

    // Edit specific part of music
    async editMusic(params) {
        const {
            audio_url,
            start_time,
            end_time,
            edit_type, // replace, remove, enhance
            new_content
        } = params;

        const payload = {
            model: this.models.aceStep,
            task_type: 'audio_edit',
            input: {
                audio_url: audio_url,
                edits: [{
                    start_time: start_time,
                    end_time: end_time,
                    type: edit_type,
                    content: new_content
                }]
            }
        };

        return this.createTask(payload);
    }

    // Generate album artwork
    async generateArtwork(params) {
        const {
            title,
            artist,
            genre,
            mood,
            style = 'album_cover'
        } = params;

        const payload = {
            model: 'flux-pro',
            task_type: 'text_to_image',
            input: {
                prompt: `Album cover art for "${title}" by ${artist}, ${genre} music, ${mood} mood, professional album artwork, ${style}`,
                width: 1024,
                height: 1024,
                quality: 'high'
            }
        };

        return this.createTask(payload);
    }

    // Style transfer (change genre/style of existing music)
    async styleTransfer(params) {
        const {
            audio_url,
            target_style,
            preserve_melody = true,
            preserve_rhythm = false
        } = params;

        const payload = {
            model: this.models.diffrhythm,
            task_type: 'style_transfer',
            input: {
                audio_url: audio_url,
                target_style: target_style,
                preservation: {
                    melody: preserve_melody,
                    rhythm: preserve_rhythm,
                    vocals: true
                }
            }
        };

        return this.createTask(payload);
    }

    // Separate stems (vocals, drums, bass, etc.)
    async separateStems(params) {
        const {
            audio_url,
            stems = ['vocals', 'drums', 'bass', 'other']
        } = params;

        const payload = {
            model: 'demucs',
            task_type: 'stem_separation',
            input: {
                audio_url: audio_url,
                stems: stems,
                quality: 'high'
            }
        };

        return this.createTask(payload);
    }

    // Create variations of existing music
    async createVariation(params) {
        const {
            audio_url,
            variation_type = 'moderate', // subtle, moderate, creative
            preserve_structure = true
        } = params;

        const payload = {
            model: this.models.suno,
            task_type: 'music_variation',
            input: {
                audio_url: audio_url,
                variation_strength: variation_type,
                preserve_structure: preserve_structure
            }
        };

        return this.createTask(payload);
    }

    // Core task creation method (PiAPI unified API)
    async createTask(payload) {
        try {
            const response = await fetch(`${this.baseURL}/api/v1/task`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'X-API-Version': '1.0'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const result = await response.json();
            return {
                success: true,
                taskId: result.task_id,
                status: 'processing',
                estimatedTime: result.estimated_time || 60
            };
        } catch (error) {
            console.error('PiAPI Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get task status and result
    async getTask(taskId) {
        try {
            const response = await fetch(`${this.baseURL}/api/v1/task/${taskId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-API-Version': '1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const result = await response.json();
            return {
                success: true,
                status: result.status,
                progress: result.progress || 0,
                output: result.output || null,
                error: result.error || null
            };
        } catch (error) {
            console.error('PiAPI Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Poll for task completion
    async waitForCompletion(taskId, maxAttempts = 60, interval = 2000) {
        for (let i = 0; i < maxAttempts; i++) {
            const result = await this.getTask(taskId);
            
            if (result.status === 'completed') {
                return result;
            } else if (result.status === 'failed') {
                throw new Error(result.error || 'Task failed');
            }
            
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        throw new Error('Task timeout');
    }

    // Cancel a running task
    async cancelTask(taskId) {
        try {
            const response = await fetch(`${this.baseURL}/api/v1/task/${taskId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-API-Version': '1.0'
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Cancel Error:', error);
            return false;
        }
    }

    // Get available styles and genres
    getAvailableStyles() {
        return {
            genres: [
                'pop', 'rock', 'jazz', 'classical', 'electronic', 'hip-hop',
                'country', 'r&b', 'folk', 'metal', 'indie', 'latin',
                'reggae', 'blues', 'funk', 'soul', 'disco', 'house',
                'techno', 'trap', 'drill', 'ambient', 'experimental'
            ],
            moods: [
                'happy', 'sad', 'energetic', 'calm', 'aggressive', 'peaceful',
                'melancholic', 'uplifting', 'dark', 'bright', 'nostalgic',
                'romantic', 'epic', 'mysterious', 'playful', 'serious'
            ],
            instruments: [
                'piano', 'guitar', 'drums', 'bass', 'violin', 'saxophone',
                'trumpet', 'flute', 'synthesizer', 'orchestra', 'acoustic',
                'electric', 'strings', 'brass', 'woodwind', 'percussion'
            ]
        };
    }

    // Helper to build style prompt
    buildStylePrompt(options) {
        const { genre, mood, instruments, tempo, era } = options;
        let prompt = [];
        
        if (genre) prompt.push(`${genre} music`);
        if (mood) prompt.push(`${mood} mood`);
        if (instruments?.length) prompt.push(`featuring ${instruments.join(', ')}`);
        if (tempo) prompt.push(`${tempo} tempo`);
        if (era) prompt.push(`${era} style`);
        
        return prompt.join(', ');
    }
}

// Export for use in other modules
window.PiAPIMusic = PiAPIMusic;