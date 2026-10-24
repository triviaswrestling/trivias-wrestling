
(() => {
  "use strict";

  const initHome = () => {
    const home = document.querySelector("body.mw-game-home");

    if (!home || home.dataset.homeInitialized === "true") return;
    home.dataset.homeInitialized = "true";

    const showcase = home.querySelector(".mw-showcase");
    const backdrop = home.querySelector(".mw-showcase__backdrop");
    const menu = home.querySelector(".mw-home-menu");
    const cards = [...home.querySelectorAll("[data-hero]")];
    const previousButton = home.querySelector("[data-menu-prev]");
    const nextButton = home.querySelector("[data-menu-next]");

    if (!showcase || !backdrop) return;

    const layers = [
      ...backdrop.querySelectorAll("[data-hero-image]")
    ];

    const slides = [
      "images/home/hero-main.webp",
      "images/home/hero-arena.webp",
      "images/home/hero-action.webp"
    ];

    const ROTATION_DELAY = 7000;
    const TRANSITION_DURATION = 900;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let currentSlide = 0;
    let rotationTimer = null;
    let transitionTimer = null;
    let previewActive = false;
    let destroyed = false;

    /*
     * Prepara las imágenes sin bloquear la carga inicial.
     * Si una imagen todavía no existe, se conserva el fondo CSS.
     */
    const preloadImage = (src) => {
      if (!src) return;

      const image = new Image();
      image.decoding = "async";
      image.src = src;

      if (typeof image.decode === "function") {
        image.decode().catch(() => {});
      }
    };

    slides.forEach(preloadImage);

    const setLayerImage = (layer, src) => {
      if (!layer || !src) return;

      layer.style.backgroundImage = `url("${src}")`;
    };

    const showSlide = (index) => {
      if (!layers.length) return;

      currentSlide = (index + slides.length) % slides.length;

      layers.forEach((layer, layerIndex) => {
        const active = layerIndex === 0;

        layer.classList.toggle("is-active", active);
        layer.setAttribute("aria-hidden", String(!active));
      });

      setLayerImage(layers[0], slides[currentSlide]);

      if (layers[1]) {
        setLayerImage(
          layers[1],
          slides[(currentSlide + 1) % slides.length]
        );
      }

      if (layers[2]) {
        setLayerImage(
          layers[2],
          slides[(currentSlide + 2) % slides.length]
        );
      }

      showcase.dataset.activeSlide = String(currentSlide);
    };

    const stopRotation = () => {
      if (rotationTimer !== null) {
        window.clearInterval(rotationTimer);
        rotationTimer = null;
      }
    };

    const startRotation = () => {
      stopRotation();

      if (
        destroyed ||
        previewActive ||
        document.hidden ||
        reducedMotion.matches ||
        slides.length < 2
      ) {
        return;
      }

      rotationTimer = window.setInterval(() => {
        showSlide(currentSlide + 1);
      }, ROTATION_DELAY);
    };

    /*
     * Selecciona una tarjeta sin interferir con su navegación.
     */
    const selectCard = (card, preview = true) => {
      cards.forEach((item) => {
        const selected = item === card;

        item.classList.toggle("is-active", selected);

        if (selected) {
          item.setAttribute("aria-current", "true");
        } else {
          item.removeAttribute("aria-current");
        }
      });

      if (!preview || !card) return;

      const image = card.dataset.hero;

      if (!image) return;

      previewActive = true;
      stopRotation();

      if (layers.length) {
        setLayerImage(layers[0], image);

        layers.forEach((layer, index) => {
          layer.classList.toggle("is-active", index === 0);
          layer.setAttribute(
            "aria-hidden",
            String(index !== 0)
          );
        });
      }

      showcase.dataset.activeMode = image;
    };

    const clearPreview = () => {
      previewActive = false;
      delete showcase.dataset.activeMode;

      showSlide(currentSlide);
      startRotation();
    };

    /*
     * Eventos de las tarjetas.
     */
    cards.forEach((card) => {
      card.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "touch") return;
        selectCard(card);
      });

      card.addEventListener("focus", () => {
        selectCard(card);
      });

      card.addEventListener("click", () => {
        /*
         * No se cancela el clic:
         * los enlaces siguen llevando a sus páginas.
         */
        cards.forEach((item) => {
          item.classList.toggle("is-active", item === card);
        });
      });
    });

    if (menu) {
      menu.addEventListener("pointerleave", (event) => {
        if (event.pointerType === "touch") return;

        const focusedCard = cards.find(
          (card) => card === document.activeElement
        );

        if (focusedCard) {
          selectCard(focusedCard);
          return;
        }

        const activeCard = cards.find(
          (card) => card.classList.contains("is-active")
        );

        if (activeCard) {
          cards.forEach((card) => {
            card.classList.toggle("is-active", card === activeCard);
          });
        }

        clearPreview();
      });

      menu.addEventListener("focusout", () => {
        window.setTimeout(() => {
          if (menu.contains(document.activeElement)) return;
          if (previewActive) clearPreview();
        }, 0);
      });
    }

    /*
     * Flechas del catálogo: desplazan varias tarjetas
     * sin cambiar el tamaño ni la distribución del menú.
     */
    const scrollMenu = (direction) => {
      if (!menu) return;

      const firstCard = cards[0];
      const cardWidth = firstCard
        ? firstCard.getBoundingClientRect().width
        : 220;

      const gap = parseFloat(
        window.getComputedStyle(menu).columnGap
      ) || 16;

      menu.scrollBy({
        left: direction * (cardWidth + gap) * 2,
        behavior: reducedMotion.matches ? "auto" : "smooth"
      });
    };

    previousButton?.addEventListener("click", () => {
      scrollMenu(-1);
    });

    nextButton?.addEventListener("click", () => {
      scrollMenu(1);
    });

    /*
     * Pausa el movimiento cuando la pestaña no está visible.
     */
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopRotation();
      } else {
        startRotation();
      }
    });

    const onMotionPreferenceChange = () => {
      if (reducedMotion.matches) {
        stopRotation();
        clearPreview();
      } else {
        startRotation();
      }
    };

    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener(
        "change",
        onMotionPreferenceChange
      );
    } else {
      reducedMotion.addListener(onMotionPreferenceChange);
    }

    /*
     * Inicio.
     */
    showSlide(0);
    startRotation();

    /*
     * Limpieza si el documento se descarga.
     */
    window.addEventListener("pagehide", () => {
      destroyed = true;
      stopRotation();

      if (transitionTimer !== null) {
        window.clearTimeout(transitionTimer);
      }
    }, { once: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHome, {
      once: true
    });
  } else {
    initHome();
  }
})();
