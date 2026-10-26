
/* ==========================================================
   MI WRESTLING — WIND SOUND ENGINE
   Un solo sonido grave para toda la web.
   Toques + animaciones + transiciones.
   Botón de sonido: solamente 🔊 / 🔇
   ========================================================== */

(() => {
    "use strict";

    if (window.MWSportsAudio) return;

    const STORAGE_KEY = "mw-sounds-enabled";

    const CONFIG = {
        enabled: true,
        volume: 0.85,

        // Evita que muchos eventos simultáneos se amontonen.
        cooldown: 150,

        // Duración del viento: más largo y pesado.
        duration: 0.48,

        // Barrido de frecuencia grave.
        startFrequency: 950,
        endFrequency: 100
    };

    let audioContext = null;
    let masterGain = null;
    let soundButton = null;
    let unlocked = false;
    let lastSoundTime = 0;

    /* ------------------------------------------------------
       PREFERENCIA DE SONIDO
       ------------------------------------------------------ */

    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved === "false") {
            CONFIG.enabled = false;
        } else if (saved === "true") {
            CONFIG.enabled = true;
        }
    } catch (_) {}

    /* ------------------------------------------------------
       INICIALIZAR AUDIO
       ------------------------------------------------------ */

    function initAudio() {
        if (audioContext) return true;

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return false;

        try {
            audioContext = new AudioContextClass();

            masterGain = audioContext.createGain();
            masterGain.gain.value = CONFIG.volume;
            masterGain.connect(audioContext.destination);

            return true;
        } catch (_) {
            return false;
        }
    }

    async function unlockAudio() {
        if (!initAudio()) return;

        try {
            if (audioContext.state === "suspended") {
                await audioContext.resume();
            }

            unlocked = audioContext.state === "running";
        } catch (_) {
            unlocked = false;
        }
    }

    /* ------------------------------------------------------
       SONIDO ÚNICO: VIENTO GRAVE Y PESADO
       ------------------------------------------------------ */

    function playWind(force = false) {
        if (!CONFIG.enabled) return;
        if (!initAudio()) return;
        if (audioContext.state !== "running") return;

        const now = performance.now();

        if (
            !force &&
            now - lastSoundTime < CONFIG.cooldown
        ) {
            return;
        }

        lastSoundTime = now;

        const ctx = audioContext;
        const start = ctx.currentTime;
        const duration = CONFIG.duration;

        /* CAPA 1: VIENTO */

        const bufferSize = Math.ceil(
            ctx.sampleRate * duration
        );

        const buffer = ctx.createBuffer(
            1,
            bufferSize,
            ctx.sampleRate
        );

        const data = buffer.getChannelData(0);

        // Ruido suave con caída progresiva.
        for (let i = 0; i < bufferSize; i++) {
            const progress = i / bufferSize;

            // Caída natural, sin cortar el sonido de golpe.
            const fade = Math.pow(1 - progress, 0.8);

            data[i] = (
                Math.random() * 2 - 1
            ) * fade;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";

        filter.frequency.setValueAtTime(
            CONFIG.startFrequency,
            start
        );

        filter.frequency.exponentialRampToValueAtTime(
            CONFIG.endFrequency,
            start + duration
        );

        filter.Q.value = 0.7;

        const envelope = ctx.createGain();

        envelope.gain.setValueAtTime(0.001, start);

        envelope.gain.exponentialRampToValueAtTime(
            0.9,
            start + 0.055
        );

        envelope.gain.setValueAtTime(
            0.65,
            start + 0.12
        );

        envelope.gain.exponentialRampToValueAtTime(
            0.001,
            start + duration
        );

        noise.connect(filter);
        filter.connect(envelope);
        envelope.connect(masterGain);

        noise.start(start);
        noise.stop(start + duration + 0.025);

        /* CAPA 2: GRAVE PROFUNDO */

        const oscillator = ctx.createOscillator();
        const bassGain = ctx.createGain();

        oscillator.type = "sine";

        oscillator.frequency.setValueAtTime(85, start);

        oscillator.frequency.exponentialRampToValueAtTime(
            38,
            start + duration
        );

        bassGain.gain.setValueAtTime(0.001, start);

        bassGain.gain.exponentialRampToValueAtTime(
            0.22,
            start + 0.06
        );

        bassGain.gain.exponentialRampToValueAtTime(
            0.001,
            start + duration
        );

        oscillator.connect(bassGain);
        bassGain.connect(masterGain);

        oscillator.start(start);
        oscillator.stop(start + duration + 0.025);
    }

    /* ------------------------------------------------------
       BOTÓN FLOTANTE: 🔊 / 🔇
       ------------------------------------------------------ */

    function updateSoundButton() {
        if (!soundButton) return;

        soundButton.textContent = CONFIG.enabled
            ? "🔊"
            : "🔇";

        soundButton.setAttribute(
            "aria-label",
            CONFIG.enabled
                ? "Silenciar sonidos"
                : "Activar sonidos"
        );

        soundButton.setAttribute(
            "aria-pressed",
            String(!CONFIG.enabled)
        );

        soundButton.title = CONFIG.enabled
            ? "Silenciar"
            : "Activar sonido";
    }

    function setEnabled(value) {
        CONFIG.enabled = Boolean(value);

        try {
            localStorage.setItem(
                STORAGE_KEY,
                String(CONFIG.enabled)
            );
        } catch (_) {}

        updateSoundButton();

        if (CONFIG.enabled) {
            unlockAudio();
        }
    }

    function toggle() {
        setEnabled(!CONFIG.enabled);
    }

    function createSoundButton() {
        soundButton = document.querySelector(
            "[data-mw-sound-toggle]"
        );

        if (!soundButton) {
            soundButton = document.createElement("button");

            soundButton.type = "button";
            soundButton.dataset.mwSoundToggle = "";

            Object.assign(soundButton.style, {
                position: "fixed",
                right: "14px",
                bottom: "14px",
                zIndex: "99999",
                width: "46px",
                height: "46px",
                padding: "0",
                border: "1px solid rgba(55, 215, 255, 0.55)",
                borderRadius: "50%",
                background: "rgba(5, 7, 11, 0.94)",
                color: "#ffffff",
                fontSize: "21px",
                lineHeight: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                touchAction: "manipulation",
                boxShadow: "0 3px 14px rgba(0,0,0,0.35)"
            });

            document.body.appendChild(soundButton);
        }

        soundButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggle();
        });

        updateSoundButton();
    }

    /* ------------------------------------------------------
       API PÚBLICA
       ------------------------------------------------------ */

    const API = {
        play: playWind,
        playSwoosh: playWind,
        playMenu: playWind,
        unlock: unlockAudio,
        setEnabled,
        toggle,

        setVolume(value) {
            CONFIG.volume = Math.max(
                0,
                Math.min(1, Number(value) || 0)
            );

            if (masterGain) {
                masterGain.gain.value = CONFIG.volume;
            }
        },

        get enabled() {
            return CONFIG.enabled;
        },

        get ready() {
            return unlocked;
        }
    };

    window.MWSportsAudio = API;
    window.MWAudio = API;

    /* ------------------------------------------------------
       DESBLOQUEAR AUDIO EN LA PRIMERA INTERACCIÓN
       ------------------------------------------------------ */

    document.addEventListener(
        "pointerdown",
        () => {
            unlockAudio();
        },
        {
            capture: true,
            passive: true
        }
    );

    document.addEventListener(
        "keydown",
        () => {
            unlockAudio();
        },
        { capture: true }
    );

    /* ------------------------------------------------------
       UN SOLO SONIDO PARA TOQUES Y CLICS
       ------------------------------------------------------ */

    document.addEventListener(
        "click",
        (event) => {
            const target = event.target;

            if (!(target instanceof Element)) return;

            // Silenciar/activar no reproduce el efecto.
            if (target.closest("[data-mw-sound-toggle]")) {
                return;
            }

            playWind();
        },
        { capture: true }
    );

    /* ------------------------------------------------------
       SONIDO AL COMENZAR ANIMACIONES
       ------------------------------------------------------ */

    document.addEventListener(
        "animationstart",
        (event) => {
            if (event.target === soundButton) return;
            playWind();
        },
        { capture: true }
    );

    /* ------------------------------------------------------
       SONIDO EN CADA REPETICIÓN DE ANIMACIÓN
       ------------------------------------------------------ */

    document.addEventListener(
        "animationiteration",
        (event) => {
            if (event.target === soundButton) return;
            playWind();
        },
        { capture: true }
    );

    /* ------------------------------------------------------
       SONIDO AL COMENZAR TRANSICIONES CSS
       ------------------------------------------------------ */

    document.addEventListener(
        "transitionrun",
        (event) => {
            if (event.target === soundButton) return;
            playWind();
        },
        { capture: true }
    );

    /* ------------------------------------------------------
       INICIO
       ------------------------------------------------------ */

    function start() {
        createSoundButton();
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            start,
            { once: true }
        );
    } else {
        start();
    }
})();
