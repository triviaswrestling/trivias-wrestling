
/* ==========================================================
   MI WRESTLING 2.0 — HOME CONTROLLER
   Fondo dinámico • Tarjetas • Reveal al hacer scroll
   Archivo: js/home.js
   ========================================================== */

(() => {
  "use strict";

  const initHome = () => {
    const home = document.querySelector("body.mw-game-home");

    if (!home || home.dataset.homeInitialized === "true") return;
    home.dataset.homeInitialized = "true";

    const showcase = home.querySelector(".mw-showcase");
    const backdrop = home.querySelector(".mw-showcase__backdrop");
    const menu = home.querySelector(".mw-game-menu");
    const cards = Array.from(home.querySelectorAll(".mw-mode[data-hero]"));
    const heroLayers = Array.from(
      home.querySelectorAll(".mw-showcase__image[data-hero-image]")
    );
    const progress = home.querySelector("#mw-hero-progress");
    const previousButton = home.querySelector("[data-menu-prev]");
    const nextButton = home.querySelector("[data-menu-next]");

    if (!showcase || !backdrop || !menu || !cards.length) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const rotationDelay = 7000;
    
const accentPalettes = [
  { name: "AZUL ELÉCTRICO", color: "#1685ff", rgb: "22, 133, 255" },
  { name: "ROJO ARENA", color: "#ff304f", rgb: "255, 48, 79" },
  { name: "VIOLETA", color: "#a16bff", rgb: "161, 107, 255" },
  { name: "DORADO", color: "#ffc94a", rgb: "255, 201, 74" },
  { name: "CYAN", color: "#20cfff", rgb: "32, 207, 255" },
  { name: "VERDE NEÓN", color: "#43e6b1", rgb: "67, 230, 177" }
];

/* Elegir un tema distinto del último guardado en esta página.
   No requiere crear archivos ni guardar preferencias. */
const previousAccent = home.dataset.accentTheme;

const availablePalettes = accentPalettes.filter(
  (palette) => palette.color !== previousAccent
);

const selectedPalette =
  availablePalettes[Math.floor(Math.random() * availablePalettes.length)];

home.dataset.accentTheme = selectedPalette.color;

home.style.setProperty("--mw-accent", selectedPalette.color);
home.style.setProperty("--mw-accent-rgb", selectedPalette.rgb);
home.style.setProperty("--mw-ambient", selectedPalette.color);


    let currentSlide = 0;
    let activeCard = -1;
    let rotationTimer = null;
    let progressFrame = null;
    let rotationStartedAt = 0;
    let paused = false;
    let destroyed = false;

    /* ------------------------------------------------------
       Utilidades
    ------------------------------------------------------ */

    const getImageURL = (element) => {
      if (!element) return "";

      const inline = element.style.backgroundImage;
      const match = inline && inline.match(/url\(["']?(.*?)["']?\)/);

      return match ? match[1] : "";
    };

    const setHeroImage = (layer, url) => {
      if (!layer || !url) return;

      layer.style.backgroundImage = `url("${url.replace(/"/g, '\\"')}")`;
    };

    const setAmbientColor = (color) => {
      if (!color) return;

      home.style.setProperty("--mw-ambient", color);
      backdrop.style.backgroundColor = color;
    };

    const getRandomColor = () => {
      const current = home.dataset.ambientColor;
      const options = ambientColors.filter((color) => color !== current);
      const color = options[Math.floor(Math.random() * options.length)];

      home.dataset.ambientColor = color;
      return color;
    };

    /* ------------------------------------------------------
       Iluminación ambiente inicial
       El color ambiente es independiente del borde rojo
       de la tarjeta seleccionada.
    ------------------------------------------------------ */

    

    /* ------------------------------------------------------
       Sincronizar tarjetas con el hero
       Lee las URL directamente desde el HTML existente.
    ------------------------------------------------------ */

    const heroImages = heroLayers
      .map((layer) => ({
        layer,
        index: Number(layer.dataset.heroImage),
        url: getImageURL(layer)
      }))
      .filter((item) => Number.isFinite(item.index))
      .sort((a, b) => a.index - b.index);

    const setSlide = (index) => {
      if (!heroImages.length) return;

      currentSlide = (index + heroImages.length) % heroImages.length;

      heroImages.forEach((item, position) => {
        item.layer.classList.toggle("is-active", position === currentSlide);
        item.layer.setAttribute(
          "aria-hidden",
          position === currentSlide ? "false" : "true"
        );
      });

      if (progress) {
        progress.style.width = "0%";
      }

      rotationStartedAt = performance.now();
    };

    const showCardImage = (card) => {
      if (!card || !heroImages.length) return;

      const url = getImageURL(card.querySelector(".mw-mode__image"));
      if (!url) return;

      const layer = heroImages.find(
        (item) => item.index === currentSlide
      )?.layer || heroImages[0].layer;

      setHeroImage(layer, url);
      layer.classList.add("is-active");

      heroImages.forEach((item) => {
        if (item.layer !== layer) {
          item.layer.classList.remove("is-active");
        }
      });
    };

    /* ------------------------------------------------------
       Selección de tarjetas
    ------------------------------------------------------ */

    const selectCard = (card, options = {}) => {
      const { updateHero = true, updateColor = true } = options;

      const index = cards.indexOf(card);
      if (index < 0) return;

      activeCard = index;

      cards.forEach((item, itemIndex) => {
        const selected = itemIndex === index;

        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-current", selected ? "true" : "false");
      });

      if (updateColor) {
        const accent = getComputedStyle(card)
          .getPropertyValue("--mode-accent")
          .trim();

        setAmbientColor(accent || getRandomColor());
      }

      if (updateHero) {
        showCardImage(card);
      }
    };

    cards.forEach((card) => {
      card.addEventListener("pointerenter", () => {
        if (window.matchMedia("(hover: hover)").matches) {
          selectCard(card);
        }
      });

      card.addEventListener("focus", () => {
        selectCard(card);
      });

      card.addEventListener("click", () => {
        selectCard(card);
      });

      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;

        /* Los enlaces conservan su navegación normal. */
        if (event.key === " ") {
          event.preventDefault();
          selectCard(card);
        }
      });
    });

    /* Seleccionar una tarjeta inicial sin forzar el foco. */
    if (cards.length) {
      selectCard(cards[0], { updateHero: false, updateColor: false });
    }

    /* ------------------------------------------------------
       Rotación del hero
       Conserva las imágenes definidas directamente en HTML.
    ------------------------------------------------------ */

    const advanceSlide = () => {
      if (destroyed || paused || heroImages.length < 2) return;

      setSlide(currentSlide + 1);
    };

    const stopRotation = () => {
      if (rotationTimer) {
        window.clearInterval(rotationTimer);
        rotationTimer = null;
      }

      if (progressFrame) {
        window.cancelAnimationFrame(progressFrame);
        progressFrame = null;
      }
    };

    const updateProgress = () => {
      if (destroyed || paused || !progress || reducedMotion) return;

      const elapsed = performance.now() - rotationStartedAt;
      const percentage = Math.min(100, (elapsed / rotationDelay) * 100);

      progress.style.width = `${percentage}%`;
      progressFrame = window.requestAnimationFrame(updateProgress);
    };

    const startRotation = () => {
      stopRotation();

      if (
        reducedMotion ||
        heroImages.length < 2 ||
        document.hidden ||
        paused
      ) {
        return;
      }

      rotationStartedAt = performance.now();

      rotationTimer = window.setInterval(() => {
        advanceSlide();
      }, rotationDelay);

      progressFrame = window.requestAnimationFrame(updateProgress);
    };

    if (heroImages.length) {
      const activeLayer = heroImages.find((item) =>
        item.layer.classList.contains("is-active")
      );

      currentSlide = activeLayer
        ? heroImages.indexOf(activeLayer)
        : 0;

      setSlide(currentSlide);
      startRotation();
    }

    /* Pausar la rotación si el usuario deja de ver la página. */
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopRotation();
      } else {
        startRotation();
      }
    });

    showcase.addEventListener("mouseenter", () => {
      paused = true;
      stopRotation();
    });

    showcase.addEventListener("mouseleave", () => {
      paused = false;
      startRotation();
    });

    showcase.addEventListener("focusin", () => {
      paused = true;
      stopRotation();
    });

    showcase.addEventListener("focusout", (event) => {
      if (!showcase.contains(event.relatedTarget)) {
        paused = false;
        startRotation();
      }
    });

    /* ------------------------------------------------------
       Animación progresiva al desplazarse
    ------------------------------------------------------ */

    home.classList.add("mw-home-js");

    if ("IntersectionObserver" in window && !reducedMotion) {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        {
          root: null,
          rootMargin: "0px 0px -35px 0px",
          threshold: 0.08
        }
      );

      cards.forEach((card, index) => {
        card.style.transitionDelay = `${(index % 4) * 65}ms`;
        revealObserver.observe(card);
      });
    } else {
      cards.forEach((card) => {
        card.classList.add("is-visible");
      });
    }

    /* ------------------------------------------------------
       Controles del menú
       Desplazan la vista por bloques, sin convertir el grid
       en un carrusel horizontal.
    ------------------------------------------------------ */

    const scrollToMenu = (direction) => {
      const firstRow = cards.slice(0, 4);
      const lastRow = cards.slice(-4);
      const targets = direction < 0 ? firstRow : lastRow;
      const target = targets[0];

      if (!target) return;

      target.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: direction < 0 ? "start" : "end"
      });
    };

    if (previousButton) {
      previousButton.addEventListener("click", () => {
        scrollToMenu(-1);
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        scrollToMenu(1);
      });
    }

    /* Si el navegador no soporta hover, evitamos cambios
       involuntarios de tarjeta mientras se toca la pantalla. */
    if (!window.matchMedia("(hover: hover)").matches) {
      cards.forEach((card) => {
        card.addEventListener(
          "touchstart",
          () => selectCard(card),
          { passive: true, once: true }
        );
      });
    }

    /* Evitar trabajo de animación cuando la pestaña se oculta. */
    window.addEventListener("pagehide", () => {
      destroyed = true;
      stopRotation();
    }, { once: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHome, { once: true });
  } else {
    initHome();
  }
})();
