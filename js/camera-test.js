/**
 * PulseScope - Camera Diagnostic Module
 */

(function () {
    let camStream = null;
    let animId = null;
    let frameCount = 0;
    let startTime = performance.now();

    document.addEventListener('DOMContentLoaded', () => {
        initCameraTester();
    });

    function initCameraTester() {
        const startBtn = document.getElementById('startCamBtn');
        const stopBtn = document.getElementById('stopCamBtn');
        const video = document.getElementById('webcamVideo');
        const badge = document.getElementById('camStatusBadge');

        if (!startBtn || !video) return;

        startBtn.addEventListener('click', async () => {
            try {
                camStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1920 }, height: { ideal: 1080 } } });
                video.srcObject = camStream;
                startBtn.disabled = true;
                stopBtn.disabled = false;

                if (badge) {
                    badge.textContent = '📷 Kamera Aktif';
                    badge.className = 'badge badge-success';
                }

                video.onloadedmetadata = () => {
                    const resStr = `${video.videoWidth}x${video.videoHeight}`;
                    document.getElementById('camResReadout').textContent = resStr;
                    PulseScopeState.camera.resolution = resStr;
                    PulseScopeState.camera.tested = true;
                    measureFps();
                };
            } catch (err) {
                alert('Kamera izni verilmedi veya cihaz bulunamadı!');
            }
        });

        stopBtn.addEventListener('click', () => {
            if (camStream) {
                camStream.getTracks().forEach(t => t.stop());
                camStream = null;
            }
            if (animId) cancelAnimationFrame(animId);
            startBtn.disabled = false;
            stopBtn.disabled = true;
            if (badge) {
                badge.textContent = 'Kamera Kapalı';
                badge.className = 'badge';
            }
        });
    }

    function measureFps() {
        frameCount++;
        const now = performance.now();
        const elapsed = now - startTime;

        if (elapsed >= 1000) {
            const fps = Math.round((frameCount * 1000) / elapsed);
            document.getElementById('camFpsReadout').textContent = `${fps} FPS`;
            PulseScopeState.camera.fps = fps;
            frameCount = 0;
            startTime = now;
        }

        animId = requestAnimationFrame(measureFps);
    }
})();
