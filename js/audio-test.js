/**
 * PulseScope - Audio, Sub-Bass & Burn-in Pink Noise Module
 */

(function () {
    let audioCtx = null;
    let currentOscillator = null;
    let sweepInterval = null;
    let pannerNode = null;
    let is8DPlaying = false;
    let spatialAnimationId = null;

    document.addEventListener('DOMContentLoaded', () => {
        initAudioControls();
    });

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function initAudioControls() {
        const leftBtn = document.getElementById('playLeftAudio');
        const rightBtn = document.getElementById('playRightAudio');
        const centerBtn = document.getElementById('playCenterAudio');
        const subBassBtn = document.getElementById('playSubBassBtn');
        const pinkNoiseBtn = document.getElementById('playPinkNoiseBtn');

        if (leftBtn) leftBtn.addEventListener('click', () => playChannelTone(-1));
        if (rightBtn) rightBtn.addEventListener('click', () => playChannelTone(1));
        if (centerBtn) centerBtn.addEventListener('click', () => playChannelTone(0));

        if (subBassBtn) {
            subBassBtn.addEventListener('click', () => playFrequencyTone(40, 3000));
        }

        if (pinkNoiseBtn) {
            pinkNoiseBtn.addEventListener('click', playPinkNoise);
        }

        const sweepBtn = document.getElementById('startSweepBtn');
        const stopBtn = document.getElementById('stopAudioBtn');
        if (sweepBtn) sweepBtn.addEventListener('click', startFrequencySweep);
        if (stopBtn) stopBtn.addEventListener('click', stopAudio);

        const spatialBtn = document.getElementById('toggle8DAudio');
        if (spatialBtn) spatialBtn.addEventListener('click', toggle8DSimulation);

        initMicTester();
    }

    function playChannelTone(panValue) {
        stopAudio();
        const ctx = getAudioContext();
        PulseScopeState.audio.channelTested = true;

        const osc = ctx.createOscillator();
        const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);

        if (panner) {
            panner.pan.setValueAtTime(panValue, ctx.currentTime);
            osc.connect(gain);
            gain.connect(panner);
            panner.connect(ctx.destination);
        } else {
            osc.connect(gain);
            gain.connect(ctx.destination);
        }

        osc.start();
        currentOscillator = osc;
        setTimeout(() => stopAudio(), 2000);
    }

    function playFrequencyTone(freq, durationMs) {
        stopAudio();
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        currentOscillator = osc;

        setTimeout(() => stopAudio(), durationMs);
    }

    /**
     * Headphones Burn-in Pink Noise Synthesizer
     */
    function playPinkNoise() {
        stopAudio();
        const ctx = getAudioContext();
        PulseScopeState.audio.pinkNoiseTested = true;

        const bufferSize = ctx.sampleRate * 3; // 3 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            data[i] *= 0.05; // safe volume level
            b6 = white * 0.115926;
        }

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = buffer;
        noiseNode.connect(ctx.destination);
        noiseNode.start();
    }

    function startFrequencySweep() {
        stopAudio();
        const ctx = getAudioContext();
        PulseScopeState.audio.sweepTested = true;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        let freq = 20;

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        currentOscillator = osc;

        sweepInterval = setInterval(() => {
            freq += Math.round(freq * 0.05) + 10;
            if (freq >= 20000) {
                freq = 20000;
                stopAudio();
            }
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            const freqDisp = document.getElementById('currentFreqVal');
            if (freqDisp) freqDisp.textContent = freq;
        }, 80);
    }

    function toggle8DSimulation() {
        if (is8DPlaying) {
            stopAudio();
            return;
        }

        stopAudio();
        const ctx = getAudioContext();
        PulseScopeState.audio.spatialTested = true;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        pannerNode = ctx.createPanner();

        pannerNode.panningModel = 'HRTF';
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);

        osc.connect(gain);
        gain.connect(pannerNode);
        pannerNode.connect(ctx.destination);

        osc.start();
        currentOscillator = osc;
        is8DPlaying = true;

        let angle = 0;
        const orbitNode = document.getElementById('soundOrbitNode');

        function animateOrbit() {
            if (!is8DPlaying) return;
            angle += 0.03;
            const x = Math.sin(angle) * 3;
            const z = Math.cos(angle) * 3;
            pannerNode.setPosition(x, 0, z);

            if (orbitNode) {
                const uiX = Math.sin(angle) * 70 + 70;
                const uiY = Math.cos(angle) * 70 + 70;
                orbitNode.style.transform = `translate(${uiX}px, ${uiY}px)`;
            }

            spatialAnimationId = requestAnimationFrame(animateOrbit);
        }
        animateOrbit();
    }

    function stopAudio() {
        if (currentOscillator) {
            try { currentOscillator.stop(); } catch (e) {}
            currentOscillator = null;
        }
        if (sweepInterval) {
            clearInterval(sweepInterval);
            sweepInterval = null;
        }
        if (spatialAnimationId) {
            cancelAnimationFrame(spatialAnimationId);
            spatialAnimationId = null;
        }
        is8DPlaying = false;
    }

    function initMicTester() {
        const startBtn = document.getElementById('startMicBtn');
        const stopBtn = document.getElementById('stopMicBtn');
        if (!startBtn) return;

        let micStream = null;
        let micAnalyser = null;

        startBtn.addEventListener('click', async () => {
            try {
                micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const ctx = getAudioContext();
                const source = ctx.createMediaStreamSource(micStream);
                micAnalyser = ctx.createAnalyser();
                micAnalyser.fftSize = 256;

                source.connect(micAnalyser);
                startBtn.disabled = true;
                stopBtn.disabled = false;
                drawMicWaveform(micAnalyser);
            } catch (err) {
                alert('Mikrofon erişimi engellendi!');
            }
        });

        stopBtn.addEventListener('click', () => {
            if (micStream) {
                micStream.getTracks().forEach(t => t.stop());
                micStream = null;
            }
            startBtn.disabled = false;
            stopBtn.disabled = true;
        });
    }

    function drawMicWaveform(micAnalyser) {
        const canvas = document.getElementById('micWaveformCanvas');
        if (!canvas || !micAnalyser) return;

        const ctx = canvas.getContext('2d');
        const bufferLength = micAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function render() {
            requestAnimationFrame(render);
            micAnalyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
            const average = sum / bufferLength;

            const volBar = document.getElementById('micVolumeLevel');
            const dbVal = document.getElementById('micDbReadout');
            if (volBar) volBar.style.width = `${Math.min(100, Math.round((average / 128) * 100))}%`;
            if (dbVal) dbVal.textContent = `${Math.round(average)} dB`;

            ctx.fillStyle = '#04060a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;
                ctx.fillStyle = '#00ff66';
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        }
        render();
    }
})();
