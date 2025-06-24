// Generation Progress UI Component
class GenerationProgressUI {
    constructor() {
        this.progressSteps = [
            { percent: 0, label: 'Initializing...', icon: 'fa-hourglass-start' },
            { percent: 10, label: 'Creating task...', icon: 'fa-cloud-upload-alt' },
            { percent: 20, label: 'Processing request...', icon: 'fa-cog' },
            { percent: 30, label: 'Analyzing style...', icon: 'fa-brain' },
            { percent: 40, label: 'Composing melody...', icon: 'fa-music' },
            { percent: 50, label: 'Generating harmony...', icon: 'fa-guitar' },
            { percent: 60, label: 'Adding instruments...', icon: 'fa-drum' },
            { percent: 70, label: 'Mixing tracks...', icon: 'fa-sliders-h' },
            { percent: 80, label: 'Mastering audio...', icon: 'fa-headphones' },
            { percent: 90, label: 'Finalizing...', icon: 'fa-compact-disc' },
            { percent: 100, label: 'Complete!', icon: 'fa-check-circle' }
        ];
        
        this.currentStep = 0;
        this.progressInterval = null;
        this.startTime = null;
    }

    // Create progress overlay
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'generationProgressOverlay';
        overlay.className = 'generation-progress-overlay';
        overlay.innerHTML = `
            <div class="generation-progress-content">
                <div class="generation-header">
                    <h2>Creating Your Music</h2>
                    <button class="cancel-btn" onclick="generationProgress.cancel()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="progress-visualization">
                    <div class="progress-circle">
                        <svg viewBox="0 0 200 200">
                            <circle cx="100" cy="100" r="90" fill="none" stroke="var(--border)" stroke-width="4"/>
                            <circle cx="100" cy="100" r="90" fill="none" stroke="var(--primary)" stroke-width="4"
                                stroke-dasharray="565.5" stroke-dashoffset="565.5" 
                                transform="rotate(-90 100 100)" id="progressCircle"/>
                        </svg>
                        <div class="progress-icon">
                            <i class="fas fa-hourglass-start" id="progressIcon"></i>
                        </div>
                    </div>
                    
                    <div class="progress-percent" id="progressPercent">0%</div>
                </div>
                
                <div class="progress-details">
                    <div class="progress-step" id="progressStep">Initializing...</div>
                    <div class="progress-time" id="progressTime">Estimated time: 30-60 seconds</div>
                </div>
                
                <div class="progress-bar-wrapper">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                </div>
                
                <div class="progress-tips">
                    <div class="tip-icon"><i class="fas fa-lightbulb"></i></div>
                    <div class="tip-text" id="progressTip">
                        Tip: The more specific your description, the better the results!
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        return overlay;
    }

    // Show progress
    show() {
        let overlay = document.getElementById('generationProgressOverlay');
        if (!overlay) {
            overlay = this.createOverlay();
        }
        
        overlay.classList.add('active');
        this.startTime = Date.now();
        this.currentStep = 0;
        this.updateProgress(0);
        
        // Start rotating tips
        this.startTipRotation();
    }

    // Hide progress
    hide() {
        const overlay = document.getElementById('generationProgressOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            this.stopTipRotation();
        }
    }

    // Update progress
    updateProgress(percent, customMessage = null) {
        // Find appropriate step
        for (let i = this.progressSteps.length - 1; i >= 0; i--) {
            if (percent >= this.progressSteps[i].percent) {
                this.currentStep = i;
                break;
            }
        }
        
        const step = this.progressSteps[this.currentStep];
        
        // Update UI elements
        document.getElementById('progressPercent').textContent = `${Math.round(percent)}%`;
        document.getElementById('progressStep').textContent = customMessage || step.label;
        document.getElementById('progressIcon').className = `fas ${step.icon}`;
        
        // Update progress bar
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }
        
        // Update circular progress
        const progressCircle = document.getElementById('progressCircle');
        if (progressCircle) {
            const circumference = 2 * Math.PI * 90;
            const offset = circumference - (percent / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
        }
        
        // Update time estimate
        if (this.startTime) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const estimated = Math.floor((elapsed / percent) * 100);
            const remaining = estimated - elapsed;
            
            if (percent > 10 && remaining > 0) {
                document.getElementById('progressTime').textContent = 
                    `Time remaining: ~${remaining} seconds`;
            }
        }
    }

    // Tips rotation
    startTipRotation() {
        const tips = [
            "Tip: The more specific your description, the better the results!",
            "Tip: Try combining different genres for unique sounds.",
            "Tip: Add mood descriptors like 'upbeat' or 'melancholic'.",
            "Tip: Mention specific instruments for better control.",
            "Tip: Use reference artists or songs for style guidance.",
            "Did you know? Our AI analyzes millions of songs to create yours.",
            "Fun fact: Each generation is completely unique!",
            "Tip: Save your favorites to build your personal library."
        ];
        
        let tipIndex = 0;
        this.tipInterval = setInterval(() => {
            tipIndex = (tipIndex + 1) % tips.length;
            const tipElement = document.getElementById('progressTip');
            if (tipElement) {
                tipElement.style.opacity = '0';
                setTimeout(() => {
                    tipElement.textContent = tips[tipIndex];
                    tipElement.style.opacity = '1';
                }, 300);
            }
        }, 5000);
    }

    // Stop tip rotation
    stopTipRotation() {
        if (this.tipInterval) {
            clearInterval(this.tipInterval);
            this.tipInterval = null;
        }
    }

    // Cancel generation
    cancel() {
        if (confirm('Are you sure you want to cancel the generation?')) {
            this.hide();
            if (window.musicGenerator) {
                window.musicGenerator.cancelGeneration();
            }
            // Refund credits
            if (window.creditsManager) {
                window.creditsManager.addCredits(10);
            }
        }
    }

    // Show success animation
    showSuccess() {
        const icon = document.getElementById('progressIcon');
        if (icon) {
            icon.className = 'fas fa-check-circle';
            icon.style.color = 'var(--success)';
        }
        
        const step = document.getElementById('progressStep');
        if (step) {
            step.textContent = 'Music generated successfully!';
        }
        
        setTimeout(() => this.hide(), 2000);
    }

    // Show error
    showError(message) {
        const icon = document.getElementById('progressIcon');
        if (icon) {
            icon.className = 'fas fa-exclamation-circle';
            icon.style.color = 'var(--error)';
        }
        
        const step = document.getElementById('progressStep');
        if (step) {
            step.textContent = `Error: ${message}`;
        }
        
        setTimeout(() => this.hide(), 3000);
    }
}

// Create global instance
window.generationProgress = new GenerationProgressUI();

// CSS for the progress overlay
const progressStyles = `
<style>
.generation-progress-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.generation-progress-overlay.active {
    opacity: 1;
    visibility: visible;
}

.generation-progress-content {
    background: var(--bg-card);
    border-radius: 16px;
    padding: 3rem;
    max-width: 500px;
    width: 90%;
    border: 1px solid var(--border);
}

.generation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.generation-header h2 {
    margin: 0;
    font-size: 1.5rem;
}

.cancel-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.5rem;
    transition: color 0.2s;
}

.cancel-btn:hover {
    color: var(--error);
}

.progress-visualization {
    text-align: center;
    margin-bottom: 2rem;
    position: relative;
}

.progress-circle {
    width: 150px;
    height: 150px;
    margin: 0 auto;
    position: relative;
}

.progress-circle svg {
    width: 100%;
    height: 100%;
}

.progress-circle circle {
    transition: stroke-dashoffset 0.3s ease;
}

.progress-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 3rem;
    color: var(--primary);
}

.progress-percent {
    font-size: 2rem;
    font-weight: 700;
    margin-top: 1rem;
    color: var(--primary);
}

.progress-details {
    text-align: center;
    margin-bottom: 2rem;
}

.progress-step {
    font-size: 1.125rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
}

.progress-time {
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.progress-bar-wrapper {
    margin-bottom: 2rem;
}

.progress-bar {
    height: 6px;
    background: var(--border);
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: var(--gradient-primary);
    width: 0%;
    transition: width 0.3s ease;
}

.progress-tips {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
}

.tip-icon {
    color: var(--accent);
    font-size: 1.25rem;
}

.tip-text {
    flex: 1;
    font-size: 0.875rem;
    color: var(--text-secondary);
    transition: opacity 0.3s ease;
}

@media (max-width: 600px) {
    .generation-progress-content {
        padding: 2rem;
    }
    
    .progress-circle {
        width: 120px;
        height: 120px;
    }
    
    .progress-icon {
        font-size: 2.5rem;
    }
}
</style>
`;

// Add styles to document
document.head.insertAdjacentHTML('beforeend', progressStyles);