/**
 * PulseScope - Keyboard & Full Layout Module
 */

(function () {
    const CHATTER_THRESHOLD_MS = 40;
    const activeKeys = new Set();
    const keyPressTimestamps = {};
    const keyLastReleaseTimes = {};

    const MAIN_KB_ROWS = [
        ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
        ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'Backspace'],
        ['Tab', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'],
        ['CapsLock', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter'],
        ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ShiftRight'],
        ['ControlLeft', 'MetaLeft', 'AltLeft', 'Space', 'AltRight', 'MetaRight', 'ControlRight']
    ];

    const NAV_KB_ROWS = [
        ['PrintScreen', 'ScrollLock', 'Pause'],
        ['Insert', 'Home', 'PageUp'],
        ['Delete', 'End', 'PageDown'],
        [],
        ['ArrowUp'],
        ['ArrowLeft', 'ArrowDown', 'ArrowRight']
    ];

    const NUMPAD_KB_ROWS = [
        ['NumLock', 'NumpadDivide', 'NumpadMultiply', 'NumpadSubtract'],
        ['Numpad7', 'Numpad8', 'Numpad9', 'NumpadAdd'],
        ['Numpad4', 'Numpad5', 'Numpad6'],
        ['Numpad1', 'Numpad2', 'Numpad3', 'NumpadEnter'],
        ['Numpad0', 'NumpadDecimal']
    ];

    document.addEventListener('DOMContentLoaded', () => {
        renderFullKeyboard();
        initKeyboardLockEngine();
    });

    function renderFullKeyboard() {
        const container = document.getElementById('virtualKeyboard');
        if (!container) return;
        container.innerHTML = '';

        const mainBlock = document.createElement('div');
        mainBlock.className = 'kb-section-main';
        MAIN_KB_ROWS.forEach(row => mainBlock.appendChild(createRowElement(row)));

        const navBlock = document.createElement('div');
        navBlock.className = 'kb-section-nav';
        NAV_KB_ROWS.forEach(row => navBlock.appendChild(createRowElement(row)));

        const numpadBlock = document.createElement('div');
        numpadBlock.className = 'kb-section-numpad';
        NUMPAD_KB_ROWS.forEach(row => numpadBlock.appendChild(createRowElement(row)));

        container.appendChild(mainBlock);
        container.appendChild(navBlock);
        container.appendChild(numpadBlock);

        const resetBtn = document.getElementById('resetKbBtn');
        if (resetBtn) resetBtn.addEventListener('click', resetKeyboardState);
    }

    function createRowElement(rowKeys) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'kb-row';

        rowKeys.forEach(code => {
            const keyEl = document.createElement('div');
            keyEl.className = 'key';
            keyEl.setAttribute('data-key', code);

            let label = code.replace('Key', '').replace('Digit', '').replace('Left', '').replace('Right', '').replace('Numpad', 'Num ');
            if (code === 'Space') label = 'SPACE';
            if (code === 'Backquote') label = '~';
            if (code === 'Minus') label = '-';
            if (code === 'Equal') label = '=';
            if (code === 'ArrowUp') label = '▲';
            if (code === 'ArrowDown') label = '▼';
            if (code === 'ArrowLeft') label = '◄';
            if (code === 'ArrowRight') label = '►';

            keyEl.textContent = label;
            rowDiv.appendChild(keyEl);
        });

        return rowDiv;
    }

    function initKeyboardLockEngine() {
        window.addEventListener('beforeunload', (e) => {
            e.preventDefault();
            e.returnValue = 'Test esnasında sayfadan ayrılmak üzeresiniz!';
        });

        window.addEventListener('keydown', (e) => {
            const hijackKeys = [
                'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
                'Tab', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'ContextMenu',
                'BrowserSearch', 'BrowserHome', 'BrowserRefresh'
            ];

            if (hijackKeys.includes(e.code) || (e.ctrlKey && (e.code === 'KeyR' || e.code === 'KeyW' || e.code === 'KeyS' || e.code === 'KeyP'))) {
                e.preventDefault();
                e.stopPropagation();
            }

            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }

            PulseScopeState.keyboard.tested = true;
            const code = e.code;
            const now = performance.now();

            if (!e.repeat) {
                keyPressTimestamps[code] = now;
                const lastRelease = keyLastReleaseTimes[code] || 0;
                const interval = now - lastRelease;

                if (lastRelease > 0 && interval < CHATTER_THRESHOLD_MS) {
                    PulseScopeState.keyboard.chatters++;
                    document.getElementById('chatterCountVal').textContent = PulseScopeState.keyboard.chatters;
                    const keyEl = document.querySelector(`.key[data-key="${code}"]`);
                    if (keyEl) keyEl.classList.add('chatter-fault');
                    logHardwareFault('Klavye', `Tuş Sekme (Key Chatter) Arızası! Tuş: ${code} (Aralık: ${Math.round(interval)}ms)`);
                }

                playSwitchSound();
            }

            activeKeys.add(code);
            PulseScopeState.keyboard.totalPresses++;

            if (activeKeys.size > PulseScopeState.keyboard.maxNKRO) {
                PulseScopeState.keyboard.maxNKRO = activeKeys.size;
            }

            const pressedCountEl = document.getElementById('pressedKeysCount');
            if (pressedCountEl) pressedCountEl.textContent = activeKeys.size;

            const targetKey = document.querySelector(`.key[data-key="${code}"]`);
            if (targetKey) targetKey.classList.add('pressed');
        }, true);

        window.addEventListener('keyup', (e) => {
            const code = e.code;
            const now = performance.now();
            keyLastReleaseTimes[code] = now;

            if (keyPressTimestamps[code]) {
                const holdDuration = Math.round(now - keyPressTimestamps[code]);
                const holdEl = document.getElementById('kbHoldDurationVal');
                if (holdEl) holdEl.textContent = `${holdDuration} ms`;
            }

            activeKeys.delete(code);
            const pressedCountEl = document.getElementById('pressedKeysCount');
            if (pressedCountEl) pressedCountEl.textContent = activeKeys.size;
        }, true);
    }

    function playSwitchSound() {
        const soundSelect = document.getElementById('switchSoundSelect');
        if (!soundSelect) return;
        const soundType = soundSelect.value;
        if (soundType === 'none') return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            if (soundType === 'blue') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(1200, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
            } else {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.06);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
            }

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.07);
        } catch (e) {}
    }

    function resetKeyboardState() {
        activeKeys.clear();
        document.getElementById('pressedKeysCount').textContent = '0';
        document.getElementById('chatterCountVal').textContent = '0';
        document.getElementById('kbHoldDurationVal').textContent = '0 ms';
        PulseScopeState.keyboard.chatters = 0;
        const keys = document.querySelectorAll('.key');
        keys.forEach(k => k.className = 'key');
    }
})();
