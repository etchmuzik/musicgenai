// Suno API Integration - Connects to existing PiAPI/n8n infrastructure

// Music Generation API
async function generateMusic(params) {
    try {
        // Check if we have PiAPI direct or n8n webhook
        const apiEndpoint = window.PIAPI_DIRECT ? '/api/piapi-direct' : '/webhook/generate-music-ai';
        
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: params.prompt,
                custom_mode: params.customMode,
                title: params.title,
                tags: params.tags,
                lyrics: params.lyrics,
                model: params.model || 'chirp-v3-5',
                continue_clip_id: params.continueClipId,
                continue_at: params.continueAt
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        
        // Handle the response
        if (result.task_id) {
            // Start polling for completion
            return await pollForCompletion(result.task_id);
        } else if (result.songs) {
            // Direct result
            return result;
        }
        
    } catch (error) {
        console.error('Music generation error:', error);
        throw error;
    }
}

// Poll for task completion
async function pollForCompletion(taskId) {
    const maxAttempts = 60; // 5 minutes
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        try {
            const response = await fetch(`/api/task-status/${taskId}`);
            const result = await response.json();
            
            if (result.status === 'completed' && result.songs) {
                return result;
            } else if (result.status === 'failed') {
                throw new Error('Generation failed');
            }
            
            // Wait 5 seconds before next check
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
            
        } catch (error) {
            console.error('Polling error:', error);
            attempts++;
        }
    }
    
    throw new Error('Generation timeout');
}

// Get user's songs
async function getUserSongs() {
    try {
        // Try localStorage first
        const cachedSongs = localStorage.getItem('userSongs');
        if (cachedSongs) {
            return JSON.parse(cachedSongs);
        }
        
        // Then try API
        const response = await fetch('/api/user-songs');
        if (response.ok) {
            const songs = await response.json();
            localStorage.setItem('userSongs', JSON.stringify(songs));
            return songs;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching songs:', error);
        return [];
    }
}

// Save song locally
function saveSongLocally(song) {
    const songs = JSON.parse(localStorage.getItem('userSongs') || '[]');
    songs.unshift(song); // Add to beginning
    localStorage.setItem('userSongs', JSON.stringify(songs));
}

// Integration with existing music generation
if (typeof window.MusicGeneration !== 'undefined') {
    // Hook into existing music generation
    const originalGenerate = window.MusicGeneration.prototype.generateMusic;
    
    window.MusicGeneration.prototype.generateMusic = async function(params) {
        // Call Suno-style API
        const result = await generateMusic(params);
        
        // Save locally
        if (result.songs) {
            result.songs.forEach(song => saveSongLocally(song));
        }
        
        // Call original if exists
        if (originalGenerate) {
            return originalGenerate.call(this, params);
        }
        
        return result;
    };
}

// Export for use in Suno pages
window.SunoAPI = {
    generateMusic,
    getUserSongs,
    saveSongLocally
};