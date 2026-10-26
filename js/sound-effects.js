
/* ==========================================================
   MI WRESTLING 2.0 — SPORTS AUDIO ENGINE
   Estilo: WWE 2K / NBA 2K / menús deportivos AAA
   Archivo: js/sound-effects.js

   - Sin archivos de audio externos.
   - Web Audio API.
   - Efectos breves, deportivos y contundentes.
   - Compatible con mouse, teclado y pantalla táctil.
   - No modifica mi-wrestling.js ni mi-wrestling.css.
   ========================================================== */

(() => {
  "use strict";

  if (window.MWAudio) return;

  const CONFIG = {
    enabled: true,
    volume: 0.72,
    cooldown: 38,
    respectReducedMotion: false
  };

  let audio = null;
  let master = null;
  let compressor = null;
  let unlocked = false;
  let lastSoundAt = 0;
  let lastTarget = null;

  const now = () => audio ? audio.currentTime : 0;

  /* ----------------------------------------------------------
     INICIALIZACIÓN
     ---------------------------------------------------------- */

  function initAudio() {
    if (audio) return true;

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return false;

    try {
      audio = new AudioContextClass();

      master = audio.createGain();
      master.gain.value = CONFIG.volume;

      compressor = audio.createDynamicsCompressor();
      compressor.threshold.value = -19;
      compressor.knee.value = 16;
      compressor.ratio.value = 3.2;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.16;

      master.connect(compressor);
      compressor.connect(audio.destination);

      return true;
    } catch (error) {
      console.warn("[MW Audio] No se pudo inicializar el audio.", error);
      return false;
    }
  }

  async function unlock() {
    if (!initAudio()) return;

    try {
      if (audio.state === "suspended") {
        await audio.resume();
      }

      unlocked = audio.state === "running";
    } catch (_) {
      unlocked = false;
    }
  }

  function canPlay(force = false) {
    if (!CONFIG.enabled || !initAudio()) return false;
    if (audio.state !== "running") return false;

    const current = performance.now();

    if (!force && current - lastSoundAt < CONFIG.cooldown) {
      return false;
    }

    lastSoundAt = current;
    return true;
  }

  function setVolume(value) {
    CONFIG.volume = Math.max(0, Math.min(1, Number(value) || 0));

    if (master && audio) {
      master.gain.setTargetAtTime(
        CONFIG.volume,
        audio.currentTime,
        0.025
      );
    }
  }

  function setEnabled(value) {
    CONFIG.enabled = Boolean(value);
  }

  /* ----------------------------------------------------------
     UTILIDADES DE SÍNTESIS
     ---------------------------------------------------------- */

  function envelope(gain, start, peak, attack, decay) {
    gain.gain.cancelScheduledValues(start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(
      Math.max(0.0001, peak),
      start + attack
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      start + attack + decay
    );
  }

  function tone({
    frequency = 400,
    endFrequency = frequency,
    duration = 0.09,
    volume = 0.12,
    type = "sine",
    delay = 0,
    detune = 0
  } = {}) {
    if (!audio || !master) return;

    const start = now() + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(
      Math.max(20, frequency),
      start
    );

    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      start + duration
    );

    osc.detune.value = detune;

    envelope(gain, start, volume, 0.006, duration);

    osc.connect(gain);
    gain.connect(master);

    osc.start(start);
    osc.stop(start + duration + 0.04);
  }

  function noise({
    duration = 0.10,
    volume = 0.12,
    frequency = 1200,
    q = 0.7,
    type = "bandpass",
    delay = 0,
    sweep = 0,
    attack = 0.008
  } = {}) {
    if (!audio || !master) return;

    const start = now() + delay;
    const length = Math.max(
      1,
      Math.ceil(audio.sampleRate * duration)
    );

    const buffer = audio.createBuffer(
      1,
      length,
      audio.sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const fade = 1 - i / length;
      data[i] = (Math.random() * 2 - 1) * fade;
    }

    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();

    source.buffer = buffer;

    filter.type = type;
    filter.frequency.setValueAtTime(
      Math.max(40, frequency),
      start
    );

    if (sweep !== 0) {
      filter.frequency.exponentialRampToValueAtTime(
        Math.max(40, frequency + sweep),
        start + duration
      );
    }

    filter.Q.value = q;

    envelope(gain, start, volume, attack, duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    source.start(start);
    source.stop(start + duration + 0.025);
  }

  /* ----------------------------------------------------------
     1. NAVEGACIÓN — ráfaga deportiva corta
     ---------------------------------------------------------- */

  function navigation() {
    if (!canPlay()) return;

    noise({
      duration: 0.075,
      volume: 0.105,
      frequency: 950,
      sweep: 2400,
      q: 0.55,
      attack: 0.004
    });

    tone({
      frequency: 175,
      endFrequency: 115,
      duration: 0.055,
      volume: 0.045,
      type: "triangle"
    });
  }

  /* ----------------------------------------------------------
     2. BOTÓN — toque seco y definido
     ---------------------------------------------------------- */

  function tap() {
    if (!canPlay()) return;

    tone({
      frequency: 240,
      endFrequency: 125,
      duration: 0.065,
      volume: 0.11,
      type: "triangle"
    });

    noise({
      duration: 0.025,
      volume: 0.045,
      frequency: 1800,
      sweep: -650,
      q: 0.8,
      attack: 0.002
    });
  }

  /* ----------------------------------------------------------
     3. SELECCIÓN — SHWIP metálico deportivo
     ---------------------------------------------------------- */

  function select() {
    if (!canPlay()) return;

    noise({
      duration: 0.115,
      volume: 0.14,
      frequency: 1500,
      sweep: 3000,
      q: 0.45,
      attack: 0.003
    });

    tone({
      frequency: 360,
      endFrequency: 175,
      duration: 0.095,
      volume: 0.11,
      type: "triangle",
      delay: 0.012
    });

    tone({
      frequency: 1050,
      endFrequency: 650,
      duration: 0.055,
      volume: 0.045,
      type: "sine",
      delay: 0.025
    });
  }

  /* ----------------------------------------------------------
     4. CONFIRMAR — golpe grave y respuesta contundente
     ---------------------------------------------------------- */

  function confirm() {
    if (!canPlay()) return;

    tone({
      frequency: 115,
      endFrequency: 48,
      duration: 0.17,
      volume: 0.22,
      type: "sine"
    });

    tone({
      frequency: 310,
      endFrequency: 180,
      duration: 0.085,
      volume: 0.095,
      type: "triangle",
      delay: 0.012
    });

    noise({
      duration: 0.045,
      volume: 0.095,
      frequency: 1250,
      sweep: -500,
      q: 0.8,
      attack: 0.002
    });
  }

  /* ----------------------------------------------------------
     5. ABRIR VENTANA — barrido ascendente y golpe
     ---------------------------------------------------------- */

  function openPanel() {
    if (!canPlay()) return;

    noise({
      duration: 0.15,
      volume: 0.11,
      frequency: 420,
      sweep: 1700,
      q: 0.65
    });

    tone({
      frequency: 145,
      endFrequency: 225,
      duration: 0.10,
      volume: 0.09,
      type: "triangle",
      delay: 0.035
    });

    noise({
      duration: 0.035,
      volume: 0.045,
      frequency: 2200,
      sweep: -500,
      delay: 0.07
    });
  }

  /* ----------------------------------------------------------
     6. CERRAR VENTANA — barrido descendente
     ---------------------------------------------------------- */

  function closePanel() {
    if (!canPlay()) return;

    noise({
      duration: 0.11,
      volume: 0.09,
      frequency: 1500,
      sweep: -1000,
      q: 0.65
    });

    tone({
      frequency: 220,
      endFrequency: 105,
      duration: 0.10,
      volume: 0.075,
      type: "triangle"
    });
  }

  /* ----------------------------------------------------------
     7. VOLVER — respuesta rápida
     ---------------------------------------------------------- */

  function back() {
    if (!canPlay()) return;

    noise({
      duration: 0.07,
      volume: 0.09,
      frequency: 1150,
      sweep: -800,
      q: 0.65
    });

    tone({
      frequency: 180,
      endFrequency: 125,
      duration: 0.07,
      volume: 0.075,
      type: "triangle"
    });
  }

  /* ----------------------------------------------------------
     8. CAMBIO DE FILTRO — clic corto
     ---------------------------------------------------------- */

  function filter() {
    if (!canPlay()) return;

    tone({
      frequency: 420,
      endFrequency: 290,
      duration: 0.045,
      volume: 0.065,
      type: "triangle"
    });

    noise({
      duration: 0.018,
      volume: 0.035,
      frequency: 2100,
      sweep: -800,
      q: 1
    });
  }

  /* ----------------------------------------------------------
     9. CAMBIO DE PESTAÑA — ráfaga con cuerpo
     ---------------------------------------------------------- */

  function tab() {
    if (!canPlay()) return;

    noise({
      duration: 0.095,
      volume: 0.12,
      frequency: 700,
      sweep: 1900,
      q: 0.5
    });

    tone({
      frequency: 260,
      endFrequency: 175,
      duration: 0.075,
      volume: 0.07,
      type: "triangle",
      delay: 0.018
    });
  }

  /* ----------------------------------------------------------
     10. ERROR — golpe apagado, sin alarma molesta
     ---------------------------------------------------------- */

  function error() {
    if (!canPlay()) return;

    tone({
      frequency: 155,
      endFrequency: 85,
      duration: 0.13,
      volume: 0.14,
      type: "triangle"
    });

    noise({
      duration: 0.035,
      volume: 0.045,
      frequency: 350,
      sweep: -100,
      q: 1.2
    });
  }

  /* ----------------------------------------------------------
     11. ÉXITO — doble golpe deportivo
     ---------------------------------------------------------- */

  function success() {
    if (!canPlay()) return;

    tone({
      frequency: 180,
      endFrequency: 125,
      duration: 0.11,
      volume: 0.15,
      type: "triangle"
    });

    noise({
      duration: 0.035,
      volume: 0.07,
      frequency: 1600,
      sweep: 600,
      delay: 0.035
    });

    tone({
      frequency: 440,
      endFrequency: 330,
      duration: 0.075,
      volume: 0.065,
      type: "sine",
      delay: 0.055
    });
  }

  /* ----------------------------------------------------------
     12. CAMBIO DE ESTADO — toggle / interruptor
     ---------------------------------------------------------- */

  function toggle() {
    if (!canPlay()) return;

    tone({
      frequency: 300,
      endFrequency: 460,
      duration: 0.045,
      volume: 0.065,
      type: "triangle"
    });

    tone({
      frequency: 180,
      endFrequency: 230,
      duration: 0.04,
      volume: 0.045,
      type: "sine",
      delay: 0.035
    });
  }

  /* ----------------------------------------------------------
     13. CARTA / SUPERSTRELLA — golpe de selección especial
     ---------------------------------------------------------- */

  function cardSelect() {
    if (!canPlay()) return;

    noise({
      duration: 0.14,
      volume: 0.15,
      frequency: 1250,
      sweep: 2600,
      q: 0.5,
      attack: 0.002
    });

    tone({
      frequency: 105,
      endFrequency: 52,
      duration: 0.15,
      volume: 0.18,
      type: "sine",
      delay: 0.012
    });

    tone({
      frequency: 560,
      endFrequency: 260,
      duration: 0.11,
      volume: 0.09,
      type: "triangle",
      delay: 0.02
    });

    noise({
      duration: 0.045,
      volume: 0.06,
      frequency: 2400,
      sweep: -900,
      delay: 0.055,
      q: 0.7
    });
  }

  /* ----------------------------------------------------------
     14. REVELACIÓN — presentación importante
     ---------------------------------------------------------- */

  function reveal() {
    if (!canPlay()) return;

    noise({
      duration: 0.24,
      volume: 0.14,
      frequency: 280,
      sweep: 2200,
      q: 0.45
    });

    tone({
      frequency: 70,
      endFrequency: 42,
      duration: 0.24,
      volume: 0.19,
      type: "sine",
      delay: 0.04
    });

    tone({
      frequency: 190,
      endFrequency: 120,
      duration: 0.15,
      volume: 0.12,
      type: "triangle",
      delay: 0.08
    });

    noise({
      duration: 0.07,
      volume: 0.07,
      frequency: 1800,
      sweep: -750,
      delay: 0.13
    });
  }

  /* ----------------------------------------------------------
     15. DESPLAZAMIENTO — ráfaga ultracorta
     ---------------------------------------------------------- */

  function swipe() {
    if (!canPlay()) return;

    noise({
      duration: 0.065,
      volume: 0.075,
      frequency: 800,
      sweep: 1800,
      q: 0.5,
      attack: 0.002
    });
  }

  /* ----------------------------------------------------------
     API PÚBLICA
     Permite llamar a cualquier sonido desde otros scripts.
     ---------------------------------------------------------- */

  const API = {
    unlock,
    init: unlock,

    play: (name) => {
      const sounds = {
        navigation,
        nav: navigation,
        tap,
        click: tap,
        select,
        confirm,
        open: openPanel,
        openPanel,
        close: closePanel,
        closePanel,
        back,
        filter,
        tab,
        error,
        success,
        toggle,
        card: cardSelect,
        cardSelect,
        reveal,
        swipe
      };

      if (sounds[name]) sounds[name]();
    },

    navigation,
    tap,
    select,
    confirm,
    open: openPanel,
    close: closePanel,
    back,
    filter,
    tab,
    error,
    success,
    toggle,
    card: cardSelect,
    cardSelect,
    reveal,
    swipe,

    setVolume,
    setEnabled,

    get enabled() {
      return CONFIG.enabled;
    },

    get volume() {
      return CONFIG.volume;
    },

    get unlocked() {
      return unlocked;
    }
  };

  window.MWAudio = API;

  /* ----------------------------------------------------------
     ACTIVACIÓN DE AUDIO EN MÓVILES
     Los navegadores requieren una interacción del usuario.
     ---------------------------------------------------------- */

  const firstInteraction = () => {
    unlock();
  };

  document.addEventListener("pointerdown", firstInteraction, {
    once: true,
    passive: true
  });

  document.addEventListener("keydown", firstInteraction, {
    once: true
  });

  /* ----------------------------------------------------------
     ASIGNACIÓN AUTOMÁTICA PRUDENTE

     Se priorizan elementos explícitamente etiquetados.
     No se asigna un sonido a todos los clics a ciegas.
     Así evitamos duplicar efectos de otros scripts.
     ---------------------------------------------------------- */

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element
      ? event.target.closest(
          "[data-sfx], [data-sound], .mw-sfx-button"
        )
      : null;

    if (!target || target.closest("[data-sfx='off']")) return;

    const soundName =
      target.dataset.sfx ||
      target.dataset.sound ||
      "tap";

    if (soundName === "off" || soundName === "none") return;

    API.play(soundName);
  }, true);

  /* ----------------------------------------------------------
     TECLADO — respuesta al navegar por controles
     ---------------------------------------------------------- */

  document.addEventListener("keydown", (event) => {
    if (event.repeat) return;

    const target = event.target;

    if (!(target instanceof Element)) return;

    if (
      event.key === "Enter" &&
      target.matches(
        "button, a, [role='button'], [data-sfx], [data-sound]"
      )
    ) {
      // El clic generado por el teclado ya puede activar el sonido.
      // Evitamos dispararlo dos veces.
      return;
    }

    if (
      (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
      target.matches("[data-sfx-nav]")
    ) {
      navigation();
    }
  });

  console.info("[MI WRESTLING] Sports Audio Engine preparado.");
})();
