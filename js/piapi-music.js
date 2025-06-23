// PiAPI Music Generation System - EXACT Implementation
// Following PiAPI documentation precisely

class PiAPIMusic {
    constructor(apiKey) {
        this.apiKey = apiKey || 'd3a513bec58ea7c7e60eebf377fbbfb806f2304f12e1ef208cd701139658c088';
        this.baseURL = 'https://api.piapi.ai';
        
        // All PiAPI Music Models
        this.models = {
            // Suno Models
            suno35: 'suno-v3.5',
            suno45: 'suno-v4.5', // If available
            
            // Udio Model
            udio: 'udio',
            
            // DiffRhythm
            diffrhythm: 'Qubico/diffrhythm',
            
            // Ace Step
            aceStep: 'ace-step',
            
            // Mmaudio
            mmaudio: 'mmaudio',
            
            // Music models
            musicU: 'music-u',
            musicS: 'music-s',
            
            // Other models
            lyricsAI: 'lyrics-ai',
            f5TTS: 'f5-tts'
        };
    }

    // ========== SUNO API ==========
    // Create music with Suno (EXACT as per PiAPI docs)
    async createMusic(params) {
        const {
            prompt,
            make_instrumental = false,
            song_style = '',
            custom_lyrics = '',
            title = '',
            model = 'suno-v3.5'
        } = params;

        const payload = {
            model: model,
            task_type: 'generate_music',
            input: {
                gpt_description_prompt: prompt,
                make_instrumental: make_instrumental,
                song_style: song_style,
                custom_lyrics: custom_lyrics,
                title: title
            }
        };

        return this.createTask(payload);
    }

    // ========== UDIO API ==========
    // Generate song with Udio
    async generateSongUdio(params) {
        const {
            prompt,
            lyrics = '',
            style = '',
            duration = 60
        } = params;

        const payload = {
            model: this.models.udio,
            task_type: 'generate_song',
            input: {
                prompt: prompt,
                lyrics: lyrics,
                style: style,
                duration: duration
            }
        };

        return this.createTask(payload);
    }

    // Extend song with Udio
    async extendSongUdio(params) {
        const {
            audio_url,
            prompt = '',
            continuation_seconds = 30
        } = params;

        const payload = {
            model: this.models.udio,
            task_type: 'song_extend',
            input: {
                audio_url: audio_url,
                prompt: prompt,
                continuation_seconds: continuation_seconds
            }
        };

        return this.createTask(payload);
    }

    // Generate lyrics with Udio
    async generateLyricsUdio(params) {
        const {
            prompt,
            genre = '',
            mood = ''
        } = params;

        const payload = {
            model: this.models.udio,
            task_type: 'generate_lyrics',
            input: {
                prompt: prompt,
                genre: genre,
                mood: mood
            }
        };

        return this.createTask(payload);
    }

    // ========== DIFFRHYTHM API ==========
    // Create music with DiffRhythm
    async createMusicDiffRhythm(params) {
        const {
            prompt,
            reference_audio = '',
            lyrics = ''
        } = params;

        const payload = {
            model: this.models.diffrhythm,
            task_type: 'create_task',
            input: {
                prompt: prompt,
                reference_audio: reference_audio,
                lyrics: lyrics
            }
        };

        return this.createTask(payload);
    }

    // ========== ACE STEP API ==========
    // Text to Audio
    async textToAudioAceStep(params) {
        const {
            prompt,
            lyrics = '',
            duration = 60
        } = params;

        const payload = {
            model: this.models.aceStep,
            task_type: 'text_to_audio',
            input: {
                prompt: prompt,
                lyrics: lyrics,
                duration: duration
            }
        };

        return this.createTask(payload);
    }

    // Audio to Audio
    async audioToAudioAceStep(params) {
        const {
            audio_url,
            prompt,
            strength = 0.7
        } = params;

        const payload = {
            model: this.models.aceStep,
            task_type: 'audio_to_audio',
            input: {
                audio_url: audio_url,
                prompt: prompt,
                strength: strength
            }
        };

        return this.createTask(payload);
    }

    // Audio Edit
    async audioEditAceStep(params) {
        const {
            audio_url,
            prompt,
            start_time,
            end_time
        } = params;

        const payload = {
            model: this.models.aceStep,
            task_type: 'audio_edit',
            input: {
                audio_url: audio_url,
                prompt: prompt,
                start_time: start_time,
                end_time: end_time
            }
        };

        return this.createTask(payload);
    }

    // Audio Extend
    async audioExtendAceStep(params) {
        const {
            audio_url,
            prompt,
            duration = 30
        } = params;

        const payload = {
            model: this.models.aceStep,
            task_type: 'audio_extend',
            input: {
                audio_url: audio_url,
                prompt: prompt,
                duration: duration
            }
        };

        return this.createTask(payload);
    }

    // ========== MMAUDIO API ==========
    // Generate audio from video
    async videoToAudio(params) {
        const {
            video_url,
            prompt = ''
        } = params;

        const payload = {
            model: this.models.mmaudio,
            task_type: 'create_task',
            input: {
                video_url: video_url,
                prompt: prompt
            }
        };

        return this.createTask(payload);
    }

    // ========== F5 TTS API ==========
    // Text to Speech
    async textToSpeech(params) {
        const {
            text,
            voice = 'default',
            speed = 1.0
        } = params;

        const payload = {
            model: this.models.f5TTS,
            task_type: 'text_to_speech',
            input: {
                text: text,
                voice: voice,
                speed: speed
            }
        };

        return this.createTask(payload);
    }

    // ========== CORE TASK METHODS ==========
    // Create task - EXACT PiAPI unified API
    async createTask(payload) {
        console.log('PiAPI Request:', JSON.stringify(payload, null, 2));
        
        try {
            const response = await fetch(`${this.baseURL}/api/v1/task`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const responseText = await response.text();
            console.log('PiAPI Response:', responseText);

            if (!response.ok) {
                let errorMessage = `API Error: ${response.status}`;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = responseText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const result = JSON.parse(responseText);
            
            return {
                success: true,
                taskId: result.task_id,
                status: 'processing'
            };
        } catch (error) {
            console.error('PiAPI Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get task - EXACT PiAPI unified API
    async getTask(taskId) {
        try {
            const response = await fetch(`${this.baseURL}/api/v1/task/${taskId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            const responseText = await response.text();
            console.log(`PiAPI Task ${taskId} Status:`, responseText);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} - ${responseText}`);
            }

            const result = JSON.parse(responseText);
            
            return result;
        } catch (error) {
            console.error('PiAPI Get Task Error:', error);
            return {
                status: 'failed',
                error: error.message
            };
        }
    }

    // Poll for completion
    async waitForCompletion(taskId, maxAttempts = 120, interval = 2000) {
        for (let i = 0; i < maxAttempts; i++) {
            const result = await this.getTask(taskId);
            
            if (result.status === 'completed') {
                return result;
            } else if (result.status === 'failed' || result.status === 'error') {
                throw new Error(result.error || result.message || 'Task failed');
            }
            
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        throw new Error('Task timeout');
    }

    // Cancel task
    async cancelTask(taskId) {
        try {
            const response = await fetch(`${this.baseURL}/api/v1/task/${taskId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Cancel Error:', error);
            return false;
        }
    }

    // Get available models
    getAvailableModels() {
        return {
            suno: ['suno-v3.5', 'suno-v4.5'],
            udio: ['udio'],
            diffrhythm: ['Qubico/diffrhythm'],
            aceStep: ['ace-step'],
            mmaudio: ['mmaudio'],
            music: ['music-u', 'music-s'],
            tts: ['f5-tts']
        };
    }

    // Helper to identify model type from task result
    identifyOutputType(result) {
        if (result.output) {
            // Audio outputs
            if (result.output.audio_url || result.output.url) {
                return 'audio';
            }
            // Multiple audio outputs
            if (result.output.audio_urls || result.output.tracks) {
                return 'audio_multiple';
            }
            // Lyrics output
            if (result.output.lyrics) {
                return 'lyrics';
            }
            // Image output (for album art)
            if (result.output.image_url) {
                return 'image';
            }
        }
        return 'unknown';
    }

    // Extract audio URL from result
    extractAudioUrl(result) {
        if (!result.output) return null;
        
        // Single audio URL
        if (result.output.audio_url) return result.output.audio_url;
        if (result.output.url) return result.output.url;
        
        // Multiple audio URLs
        if (result.output.audio_urls && result.output.audio_urls.length > 0) {
            return result.output.audio_urls[0];
        }
        if (result.output.tracks && result.output.tracks.length > 0) {
            return result.output.tracks[0].url || result.output.tracks[0].audio_url;
        }
        
        return null;
    }
}

// Export for use
window.PiAPIMusic = PiAPIMusic;