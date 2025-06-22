/**
 * Direct PiAPI Integration for MusicGen AI
 * Handles music generation without n8n dependency
 */

class PiAPIService {
    constructor() {
        this.apiBaseUrl = 'https://api.piapi.ai/api/v1';
        this.apiKey = localStorage.getItem('piapi_key') || 'YOUR_PIAPI_KEY_HERE';
        this.maxRetries = 3;
        this.pollingInterval = 2000; // 2 seconds
    }

    /**
     * Set API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('piapi_key', apiKey);
    }

    /**
     * Generate music using PiAPI
     */
    async generateMusic(params, onProgress, onComplete, onError) {
        try {
            // Step 1: Create generation task
            const taskId = await this.createTask(params);
            
            if (!taskId) {
                throw new Error('Failed to create generation task');
            }

            // Step 2: Poll for completion
            const result = await this.pollForCompletion(taskId, onProgress);
            
            if (result && result.output && result.output.audio_url) {
                onComplete({
                    audioUrl: result.output.audio_url,
                    title: params.prompt || 'Generated Music',
                    duration: result.output.duration || '30s',
                    taskId: taskId
                });
            } else {
                throw new Error('Generation completed but no audio URL received');
            }
        } catch (error) {
            console.error('Music generation error:', error);
            onError(error.message || 'Failed to generate music');
        }
    }

    /**
     * Create a generation task
     */
    async createTask(params) {
        const taskData = {
            model: 'music-u', // or 'Qubico/diffrhythm' for extended generations
            task_type: 'music_generation',
            input: {
                prompt: this.buildPrompt(params),
                duration: parseInt(params.duration) || 30,
                instrumental: params.instrumental !== false
            }
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/task`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-API-Key': this.apiKey
                },
                body: JSON.stringify(taskData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.task_id;
        } catch (error) {
            console.error('Task creation error:', error);
            throw error;
        }
    }

    /**
     * Build prompt from parameters
     */
    buildPrompt(params) {
        let prompt = params.prompt || '';
        
        if (params.genre) {
            prompt = `${params.genre} music, ${prompt}`;
        }
        
        if (params.mood) {
            prompt = `${prompt}, ${params.mood} mood`;
        }
        
        if (params.style) {
            prompt = `${prompt}, ${params.style} style`;
        }
        
        if (params.bpm) {
            prompt = `${prompt}, ${params.bpm} BPM`;
        }
        
        if (params.key) {
            prompt = `${prompt}, in ${params.key}`;
        }

        return prompt.trim();
    }

    /**
     * Poll for task completion
     */
    async pollForCompletion(taskId, onProgress) {
        let attempts = 0;
        const maxAttempts = 60; // 2 minutes max

        while (attempts < maxAttempts) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/task/${taskId}`, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'X-API-Key': this.apiKey
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                
                if (data.status === 'completed') {
                    return data;
                } else if (data.status === 'failed') {
                    throw new Error(data.error || 'Generation failed');
                } else if (data.status === 'processing' || data.status === 'pending') {
                    // Update progress
                    const progress = Math.min(95, (attempts / maxAttempts) * 100);
                    if (onProgress) {
                        onProgress({
                            status: data.status,
                            progress: progress,
                            message: `Generating music... ${Math.round(progress)}%`
                        });
                    }
                }

                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, this.pollingInterval));
                attempts++;
            } catch (error) {
                console.error('Polling error:', error);
                if (attempts >= this.maxRetries) {
                    throw error;
                }
            }
        }

        throw new Error('Generation timed out');
    }

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-API-Key': this.apiKey
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
}

// Create global instance
window.piAPIService = new PiAPIService();

// Override the existing music generation service
if (window.musicGeneration) {
    // Replace the generateMusic method
    window.musicGeneration.generateMusic = async function(params, onProgress, onComplete, onError) {
        return window.piAPIService.generateMusic(params, onProgress, onComplete, onError);
    };
}