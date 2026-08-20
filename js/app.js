/**
 * PulseScope - Master State & Battery API Engine
 */

const PulseScopeState = {
    faults: [],
    mouse: { totalClicks: 0, doubleClicks: 0, maxHz: 0, scrollJumps: 0, tested: false },
    keyboard: { totalPresses: 0, chatters: 0, maxNKRO: 0, tested: false },
    gamepad: { connected: false, leftStickDrift: false, rightStickDrift: false, tested: false },
    display: { detectedHz: 0, deadPixelTested: false, tested: false },
    camera: { resolution: '0x0', fps: 0, tested: false },
    network: { istanbulPing: 0, frankfurtPing: 0, londonPing: 0, tested: false },
    gpu: { score: 0, tested: false },
    battery: { level: 0, charging: false, tested: false },
    audio: { channelTested: false, sweepTested: false, spatialTested: false, phaseTested: false, pinkNoiseTested: false },
    mic: { tested: false }
};

document.addEventListener('DOMContentLoaded', () => {
    initTabNavigation();
    initThemeToggle();
    initReportModal();
    initBackgroundParticles();
    initUISoundEffects();
    initBatteryStatusAPI();
});

/**
 * Laptop Battery Status API Engine
 */
function initBatteryStatusAPI() {
    if (navigator.getBattery) {
        navigator.getBattery().then(battery => {
            function updateBatteryInfo() {
                const level = Math.round(battery.level * 100);
                const charging = battery.charging ? 'Şarj Oluyor (AC Bağlı)' : 'Deşarj Oluyor (Pilde)';
                const time = battery.dischargingTime !== Infinity ? Math.round(battery.dischargingTime / 60) : 'Tam Şarjlı';

                document.getElementById('batteryLevelVal').textContent = `%${level}`;
                document.getElementById('batteryChargingVal').textContent = charging;
                document.getElementById('batteryTimeVal').textContent = `${time} dk`;

                PulseScopeState.battery.level = level;
                PulseScopeState.battery.charging = battery.charging;
                PulseScopeState.battery.tested = true;
            }

            updateBatteryInfo();
            battery.addEventListener('chargingchange', updateBatteryInfo);
            battery.addEventListener('levelchange', updateBatteryInfo);
        });
    } else {
        document.getElementById('batteryLevelVal').textContent = 'Masaüstü PC (Pil Yok)';
    }
}

function initBackgroundParticles() {
    const canvas = document.getElementById('bgParticleCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 2 + 1,
            color: i % 2 === 0 ? 'rgba(0, 255, 102, 0.3)' : 'rgba(0, 240, 255, 0.3)',
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5
        });
    }

    function renderParticles() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });
        requestAnimationFrame(renderParticles);
    }
    renderParticles();
}

function initUISoundEffects() {
    window.playUISound = function (type) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.03);
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
            } else if (type === 'warning') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(250, ctx.currentTime);
                osc.frequency.setValueAtTime(180, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            }

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) {}
    };
}

function initTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const titleEl = document.getElementById('currentPageTitle');
    const descEl = document.getElementById('currentPageDesc');

    const tabMeta = {
        dashboard: { title: 'Gösterge Paneli', desc: 'PulseScope Master Hardware Suite' },
        system: { title: 'Sistem & Batarya', desc: 'Laptop şarj durumu ve pil sağlığı analitiği' },
        mouse: { title: 'Mouse & DPI Ölçer', desc: 'Double-Click, Hz polling ve DPI tahmini' },
        keyboard: { title: 'Klavye & WPM Arena', desc: 'Sanal klavye, Key Chatter ve yazma hızı' },
        gamepad: { title: 'Gamepad & Titreşim', desc: 'Stick drift ve titreşim motoru testi' },
        display: { title: 'Ekran, Hz & Kalibrasyon', desc: 'Yenileme hızı ve ölü piksel taraması' },
        camera: { title: 'WebCam & Kamera', desc: 'Çözünürlük ve kare hızı (FPS) doğrulama' },
        audio: { title: 'Ses & Burn-in Pink Noise', desc: '8D Sahne, Sub-Bass ve Burn-in pembe gürültü' },
        mic: { title: 'Mikrofon Testi', desc: 'Canlı dB Meter ve dip gürültü analizi' },
        network: { title: 'Ping & Wi-Fi Analiz', desc: 'E-Spor sunucuları canlı ping analizi' },
        benchmark: { title: 'GPU & VRAM Benchmark', desc: '3D parçacık stres testi ve performans skoru' }
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.playUISound) window.playUISound('click');
            const targetTab = item.getAttribute('data-tab');

            navItems.forEach(n => n.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            item.classList.add('active');
            document.getElementById(`tab-${targetTab}`).classList.add('active');

            if (tabMeta[targetTab]) {
                titleEl.textContent = tabMeta[targetTab].title;
                descEl.textContent = tabMeta[targetTab].desc;
            }
        });
    });
}

function initThemeToggle() {
    const themeBtn = document.getElementById('themeToggle');
    const htmlEl = document.documentElement;

    themeBtn.addEventListener('click', () => {
        if (window.playUISound) window.playUISound('click');
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlEl.setAttribute('data-theme', newTheme);

        const icon = themeBtn.querySelector('.theme-icon');
        const text = themeBtn.querySelector('.theme-text');

        if (newTheme === 'light') {
            icon.textContent = '☀️';
            text.textContent = 'Aydınlık Mod';
        } else {
            icon.textContent = '🌙';
            text.textContent = 'Karanlık Mod';
        }
    });
}

function logHardwareFault(module, description) {
    const faultEntry = { module, description, timestamp: new Date().toLocaleTimeString() };
    PulseScopeState.faults.push(faultEntry);

    if (window.playUISound) window.playUISound('warning');

    const badge = document.getElementById('faultCountBadge');
    badge.textContent = `${PulseScopeState.faults.length} Arıza Tespiti`;
    badge.style.backgroundColor = 'var(--danger-color)';
    badge.style.color = '#fff';

    const faultList = document.getElementById('faultList');
    const emptyMsg = faultList.querySelector('.no-faults');
    if (emptyMsg) emptyMsg.remove();

    const li = document.createElement('li');
    li.className = 'fault-item';
    const label = document.createElement('span');
    label.textContent = `[${faultEntry.module.toUpperCase()}] ${faultEntry.description}`;
    const small = document.createElement('small');
    small.textContent = ` (${faultEntry.timestamp})`;
    li.append(label, small);
    faultList.prepend(li);
}

function initReportModal() {
    const modal = document.getElementById('reportModal');
    const openBtn = document.getElementById('exportReportBtn');
    const closeBtn = document.getElementById('closeModalBtn');

    openBtn.addEventListener('click', () => {
        if (window.playUISound) window.playUISound('click');
        document.getElementById('reportDate').textContent = `Rapor Tarihi: ${new Date().toLocaleString()}`;

        const m = PulseScopeState.mouse;
        document.getElementById('repMouseText').textContent = m.tested
            ? `Toplam Tıklama: ${m.totalClicks} | Double-Click Arızası: ${m.doubleClicks} | Max Polling Rate: ${m.maxHz} Hz`
            : 'Mouse testi yapılmadı.';

        const k = PulseScopeState.keyboard;
        document.getElementById('repKbText').textContent = k.tested
            ? `Toplam Basılan Tuş: ${k.totalPresses} | Key Chatter Arızası: ${k.chatters} | Max NKRO: ${k.maxNKRO}`
            : 'Klavye testi yapılmadı.';

        const g = PulseScopeState.gamepad;
        document.getElementById('repGamepadText').textContent = g.tested
            ? `Gamepad Durumu: Bağlı | Stick Drift: ${g.leftStickDrift || g.rightStickDrift ? 'VAR (Arızalı)' : 'Yok (Sağlıklı)'}`
            : 'Gamepad testi yapılmadı.';

        const d = PulseScopeState.display;
        document.getElementById('repDisplayText').textContent = d.tested
            ? `Yenileme Hızı: ${d.detectedHz} Hz`
            : 'Ekran testi yapılmadı.';

        const aiAdviceEl = document.getElementById('repAiAdviceText');
        aiAdviceEl.textContent = document.getElementById('aiAdviceText').textContent;

        const faultUl = document.getElementById('repFaultList');
        while (faultUl.firstChild) faultUl.removeChild(faultUl.firstChild);
        if (PulseScopeState.faults.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Hiçbir fiziksel donanım arızası tespit edilmedi. Donanımlarınız sağlıklı görünüyor.';
            faultUl.appendChild(li);
        } else {
            PulseScopeState.faults.forEach(f => {
                const li = document.createElement('li');
                li.style.color = 'red';
                li.textContent = `[${f.module}] ${f.description}`;
                faultUl.appendChild(li);
            });
        }

        const qrBox = document.getElementById('qrCodeContainer');
        if (qrBox) {
            while (qrBox.firstChild) qrBox.removeChild(qrBox.firstChild);
            const reportId = `PD-${Date.now().toString(36).toUpperCase()}`;
            const badge = document.createElement('div');
            badge.style.cssText = 'font-family:monospace;padding:12px;border:1px dashed currentColor;display:inline-block;';
            badge.textContent = reportId;
            const hint = document.createElement('p');
            hint.style.fontSize = '0.75rem';
            hint.textContent = 'Yerel rapor kimliği (üçüncü taraf QR API kullanılmıyor)';
            qrBox.append(badge, hint);
        }

        modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
}
