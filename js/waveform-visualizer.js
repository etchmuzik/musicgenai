// Advanced Waveform Visualization System
class WaveformVisualizer {
    constructor(canvas, audioEngine) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioEngine = audioEngine;
        this.width = canvas.width;
        this.height = canvas.height;
        this.animationId = null;
        this.isDrawing = false;
        
        // Visualization settings
        this.settings = {
            backgroundColor: '#0a0a0a',
            waveformColor: '#00d4ff',
            progressColor: '#ffffff',
            gridColor: 'rgba(255, 255, 255, 0.1)',
            cursorColor: '#ff6b6b',
            selectionColor: 'rgba(0, 212, 255, 0.3)',
            frequencyColor: '#7c3aed',
            barCount: 64,
            smoothing: 0.8,
            amplification: 1.5
        };
        
        // Interaction state
        this.isDragging = false;
        this.isSelecting = false;
        this.selectionStart = 0;
        this.selectionEnd = 0;
        this.cursorPosition = 0;
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupInteractions();
        this.setupAudioEngineListeners();
        this.startVisualization();
    }

    setupCanvas() {
        // Handle high DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.width = rect.width;
        this.height = rect.height;
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    setupInteractions() {
        let startX = 0;
        let startTime = 0;
        
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startTime = (startX / this.width) * this.audioEngine.duration;
            
            if (e.shiftKey) {
                // Start selection
                this.isSelecting = true;
                this.selectionStart = startTime;
                this.selectionEnd = startTime;
            } else {
                // Seek to position
                this.audioEngine.seek(startTime);
                this.isDragging = true;
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const time = (x / this.width) * this.audioEngine.duration;
            
            if (this.isSelecting) {
                this.selectionEnd = time;
                this.drawWaveform();
            } else if (this.isDragging) {
                this.audioEngine.seek(time);
            }
            
            // Update cursor position for hover effect
            this.cursorPosition = time;
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            if (this.isSelecting) {
                this.isSelecting = false;
                this.onSelectionMade(
                    Math.min(this.selectionStart, this.selectionEnd),
                    Math.max(this.selectionStart, this.selectionEnd)
                );
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.isSelecting = false;
        });

        // Double click to clear selection
        this.canvas.addEventListener('dblclick', () => {
            this.clearSelection();
        });
    }

    setupAudioEngineListeners() {
        this.audioEngine.on('audioLoaded', () => {
            this.generateWaveformData();
        });

        this.audioEngine.on('timeUpdate', (data) => {
            this.drawWaveform();
        });
    }

    async generateWaveformData() {
        if (!this.audioEngine.audioBuffer) return;
        
        const audioBuffer = this.audioEngine.audioBuffer;
        const rawData = audioBuffer.getChannelData(0); // Use first channel
        const samples = this.width; // One sample per pixel
        const blockSize = Math.floor(rawData.length / samples);
        
        this.waveformData = [];
        
        for (let i = 0; i < samples; i++) {
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
                sum += Math.abs(rawData[i * blockSize + j]);
            }
            this.waveformData.push(sum / blockSize);
        }
        
        // Normalize
        const max = Math.max(...this.waveformData);
        this.waveformData = this.waveformData.map(value => value / max);
        
        this.drawWaveform();
    }

    startVisualization() {
        if (this.isDrawing) return;
        this.isDrawing = true;
        
        const draw = () => {
            if (!this.isDrawing) return;
            
            this.drawSpectrum();
            this.animationId = requestAnimationFrame(draw);
        };
        
        draw();
    }

    stopVisualization() {
        this.isDrawing = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    drawWaveform() {
        this.ctx.fillStyle = this.settings.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (!this.waveformData) return;
        
        this.drawGrid();
        this.drawWaveformBars();
        this.drawSelection();
        this.drawPlayhead();
        this.drawTimeLabels();
    }

    drawGrid() {
        this.ctx.strokeStyle = this.settings.gridColor;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 4]);
        
        // Horizontal lines
        for (let i = 0; i <= 4; i++) {
            const y = (this.height / 4) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
        
        // Vertical time markers
        const duration = this.audioEngine.duration || 1;
        const timeStep = duration > 60 ? 10 : duration > 10 ? 5 : 1;
        
        for (let time = 0; time <= duration; time += timeStep) {
            const x = (time / duration) * this.width;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }

    drawWaveformBars() {
        if (!this.waveformData) return;
        
        const barWidth = this.width / this.waveformData.length;
        const centerY = this.height / 2;
        
        this.ctx.fillStyle = this.settings.waveformColor;
        
        for (let i = 0; i < this.waveformData.length; i++) {
            const amplitude = this.waveformData[i] * this.settings.amplification;
            const barHeight = amplitude * (this.height / 2) * 0.8;
            const x = i * barWidth;
            
            // Draw positive half
            this.ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight);
            
            // Draw negative half (mirror)
            this.ctx.fillRect(x, centerY, barWidth - 1, barHeight);
        }
    }

    drawSelection() {
        if (this.selectionStart === this.selectionEnd) return;
        
        const duration = this.audioEngine.duration || 1;
        const startX = (this.selectionStart / duration) * this.width;
        const endX = (this.selectionEnd / duration) * this.width;
        
        this.ctx.fillStyle = this.settings.selectionColor;
        this.ctx.fillRect(startX, 0, endX - startX, this.height);
        
        // Selection borders
        this.ctx.strokeStyle = this.settings.progressColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, 0);
        this.ctx.lineTo(startX, this.height);
        this.ctx.moveTo(endX, 0);
        this.ctx.lineTo(endX, this.height);
        this.ctx.stroke();
    }

    drawPlayhead() {
        const duration = this.audioEngine.duration || 1;
        const currentTime = this.audioEngine.currentTime || 0;
        const x = (currentTime / duration) * this.width;
        
        this.ctx.strokeStyle = this.settings.cursorColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.height);
        this.ctx.stroke();
        
        // Playhead circle
        this.ctx.fillStyle = this.settings.cursorColor;
        this.ctx.beginPath();
        this.ctx.arc(x, 10, 4, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    drawTimeLabels() {
        const duration = this.audioEngine.duration || 1;
        const currentTime = this.audioEngine.currentTime || 0;
        
        this.ctx.fillStyle = this.settings.progressColor;
        this.ctx.font = '12px Inter, sans-serif';
        
        // Current time
        const currentTimeStr = this.formatTime(currentTime);
        this.ctx.fillText(currentTimeStr, 10, this.height - 10);
        
        // Total duration
        const durationStr = this.formatTime(duration);
        const durationWidth = this.ctx.measureText(durationStr).width;
        this.ctx.fillText(durationStr, this.width - durationWidth - 10, this.height - 10);
        
        // Selection info
        if (this.selectionStart !== this.selectionEnd) {
            const selectionDuration = Math.abs(this.selectionEnd - this.selectionStart);
            const selectionStr = `Selection: ${this.formatTime(selectionDuration)}`;
            const selectionWidth = this.ctx.measureText(selectionStr).width;
            this.ctx.fillText(selectionStr, (this.width - selectionWidth) / 2, this.height - 10);
        }
    }

    drawSpectrum() {
        if (!this.audioEngine.isPlaying) return;
        
        const freqData = this.audioEngine.getFrequencyData();
        if (freqData.length === 0) return;
        
        // Draw frequency spectrum in top quarter
        const spectrumHeight = this.height * 0.25;
        const barWidth = this.width / this.settings.barCount;
        
        this.ctx.fillStyle = this.settings.frequencyColor;
        
        for (let i = 0; i < this.settings.barCount; i++) {
            const value = freqData[i] / 255;
            const barHeight = value * spectrumHeight;
            const x = i * barWidth;
            
            this.ctx.fillRect(x, spectrumHeight - barHeight, barWidth - 2, barHeight);
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Selection methods
    getSelection() {
        if (this.selectionStart === this.selectionEnd) return null;
        return {
            start: Math.min(this.selectionStart, this.selectionEnd),
            end: Math.max(this.selectionStart, this.selectionEnd)
        };
    }

    setSelection(start, end) {
        this.selectionStart = start;
        this.selectionEnd = end;
        this.drawWaveform();
    }

    clearSelection() {
        this.selectionStart = 0;
        this.selectionEnd = 0;
        this.drawWaveform();
    }

    onSelectionMade(start, end) {
        // Emit custom event for selection
        this.canvas.dispatchEvent(new CustomEvent('selectionMade', {
            detail: { start, end, duration: end - start }
        }));
    }

    // Zoom functionality
    zoomToSelection() {
        const selection = this.getSelection();
        if (!selection) return;
        
        // This would require more complex implementation
        // For now, just log the zoom request
        console.log('Zoom to selection:', selection);
    }

    zoomFit() {
        // Reset zoom to show full waveform
        this.generateWaveformData();
    }

    // Settings
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.drawWaveform();
    }

    // Cleanup
    destroy() {
        this.stopVisualization();
        
        // Remove event listeners
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    }
}

// Advanced spectrum analyzer
class SpectrumAnalyzer {
    constructor(canvas, audioEngine) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioEngine = audioEngine;
        this.animationId = null;
        this.isActive = false;
        
        this.settings = {
            backgroundColor: '#0a0a0a',
            barColor: '#00d4ff',
            peakColor: '#ffffff',
            gridColor: 'rgba(255, 255, 255, 0.1)',
            barCount: 32,
            smoothing: 0.8
        };
        
        this.peaks = new Array(this.settings.barCount).fill(0);
        this.peakHold = new Array(this.settings.barCount).fill(0);
        
        this.setupCanvas();
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.width = rect.width;
        this.height = rect.height;
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.animate();
    }

    stop() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    animate() {
        if (!this.isActive) return;
        
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = this.settings.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (!this.audioEngine.isPlaying) return;
        
        const freqData = this.audioEngine.getFrequencyData();
        if (freqData.length === 0) return;
        
        const barWidth = this.width / this.settings.barCount;
        const binSize = Math.floor(freqData.length / this.settings.barCount);
        
        this.ctx.fillStyle = this.settings.barColor;
        
        for (let i = 0; i < this.settings.barCount; i++) {
            // Average frequency bins for this bar
            let sum = 0;
            for (let j = 0; j < binSize; j++) {
                sum += freqData[i * binSize + j];
            }
            const average = sum / binSize;
            const normalizedValue = average / 255;
            
            // Smooth the value
            this.peaks[i] = this.peaks[i] * this.settings.smoothing + 
                            normalizedValue * (1 - this.settings.smoothing);
            
            // Update peak hold
            if (this.peaks[i] > this.peakHold[i]) {
                this.peakHold[i] = this.peaks[i];
            } else {
                this.peakHold[i] *= 0.995; // Slow decay
            }
            
            const barHeight = this.peaks[i] * this.height;
            const x = i * barWidth;
            
            // Draw main bar
            this.ctx.fillRect(x + 1, this.height - barHeight, barWidth - 2, barHeight);
            
            // Draw peak indicator
            this.ctx.fillStyle = this.settings.peakColor;
            const peakY = this.height - (this.peakHold[i] * this.height);
            this.ctx.fillRect(x + 1, peakY - 1, barWidth - 2, 2);
            
            this.ctx.fillStyle = this.settings.barColor;
        }
    }
}

export { WaveformVisualizer, SpectrumAnalyzer };