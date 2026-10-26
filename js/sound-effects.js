/* MI WRESTLING 2.0 — GLOBAL SOUND EFFECTS */
(() => {
    "use strict";

    if (window.MWSoundEffects) return;

    const KEY = "mw-sounds-enabled";
    let enabled = true;
    let audio = null;
    let lastSound = 0;

    try {
        enabled = localStorage.getItem(KEY) !== "false";
    } catch (_) {}

    function getAudio() {
        if (!audio) {
            const AudioContext =
                window.AudioContext || window.webkitAudioContext;

            if (!AudioContext) return null;
            audio = new AudioContext();
        }

        if (audio.state === "suspended") audio.resume();
        return audio;
    }

    function tone(frequency, duration, type = "sine", volume = 0.035, delay = 0) {
        const ctx = getAudio();
        if (!ctx || !enabled) return;

        const start = ctx.currentTime + delay;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(start);
        oscillator.stop(start + duration + 0.02);
    }

    function play(kind = "click") {
        if (!enabled || Date.now() - lastSound < 65) return;
        lastSound = Date.now();

        switch (kind) {
            case "menu":
                tone(440, 0.07, "triangle", 0.035);
                tone(660, 0.09, "triangle", 0.025, 0.045);
                break;

            case "card":
                tone(520, 0.055, "sine", 0.025);
                tone(780, 0.075, "triangle", 0.02, 0.035);
                break;

            case "modal":
                tone(330, 0.08, "triangle", 0.03);
                tone(495, 0.12, "sine", 0.025, 0.045);
                break;

            case "filter":
                tone(620, 0.045, "square", 0.012);
                break;

            default:
                tone(460, 0.045, "triangle", 0.025);
        }
    }

    function createControl() {
        if (document.querySelector("[data-mw-sound-toggle]")) return;

        const button = document.createElement("button");
        button.type = "button";
        button.dataset.mwSoundToggle = "";
        button.setAttribute("aria-pressed", String(enabled));
        button.style.cssText = [
            "position:fixed",
            "right:14px",
            "bottom:14px",
            "z-index:9999",
            "width:44px",
            "height:44px",
            "border:1px solid #168cff",
            "border-radius:5px",
            "background:#090d16",
            "color:#fff",
            "font-size:19px",
            "cursor:pointer",
            "box-shadow:0 0 12px #168cff35"
        ].join(";");

        function update() {
            button.textContent = enabled ? "♪" : "♪̸";
            button.setAttribute("aria-pressed", String(enabled));
            button.setAttribute(
                "aria-label",
                enabled ? "Silenciar efectos de sonido" : "Activar efectos de sonido"
            );
            button.title = enabled ? "Sonido activado" : "Sonido silenciado";
        }

        button.addEventListener("click", () => {
            enabled = !enabled;

            try {
                localStorage.setItem(KEY, String(enabled));
            } catch (_) {}

            update();

            if (enabled) play("menu");
        });

        update();
        document.body.appendChild(button);
    }

    document.addEventListener("click", event => {
        const target = event.target instanceof Element
            ? event.target
            : event.target.parentElement;

        if (!target) return;

        if (target.closest("[data-mw-sound-toggle]")) return;

        const control = target.closest(
            'button, a, [role="button"], summary, ' +
            'input[type="button"], input[type="submit"], select'
        );

        if (!control || control.matches(":disabled")) return;

        if (control.matches("select")) {
            play("filter");
        } else if (control.matches(".mw-global-nav__toggle")) {
            play("menu");
        } else if (control.matches(
            ".mw-global-nav__link, .mw-event-card, " +
            ".mw-event-category-card, .mw-event-season-card"
        )) {
            play("card");
        } else if (
            control.closest('[role="dialog"], .mw-modal, .mw-modal-root')
        ) {
            play("modal");
        } else {
            play("click");
        }
    });

    document.addEventListener("change", event => {
        if (event.target.matches("select, input[type=checkbox], input[type=radio]")) {
            play("filter");
        }
    });

    window.MWSoundEffects = {
        play,
        enable() { enabled = true; },
        disable() { enabled = false; }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createControl, { once: true });
    } else {
        createControl();
    }
})();
