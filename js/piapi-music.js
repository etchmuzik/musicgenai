// PiAPI Music Generation System - EXACT Implementation
// Following PiAPI documentation precisely

class PiAPIMusic {
    constructor(apiKey) {
        this.apiKey = apiKey || 'd3a513bec58ea7c7e60eebf377fbbfb806f2304f12e1ef208cd701139658c088';
        this.baseURL = 'https://api.piapi.ai';
        
        // All PiAPI Music Models - Using exact names from PiAPI
        this.models = {
            // Suno Models - Check PiAPI docs for exact model names
            suno: 'suno',  // Try without version
            suno3: 'suno-v3',
            suno35: 'suno-v3.5',  // Fixed version format
            suno4: 'suno-v4',
            suno45: 'suno-v4.5',  // Added v4.5
            
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

    // ========== MUSIC API (Following Swift Implementation) ==========
    // Create music using the exact format from working Swift code
    async createMusic(params) {
        const {
            prompt,
            make_instrumental = false,
            song_style = '',
            custom_lyrics = '',
            title = '',
            model = 'music-u'  // Use music-u model like Swift
        } = params;

        // Build the prompt exactly like Swift does
        let gptDescriptionPrompt = prompt;
        if (song_style) {
            gptDescriptionPrompt += `. Genre: ${song_style}`;
        }

        // Determine lyrics type exactly like Swift
        let lyricsType;
        if (make_instrumental) {
            lyricsType = 'instrumental';
        } else if (custom_lyrics && custom_lyrics.trim() !== '') {
            lyricsType = 'user';
        } else {
            lyricsType = 'generate';
        }

        const payload = {
            model: model,
            task_type: 'generate_music',  // Use exact task type from Swift
            input: {
                gpt_description_prompt: gptDescriptionPrompt,  // Use exact field name
                negative_tags: '',
                lyrics_type: lyricsType,  // Use underscore
                seed: -1,
                lyrics: custom_lyrics || undefined  // Only include if provided
            },
            config: {
                service_mode: 'public',  // Use underscore
                webhook_config: {
                    endpoint: '',
                    secret: ''
                }
            }
        };

        // Try the new music endpoint if the error suggests it
        return this.createTaskWithMusicEndpoint(payload);
    }

    // Try using a potential new music endpoint
    async createTaskWithMusicEndpoint(payload) {
        console.log('PiAPI Music Request:', JSON.stringify(payload, null, 2));
        
        try {
            // First try the standard endpoint
            const response = await fetch(`${this.baseURL}/api/v1/task`, {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const responseText = await response.text();
            console.log('PiAPI Response:', responseText);

            // If we get the "use new music endpoint" error, try the music endpoint
            if (responseText.includes('use the new \'music\' endpoint') || responseText.includes('music endpoint')) {
                console.log('Trying /api/v1/music endpoint...');
                
                // Try the music-specific endpoint
                const musicResponse = await fetch(`${this.baseURL}/api/v1/music`, {
                    method: 'POST',
                    headers: {
                        'x-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const musicResponseText = await musicResponse.text();
                console.log('Music Endpoint Response:', musicResponseText);

                if (!musicResponse.ok) {
                    throw new Error(musicResponseText || `API Error: ${musicResponse.status}`);
                }

                const musicResult = JSON.parse(musicResponseText);
                
                // Check if we got a task_id in the response
                if (musicResult.data && musicResult.data.task_id) {
                    return {
                        success: true,
                        taskId: musicResult.data.task_id,
                        status: 'processing'
                    };
                } else if (musicResult.task_id) {
                    return {
                        success: true,
                        taskId: musicResult.task_id,
                        status: 'processing'
                    };
                } else {
                    throw new Error('No task ID in response');
                }
            }

            // If no special error, process normal response
            if (!response.ok) {
                throw new Error(responseText || `API Error: ${response.status}`);
            }

            const result = JSON.parse(responseText);
            
            // Check if we got a task_id in the response
            if (result.data && result.data.task_id) {
                return {
                    success: true,
                    taskId: result.data.task_id,
                    status: 'processing'
                };
            } else if (result.task_id) {
                return {
                    success: true,
                    taskId: result.task_id,
                    status: 'processing'
                };
            } else {
                throw new Error('No task ID in response');
            }
        } catch (error) {
            console.error('PiAPI Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ========== UDIO API ==========
    // Generate song with Udio using exact Swift format
    async generateSongUdio(params) {
        const {
            prompt,
            lyrics = '',
            style = '',
            duration = 60
        } = params;

        // Build prompt like Swift
        const gptDescriptionPrompt = `${prompt}. Genre: ${style || 'Electronic'}, Mood: Energetic`;

        const payload = {
            model: 'music-u',
            task_type: 'generate_music',
            input: {
                gpt_description_prompt: gptDescriptionPrompt,
                negative_tags: '',
                lyrics_type: lyrics ? 'user' : 'instrumental',
                seed: -1,
                lyrics: lyrics || undefined
            },
            config: {
                service_mode: 'public',
                webhook_config: {
                    endpoint: '',
                    secret: ''
                }
            }
        };

        return this.createTask(payload);
    }

    // Extend song with Udio
    async extendSongUdio(params) {
        const {
            audio_url,
            prompt = '',
            continuation_seconds = 30,
            extend_from = 'end' // 'end', 'beginning', or specific timestamp
        } = params;

        // For Udio extend, we need to specify the continuation point
        const payload = {
            model: 'music-u',
            task_type: 'generate_music_custom', // Use custom task for extensions
            input: {
                gpt_description_prompt: prompt || 'Continue and extend this music',
                negative_tags: '',
                lyrics_type: 'instrumental',
                seed: -1,
                // Extension specific parameters
                continue_clip_id: audio_url, // Reference to original
                continue_at: extend_from === 'beginning' ? 0 : -1 // -1 for end
            },
            config: {
                service_mode: 'public',
                webhook_config: {
                    endpoint: '',
                    secret: ''
                }
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
                    'x-api-key': this.apiKey,  // Use x-api-key like Swift
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
            
            // Check if we got a task_id in the response
            if (result.data && result.data.task_id) {
                return {
                    success: true,
                    taskId: result.data.task_id,
                    status: 'processing'
                };
            } else if (result.task_id) {
                return {
                    success: true,
                    taskId: result.task_id,
                    status: 'processing'
                };
            } else {
                throw new Error('No task ID in response');
            }
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
                    'x-api-key': this.apiKey  // Use x-api-key like Swift
                }
            });

            const responseText = await response.text();
            console.log(`PiAPI Task ${taskId} Status:`, responseText);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} - ${responseText}`);
            }

            const result = JSON.parse(responseText);
            
            // Handle nested data structure like Swift
            if (result.data) {
                return result.data;
            }
            return result;
        } catch (error) {
            console.error('PiAPI Get Task Error:', error);
            return {
                status: 'failed',
                error: error.message
            };
        }
    }

    // Poll for completion - matching Swift logic exactly
    async waitForCompletion(taskId, maxAttempts = 60, interval = 3000) {
        console.log(`🔄 Starting polling for task ${taskId}`);
        console.log(`   Max attempts: ${maxAttempts}`);
        console.log(`   Polling interval: ${interval}ms`);
        
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, interval));
            console.log(`🔄 Polling attempt ${i + 1}/${maxAttempts}...`);
            
            const result = await this.getTask(taskId);
            
            console.log(`   Status: ${result.status}`);
            console.log(`   Output songs count: ${result.output?.songs?.length || 0}`);
            
            // Check for completion - matching Swift's status checks
            const status = result.status.toLowerCase();
            if (['completed', 'success', 'finished'].includes(status)) {
                if (result.output?.songs && result.output.songs.length > 0) {
                    console.log('✅ Generation completed!');
                    return result;
                } else {
                    console.log('⚠️ Completed but no songs in output');
                }
            } else if (['failed', 'error'].includes(status)) {
                console.log('❌ Generation failed according to API');
                throw new Error(result.error || result.message || 'Task failed');
            }
        }
        
        throw new Error('Task timeout after ' + maxAttempts + ' attempts');
    }

    // Cancel task
    async cancelTask(taskId) {
        try {
            const response = await fetch(`${this.baseURL}/api/v1/task/${taskId}/cancel`, {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey  // Use x-api-key like Swift
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
            suno: ['suno', 'suno-v3', 'suno-v3.5', 'suno-v4', 'suno-v4.5'],
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

    // Extract audio URL from result - matching Swift's song extraction
    extractAudioUrl(result) {
        if (!result.output) return null;
        
        // Check for songs array first (like Swift)
        if (result.output.songs && result.output.songs.length > 0) {
            const firstSong = result.output.songs[0];
            // Try song_path first (PiAPI's actual field), then fallback to audio_url
            const url = firstSong.song_path || firstSong.audio_url;
            if (url) {
                console.log(`✅ Found audio URL: ${url}`);
                return url;
            }
        }
        
        // Fallback to other possible fields
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