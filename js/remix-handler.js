// Remix and Transform Handler for PiAPI
class RemixHandler {
    constructor(piapi) {
        this.piapi = piapi;
        this.currentTask = null;
    }

    // Extend a track by adding more content
    async extendTrack(track, options = {}) {
        const {
            direction = 'end', // 'beginning', 'end', or 'both'
            duration = 60,
            prompt = '',
            model = 'music-u'
        } = options;

        console.log(`🔄 Extending track: ${track.title}`);
        
        // Build extension prompt
        let extendPrompt = `Extend "${track.title}"`;
        
        if (direction === 'beginning') {
            extendPrompt += ' by adding an intro section';
        } else if (direction === 'end') {
            extendPrompt += ' by adding an outro section';
        } else if (direction === 'both') {
            extendPrompt += ' by adding intro and outro sections';
        }
        
        if (prompt) {
            extendPrompt += `. ${prompt}`;
        }

        // For Udio, we can use the extend functionality
        if (model === 'udio' || model === 'music-u') {
            return await this.piapi.extendSongUdio({
                audio_url: track.audio_url || track.localURL,
                prompt: extendPrompt,
                continuation_seconds: duration
            });
        } else {
            // For other models, generate a new track with extension instructions
            return await this.piapi.createMusic({
                prompt: extendPrompt,
                make_instrumental: !track.lyrics,
                song_style: track.genre || 'Electronic',
                model: model
            });
        }
    }

    // Create a remix with different style
    async remixTrack(track, options = {}) {
        const {
            newGenre = 'Electronic',
            newMood = 'Energetic',
            remixStyle = '',
            keepLyrics = false,
            model = 'music-u'
        } = options;

        console.log(`🎛️ Remixing track: ${track.title} to ${newGenre} ${newMood}`);

        let remixPrompt = `${newGenre} ${newMood} remix of "${track.title}"`;
        
        if (remixStyle) {
            remixPrompt += `. ${remixStyle}`;
        }

        // Different approaches for different models
        switch (model) {
            case 'Qubico/diffrhythm':
                // DiffRhythm supports style transfer
                return await this.piapi.createMusicDiffRhythm({
                    prompt: remixPrompt,
                    reference_audio: track.audio_url,
                    lyrics: keepLyrics ? track.lyrics : null
                });
                
            case 'ace-step':
                // Ace Step audio-to-audio transformation
                return await this.piapi.audioToAudioAceStep({
                    audio_url: track.audio_url,
                    prompt: remixPrompt,
                    strength: 0.7 // How much to change from original
                });
                
            default:
                // Standard music generation with remix prompt
                return await this.piapi.createMusic({
                    prompt: remixPrompt,
                    make_instrumental: !keepLyrics || !track.lyrics,
                    song_style: newGenre,
                    custom_lyrics: keepLyrics ? track.lyrics : '',
                    model: model
                });
        }
    }

    // Create variations of a track
    async createVariations(track, count = 3, options = {}) {
        const {
            variationStrength = 'medium', // 'subtle', 'medium', 'strong'
            model = 'music-u'
        } = options;

        console.log(`🎨 Creating ${count} variations of: ${track.title}`);

        const variations = [];
        const strengthPrompts = {
            subtle: 'slight variation',
            medium: 'noticeable variation',
            strong: 'significant variation'
        };

        for (let i = 0; i < count; i++) {
            const variationPrompt = `Create a ${strengthPrompts[variationStrength]} of "${track.title}". Keep the same general feel but add unique elements.`;
            
            const result = await this.piapi.createMusic({
                prompt: variationPrompt,
                make_instrumental: !track.lyrics,
                song_style: track.genre || 'Electronic',
                custom_lyrics: track.lyrics || '',
                model: model
            });

            if (result.success) {
                variations.push(result);
            }
        }

        return variations;
    }

    // Mashup two tracks
    async mashupTracks(track1, track2, options = {}) {
        const {
            blend = 'equal', // 'equal', 'track1_dominant', 'track2_dominant'
            model = 'music-u'
        } = options;

        console.log(`🎚️ Creating mashup of: ${track1.title} + ${track2.title}`);

        let mashupPrompt = `Mashup combining elements from "${track1.title}" and "${track2.title}"`;
        
        if (blend === 'track1_dominant') {
            mashupPrompt += ` with more emphasis on the first track`;
        } else if (blend === 'track2_dominant') {
            mashupPrompt += ` with more emphasis on the second track`;
        } else {
            mashupPrompt += ` with equal balance between both tracks`;
        }

        // Combine genres and styles
        const combinedGenre = `${track1.genre || 'Electronic'} / ${track2.genre || 'Electronic'}`;

        return await this.piapi.createMusic({
            prompt: mashupPrompt,
            make_instrumental: !track1.lyrics && !track2.lyrics,
            song_style: combinedGenre,
            model: model
        });
    }

    // Generate lyrics for instrumental track
    async generateLyrics(track, options = {}) {
        const {
            theme = '',
            mood = 'uplifting',
            language = 'English'
        } = options;

        console.log(`📝 Generating lyrics for: ${track.title}`);

        const lyricsPrompt = theme || `Write lyrics that match the mood and style of "${track.title}"`;

        return await this.piapi.generateLyricsUdio({
            prompt: lyricsPrompt,
            genre: track.genre || 'Pop',
            mood: mood
        });
    }

    // Add vocals to instrumental track
    async addVocals(track, lyrics, options = {}) {
        const {
            voiceStyle = 'auto',
            model = 'music-u'
        } = options;

        console.log(`🎤 Adding vocals to: ${track.title}`);

        return await this.piapi.createMusic({
            prompt: `Add vocals to "${track.title}"`,
            make_instrumental: false,
            song_style: track.genre || 'Pop',
            custom_lyrics: lyrics,
            model: model
        });
    }

    // Remove vocals from track (create instrumental)
    async removeVocals(track, options = {}) {
        const {
            model = 'music-u'
        } = options;

        console.log(`🔇 Creating instrumental version of: ${track.title}`);

        return await this.piapi.createMusic({
            prompt: `Instrumental version of "${track.title}" without vocals`,
            make_instrumental: true,
            song_style: track.genre || 'Electronic',
            model: model
        });
    }

    // Change tempo/BPM
    async changeTempo(track, newBPM, options = {}) {
        const {
            model = 'ace-step'
        } = options;

        console.log(`⚡ Changing tempo of ${track.title} to ${newBPM} BPM`);

        if (model === 'ace-step') {
            return await this.piapi.audioEditAceStep({
                audio_url: track.audio_url,
                prompt: `Change tempo to ${newBPM} BPM`,
                start_time: 0,
                end_time: track.duration
            });
        } else {
            // Fallback to recreation with new tempo
            return await this.piapi.createMusic({
                prompt: `"${track.title}" at ${newBPM} BPM`,
                make_instrumental: !track.lyrics,
                song_style: track.genre || 'Electronic',
                custom_lyrics: track.lyrics || '',
                model: model
            });
        }
    }

    // Generate album artwork
    async generateArtwork(track, options = {}) {
        const {
            style = 'modern',
            theme = ''
        } = options;

        console.log(`🎨 Generating artwork for: ${track.title}`);

        const artworkPrompt = theme || `Album cover for "${track.title}" - ${track.genre || 'music'} track with ${style} aesthetic`;

        // Note: This would typically use an image generation API
        // For now, we'll use the lyrics API as a placeholder
        return await this.piapi.generateLyricsUdio({
            prompt: `Visual description: ${artworkPrompt}`,
            genre: 'Artwork',
            mood: style
        });
    }

    // Process with video (MMAudio)
    async processWithVideo(videoUrl, options = {}) {
        const {
            prompt = '',
            syncToVideo = true
        } = options;

        console.log(`🎬 Generating audio for video: ${videoUrl}`);

        return await this.piapi.videoToAudio({
            video_url: videoUrl,
            prompt: prompt || 'Generate matching audio for this video'
        });
    }

    // Batch process multiple tracks
    async batchProcess(tracks, action, options = {}) {
        console.log(`📦 Batch processing ${tracks.length} tracks with action: ${action}`);

        const results = [];
        
        for (const track of tracks) {
            try {
                let result;
                
                switch (action) {
                    case 'remix':
                        result = await this.remixTrack(track, options);
                        break;
                    case 'extend':
                        result = await this.extendTrack(track, options);
                        break;
                    case 'instrumental':
                        result = await this.removeVocals(track, options);
                        break;
                    case 'artwork':
                        result = await this.generateArtwork(track, options);
                        break;
                    default:
                        throw new Error(`Unknown action: ${action}`);
                }
                
                if (result.success) {
                    results.push({
                        track: track,
                        result: result,
                        success: true
                    });
                }
            } catch (error) {
                console.error(`Failed to process ${track.title}:`, error);
                results.push({
                    track: track,
                    error: error.message,
                    success: false
                });
            }
        }

        return results;
    }

    // Smart remix suggestions based on track analysis
    getRemixSuggestions(track) {
        const suggestions = [];
        const genre = track.genre || 'Unknown';
        
        // Genre-based suggestions
        const genreMap = {
            'Electronic': ['Hip Hop', 'Ambient', 'Drum & Bass'],
            'Pop': ['Electronic', 'R&B', 'Acoustic'],
            'Rock': ['Electronic', 'Jazz', 'Blues'],
            'Hip Hop': ['Electronic', 'R&B', 'Trap'],
            'Classical': ['Electronic', 'Jazz', 'Ambient']
        };

        const suggestedGenres = genreMap[genre] || ['Electronic', 'Pop', 'Hip Hop'];
        
        suggestedGenres.forEach(newGenre => {
            suggestions.push({
                type: 'genre_change',
                title: `${newGenre} Remix`,
                description: `Transform into ${newGenre} style`,
                genre: newGenre,
                mood: 'Energetic'
            });
        });

        // Tempo suggestions
        suggestions.push({
            type: 'tempo_change',
            title: 'Chill Version',
            description: 'Slow down for a relaxed vibe',
            tempo: 'slow',
            mood: 'Chill'
        });

        suggestions.push({
            type: 'tempo_change',
            title: 'Dance Version',
            description: 'Speed up for the dancefloor',
            tempo: 'fast',
            mood: 'Energetic'
        });

        // Special versions
        suggestions.push({
            type: 'special',
            title: 'Acoustic Version',
            description: 'Strip back to acoustic instruments',
            style: 'acoustic'
        });

        suggestions.push({
            type: 'special',
            title: 'Orchestra Version',
            description: 'Add orchestral grandeur',
            style: 'orchestral'
        });

        return suggestions;
    }
}

// Export for use
window.RemixHandler = RemixHandler;