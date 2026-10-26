
/* ==========================================================
   MI WRESTLING — HEAVY SWORD SWISH
   Un solo efecto: ráfaga pesada que corta el aire.
   ========================================================== */

(() => {
    "use strict";

    if (window.MWSportsAudio) return;

    const STORAGE_KEY = "mw-sounds-enabled";

    let enabled = true;
    let audioContext = null;
    let masterGain = null;
    let unlocked = false;
    let lastPlayed = 0;
    let soundButton = null;

    try {
        enabled = localStorage.getItem(STORAGE_KEY) !== "false";
    } catch (_) {}

    function initAudio() {
        if (audioContext) return true;

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return false;

        try {
            audioContext = new AudioContextClass();
            masterGain = audioContext.createGain();
            masterGain.gain.value = 0.68;
            masterGain.connect(audioContext.destination);
            return true;
        } catch (_) {
            return false;
        }
    }

    async function unlock() {
        if (!initAudio()) return false;

        try {
            if (audioContext.state !== "running") {
                await audioContext.resume();
            }

            unlocked = audioContext.state === "running";
            return unlocked;
        } catch (_) {
            return false;
        }
    }

    function play() {
        if (!enabled) return;

        if (!unlocked || !audioContext ||
            audioContext.state !== "running") {
            unlock().then((ready) => {
                if (ready && enabled) play();
            });
            return;
        }

        const now = performance.now();

        // Evita que un clic dispare varias ráfagas superpuestas.
        if (now - lastPlayed < 240) return;
        lastPlayed = now;

        const ctx = audioContext;
        const t = ctx.currentTime;
        const duration = 0.28;

        // Ruido filtrado: el cuerpo de la espada cortando el aire.
        const length = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const p = i / length;

            // Ataque rápido y cola larga, como un corte potente.
            const envelope =
                Math.pow(1 - p, 2.1) *
                Math.min(1, p * 24);

            data[i] = (Math.random() * 2 - 1) * envelope;
        }

        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        source.buffer = buffer;
        filter.type = "bandpass";
        filter.Q.value = 0.72;

        // Barrido descendente: da sensación de velocidad y peso.
        filter.frequency.setValueAtTime(3400, t);
        filter.frequency.exponentialRampToValueAtTime(480, t + duration);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.72, t + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        source.start(t);
        source.stop(t + duration + 0.01);
    }

    function updateButton() {
        if (!soundButton) return;

        soundButton.textContent = enabled
            ? "🔊 Sonido"
            : "🔇 Silenciado";

        soundButton.setAttribute(
            "aria-label",
            enabled ? "Silenciar sonido" : "Activar sonido"
        );

        soundButton.setAttribute("aria-pressed", String(enabled));
    }

    function createButton() {
        // Reutiliza un botón existente si tiene este atributo.
        soundButton = document.querySelector("[data-mw-sound-toggle]");

        if (!soundButton) {
            soundButton = document.createElement("button");
            soundButton.type = "button";
            soundButton.dataset.mwSoundToggle = "";

            soundButton.style.cssText = [
                "position:fixed",
                "right:14px",
                "bottom:14px",
                "z-index:9999",
                "padding:10px 14px",
                "border:1px solid rgba(55,215,255,.65)",
                "border-radius:4px",
                "background:#080b10",
                "color:#fff",
                "font:700 12px Montserrat,Arial,sans-serif",
                "cursor:pointer"
            ].join(";");

            document.body.appendChild(soundButton);
        }

        soundButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            enabled = !enabled;

            try {
                localStorage.setItem(STORAGE_KEY, String(enabled));
            } catch (_) {}

            updateButton();

            if (enabled) unlock();
        });

        updateButton();
    }

    const API = {
        play,
        unlock,

        setEnabled(value) {
            enabled = Boolean(value);

            try {
                localStorage.setItem(STORAGE_KEY, String(enabled));
            } catch (_) {}

            updateButton();

            if (enabled) unlock();
        },

        toggle() {
            API.setEnabled(!enabled);
            return enabled;
        },

        get enabled() {
            return enabled;
        }
    };

    window.MWSportsAudio = API;
    window.MWAudio = API;

    // Desbloquea el sonido tras la primera interacción del usuario.
    document.addEventListener("pointerdown", unlock, {
        once: true,
        passive: true
    });

    document.addEventListener("keydown", unlock, { once: true });

    // Un único sonido para botones, enlaces y tarjetas.
    document.addEventListener("click", (event) => {
        const target = event.target;

        if (!(target instanceof Element)) return;

        const control = target.closest(
            "a, button, [role='button'], select, summary, " +
            ".mw-wrestler-card"
        );

        if (!control || control.matches("[data-mw-sound-toggle]")) {
            return;
        }

        if (
            control.dataset.sfx === "off" ||
            control.dataset.sound === "off"
        ) {
            return;
        }

        play();
    }, true);

    function start() {
        createButton();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, {
            once: true
        });
    } else {
        start();
    }

    console.info("[MI WRESTLING] Efecto único de ráfaga cargado.");
})();
