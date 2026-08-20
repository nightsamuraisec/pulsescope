/**
 * PulseScope - Mouse & DPI Diagnostic Module
 */

(function () {
    const DOUBLE_CLICK_THRESHOLD_MS = 80;
    let lastClickTimes = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    let mouseMoveTimes = [];
    let currentHz = 0;

    document.addEventListener('DOMContentLoaded', () => {
        initMouseClickTester();
        initPollingRateTester();
        initScrollTester();
    });

    function initMouseClickTester() {
        const clickArea = document.getElementById('mouseClickArea');
        const btnVisuals = {
            0: document.getElementById('mBtnLeft'),
            1: document.getElementById('mBtnMiddle'),
            2: document.getElementById('mBtnRight'),
            3: document.getElementById('mBtnSide1'),
            4: document.getElementById('mBtnSide2')
        };

        if (!clickArea) return;
        clickArea.addEventListener('contextmenu', e => e.preventDefault());

        clickArea.addEventListener('mousedown', (e) => {
            e.preventDefault();
            PulseScopeState.mouse.tested = true;
            const btnIdx = e.button;
            const now = performance.now();
            const timeDiff = now - (lastClickTimes[btnIdx] || 0);

            PulseScopeState.mouse.totalClicks++;
            document.getElementById('totalClicksVal').textContent = PulseScopeState.mouse.totalClicks;
            document.getElementById('lastClickIntervalVal').textContent = `${Math.round(timeDiff)} ms`;

            const btnEl = btnVisuals[btnIdx];
            if (btnEl) {
                btnEl.classList.add('active');
                setTimeout(() => btnEl.classList.remove('active'), 150);
            }

            if (lastClickTimes[btnIdx] > 0 && timeDiff < DOUBLE_CLICK_THRESHOLD_MS) {
                PulseScopeState.mouse.doubleClicks++;
                document.getElementById('doubleClickCountVal').textContent = PulseScopeState.mouse.doubleClicks;

                if (btnEl) {
                    btnEl.classList.add('double-click-fault');
                    setTimeout(() => btnEl.classList.remove('double-click-fault'), 800);
                }

                const btnNames = { 0: 'Sol Tuş', 1: 'Orta Tuş', 2: 'Sağ Tuş', 3: 'Yan Tuş 1', 4: 'Yan Tuş 2' };
                logHardwareFault('Mouse', `${btnNames[btnIdx] || 'Tuş'} Çift Tıklama (Double-Click) Arızası! (Tepki: ${Math.round(timeDiff)}ms)`);
                document.getElementById('dashMouseStatus').textContent = '⚠️ Arıza Tespit Edildi';
                document.getElementById('dashMouseStatus').style.color = 'var(--danger-color)';
            }
            lastClickTimes[btnIdx] = now;
        });
    }

    function initPollingRateTester() {
        const moveArea = document.getElementById('mouseMoveArea');
        const hzValEl = document.getElementById('currentHzVal');
        const hzBadgeEl = document.getElementById('hzStatusBadge');

        if (!moveArea) return;
        moveArea.addEventListener('mousemove', () => {
            const now = performance.now();
            mouseMoveTimes.push(now);
        });

        setInterval(() => {
            const now = performance.now();
            mouseMoveTimes = mouseMoveTimes.filter(t => now - t <= 1000);
            currentHz = mouseMoveTimes.length;

            if (currentHz > PulseScopeState.mouse.maxHz) PulseScopeState.mouse.maxHz = currentHz;
            if (hzValEl) hzValEl.textContent = currentHz;

            if (hzBadgeEl) {
                if (currentHz > 850) {
                    hzBadgeEl.textContent = '1000Hz E-Spor Seviyesi';
                    hzBadgeEl.style.color = 'var(--accent-color)';
                } else if (currentHz > 400) {
                    hzBadgeEl.textContent = '500Hz Oyun Seviyesi';
                    hzBadgeEl.style.color = 'var(--neon-blue)';
                } else {
                    hzBadgeEl.textContent = '125Hz Standart';
                    hzBadgeEl.style.color = 'var(--text-secondary)';
                }
            }
        }, 100);
    }

    function initScrollTester() {
        const scrollArea = document.getElementById('scrollArea');
        const upInd = document.getElementById('scrollUpInd');
        const downInd = document.getElementById('scrollDownInd');
        const alertBox = document.getElementById('scrollJumpAlert');

        if (!scrollArea) return;
        let scrollHistory = [];

        scrollArea.addEventListener('wheel', (e) => {
            e.preventDefault();
            const currentDir = e.deltaY < 0 ? 'up' : 'down';

            if (currentDir === 'up') {
                if (upInd) upInd.classList.add('active');
                setTimeout(() => upInd && upInd.classList.remove('active'), 100);
            } else {
                if (downInd) downInd.classList.add('active');
                setTimeout(() => downInd && downInd.classList.remove('active'), 100);
            }

            scrollHistory.push({ dir: currentDir, time: performance.now() });

            if (scrollHistory.length > 5) {
                scrollHistory.shift();
                const ups = scrollHistory.filter(s => s.dir === 'up').length;
                const downs = scrollHistory.filter(s => s.dir === 'down').length;

                if ((downs >= 4 && ups === 1) || (ups >= 4 && downs === 1)) {
                    PulseScopeState.mouse.scrollJumps++;
                    if (alertBox) alertBox.classList.remove('hidden');
                    logHardwareFault('Mouse', 'Scroll Tekerleği Ters Yöne Atlama (Scroll Jump) Arızası!');
                }
            }
        });
    }
})();
