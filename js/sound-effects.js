
/* ==========================================================
   MI WRESTLING — MAGIC CARD SFX
   Efecto: ráfaga + cromo + impacto mágico
   Sin archivos de audio externos
   ========================================================== */

(() => {
    "use strict";

    if (window.MWSoundEffects) return;

    const KEY = "mw-sounds-enabled";
    let enabled = localStorage.getItem(KEY) !== "false";
    let ctx = null;
    let master = null;
    let lastCardSound = 0;

    function init() {
        if (ctx) {
            if (ctx.state === "suspended") ctx.resume();
            return;
        }

        const AudioContext =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContext) return;

        ctx = new AudioContext();
        master = ctx.createGain();
        master.gain.value = 0.8;
        master.connect(ctx.destination);
    }

    function sweep({
        start = 500,
        end = 7000,
        duration = 0.3,
        volume = 0.16,
        delay = 0,
        filterType = "bandpass"
    } = {}) {
        init();
        if (!ctx) return;

        const t = ctx.currentTime + delay;
        const length = Math.ceil(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Ruido breve y suave, como una ráfaga de aire.
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const envelope = ctx.createGain();

        source.buffer = buffer;
        filter.type = filterType;
        filter.Q.value = 0.7;

        filter.frequency.setValueAtTime(start, t);
        filter.frequency.exponentialRampToValueAtTime(
            Math.max(80, end), t + duration
        );

        envelope.gain.setValueAtTime(0.0001, t);
        envelope.gain.linearRampToValueAtTime(volume, t + 0.035);
        envelope.gain.exponentialRampToValueAtTime(
            0.0001, t + duration
        );

        source.connect(filter);
        filter.connect(envelope);
        envelope.connect(master);

        source.start(t);
        source.stop(t + duration + 0.02);
    }

    function chime(freq, delay, duration, volume, type = "sine") {
        init();
        if (!ctx) return;

        const t = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);

        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(
            volume, t + 0.012
        );
        env.gain.exponentialRampToValueAtTime(
            0.0001, t + duration
        );

        osc.connect(env);
        env.connect(master);

        osc.start(t);
        osc.stop(t + duration + 0.025);
    }

    function impact() {
        chime(145, 0, 0.20, 0.24, "sine");
        chime(62, 0.015, 0.26, 0.20, "triangle");

        sweep({
            start: 180,
            end: 1000,
            duration: 0.12,
            volume: 0.11,
            filterType: "lowpass"
        });
    }

    function playCard() {
        if (!enabled) return;

        const now = performance.now();
        if (now - lastCardSound < 220) return;
        lastCardSound = now;

        try {
            init();
            if (!ctx) return;

            // 1. FSSSH — la carta entra en escena.
            sweep({
                start: 450,
                end: 8500,
                duration: 0.30,
                volume: 0.19
            });

            // 2. SHWING — brillo cromado y mágico.
            chime(1174, 0.055, 0.34, 0.13);
            chime(1760, 0.075, 0.38, 0.095);
            chime(2637, 0.105, 0.42, 0.065);
            chime(3520, 0.13, 0.30, 0.035, "triangle");

            // 3. WHOOM — pequeño golpe al seleccionar.
            chime(105, 0.025, 0.22, 0.17, "triangle");

            // 4. Cola brillante, como una carta holográfica.
            sweep({
                start: 6000,
                end: 1700,
                duration: 0.34,
                volume: 0.07,
                delay: 0.09
            });
        } catch (_) {}
    }

    function playMenu() {
        if (!enabled) return;

        try {
            init();
            if (!ctx) return;

            sweep({
                start: 300,
                end: 5500,
                duration: 0.20,
                volume: 0.12
            });

            chime(880, 0.035, 0.15, 0.075);
            chime(1320, 0.065, 0.19, 0.045);
        } catch (_) {}
    }

    function setEnabled(value) {
        enabled = Boolean(value);
        localStorage.setItem(KEY, String(enabled));
        updateToggle();

        if (!enabled && ctx && master) {
            master.gain.setTargetAtTime(
                0, ctx.currentTime, 0.025
            );
        } else if (enabled && ctx && master) {
            master.gain.setTargetAtTime(
                0.8, ctx.currentTime, 0.025
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
                button.setAttribute("aria-pressed", String(enabled));
            });
    }

    function createToggle() {
        if (document.querySelector("[data-mw-sound-toggle]")) return;

        const button = document.createElement("button");
        button.type = "button";
        button.dataset.mwSoundToggle = "";
        button.textContent = enabled ? "🔊" : "🔇";
        button.setAttribute("aria-label", "Silenciar sonidos");

        Object.assign(button.style, {
            position: "fixed",
            right: "16px",
            bottom: "16px",
            zIndex: "99999",
            width: "46px",
            height: "46px",
            border: "1px solid rgba(55,215,255,.65)",
            borderRadius: "12px",
            background: "#05070b",
            color: "#fff",
            fontSize: "20px"
        });

        button.addEventListener("click", () => {
            setEnabled(!enabled);
            if (enabled) playMenu();
        });

        document.body.appendChild(button);
        updateToggle();
    }

    document.addEventListener("click", event => {
        if (event.target.closest("[data-mw-sound-toggle]")) return;

        const card = event.target.closest(
            ".mw-wrestler-card, [data-wrestler-card], " +
            "[data-wrestler-id], .wrestler-card"
        );

        if (card) {
            playCard();
            return;
        }

        if (event.target.closest(
            ".mw-global-nav__toggle, .mw-global-nav__link"
        )) {
            playMenu();
        }
    });

    window.MWSoundEffects = {
        play(name = "card") {
            if (name === "menu") playMenu();
            else playCard();
        },
        enable: () => setEnabled(true),
        disable: () => setEnabled(false),
        setVolume(value) {
            init();
            if (master && ctx) {
                const volume = Math.max(
                    0, Math.min(1, Number(value) || 0)
                );
                master.gain.setTargetAtTime(
                    volume, ctx.currentTime, 0.025
                );
            }
        },
        get enabled() {
            return enabled;
        }
    };

    function start() {
        createToggle();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, {
            once: true
        });
    } else {
        start();
    }
})();
