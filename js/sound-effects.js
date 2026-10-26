
/* ==========================================================
   MI WRESTLING — SPORTS SOUND ENGINE
   Archivo: js/sound-effects.js

   EFECTOS:
   - tap: toque de botón
   - menu: ráfaga deportiva de navegación
   - action: impacto/swish de animación

   - Botón para activar/silenciar
   - Preferencia guardada en localStorage
   - Audio desbloqueado con la primera interacción
   - Compatible con GitHub Pages
   - No modifica mi-wrestling.js ni el CSS global
   ========================================================== */

(() => {
    "use strict";

    if (window.MWSportsAudio) return;

    const STORAGE_KEY = "mw-sounds-enabled";

    const CONFIG = {
        enabled: true,
        volume: 0.72,
        masterVolume: 0.48,
        tapCooldown: 55,
        menuCooldown: 130,
        actionCooldown: 180
    };

    let audioContext = null;
    let masterGain = null;
    let unlocked = false;

    let lastTap = 0;
    let lastMenu = 0;
    let lastAction = 0;

    let soundButton = null;

    /* ------------------------------------------------------
       PREFERENCIAS
       ------------------------------------------------------ */

    function loadPreference() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (saved === "false") CONFIG.enabled = false;
            if (saved === "true") CONFIG.enabled = true;
        } catch (_) {
            // Si el almacenamiento está bloqueado, usamos el valor por defecto.
        }
    }

    function savePreference() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                String(CONFIG.enabled)
            );
        } catch (_) {
            // El sonido seguirá funcionando aunque no pueda guardarse.
        }
    }

    /* ------------------------------------------------------
       MOTOR DE AUDIO
       ------------------------------------------------------ */

    function initAudio() {
        if (audioContext) return true;

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return false;

        try {
            audioContext = new AudioContextClass();
            masterGain = audioContext.createGain();

            masterGain.gain.value =
                CONFIG.masterVolume * CONFIG.volume;

            masterGain.connect(audioContext.destination);

            return true;
        } catch (error) {
            console.warn(
                "[MI WRESTLING] No se pudo iniciar el audio.",
                error
            );

            return false;
        }
    }

    async function unlockAudio() {
        if (!initAudio()) return false;

        try {
            if (audioContext.state !== "running") {
                await audioContext.resume();
            }

            unlocked = audioContext.state === "running";
            return unlocked;
        } catch (_) {
            unlocked = false;
            return false;
        }
    }

    function canPlay() {
        return Boolean(
            CONFIG.enabled &&
            unlocked &&
            audioContext &&
            audioContext.state === "running" &&
            masterGain
        );
    }

    function makeNoise(
        duration,
        filterType,
        frequency,
        volume = 0.25,
        q = 0.7
    ) {
        if (!canPlay()) return;

        const ctx = audioContext;
        const length = Math.max(
            1,
            Math.floor(ctx.sampleRate * duration)
        );

        const buffer = ctx.createBuffer(
            1,
            length,
            ctx.sampleRate
        );

        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const progress = i / length;
            const fade = Math.pow(1 - progress, 1.4);

            data[i] = (Math.random() * 2 - 1) * fade;
        }

        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        source.buffer = buffer;

        filter.type = filterType;
        filter.frequency.value = frequency;
        filter.Q.value = q;

        const start = ctx.currentTime;
        const end = start + duration;

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(
            Math.max(0.0001, volume),
            start + Math.min(0.012, duration / 3)
        );
        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            end
        );

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        source.start(start);
        source.stop(end + 0.015);
    }

    function makeTone(options = {}) {
        if (!canPlay()) return;

        const {
            frequency = 180,
            endFrequency = 90,
            duration = 0.08,
            type = "triangle",
            volume = 0.2
        } = options;

        const ctx = audioContext;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime;
        const end = start + duration;

        oscillator.type = type;

        oscillator.frequency.setValueAtTime(
            Math.max(1, frequency),
            start
        );

        oscillator.frequency.exponentialRampToValueAtTime(
            Math.max(1, endFrequency),
            end
        );

        gain.gain.setValueAtTime(
            Math.max(0.0001, volume),
            start
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            end
        );

        oscillator.connect(gain);
        gain.connect(masterGain);

        oscillator.start(start);
        oscillator.stop(end + 0.015);
    }

    /* ------------------------------------------------------
       SONIDO 1 — TOQUE DE BOTÓN
       ------------------------------------------------------ */

    function playTap() {
        if (!canPlay()) return;

        const time = performance.now();

        if (time - lastTap < CONFIG.tapCooldown) return;

        lastTap = time;

        makeTone({
            frequency: 210,
            endFrequency: 118,
            duration: 0.055,
            type: "triangle",
            volume: 0.19
        });

        makeNoise(
            0.035,
            "highpass",
            2600,
            0.12
        );
    }

    /* ------------------------------------------------------
       SONIDO 2 — RÁFAGA DE NAVEGACIÓN
       ------------------------------------------------------ */

    function playMenu() {
        if (!canPlay()) return;

        const time = performance.now();

        if (time - lastMenu < CONFIG.menuCooldown) return;

        lastMenu = time;

        const ctx = audioContext;
        const duration = 0.19;
        const length = Math.floor(
            ctx.sampleRate * duration
        );

        const buffer = ctx.createBuffer(
            1,
            length,
            ctx.sampleRate
        );

        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const progress = i / length;

            const envelope =
                Math.pow(
                    Math.sin(Math.PI * progress),
                    0.7
                ) *
                (1 - progress * 0.48);

            data[i] =
                (Math.random() * 2 - 1) * envelope;
        }

        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        source.buffer = buffer;

        filter.type = "bandpass";
        filter.Q.value = 0.65;

        filter.frequency.setValueAtTime(
            2100,
            ctx.currentTime
        );

        filter.frequency.exponentialRampToValueAtTime(
            620,
            ctx.currentTime + duration
        );

        gain.gain.setValueAtTime(
            0.0001,
            ctx.currentTime
        );

        gain.gain.linearRampToValueAtTime(
            0.24,
            ctx.currentTime + 0.035
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            ctx.currentTime + duration
        );

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        source.start();
        source.stop(
            ctx.currentTime + duration + 0.02
        );
    }

    /* ------------------------------------------------------
       SONIDO 3 — IMPACTO / SWISH DE ANIMACIÓN
       ------------------------------------------------------ */

    function playAction() {
        if (!canPlay()) return;

        const time = performance.now();

        if (
            time - lastAction <
            CONFIG.actionCooldown
        ) {
            return;
        }

        lastAction = time;

        makeTone({
            frequency: 125,
            endFrequency: 54,
            duration: 0.115,
            type: "sine",
            volume: 0.23
        });

        makeNoise(
            0.15,
            "bandpass",
            1250,
            0.19,
            0.45
        );
    }

    /* ------------------------------------------------------
       BOTÓN DE SONIDO
       Reutiliza el botón existente si lo encuentra.
       Si no existe, crea uno sin tocar el CSS global.
       ------------------------------------------------------ */

    function updateSoundButton() {
        if (!soundButton) return;

        const enabled = CONFIG.enabled;

        soundButton.textContent = enabled
            ? "🔊 Sonido"
            : "🔇 Silenciado";

        soundButton.setAttribute(
            "aria-label",
            enabled
                ? "Silenciar efectos de sonido"
                : "Activar efectos de sonido"
        );

        soundButton.setAttribute(
            "aria-pressed",
            String(enabled)
        );

        soundButton.title = enabled
            ? "Silenciar efectos de sonido"
            : "Activar efectos de sonido";

        soundButton.dataset.soundState = enabled
            ? "on"
            : "off";
    }

    function createSoundButton() {
        soundButton = document.querySelector(
            "[data-mw-sound-toggle]"
        );

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
                "letter-spacing:.3px",
                "cursor:pointer",
                "box-shadow:0 3px 12px rgba(0,0,0,.35)"
            ].join(";");

            document.body.appendChild(soundButton);
        }

        soundButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            CONFIG.enabled = !CONFIG.enabled;

            savePreference();
            updateSoundButton();

            // Si se acaba de activar, desbloqueamos el audio
            // desde esta interacción real del usuario.
            if (CONFIG.enabled) {
                unlockAudio();
            }
        });

        updateSoundButton();
    }

    /* ------------------------------------------------------
       API PÚBLICA
       ------------------------------------------------------ */

    const API = {
        play(type = "tap") {
            if (!unlocked) {
                unlockAudio().then((ready) => {
                    if (ready) API.play(type);
                });

                return;
            }

            switch (type) {
                case "menu":
                    playMenu();
                    break;

                case "action":
                case "animation":
                    playAction();
                    break;

                case "tap":
                default:
                    playTap();
                    break;
            }
        },

        unlock: unlockAudio,

        setEnabled(value) {
            CONFIG.enabled = Boolean(value);
            savePreference();
            updateSoundButton();

            if (CONFIG.enabled) {
                unlockAudio();
            }
        },

        toggle() {
            API.setEnabled(!CONFIG.enabled);
            return CONFIG.enabled;
        },

        setVolume(value) {
            const numericValue = Number(value);

            CONFIG.volume = Number.isFinite(numericValue)
                ? Math.max(0, Math.min(1, numericValue))
                : CONFIG.volume;

            if (masterGain && audioContext) {
                masterGain.gain.setTargetAtTime(
                    CONFIG.masterVolume * CONFIG.volume,
                    audioContext.currentTime,
                    0.025
                );
            }
        },

        get enabled() {
            return CONFIG.enabled;
        },

        get ready() {
            return canPlay();
        }
    };

    window.MWSportsAudio = API;
    window.MWAudio = API;

    /* ------------------------------------------------------
       ACTIVACIÓN AUTOMÁTICA TRAS INTERACCIÓN REAL
       ------------------------------------------------------ */

    function firstInteraction() {
        unlockAudio();
    }

    document.addEventListener(
        "pointerdown",
        firstInteraction,
        { once: true, passive: true }
    );

    document.addEventListener(
        "keydown",
        firstInteraction,
        { once: true }
    );

    /* ------------------------------------------------------
       SONIDOS AUTOMÁTICOS DE INTERFAZ
       ------------------------------------------------------ */

    document.addEventListener("click", (event) => {
        const target = event.target;

        if (!(target instanceof Element)) return;

        const control = target.closest(
            "a, button, [role='button'], select, summary, " +
            ".mw-wrestler-card, [data-sfx], [data-sound]"
        );

        if (!control) return;

        // El botón de sonido nunca debe producir otro efecto.
        if (control.matches("[data-mw-sound-toggle]")) return;

        const explicit =
            control.dataset.sfx ||
            control.dataset.sound;

        if (explicit === "off") return;

        if (explicit === "menu") {
            API.play("menu");
        } else if (explicit === "action") {
            API.play("action");
        } else if (
            control.matches("a") ||
            control.matches(".mw-wrestler-card")
        ) {
            API.play("menu");
        } else {
            API.play("tap");
        }
    }, true);

    /* ------------------------------------------------------
       SONIDOS DE ANIMACIONES
       ------------------------------------------------------ */

    document.addEventListener(
        "animationstart",
        (event) => {
            if (!event.animationName) return;

            const target = event.target;

            if (!(target instanceof Element)) return;

            if (
                target.closest(
                    "[data-sfx='off'], [data-sound='off'], " +
                    "[data-mw-sound-toggle]"
                )
            ) {
                return;
            }

            API.play("action");
        },
        true
    );

    document.addEventListener(
        "transitionrun",
        (event) => {
            const target = event.target;

            if (!(target instanceof Element)) return;

            const property = event.propertyName || "";

            if (
                property.includes("color") ||
                property.includes("shadow") ||
                property.includes("opacity") ||
                property.includes("background")
            ) {
                return;
            }

            if (
                target.closest(
                    "[data-sfx='off'], [data-sound='off'], " +
                    "[data-mw-sound-toggle]"
                )
            ) {
                return;
            }

            API.play("action");
        },
        true
    );

    /* ------------------------------------------------------
       INICIO
       ------------------------------------------------------ */

    loadPreference();

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

    console.info(
        "[MI WRESTLING] Audio deportivo listo: tap / menu / action"
    );
})();
