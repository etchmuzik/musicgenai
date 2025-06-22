// Advanced Audio Processing Engine for MusicGen AI
class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.filterNode = null;
        this.reverbNode = null;
        this.delayNode = null;
        this.compressorNode = null;
        this.analyserNode = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.playbackRate = 1;
        this.effects = {};
        this.callbacks = {};
        
        this.init();
    }

    async init() {
        try {
            // Initialize Audio Context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create core nodes
            this.gainNode = this.audioContext.createGain();
            this.filterNode = this.audioContext.createBiquadFilter();
            this.compressorNode = this.audioContext.createDynamicsCompressor();
            this.analyserNode = this.audioContext.createAnalyser();
            
            // Create reverb
            this.reverbNode = await this.createReverbNode();
            
            // Create delay
            this.delayNode = this.createDelayNode();
            
            // Set up analyser
            this.analyserNode.fftSize = 2048;
            this.analyserNode.smoothingTimeConstant = 0.8;
            
            // Set up filter
            this.filterNode.type = 'lowpass';
            this.filterNode.frequency.setValueAtTime(20000, this.audioContext.currentTime);
            this.filterNode.Q.setValueAtTime(1, this.audioContext.currentTime);
            
            // Set up compressor
            this.compressorNode.threshold.setValueAtTime(-24, this.audioContext.currentTime);
            this.compressorNode.knee.setValueAtTime(30, this.audioContext.currentTime);
            this.compressorNode.ratio.setValueAtTime(12, this.audioContext.currentTime);
            this.compressorNode.attack.setValueAtTime(0.003, this.audioContext.currentTime);
            this.compressorNode.release.setValueAtTime(0.25, this.audioContext.currentTime);
            
            console.log('Audio Engine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Audio Engine:', error);
        }
    }

    async createReverbNode() {
        const convolver = this.audioContext.createConvolver();
        const reverbBuffer = await this.createReverbImpulse(2, 2, false);
        convolver.buffer = reverbBuffer;
        return convolver;
    }

    async createReverbImpulse(duration, decay, reverse) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const n = reverse ? length - i : i;
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
            }
        }
        
        return impulse;
    }

    createDelayNode() {
        const delay = this.audioContext.createDelay(1);
        const feedback = this.audioContext.createGain();
        const delayGain = this.audioContext.createGain();
        
        delay.delayTime.setValueAtTime(0.3, this.audioContext.currentTime);
        feedback.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        delayGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        
        // Connect delay feedback loop
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(delayGain);
        
        return { delay, feedback, gain: delayGain };
    }

    async loadAudioFromUrl(url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.duration = this.audioBuffer.duration;
            
            this.emit('audioLoaded', {
                duration: this.duration,
                sampleRate: this.audioBuffer.sampleRate,
                numberOfChannels: this.audioBuffer.numberOfChannels
            });
            
            return this.audioBuffer;
        } catch (error) {
            console.error('Failed to load audio:', error);
            throw error;
        }
    }

    async loadAudioFromFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.duration = this.audioBuffer.duration;
            
            this.emit('audioLoaded', {
                duration: this.duration,
                sampleRate: this.audioBuffer.sampleRate,
                numberOfChannels: this.audioBuffer.numberOfChannels
            });
            
            return this.audioBuffer;
        } catch (error) {
            console.error('Failed to load audio from file:', error);
            throw error;
        }
    }

    play(startTime = 0) {
        if (!this.audioBuffer) {
            console.warn('No audio buffer loaded');
            return;
        }

        this.stop(); // Stop any existing playback
        
        // Create new source node
        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.playbackRate.setValueAtTime(this.playbackRate, this.audioContext.currentTime);
        
        // Connect audio graph
        this.connectAudioGraph();
        
        // Start playback
        this.sourceNode.start(0, startTime);
        this.isPlaying = true;
        this.currentTime = startTime;
        
        // Set up ended event
        this.sourceNode.onended = () => {
            this.isPlaying = false;
            this.emit('playbackEnded');
        };
        
        this.emit('playbackStarted', { startTime });
        this.startTimeUpdate();
    }

    stop() {
        if (this.sourceNode) {
            this.sourceNode.stop();
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        this.isPlaying = false;
        this.emit('playbackStopped');
    }

    pause() {
        if (this.isPlaying) {
            this.stop();
            this.emit('playbackPaused', { currentTime: this.currentTime });
        }
    }

    resume() {
        if (!this.isPlaying && this.audioBuffer) {
            this.play(this.currentTime);
            this.emit('playbackResumed', { currentTime: this.currentTime });
        }
    }

    seek(time) {
        const wasPlaying = this.isPlaying;
        this.stop();
        this.currentTime = Math.max(0, Math.min(time, this.duration));
        
        if (wasPlaying) {
            this.play(this.currentTime);
        }
        
        this.emit('seeked', { currentTime: this.currentTime });
    }

    connectAudioGraph() {
        if (!this.sourceNode) return;
        
        // Basic connection: source -> gain -> filter -> compressor -> reverb -> delay -> analyser -> destination
        this.sourceNode.connect(this.gainNode);
        this.gainNode.connect(this.filterNode);
        this.filterNode.connect(this.compressorNode);
        
        // Reverb send
        const reverbGain = this.audioContext.createGain();
        reverbGain.gain.setValueAtTime(this.effects.reverb || 0, this.audioContext.currentTime);
        this.compressorNode.connect(reverbGain);
        reverbGain.connect(this.reverbNode);
        
        // Delay send
        const delayGain = this.audioContext.createGain();
        delayGain.gain.setValueAtTime(this.effects.delay || 0, this.audioContext.currentTime);
        this.compressorNode.connect(delayGain);
        delayGain.connect(this.delayNode.delay);
        
        // Mix dry and wet signals
        const dryGain = this.audioContext.createGain();
        dryGain.gain.setValueAtTime(1, this.audioContext.currentTime);
        this.compressorNode.connect(dryGain);
        
        // Connect to analyser and destination
        const mixGain = this.audioContext.createGain();
        dryGain.connect(mixGain);
        this.reverbNode.connect(mixGain);
        this.delayNode.gain.connect(mixGain);
        
        mixGain.connect(this.analyserNode);
        this.analyserNode.connect(this.audioContext.destination);
    }

    startTimeUpdate() {
        if (!this.isPlaying) return;
        
        const updateTime = () => {
            if (this.isPlaying) {
                this.currentTime += 0.1;
                if (this.currentTime >= this.duration) {
                    this.currentTime = this.duration;
                    this.stop();
                    return;
                }
                this.emit('timeUpdate', { currentTime: this.currentTime });
                setTimeout(updateTime, 100);
            }
        };
        
        updateTime();
    }

    // Audio Effects
    setVolume(volume) {
        if (this.gainNode) {
            this.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            this.emit('volumeChanged', { volume });
        }
    }

    setPlaybackRate(rate) {
        this.playbackRate = rate;
        if (this.sourceNode) {
            this.sourceNode.playbackRate.setValueAtTime(rate, this.audioContext.currentTime);
        }
        this.emit('playbackRateChanged', { rate });
    }

    setFilter(type, frequency, Q = 1) {
        if (this.filterNode) {
            this.filterNode.type = type;
            this.filterNode.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            this.filterNode.Q.setValueAtTime(Q, this.audioContext.currentTime);
            this.emit('filterChanged', { type, frequency, Q });
        }
    }

    setReverb(amount) {
        this.effects.reverb = amount;
        this.emit('reverbChanged', { amount });
    }

    setDelay(amount, time = 0.3, feedback = 0.3) {
        this.effects.delay = amount;
        if (this.delayNode) {
            this.delayNode.delay.delayTime.setValueAtTime(time, this.audioContext.currentTime);
            this.delayNode.feedback.gain.setValueAtTime(feedback, this.audioContext.currentTime);
        }
        this.emit('delayChanged', { amount, time, feedback });
    }

    // Audio Analysis
    getFrequencyData() {
        if (!this.analyserNode) return new Uint8Array(0);
        
        const bufferLength = this.analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyserNode.getByteFrequencyData(dataArray);
        return dataArray;
    }

    getWaveformData() {
        if (!this.analyserNode) return new Uint8Array(0);
        
        const bufferLength = this.analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyserNode.getByteTimeDomainData(dataArray);
        return dataArray;
    }

    // Audio Processing
    trimAudio(startTime, endTime) {
        if (!this.audioBuffer) return null;
        
        const sampleRate = this.audioBuffer.sampleRate;
        const startSample = Math.floor(startTime * sampleRate);
        const endSample = Math.floor(endTime * sampleRate);
        const trimmedLength = endSample - startSample;
        
        const trimmedBuffer = this.audioContext.createBuffer(
            this.audioBuffer.numberOfChannels,
            trimmedLength,
            sampleRate
        );
        
        for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
            const originalData = this.audioBuffer.getChannelData(channel);
            const trimmedData = trimmedBuffer.getChannelData(channel);
            
            for (let i = 0; i < trimmedLength; i++) {
                trimmedData[i] = originalData[startSample + i];
            }
        }
        
        return trimmedBuffer;
    }

    fadeIn(duration = 1) {
        if (!this.gainNode) return;
        
        const currentTime = this.audioContext.currentTime;
        this.gainNode.gain.setValueAtTime(0, currentTime);
        this.gainNode.gain.linearRampToValueAtTime(1, currentTime + duration);
        
        this.emit('fadeInApplied', { duration });
    }

    fadeOut(duration = 1) {
        if (!this.gainNode) return;
        
        const currentTime = this.audioContext.currentTime;
        this.gainNode.gain.setValueAtTime(1, currentTime);
        this.gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);
        
        setTimeout(() => {
            this.stop();
        }, duration * 1000);
        
        this.emit('fadeOutApplied', { duration });
    }

    // Export functionality
    async exportAsWAV() {
        if (!this.audioBuffer) return null;
        
        const length = this.audioBuffer.length;
        const numberOfChannels = this.audioBuffer.numberOfChannels;
        const sampleRate = this.audioBuffer.sampleRate;
        const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
        const view = new DataView(arrayBuffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * numberOfChannels * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numberOfChannels * 2, true);
        view.setUint16(32, numberOfChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * numberOfChannels * 2, true);
        
        // Convert audio data
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, this.audioBuffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    // Event system
    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }

    off(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    }

    // Cleanup
    destroy() {
        this.stop();
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.callbacks = {};
    }
}

// Export for use
export { AudioEngine };