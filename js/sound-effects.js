
/* ==========================================================
   MI WRESTLING — SOUND ENGINE
   Estilo: WWE 2K + SuperCard + PS5
   Archivo: js/sound-effects.js
   ========================================================== */

(() => {
    "use strict";

    if (window.MWSoundEffects) return;

    const STORAGE_KEY = "mw-sounds-enabled";
    const VOLUME_KEY = "mw-sounds-volume";

    let enabled = localStorage.getItem(STORAGE_KEY) !== "false";
    let volume = Number(localStorage.getItem(VOLUME_KEY) ?? 0.75);
    let audioContext = null;
    let masterGain = null;
    let lastSound = 0;

    const clamp = (value, min, max) =>
        Math.max(min, Math.min(max, value));

    function initAudio() {
        const AudioCtx = window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioCtx) return false;

        if (!audioContext) {
            audioContext = new AudioCtx();
            masterGain = audioContext.createGain();
            masterGain.gain.value = volume;
            masterGain.connect(audioContext.destination);
        }

        if (audioContext.state === "suspended") {
            audioContext.resume().catch(() => {});
        }

        return true;
    }

    function tone({
        frequency = 440,
        endFrequency = frequency,
        duration = 0.12,
        type = "sine",
        gain = 0.2,
        delay = 0
    } = {}) {
        if (!initAudio()) return;

        const now = audioContext.currentTime + delay;
        const oscillator = audioContext.createOscillator();
        const envelope = audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(
            Math.max(20, frequency), now
        );
        oscillator.frequency.exponentialRampToValueAtTime(
            Math.max(20, endFrequency), now + duration
        );

        envelope.gain.setValueAtTime(0.0001, now);
        envelope.gain.exponentialRampToValueAtTime(
            Math.max(0.0002, gain), now + 0.008
        );
        envelope.gain.exponentialRampToValueAtTime(
            0.0001, now + duration
        );

        oscillator.connect(envelope);
        envelope.connect(masterGain);

        oscillator.start(now);
        oscillator.stop(now + duration + 0.02);
    }

    function noise({
        duration = 0.15,
        gain = 0.12,
        frequency = 1800,
        delay = 0
    } = {}) {
        if (!initAudio()) return;

        const sampleRate = audioContext.sampleRate;
        const length = Math.max(
            1, Math.floor(sampleRate * duration)
        );

        const buffer = audioContext.createBuffer(
            1, length, sampleRate
        );
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const fade = 1 - i / length;
            data[i] = (Math.random() * 2 - 1) * fade;
        }

        const source = audioContext.createBufferSource();
        const filter = audioContext.createBiquadFilter();
        const envelope = audioContext.createGain();

        source.buffer = buffer;
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(frequency, audioContext.currentTime + delay);

        envelope.gain.setValueAtTime(
            Math.max(0.0001, gain), audioContext.currentTime + delay
        );
        envelope.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + delay + duration
        );

        source.connect(filter);
        filter.connect(envelope);
        envelope.connect(masterGain);

        source.start(audioContext.currentTime + delay);
    }

    const sounds = {
        // Golpe potente para botones y acciones.
        click() {
            tone({
                frequency: 180,
                endFrequency: 65,
                duration: 0.16,
                type: "triangle",
                gain: 0.36
            });
            noise({
                duration: 0.09,
                gain: 0.13,
                frequency: 1500
            });
        },

        // Interfaz futurista, estilo consola.
        menu() {
            tone({
                frequency: 520,
                endFrequency: 880,
                duration: 0.11,
                type: "sine",
                gain: 0.18
            });
            tone({
                frequency: 1100,
                endFrequency: 650,
                duration: 0.10,
                type: "triangle",
                gain: 0.09,
                delay: 0.035
            });
            noise({
                duration: 0.09,
                gain: 0.045,
                frequency: 4500
            });
        },

        // Brillo metálico para tarjetas y cromados.
        card() {
            noise({
                duration: 0.20,
                gain: 0.10,
                frequency: 6500
            });
            tone({
                frequency: 1250,
                endFrequency: 2100,
                duration: 0.16,
                type: "sine",
                gain: 0.19
            });
            tone({
                frequency: 1850,
                endFrequency: 950,
                duration: 0.23,
                type: "triangle",
                gain: 0.11,
                delay: 0.045
            });
        },

        // Entrada de ventana, ficha o modal.
        open() {
            tone({
                frequency: 95,
                endFrequency: 48,
                duration: 0.28,
                type: "sawtooth",
                gain: 0.30
            });
            noise({
                duration: 0.23,
                gain: 0.12,
                frequency: 2400
            });
            tone({
                frequency: 240,
                endFrequency: 720,
                duration: 0.22,
                type: "sine",
                gain: 0.14,
                delay: 0.035
            });
        },

        // Cierre más corto.
        close() {
            tone({
                frequency: 520,
                endFrequency: 140,
                duration: 0.16,
                type: "triangle",
                gain: 0.17
            });
        },

        // Acción importante: campeonato, confirmación o destacado.
        special() {
            tone({
                frequency: 55,
                endFrequency: 38,
                duration: 0.42,
                type: "sine",
                gain: 0.42
            });
            tone({
                frequency: 130,
                endFrequency: 65,
                duration: 0.32,
                type: "triangle",
                gain: 0.30
            });
            noise({
                duration: 0.30,
                gain: 0.18,
                frequency: 1200
            });
            tone({
                frequency: 440,
                endFrequency: 1100,
                duration: 0.35,
                type: "sine",
                gain: 0.12,
                delay: 0.04
            });
        }
    };

    function play(kind = "click") {
        if (!enabled || !sounds[kind]) return;

        const now = performance.now();

        // Evita que un mismo sonido se dispare en ráfaga.
        if (now - lastSound < 45) return;
        lastSound = now;

        try {
            sounds[kind]();
        } catch (error) {
            // Si el navegador bloquea el audio, no rompe la página.
        }
    }

    function setEnabled(value) {
        enabled = Boolean(value);
        localStorage.setItem(STORAGE_KEY, String(enabled));

        if (enabled) initAudio();

        updateToggle();
    }

    function setVolume(value) {
        volume = clamp(Number(value) || 0, 0, 1);
        localStorage.setItem(VOLUME_KEY, String(volume));

        if (masterGain && audioContext) {
            masterGain.gain.setTargetAtTime(
                volume,
                audioContext.currentTime,
                0.03
            );
        }
    }

    function updateToggle() {
        document.querySelectorAll("[data-mw-sound-toggle]")
            .forEach(button => {
                button.textContent = enabled ? "🔊" : "🔇";
                button.setAttribute(
                    "aria-label",
                    enabled ? "Silenciar sonidos" : "Activar sonidos"
                );
                button.setAttribute(
                    "aria-pressed",
                    String(enabled)
                );
            });
    }

    function createToggle() {
        if (document.querySelector("[data-mw-sound-toggle]")) return;

        const button = document.createElement("button");
        button.type = "button";
        button.dataset.mwSoundToggle = "";
        button.textContent = enabled ? "🔊" : "🔇";
        button.setAttribute("aria-label", "Silenciar sonidos");
        button.setAttribute("aria-pressed", String(enabled));

        Object.assign(button.style, {
            position: "fixed",
            right: "16px",
            bottom: "16px",
            zIndex: "99999",
            width: "46px",
            height: "46px",
            border: "1px solid rgba(55,215,255,.65)",
            borderRadius: "12px",
            background: "rgba(5,7,11,.94)",
            color: "#fff",
            fontSize: "20px",
            cursor: "pointer",
            boxShadow: "0 0 14px rgba(55,215,255,.18)"
        });

        button.addEventListener("click", () => {
            setEnabled(!enabled);
            if (enabled) play("menu");
        });

        document.body.appendChild(button);
    }

    // Detecta interacciones en las páginas sin editar sus scripts.
    document.addEventListener("click", event => {
        const target = event.target.closest(
            "[data-mw-sound-toggle], " +
            ".mw-global-nav__toggle, " +
            ".mw-global-nav__link, " +
            ".mw-event-card, " +
            ".mw-event-category-card, " +
            ".mw-event-season-card, " +
            "[data-sound='card'], " +
            "[data-sound='special'], " +
            "button, a, [role='button'], summary"
        );

        if (!target || target.matches("[data-mw-sound-toggle]")) return;

        if (target.matches("[data-sound='special']")) {
            play("special");
        } else if (target.matches(
            ".mw-event-card, .mw-event-category-card, " +
            ".mw-event-season-card, [data-sound='card']"
        )) {
            play("card");
        } else if (target.matches(
            ".mw-global-nav__toggle, .mw-global-nav__link"
        )) {
            play("menu");
        } else {
            play("click");
        }
    });

    window.MWSoundEffects = {
        play,
        enable: () => setEnabled(true),
        disable: () => setEnabled(false),
        setVolume,
        get enabled() {
            return enabled;
        }
    };

    function start() {
        createToggle();
        updateToggle();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }
})();
