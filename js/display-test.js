/**
 * PulseScope - Display & Dead Pixel Module
 */

(function () {
    let frameCount = 0;
    let startTime = performance.now();
    let detectedHz = 60;

    const DEAD_PIXEL_COLORS = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#cyan', '#magenta'];
    let currentColorIndex = 0;

    document.addEventListener('DOMContentLoaded', () => {
        initDisplayHzTester();
        initDeadPixelTester();
    });

    function initDisplayHzTester() {
        function measureHz() {
            frameCount++;
            const now = performance.now();
            const elapsed = now - startTime;

            if (elapsed >= 1000) {
                detectedHz = Math.round((frameCount * 1000) / elapsed);
                frameCount = 0;
                startTime = now;

                PulseScopeState.display.detectedHz = detectedHz;
                PulseScopeState.display.tested = true;

                const hzEl = document.getElementById('detectedDisplayHz');
                const textEl = document.getElementById('hzAssessmentText');
                const dashVal = document.getElementById('dashDisplayStatus');

                if (hzEl) hzEl.textContent = detectedHz;
                if (dashVal) {
                    dashVal.textContent = `${detectedHz} Hz`;
                    dashVal.style.color = detectedHz >= 144 ? 'var(--accent-color)' : 'var(--neon-blue)';
                }

                if (textEl) {
                    if (detectedHz >= 230) {
                        textEl.textContent = '⚡ 240Hz/360Hz E-Spor Oyuncu Monitörü';
                    } else if (detectedHz >= 135) {
                        textEl.textContent = '🎮 144Hz/165Hz Oyuncu Monitörü';
                    } else {
                        textEl.textContent = '📺 Standart Monitör (60Hz/75Hz)';
                    }
                }
            }
            requestAnimationFrame(measureHz);
        }
        requestAnimationFrame(measureHz);
    }

    function initDeadPixelTester() {
        const startBtn = document.getElementById('startDeadPixelTestBtn');
        const overlay = document.getElementById('deadPixelOverlay');
        if (!startBtn || !overlay) return;

        startBtn.addEventListener('click', () => {
            PulseScopeState.display.deadPixelTested = true;
            currentColorIndex = 0;
            overlay.style.backgroundColor = DEAD_PIXEL_COLORS[currentColorIndex];
            overlay.classList.remove('hidden');

            if (overlay.requestFullscreen) {
                overlay.requestFullscreen();
            }
        });

        overlay.addEventListener('click', () => {
            currentColorIndex = (currentColorIndex + 1) % DEAD_PIXEL_COLORS.length;
            overlay.style.backgroundColor = DEAD_PIXEL_COLORS[currentColorIndex];
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
                overlay.classList.add('hidden');
                if (document.exitFullscreen) document.exitFullscreen();
            }
        });
    }
})();
