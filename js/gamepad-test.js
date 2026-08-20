/**
 * PulseScope - Gamepad & Haptic Vibration Test Module
 */

(function () {
    let gamepadIndex = null;
    let animId = null;

    document.addEventListener('DOMContentLoaded', () => {
        initGamepadEvents();
    });

    function initGamepadEvents() {
        window.addEventListener('gamepadconnected', (e) => {
            gamepadIndex = e.gamepad.index;
            PulseScopeState.gamepad.connected = true;
            PulseScopeState.gamepad.tested = true;

            const badge = document.getElementById('gamepadConnectBadge');
            if (badge) {
                badge.textContent = `🎮 Bağlı: ${e.gamepad.id.slice(0, 20)}...`;
                badge.className = 'badge badge-success';
            }

            document.getElementById('dashGamepadStatus').textContent = '✅ Gamepad Bağlı';
            document.getElementById('dashGamepadStatus').style.color = 'var(--accent-color)';

            pollGamepad();
        });

        window.addEventListener('gamepaddisconnected', () => {
            gamepadIndex = null;
            PulseScopeState.gamepad.connected = false;
            const badge = document.getElementById('gamepadConnectBadge');
            if (badge) {
                badge.textContent = 'Bağlantı Bekleniyor...';
                badge.className = 'badge';
            }
            if (animId) cancelAnimationFrame(animId);
        });

        const vibBtn = document.getElementById('testVibrationBtn');
        if (vibBtn) {
            vibBtn.addEventListener('click', triggerGamepadVibration);
        }
    }

    function triggerGamepadVibration() {
        if (gamepadIndex === null) {
            alert('Lütfen önce bir Gamepad (PS5 / Xbox) bağlayın!');
            return;
        }

        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[gamepadIndex];

        if (gp && gp.vibrationActuator) {
            gp.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: 1000,
                weakMagnitude: 1.0,
                strongMagnitude: 1.0
            });
        } else {
            alert('Gamepad bağlı ancak tarayıcınız titreşim motoru erişimini desteklemiyor veya kol titresimsiz.');
        }
    }

    function pollGamepad() {
        if (gamepadIndex === null) return;
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[gamepadIndex];
        if (!gp) return;

        const lx = gp.axes[0] || 0;
        const ly = gp.axes[1] || 0;
        const rx = gp.axes[2] || 0;
        const ry = gp.axes[3] || 0;

        const leftDot = document.getElementById('leftStickDot');
        const rightDot = document.getElementById('rightStickDot');

        if (leftDot) {
            leftDot.style.transform = `translate(${lx * 45}px, ${ly * 45}px)`;
            document.getElementById('leftStickPosVal').textContent = `X: ${lx.toFixed(2)} | Y: ${ly.toFixed(2)}`;
        }

        if (rightDot) {
            rightDot.style.transform = `translate(${rx * 45}px, ${ry * 45}px)`;
            document.getElementById('rightStickPosVal').textContent = `X: ${rx.toFixed(2)} | Y: ${ry.toFixed(2)}`;
        }

        const DRIFT_THRESHOLD = 0.18;
        const alertBox = document.getElementById('gamepadDriftAlert');

        if (Math.abs(lx) > DRIFT_THRESHOLD || Math.abs(ly) > DRIFT_THRESHOLD) {
            PulseScopeState.gamepad.leftStickDrift = true;
            if (alertBox) alertBox.classList.remove('hidden');
            logHardwareFault('Gamepad', `Sol Analog Çubuk Kayması (Left Stick Drift)!`);
        }

        if (Math.abs(rx) > DRIFT_THRESHOLD || Math.abs(ry) > DRIFT_THRESHOLD) {
            PulseScopeState.gamepad.rightStickDrift = true;
            if (alertBox) alertBox.classList.remove('hidden');
            logHardwareFault('Gamepad', `Sağ Analog Çubuk Kayması (Right Stick Drift)!`);
        }

        animId = requestAnimationFrame(pollGamepad);
    }
})();
