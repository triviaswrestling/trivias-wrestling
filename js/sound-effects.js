
/* ==========================================================
   MI WRESTLING — SPORTS AUDIO ENGINE
   Archivo: js/sound-effects.js

   SONIDO 1: ráfaga pesada tipo rompeviento / espada.
   SONIDO 2: swoosh gamer para menú y footer.

   - Sin archivos de audio externos.
   - Activación tras la primera interacción.
   - Botón de silencio con preferencia guardada.
   - Evita sonidos duplicados por animaciones.
   - Compatible con GitHub Pages.
   ========================================================== */

(() => {
    "use strict";

    if (window.MWSportsAudio) return;

    const STORAGE_KEY = "mw-sounds-enabled";

    const CONFIG = {
        enabled: true,
        volume: 0.72,
        masterVolume: 0.65,
        generalCooldown: 220,
        menuCooldown: 180
    };

    let audioContext = null;
    let masterGain = null;
    let unlocked = false;
    let lastGeneral = 0;
    let lastMenu = 0;
    let soundButton = null;

    /* ======================================================
       PREFERENCIAS
       ====================================================== */

    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved === "true") CONFIG.enabled = true;
        if (saved === "false") CONFIG.enabled = false;
    } catch (_) {}

    function savePreference() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                String(CONFIG.enabled)
            );
        } catch (_) {}
    }

    /* ======================================================
       MOTOR DE AUDIO
       ====================================================== */

    function initAudio() {
        if (audioContext) return true;

        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

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
                "[MI WRESTLING] Audio no disponible:",
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

    /* ======================================================
       GENERADOR DE RÁFAGAS
       ====================================================== */

    function noiseSweep({
        duration = 0.25,
        startFrequency = 3000,
        endFrequency = 500,
        volume = 0.5,
        q = 0.7,
        attack = 0.015,
        curve = 1.8
    } = {}) {
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

        const samples = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const p = i / length;

            // Ataque rápido y cola natural de aire.
            const fadeIn = Math.min(
                1,
                p / Math.max(0.001, attack / duration)
            );

            const envelope =
                Math.pow(1 - p, curve) * fadeIn;

            samples[i] =
                (Math.random() * 2 - 1) * envelope;
        }

        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        const t = ctx.currentTime;

        source.buffer = buffer;

        filter.type = "bandpass";
        filter.Q.value = q;

        filter.frequency.setValueAtTime(
            startFrequency,
            t
        );

        filter.frequency.exponentialRampToValueAtTime(
            endFrequency,
            t + duration
        );

        gain.gain.setValueAtTime(0.0001, t);

        gain.gain.linearRampToValueAtTime(
            volume,
            t + attack
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            t + duration
        );

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        source.start(t);
        source.stop(t + duration + 0.015);
    }

    /* ======================================================
       SONIDO 1 — RÁFAGA PESADA
       Botones y tarjetas fuera del menú y footer.
       ====================================================== */

    function playSwoosh() {
        if (!CONFIG.enabled) return;

        if (!unlocked) {
            unlockAudio().then((ready) => {
                if (ready && CONFIG.enabled) {
                    playSwoosh();
                }
            });

            return;
        }

        const time = performance.now();

        if (
            time - lastGeneral <
            CONFIG.generalCooldown
        ) {
            return;
        }

        lastGeneral = time;

        noiseSweep({
            duration: 0.29,
            startFrequency: 3800,
            endFrequency: 420,
            volume: 0.76,
            q: 0.62,
            attack: 0.014,
            curve: 1.75
        });
    }

    /* ======================================================
       SONIDO 2 — MENÚ / FOOTER
       Swoosh más grave, corto y definido.
       ====================================================== */

    function playMenu() {
        if (!CONFIG.enabled) return;

        if (!unlocked) {
            unlockAudio().then((ready) => {
                if (ready && CONFIG.enabled) {
                    playMenu();
                }
            });

            return;
        }

        const time = performance.now();

        if (
            time - lastMenu <
            CONFIG.menuCooldown
        ) {
            return;
        }

        lastMenu = time;

        // Barrido más grave y compacto, estilo interfaz deportiva.
        noiseSweep({
            duration: 0.19,
            startFrequency: 2200,
            endFrequency: 520,
            volume: 0.48,
            q: 0.8,
            attack: 0.018,
            curve: 1.65
        });
    }

    /* ======================================================
       IDENTIFICACIÓN DEL MENÚ Y FOOTER REALES
       Generados por mi-wrestling.js.
       ====================================================== */

    function isMenuControl(element) {
        if (!(element instanceof Element)) {
            return false;
        }

        return Boolean(
            element.closest([
                "[data-mw-global-nav]",
                ".mw-global-nav",
                ".mw-global-nav__toggle",
                ".mw-global-nav__links",
                "[data-mw-global-footer]",
                ".mw-global-footer",
                ".mw-global-socials",
                ".mw-global-social"
            ].join(","))
        );
    }

    /* ======================================================
       BOTÓN PARA SILENCIAR
       Reutiliza uno existente o crea uno flotante.
       ====================================================== */

    function updateSoundButton() {
        if (!soundButton) return;

        soundButton.textContent = CONFIG.enabled
            ? "🔊 Sonido"
            : "🔇 Silenciado";

        soundButton.setAttribute(
            "aria-label",
            CONFIG.enabled
                ? "Silenciar efectos de sonido"
                : "Activar efectos de sonido"
        );

        soundButton.setAttribute(
            "aria-pressed",
            String(CONFIG.enabled)
        );

        soundButton.title = CONFIG.enabled
            ? "Silenciar efectos de sonido"
            : "Activar efectos de sonido";
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

            if (CONFIG.enabled) {
                unlockAudio();
            }
        });

        updateSoundButton();
    }

    /* ======================================================
       API PÚBLICA
       ====================================================== */

    const API = {
        play(type = "swoosh") {
            if (type === "menu") {
                playMenu();
            } else {
                playSwoosh();
            }
        },

        playMenu,
        playSwoosh,
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
            const number = Number(value);

            if (!Number.isFinite(number)) return;

            CONFIG.volume = Math.max(
                0,
                Math.min(1, number)
            );

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

    /* ======================================================
       DESBLOQUEO AUTOMÁTICO TRAS INTERACCIÓN
       ====================================================== */

    document.addEventListener(
        "pointerdown",
        unlockAudio,
        {
            once: true,
            passive: true
        }
    );

    document.addEventListener(
        "keydown",
        unlockAudio,
        { once: true }
    );

    /* ======================================================
       UN ÚNICO SONIDO POR CLIC
       El menú/footer tienen prioridad sobre el sonido general.
       ====================================================== */

    document.addEventListener("click", (event) => {
        const target = event.target;

        if (!(target instanceof Element)) return;

        const control = target.closest([
            "a",
            "button",
            "[role='button']",
            "select",
            "summary",
            ".mw-wrestler-card",
            "[data-sfx]",
            "[data-sound]"
        ].join(","));

        if (!control) return;

        // No hacer sonar el botón que silencia/activa.
        if (control.matches("[data-mw-sound-toggle]")) {
            return;
        }

        const explicit =
            control.dataset.sfx ||
            control.dataset.sound;

        if (explicit === "off") return;

        if (
            explicit === "menu" ||
            isMenuControl(control)
        ) {
            playMenu();
        } else {
            playSwoosh();
        }
    }, true);

    /* ======================================================
       INICIO
       ====================================================== */

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
        "[MI WRESTLING] Audio deportivo listo: swoosh + menú."
    );
})();
