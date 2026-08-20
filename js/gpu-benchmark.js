/**
 * PulseScope - GPU Benchmark Module
 */

(function () {
    document.addEventListener('DOMContentLoaded', () => {
        const startBtn = document.getElementById('startGpuBenchBtn');
        if (startBtn) startBtn.addEventListener('click', runGpuStressBenchmark);
    });

    function runGpuStressBenchmark() {
        const canvas = document.getElementById('gpuBenchCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const startBtn = document.getElementById('startGpuBenchBtn');
        const badge = document.getElementById('gpuScoreBadge');

        if (startBtn) startBtn.disabled = true;
        if (badge) {
            badge.textContent = 'Stres Testi Çalışıyor...';
            badge.className = 'badge badge-warning';
        }

        let particles = [];
        for (let i = 0; i < 2500; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`
            });
        }

        let totalFrames = 0;
        const testStartTime = performance.now();

        function renderBenchmark() {
            totalFrames++;
            const elapsed = performance.now() - testStartTime;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            });

            if (elapsed < 8000) {
                requestAnimationFrame(renderBenchmark);
            } else {
                const avgFps = Math.round((totalFrames * 1000) / elapsed);
                const finalScore = avgFps * 240 + Math.floor(Math.random() * 300);

                PulseScopeState.gpu.score = finalScore;
                PulseScopeState.gpu.tested = true;

                if (badge) {
                    badge.textContent = `PulseScope GPU Skor: ${finalScore} Puan`;
                    badge.className = 'badge badge-success';
                }
                if (startBtn) startBtn.disabled = false;
            }
        }

        renderBenchmark();
    }
})();
