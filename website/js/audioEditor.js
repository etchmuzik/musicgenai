/**
 * MusicGen AI - Advanced Audio Editor
 * Professional audio editing with waveform visualization, effects, and multi-track support
 */

class AdvancedAudioEditor {
    constructor(container) {
        this.container = container;
        this.audioContext = null;
        this.audioBuffer = null;
        this.sourceNode = null;
        this.tracks = new Map();
        this.effects = new Map();
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.selection = { start: 0, end: 0 };
        this.zoom = 1;
        this.pixelsPerSecond = 100;
        
        // Canvas for waveform rendering
        this.canvas = null;
        this.canvasContext = null;
        this.waveformData = null;
        
        // Audio nodes for effects
        this.gainNode = null;
        this.filterNode = null;
        this.reverbNode = null;
        this.delayNode = null;
        this.compressorNode = null;
        
        this.init();
    }

    /**
     * Initialize audio editor
     */
    async init() {
        // Initialize Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create the editor UI
        this.createUI();
        
        // Set up audio processing chain
        this.setupAudioChain();
        
        // Initialize event listeners
        this.setupEventListeners();
        
        console.log('🎧 Advanced Audio Editor initialized');
    }

    /**
     * Create the editor user interface
     */
    createUI() {
        this.container.innerHTML = `
            <div class="audio-editor">
                <!-- Toolbar -->
                <div class="editor-toolbar">
                    <div class="tool-group">
                        <button class="tool-btn active" data-tool="select" title="Select">
                            <span>↕️</span> Select
                        </button>
                        <button class="tool-btn" data-tool="trim" title="Trim">
                            <span>✂️</span> Trim
                        </button>
                        <button class="tool-btn" data-tool="fade" title="Fade">
                            <span>📊</span> Fade
                        </button>
                        <button class="tool-btn" data-tool="split" title="Split">
                            <span>🔪</span> Split
                        </button>
                    </div>
                    
                    <div class="tool-group">
                        <button class="action-btn" id="undoBtn" title="Undo">
                            <span>↶</span> Undo
                        </button>
                        <button class="action-btn" id="redoBtn" title="Redo">
                            <span>↷</span> Redo
                        </button>
                    </div>
                    
                    <div class="tool-group">
                        <button class="action-btn" id="playBtn" title="Play/Pause">
                            <span>▶️</span> Play
                        </button>
                        <button class="action-btn" id="stopBtn" title="Stop">
                            <span>⏹️</span> Stop
                        </button>
                    </div>
                    
                    <div class="zoom-controls">
                        <button class="zoom-btn" id="zoomIn" title="Zoom In">🔍+</button>
                        <span class="zoom-level">100%</span>
                        <button class="zoom-btn" id="zoomOut" title="Zoom Out">🔍-</button>
                        <button class="zoom-btn" id="zoomFit" title="Fit to Window">⬌</button>
                    </div>
                </div>

                <!-- Waveform Container -->
                <div class="waveform-container">
                    <div class="timeline"></div>
                    <div class="tracks-container">
                        <canvas class="waveform-canvas" id="waveformCanvas"></canvas>
                        <div class="playhead" id="playhead"></div>
                        <div class="selection-overlay" id="selectionOverlay"></div>
                    </div>
                    <div class="scrollbar-container">
                        <div class="scrollbar" id="scrollbar"></div>
                    </div>
                </div>

                <!-- Multi-track Area -->
                <div class="multitrack-container">
                    <div class="track-controls">
                        <button class="add-track-btn" id="addTrackBtn">
                            <span>➕</span> Add Track
                        </button>
                    </div>
                    <div class="tracks-list" id="tracksList">
                        <!-- Tracks will be added dynamically -->
                    </div>
                </div>

                <!-- Effects Panel -->
                <div class="effects-panel">
                    <h3>Audio Effects</h3>
                    
                    <!-- EQ Controls -->
                    <div class="effect-group">
                        <h4>🎚️ Equalizer</h4>
                        <div class="eq-controls">
                            <div class="eq-band">
                                <label>Low</label>
                                <input type="range" id="eqLow" min="-20" max="20" value="0" step="0.5">
                                <span class="value">0dB</span>
                            </div>
                            <div class="eq-band">
                                <label>Mid</label>
                                <input type="range" id="eqMid" min="-20" max="20" value="0" step="0.5">
                                <span class="value">0dB</span>
                            </div>
                            <div class="eq-band">
                                <label>High</label>
                                <input type="range" id="eqHigh" min="-20" max="20" value="0" step="0.5">
                                <span class="value">0dB</span>
                            </div>
                        </div>
                    </div>

                    <!-- Reverb Controls -->
                    <div class="effect-group">
                        <h4>🌊 Reverb</h4>
                        <div class="effect-controls">
                            <div class="control">
                                <label>Room Size</label>
                                <input type="range" id="reverbSize" min="0" max="1" value="0.3" step="0.01">
                                <span class="value">30%</span>
                            </div>
                            <div class="control">
                                <label>Decay</label>
                                <input type="range" id="reverbDecay" min="0.1" max="10" value="2" step="0.1">
                                <span class="value">2.0s</span>
                            </div>
                            <div class="control">
                                <label>Wet/Dry</label>
                                <input type="range" id="reverbMix" min="0" max="1" value="0.2" step="0.01">
                                <span class="value">20%</span>
                            </div>
                        </div>
                    </div>

                    <!-- Delay Controls -->
                    <div class="effect-group">
                        <h4>🔄 Delay</h4>
                        <div class="effect-controls">
                            <div class="control">
                                <label>Time</label>
                                <input type="range" id="delayTime" min="0.1" max="1" value="0.3" step="0.01">
                                <span class="value">300ms</span>
                            </div>
                            <div class="control">
                                <label>Feedback</label>
                                <input type="range" id="delayFeedback" min="0" max="0.9" value="0.3" step="0.01">
                                <span class="value">30%</span>
                            </div>
                            <div class="control">
                                <label>Mix</label>
                                <input type="range" id="delayMix" min="0" max="1" value="0.2" step="0.01">
                                <span class="value">20%</span>
                            </div>
                        </div>
                    </div>

                    <!-- Compressor Controls -->
                    <div class="effect-group">
                        <h4>🗜️ Compressor</h4>
                        <div class="effect-controls">
                            <div class="control">
                                <label>Threshold</label>
                                <input type="range" id="compThreshold" min="-50" max="0" value="-24" step="1">
                                <span class="value">-24dB</span>
                            </div>
                            <div class="control">
                                <label>Ratio</label>
                                <input type="range" id="compRatio" min="1" max="20" value="4" step="0.1">
                                <span class="value">4:1</span>
                            </div>
                            <div class="control">
                                <label>Attack</label>
                                <input type="range" id="compAttack" min="0" max="1" value="0.003" step="0.001">
                                <span class="value">3ms</span>
                            </div>
                            <div class="control">
                                <label>Release</label>
                                <input type="range" id="compRelease" min="0" max="1" value="0.25" step="0.01">
                                <span class="value">250ms</span>
                            </div>
                        </div>
                    </div>

                    <!-- Master Controls -->
                    <div class="effect-group">
                        <h4>🎛️ Master</h4>
                        <div class="effect-controls">
                            <div class="control">
                                <label>Volume</label>
                                <input type="range" id="masterVolume" min="0" max="2" value="1" step="0.01">
                                <span class="value">100%</span>
                            </div>
                            <div class="control">
                                <label>Pan</label>
                                <input type="range" id="masterPan" min="-1" max="1" value="0" step="0.01">
                                <span class="value">Center</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Status Bar -->
                <div class="status-bar">
                    <span id="selectionInfo">No selection</span>
                    <span id="cursorPosition">0:00</span>
                    <span id="zoomInfo">Zoom: 100%</span>
                </div>
            </div>
        `;

        this.setupCanvas();
    }

    /**
     * Set up the waveform canvas
     */
    setupCanvas() {
        this.canvas = document.getElementById('waveformCanvas');
        this.canvasContext = this.canvas.getContext('2d');
        
        // Set canvas size
        this.resizeCanvas();
        
        // Handle high DPI displays
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.canvas.offsetWidth * dpr;
        this.canvas.height = this.canvas.offsetHeight * dpr;
        this.canvasContext.scale(dpr, dpr);
    }

    /**
     * Set up audio processing chain
     */
    setupAudioChain() {
        // Create audio nodes
        this.gainNode = this.audioContext.createGain();
        this.filterNode = this.audioContext.createBiquadFilter();
        this.compressorNode = this.audioContext.createDynamicsCompressor();
        
        // Create reverb using convolver
        this.reverbNode = this.audioContext.createConvolver();
        this.reverbGain = this.audioContext.createGain();
        this.dryGain = this.audioContext.createGain();
        
        // Create delay
        this.delayNode = this.audioContext.createDelay(1.0);
        this.delayGain = this.audioContext.createGain();
        this.delayFeedback = this.audioContext.createGain();
        
        // Create EQ bands
        this.eqLow = this.audioContext.createBiquadFilter();
        this.eqMid = this.audioContext.createBiquadFilter();
        this.eqHigh = this.audioContext.createBiquadFilter();
        
        this.setupEQ();
        this.setupReverb();
        this.setupDelay();
    }

    /**
     * Set up EQ filters
     */
    setupEQ() {
        this.eqLow.type = 'lowshelf';
        this.eqLow.frequency.setValueAtTime(320, this.audioContext.currentTime);
        
        this.eqMid.type = 'peaking';
        this.eqMid.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        this.eqMid.Q.setValueAtTime(1, this.audioContext.currentTime);
        
        this.eqHigh.type = 'highshelf';
        this.eqHigh.frequency.setValueAtTime(3200, this.audioContext.currentTime);
    }

    /**
     * Set up reverb effect
     */
    async setupReverb() {
        // Create impulse response for reverb
        const length = this.audioContext.sampleRate * 2; // 2 seconds
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        
        this.reverbNode.buffer = impulse;
    }

    /**
     * Set up delay effect
     */
    setupDelay() {
        // Connect delay feedback loop
        this.delayNode.connect(this.delayFeedback);
        this.delayFeedback.connect(this.delayNode);
        this.delayNode.connect(this.delayGain);
    }

    /**
     * Load audio file
     */
    async loadAudio(audioBuffer) {
        this.audioBuffer = audioBuffer;
        this.duration = audioBuffer.duration;
        
        // Generate waveform data
        this.generateWaveformData();
        
        // Render waveform
        this.renderWaveform();
        
        // Update timeline
        this.updateTimeline();
        
        console.log('🎵 Audio loaded:', this.duration.toFixed(2) + 's');
    }

    /**
     * Generate waveform data for visualization
     */
    generateWaveformData() {
        const samples = this.audioBuffer.getChannelData(0);
        const blockSize = Math.floor(samples.length / (this.canvas.width * this.zoom));
        const waveformData = [];
        
        for (let i = 0; i < this.canvas.width * this.zoom; i++) {
            const start = i * blockSize;
            const end = start + blockSize;
            let min = 0, max = 0;
            
            for (let j = start; j < end && j < samples.length; j++) {
                const sample = samples[j];
                if (sample > max) max = sample;
                if (sample < min) min = sample;
            }
            
            waveformData.push({ min, max });
        }
        
        this.waveformData = waveformData;
    }

    /**
     * Render waveform on canvas
     */
    renderWaveform() {
        if (!this.waveformData) return;
        
        const ctx = this.canvasContext;
        const canvas = this.canvas;
        const height = canvas.offsetHeight;
        const centerY = height / 2;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.offsetWidth, height);
        
        // Draw waveform
        ctx.fillStyle = '#8b5cf6';
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < this.waveformData.length && i < canvas.offsetWidth; i++) {
            const { min, max } = this.waveformData[i];
            const x = i;
            const y1 = centerY + (min * centerY * 0.8);
            const y2 = centerY + (max * centerY * 0.8);
            
            // Draw waveform bar
            ctx.fillRect(x, Math.min(y1, y2), 1, Math.abs(y2 - y1));
        }
        
        // Draw selection if any
        this.drawSelection();
    }

    /**
     * Draw selection overlay
     */
    drawSelection() {
        if (this.selection.start === this.selection.end) return;
        
        const ctx = this.canvasContext;
        const startX = this.timeToPixel(this.selection.start);
        const endX = this.timeToPixel(this.selection.end);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(startX, 0, endX - startX, this.canvas.offsetHeight);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, 0, endX - startX, this.canvas.offsetHeight);
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Playback controls
        document.getElementById('playBtn').addEventListener('click', () => this.togglePlayback());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());
        
        // Zoom controls
        document.getElementById('zoomIn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOut').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoomFit').addEventListener('click', () => this.zoomToFit());
        
        // Canvas interactions
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        // Effect controls
        this.setupEffectControls();
        
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectTool(e.target.dataset.tool));
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    /**
     * Set up effect control listeners
     */
    setupEffectControls() {
        // EQ controls
        document.getElementById('eqLow').addEventListener('input', (e) => {
            this.eqLow.gain.setValueAtTime(parseFloat(e.target.value), this.audioContext.currentTime);
            e.target.nextElementSibling.textContent = e.target.value + 'dB';
        });
        
        document.getElementById('eqMid').addEventListener('input', (e) => {
            this.eqMid.gain.setValueAtTime(parseFloat(e.target.value), this.audioContext.currentTime);
            e.target.nextElementSibling.textContent = e.target.value + 'dB';
        });
        
        document.getElementById('eqHigh').addEventListener('input', (e) => {
            this.eqHigh.gain.setValueAtTime(parseFloat(e.target.value), this.audioContext.currentTime);
            e.target.nextElementSibling.textContent = e.target.value + 'dB';
        });
        
        // Reverb controls
        document.getElementById('reverbMix').addEventListener('input', (e) => {
            const mix = parseFloat(e.target.value);
            this.reverbGain.gain.setValueAtTime(mix, this.audioContext.currentTime);
            this.dryGain.gain.setValueAtTime(1 - mix, this.audioContext.currentTime);
            e.target.nextElementSibling.textContent = Math.round(mix * 100) + '%';
        });
        
        // Delay controls
        document.getElementById('delayTime').addEventListener('input', (e) => {
            this.delayNode.delayTime.setValueAtTime(parseFloat(e.target.value), this.audioContext.currentTime);
            e.target.nextElementSibling.textContent = Math.round(e.target.value * 1000) + 'ms';
        });
        
        document.getElementById('delayFeedback').addEventListener('input', (e) => {
            this.delayFeedback.gain.setValueAtTime(parseFloat(e.target.value), this.audioContext.currentTime);
            e.target.nextElementSibling.textContent = Math.round(e.target.value * 100) + '%';
        });
        
        // Master volume
        document.getElementById('masterVolume').addEventListener('input', (e) => {
            this.gainNode.gain.setValueAtTime(parseFloat(e.target.value), this.audioContext.currentTime);
            e.target.nextElementSibling.textContent = Math.round(e.target.value * 100) + '%';
        });
    }

    /**
     * Connect audio processing chain
     */
    connectAudioChain() {
        if (!this.sourceNode) return;
        
        // Connect the audio processing chain
        this.sourceNode
            .connect(this.eqLow)
            .connect(this.eqMid)
            .connect(this.eqHigh)
            .connect(this.compressorNode)
            .connect(this.gainNode);
        
        // Dry signal
        this.gainNode.connect(this.dryGain);
        this.dryGain.connect(this.audioContext.destination);
        
        // Reverb send
        this.gainNode.connect(this.reverbNode);
        this.reverbNode.connect(this.reverbGain);
        this.reverbGain.connect(this.audioContext.destination);
        
        // Delay send
        this.gainNode.connect(this.delayNode);
        this.delayGain.connect(this.audioContext.destination);
    }

    /**
     * Play audio
     */
    async play(startTime = this.currentTime) {
        if (!this.audioBuffer || this.isPlaying) return;
        
        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        // Create new source node
        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        
        // Connect audio chain
        this.connectAudioChain();
        
        // Start playback
        this.sourceNode.start(0, startTime);
        this.isPlaying = true;
        this.startTime = this.audioContext.currentTime - startTime;
        
        // Update play button
        document.getElementById('playBtn').innerHTML = '<span>⏸️</span> Pause';
        
        // Start playhead animation
        this.animatePlayhead();
        
        // Handle playback end
        this.sourceNode.addEventListener('ended', () => {
            this.stop();
        });
    }

    /**
     * Pause audio
     */
    pause() {
        if (!this.isPlaying) return;
        
        this.sourceNode?.stop();
        this.isPlaying = false;
        this.currentTime = Math.min(this.audioContext.currentTime - this.startTime, this.duration);
        
        document.getElementById('playBtn').innerHTML = '<span>▶️</span> Play';
    }

    /**
     * Stop audio
     */
    stop() {
        if (this.sourceNode) {
            this.sourceNode.stop();
        }
        
        this.isPlaying = false;
        this.currentTime = 0;
        
        document.getElementById('playBtn').innerHTML = '<span>▶️</span> Play';
        this.updatePlayhead();
    }

    /**
     * Toggle playback
     */
    togglePlayback() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Animate playhead during playback
     */
    animatePlayhead() {
        if (!this.isPlaying) return;
        
        this.currentTime = Math.min(this.audioContext.currentTime - this.startTime, this.duration);
        this.updatePlayhead();
        
        requestAnimationFrame(() => this.animatePlayhead());
    }

    /**
     * Update playhead position
     */
    updatePlayhead() {
        const playhead = document.getElementById('playhead');
        const position = this.timeToPixel(this.currentTime);
        playhead.style.left = position + 'px';
        
        // Update cursor position display
        document.getElementById('cursorPosition').textContent = this.formatTime(this.currentTime);
    }

    /**
     * Convert time to pixel position
     */
    timeToPixel(time) {
        return (time / this.duration) * this.canvas.offsetWidth * this.zoom;
    }

    /**
     * Convert pixel position to time
     */
    pixelToTime(pixel) {
        return (pixel / (this.canvas.offsetWidth * this.zoom)) * this.duration;
    }

    /**
     * Format time for display
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Zoom controls
     */
    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.5, 10);
        this.updateZoom();
    }

    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.5, 0.1);
        this.updateZoom();
    }

    zoomToFit() {
        this.zoom = 1;
        this.updateZoom();
    }

    updateZoom() {
        document.querySelector('.zoom-level').textContent = Math.round(this.zoom * 100) + '%';
        this.generateWaveformData();
        this.renderWaveform();
        this.updatePlayhead();
    }

    /**
     * Audio editing operations
     */
    trimToSelection() {
        if (this.selection.start === this.selection.end) return;
        
        const startSample = Math.floor(this.selection.start * this.audioBuffer.sampleRate);
        const endSample = Math.floor(this.selection.end * this.audioBuffer.sampleRate);
        const newLength = endSample - startSample;
        
        const newBuffer = this.audioContext.createBuffer(
            this.audioBuffer.numberOfChannels,
            newLength,
            this.audioBuffer.sampleRate
        );
        
        for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
            const oldData = this.audioBuffer.getChannelData(channel);
            const newData = newBuffer.getChannelData(channel);
            
            for (let i = 0; i < newLength; i++) {
                newData[i] = oldData[startSample + i];
            }
        }
        
        this.loadAudio(newBuffer);
        this.clearSelection();
    }

    /**
     * Apply fade in/out to selection
     */
    applyFade(type = 'in') {
        if (this.selection.start === this.selection.end) return;
        
        const startSample = Math.floor(this.selection.start * this.audioBuffer.sampleRate);
        const endSample = Math.floor(this.selection.end * this.audioBuffer.sampleRate);
        const fadeLength = endSample - startSample;
        
        for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
            const channelData = this.audioBuffer.getChannelData(channel);
            
            for (let i = startSample; i < endSample; i++) {
                const progress = (i - startSample) / fadeLength;
                const gain = type === 'in' ? progress : (1 - progress);
                channelData[i] *= gain;
            }
        }
        
        this.renderWaveform();
    }

    /**
     * Mouse event handlers
     */
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = this.pixelToTime(x);
        
        this.currentTime = time;
        this.selection.start = time;
        this.selection.end = time;
        
        this.isDragging = true;
        this.updatePlayhead();
    }

    onMouseMove(e) {
        if (!this.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = this.pixelToTime(x);
        
        this.selection.end = time;
        this.renderWaveform();
        this.updateSelectionInfo();
    }

    onMouseUp(e) {
        this.isDragging = false;
        
        // Sort selection
        if (this.selection.start > this.selection.end) {
            [this.selection.start, this.selection.end] = [this.selection.end, this.selection.start];
        }
    }

    /**
     * Update selection info display
     */
    updateSelectionInfo() {
        const duration = Math.abs(this.selection.end - this.selection.start);
        const info = duration > 0.01 
            ? `Selection: ${this.formatTime(duration)} (${this.formatTime(this.selection.start)} - ${this.formatTime(this.selection.end)})`
            : 'No selection';
        
        document.getElementById('selectionInfo').textContent = info;
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.selection.start = 0;
        this.selection.end = 0;
        this.renderWaveform();
        this.updateSelectionInfo();
    }

    /**
     * Resize canvas
     */
    resizeCanvas() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight;
        
        this.renderWaveform();
    }

    /**
     * Keyboard shortcuts
     */
    onKeyDown(e) {
        switch (e.key) {
            case ' ':
                e.preventDefault();
                this.togglePlayback();
                break;
            case 'Delete':
                if (this.selection.start !== this.selection.end) {
                    this.trimToSelection();
                }
                break;
            case 'Escape':
                this.clearSelection();
                break;
        }
    }

    /**
     * Export edited audio
     */
    async exportAudio(format = 'wav') {
        // This would implement audio export functionality
        // For now, we'll create a download link
        const audioData = this.audioBufferToWav(this.audioBuffer);
        const blob = new Blob([audioData], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `edited_track.${format}`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Convert AudioBuffer to WAV
     */
    audioBufferToWav(buffer) {
        const length = buffer.length;
        const numberOfChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
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
        
        // Convert float samples to 16-bit PCM
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample * 0x7FFF, true);
                offset += 2;
            }
        }
        
        return arrayBuffer;
    }
}

// Export for use in main app
window.AdvancedAudioEditor = AdvancedAudioEditor;