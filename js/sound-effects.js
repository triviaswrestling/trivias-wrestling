
/* ==========================================================
   MI WRESTLING — SPORTS SWISH AUDIO
   1. swoosh: rompeviento / espada cortando el aire
   2. menu: ráfaga ligera para navegación y animaciones del menú
   ========================================================== */

(() => {
    "use strict";

    if (window.MWSportsAudio) return;

    const STORAGE_KEY = "mw-sounds-enabled";

    let enabled = true;
    let ctx = null;
    let master = null;
    let unlocked = false;
    let lastSwoosh = 0;
    let lastMenu = 0;
    let soundButton = null;

    try {
        enabled = localStorage.getItem(STORAGE_KEY) !== "false";
    } catch (_) {}

    function init() {
        if (ctx) return true;

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return false;

        try {
            ctx = new AudioContextClass();
            master = ctx.createGain();
            master.gain.value = 0.65;
            master.connect(ctx.destination);
            return true;
        } catch (_) {
            return false;
        }
    }

    async function unlock() {
        if (!init()) return false;

        try {
            if (ctx.state !== "running") await ctx.resume();
            unlocked = ctx.state === "running";
            return unlocked;
        } catch (_) {
            return false;
        }
    }

    function noiseSweep({
        duration,
        startFrequency,
        endFrequency,
        volume,
        q = 0.7,
        attack = 0.018
    }) {
        if (!enabled || !unlocked || !ctx ||
            ctx.state !== "running") return;

        const length = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const samples = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const p = i / length;

            // Ataque rápido, cuerpo marcado y cola de aire.
            const envelope =
                Math.pow(1 - p, 1.75) *
                Math.min(1, p / Math.max(0.001, attack / duration));

            samples[i] = (Math.random() * 2 - 1) * envelope;
        }

        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        const t = ctx.currentTime;

        source.buffer = buffer;

        filter.type = "bandpass";
        filter.Q.value = q;
        filter.frequency.setValueAtTime(startFrequency, t);
        filter.frequency.exponentialRampToValueAtTime(
            endFrequency,
            t + duration
        );

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(volume, t + attack);
        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            t + duration
        );

        source.connect(filter);
        filter.connect(gain);
        gain.connect(master);

        source.start(t);
        source.stop(t + duration + 0.015);
    }

    // SONIDO 1: rompeviento pesado, con barrido agudo descendente.
    function playSwoosh() {
        if (!enabled) return;

        if (!unlocked) {
            unlock().then((ready) => {
                if (ready && enabled) playSwoosh();
            });
            return;
        }

        const time = performance.now();
        if (time - lastSwoosh < 220) return;
        lastSwoosh = time;

        noiseSweep({
            duration: 0.29,
            startFrequency: 3800,
            endFrequency: 420,
            volume: 0.76,
            q: 0.62,
            attack: 0.014
        });
    }

    // SONIDO 2: swoosh corto y liviano para el menú.
    function playMenu() {
        if (!enabled) return;

        if (!unlocked) {
            unlock().then((ready) => {
                if (ready && enabled) playMenu();
            });
            return;
        }

        const time = performance.now();
        if (time - lastMenu < 170) return;
        lastMenu = time;

        noiseSweep({
            duration: 0.17,
            startFrequency: 2400,
            endFrequency: 850,
            volume: 0.37,
            q: 0.8,
            attack: 0.022
        });
    }

    function updateButton() {
        if (!soundButton) return;

        soundButton.textContent = enabled
            ? "🔊 Sonido"
            : "🔇 Silenciado";

        soundButton.setAttribute(
            "aria-label",
            enabled ? "Silenciar sonidos" : "Activar sonidos"
        );

        soundButton.setAttribute("aria-pressed", String(enabled));
    }

    function createButton() {
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
        play(type = "swoosh") {
            if (type === "menu") playMenu();
            else playSwoosh();
        },

        playMenu,
        playSwoosh,
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

    document.addEventListener("pointerdown", unlock, {
        once: true,
        passive: true
    });

    document.addEventListener("keydown", unlock, { once: true });

    // Detectar controles del menú por selectores comunes.
    function isMenuControl(element) {
        return Boolean(element.closest([
            ".main-header",
            ".main-nav",
            ".navbar",
            ".navigation",
            ".nav-menu",
            ".menu",
            ".mobile-menu",
            ".menu-toggle",
            ".hamburger",
            "[data-menu]",
            "[data-nav]",
            "[aria-controls]"
        ].join(",")));
    }

    document.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const control = target.closest(
            "a, button, [role='button'], select, summary, " +
            ".mw-wrestler-card, [data-sfx], [data-sound]"
        );

        if (!control ||
            control.matches("[data-mw-sound-toggle]")) return;

        if (
            control.dataset.sfx === "off" ||
            control.dataset.sound === "off"
        ) return;

        const explicit =
            control.dataset.sfx || control.dataset.sound;

        if (explicit === "menu" || isMenuControl(control)) {
            playMenu();
        } else {
            playSwoosh();
        }
    }, true);

    // Solo transiciones/animaciones del menú; evita que todo el sitio
    // dispare sonidos por cambios de color o efectos decorativos.
    function isMenuAnimation(target) {
        return target instanceof Element &&
            isMenuControl(target);
    }

    document.addEventListener("animationstart", (event) => {
        if (isMenuAnimation(event.target)) playMenu();
    }, true);

    document.addEventListener("transitionrun", (event) => {
        if (!isMenuAnimation(event.target)) return;

        const property = event.propertyName || "";

        if (
            property.includes("color") ||
            property.includes("shadow") ||
            property.includes("opacity")
        ) return;

        playMenu();
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

    console.info("[MI WRESTLING] Swoosh + menú cargados.");
})();
