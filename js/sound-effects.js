
/* ==========================================================
   MI WRESTLING — SPORTS SOUND ENGINE
   3 efectos:
   1. tap      → toque / botón
   2. menu     → ráfaga deportiva de navegación
   3. action   → movimiento / animación

   Sin archivos de audio externos.
   No modifica mi-wrestling.js ni el CSS.
   ========================================================== */

(() => {
    "use strict";

    // Evitar instalar el sistema dos veces.
    if (window.MWSportsAudio) return;

    const CONFIG = {
        volume: 0.72,
        enabled: true,
        tapCooldown: 55,
        menuCooldown: 130,
        animationCooldown: 180,
        masterVolume: 0.48
    };

    let audioContext = null;
    let masterGain = null;
    let unlocked = false;
    let lastTap = 0;
    let lastMenu = 0;
    let lastAnimation = 0;

    const now = () => performance.now();

    /* ------------------------------------------------------
       AUDIO
       ------------------------------------------------------ */

    function initAudio() {
        if (audioContext) return true;

        const AudioCtx =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioCtx) return false;

        try {
            audioContext = new AudioCtx();

            masterGain = audioContext.createGain();
            masterGain.gain.value =
                CONFIG.masterVolume * CONFIG.volume;

            masterGain.connect(audioContext.destination);

            return true;
        } catch (error) {
            console.warn("[MI WRESTLING AUDIO] No disponible:", error);
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
        } catch {
            unlocked = false;
            return false;
        }
    }

    function canPlay() {
        return (
            CONFIG.enabled &&
            unlocked &&
            audioContext &&
            audioContext.state === "running" &&
            masterGain
        );
    }

    function makeGain(start, end, duration, destination = masterGain) {
        const gain = audioContext.createGain();
        const t = audioContext.currentTime;

        gain.gain.setValueAtTime(Math.max(0.0001, start), t);
        gain.gain.exponentialRampToValueAtTime(
            Math.max(0.0001, end),
            t + duration
        );

        gain.connect(destination);
        return gain;
    }

    function makeNoise(duration, filterType, frequency, q = 0.7) {
        const sampleRate = audioContext.sampleRate;
        const length = Math.max(
            1,
            Math.floor(sampleRate * duration)
        );

        const buffer = audioContext.createBuffer(
            1,
            length,
            sampleRate
        );

        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const fade = 1 - i / length;
            data[i] = (Math.random() * 2 - 1) * fade;
        }

        const source = audioContext.createBufferSource();
        const filter = audioContext.createBiquadFilter();
        const gain = audioContext.createGain();

        source.buffer = buffer;
        filter.type = filterType;
        filter.frequency.value = frequency;
        filter.Q.value = q;

        gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.45,
            audioContext.currentTime + 0.012
        );
        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + duration
        );

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        source.start();
        source.stop(audioContext.currentTime + duration + 0.01);
    }

    function makeTone({
        frequency = 180,
        endFrequency = 90,
        duration = 0.08,
        type = "triangle",
        volume = 0.25
    } = {}) {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const t = audioContext.currentTime;

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, t);
        oscillator.frequency.exponentialRampToValueAtTime(
            Math.max(1, endFrequency),
            t + duration
        );

        gain.gain.setValueAtTime(
            Math.max(0.0001, volume),
            t
        );
        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            t + duration
        );

        oscillator.connect(gain);
        gain.connect(masterGain);

        oscillator.start(t);
        oscillator.stop(t + duration + 0.015);
    }

    /* ------------------------------------------------------
       1. TAP — toque corto y firme
       Como el clic físico de un menú deportivo.
       ------------------------------------------------------ */

    function playTap() {
        if (!canPlay()) return;

        const t = now();
        if (t - lastTap < CONFIG.tapCooldown) return;
        lastTap = t;

        makeTone({
            frequency: 210,
            endFrequency: 118,
            duration: 0.055,
            type: "triangle",
            volume: 0.24
        });

        makeNoise(0.035, "highpass", 2600);
    }

    /* ------------------------------------------------------
       2. MENU — ráfaga de aire rápida
       El sonido principal de navegación.
       ------------------------------------------------------ */

    function playMenu() {
        if (!canPlay()) return;

        const t = now();
        if (t - lastMenu < CONFIG.menuCooldown) return;
        lastMenu = t;

        const duration = 0.19;
        const sampleRate = audioContext.sampleRate;
        const length = Math.floor(sampleRate * duration);
        const buffer = audioContext.createBuffer(
            1,
            length,
            sampleRate
        );

        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const p = i / length;

            // Ataque rápido y cola de aire.
            const envelope =
                Math.pow(Math.sin(Math.PI * p), 0.7) *
                (1 - p * 0.48);

            data[i] = (Math.random() * 2 - 1) * envelope;
        }

        const source = audioContext.createBufferSource();
        const filter = audioContext.createBiquadFilter();
        const gain = audioContext.createGain();

        source.buffer = buffer;

        filter.type = "bandpass";
        filter.Q.value = 0.65;
        filter.frequency.setValueAtTime(
            2100,
            audioContext.currentTime
        );
        filter.frequency.exponentialRampToValueAtTime(
            620,
            audioContext.currentTime + duration
        );

        gain.gain.setValueAtTime(
            0.0001,
            audioContext.currentTime
        );
        gain.gain.linearRampToValueAtTime(
            0.52,
            audioContext.currentTime + 0.035
        );
        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + duration
        );

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        source.start();
        source.stop(audioContext.currentTime + duration + 0.02);
    }

    /* ------------------------------------------------------
       3. ACTION — impacto + barrido deportivo
       Para entradas, revelaciones y animaciones importantes.
       ------------------------------------------------------ */

    function playAction() {
        if (!canPlay()) return;

        const t = now();
        if (t - lastAnimation < CONFIG.animationCooldown) return;
        lastAnimation = t;

        // Golpe grave corto.
        makeTone({
            frequency: 125,
            endFrequency: 54,
            duration: 0.115,
            type: "sine",
            volume: 0.32
        });

        // Barrido de aire con más cuerpo.
        makeNoise(0.15, "bandpass", 1250, 0.45);
    }

    /* ------------------------------------------------------
       API PÚBLICA
       ------------------------------------------------------ */

    const API = {
        play(type = "tap") {
            if (!unlocked) {
                unlockAudio().then((ready) => {
                    if (ready) this.play(type);
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
        },

        setVolume(value) {
            CONFIG.volume = Math.max(
                0,
                Math.min(1, Number(value) || 0)
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

    // Alias para que puedas probar los sonidos desde otros scripts.
    window.MWAudio = window.MWAudio || API;

    /* ------------------------------------------------------
       DESBLOQUEO EN MÓVILES
       Los navegadores exigen una interacción real del usuario.
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
       TOQUES GENERALES
       No intercepta ni cancela la acción original del elemento.
       ------------------------------------------------------ */

    document.addEventListener("click", (event) => {
        const target = event.target;

        if (!(target instanceof Element)) return;

        const control = target.closest(
            [
                "[data-sfx]",
                "[data-sound]",
                ".mw-sfx-button",
                "button",
                "[role='button']",
                "select",
                "summary"
            ].join(",")
        );

        if (!control) return;

        const explicit =
            control.dataset.sfx ||
            control.dataset.sound;

        // El atributo permite elegir el sonido del menú.
        if (explicit === "menu") {
            API.play("menu");
        } else if (explicit === "action") {
            API.play("action");
        } else if (explicit !== "off") {
            API.play("tap");
        }
    }, true);

    /* ------------------------------------------------------
       ANIMACIONES
       Detecta animaciones CSS y entradas de elementos.
       El cooldown evita una ametralladora de sonidos.
       ------------------------------------------------------ */

    document.addEventListener("animationstart", (event) => {
        if (event.target === document.documentElement) return;

        // Solo animaciones con nombre: evita eventos vacíos.
        if (!event.animationName) return;

        API.play("action");
    }, true);

    document.addEventListener("transitionrun", (event) => {
        const target = event.target;

        if (!(target instanceof Element)) return;

        // Las transiciones de color y sombra no necesitan sonido.
        const property = event.propertyName || "";

        if (
            property.includes("color") ||
            property.includes("shadow") ||
            property.includes("opacity")
        ) {
            return;
        }

        API.play("action");
    }, true);

    console.info(
        "[MI WRESTLING] Sports Audio listo: tap / menu / action"
    );
})();
