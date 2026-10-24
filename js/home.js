
(() => {
  "use strict";

  const initHome = () => {
    const home = document.querySelector(".mw-game-home");
    if (!home) return;

    const showcase = home.querySelector(".mw-showcase");
    const slides = [...home.querySelectorAll(".mw-slide")];
    const dots = [...home.querySelectorAll(".mw-slide-dot")];
    const title = home.querySelector("#mw-slide-title");
    const kicker = home.querySelector("#mw-slide-kicker");
    const counter = home.querySelector("#mw-slide-counter");
    const cards = [...home.querySelectorAll(".mw-mode-card")];

    if (!showcase || slides.length === 0) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let current = 0;
    let timer = null;
    let lastInteraction = 0;

    const setSlide = (index, options = {}) => {
      current = (index + slides.length) % slides.length;

      slides.forEach((slide, i) => {
        const active = i === current;

        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
      });

      dots.forEach((dot, i) => {
        const active = i === current;

        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-pressed", String(active));
      });

      const slide = slides[current];

      if (title && slide.dataset.title) {
        const words = slide.dataset.title.split(" ");

        if (current === 0) {
          title.innerHTML = "WELCOME TO <span>MI WRESTLING</span>";
        } else if (current === 1) {
          title.innerHTML = "CHOOSE YOUR <span>LEGACY</span>";
        } else {
          title.innerHTML = "MAKE <span>HISTORY</span>";
        }
      }

      if (kicker && slide.dataset.kicker) {
        kicker.textContent = slide.dataset.kicker;
      }

      if (counter) {
        counter.textContent =
          String(current + 1).padStart(2, "0") +
          " / " +
          String(slides.length).padStart(2, "0");
      }

      if (options.interaction) {
        lastInteraction = Date.now();
      }
    };

    const stopRotation = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    const startRotation = () => {
      stopRotation();

      if (reducedMotion.matches || slides.length < 2) return;

      timer = window.setInterval(() => {
        if (document.hidden) return;
        if (Date.now() - lastInteraction < 9000) return;

        setSlide(current + 1);
      }, 6000);
    };

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const index = Number(dot.dataset.slide);

        if (!Number.isInteger(index)) return;

        setSlide(index, { interaction: true });
        startRotation();
      });
    });

    cards.forEach((card) => {
      const preview = Number(card.dataset.preview);

      if (!Number.isInteger(preview)) return;

      const showPreview = () => {
        if (preview < 0 || preview >= slides.length) return;

        setSlide(preview, { interaction: true });
      };

      card.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "mouse") showPreview();
      });

      card.addEventListener("focus", showPreview);

      card.addEventListener("click", () => {
        card.classList.add("is-activating");

        window.setTimeout(() => {
          card.classList.remove("is-activating");
        }, 180);
      });
    });

    showcase.addEventListener("mouseenter", stopRotation);
    showcase.addEventListener("mouseleave", startRotation);

    showcase.addEventListener("focusin", stopRotation);
    showcase.addEventListener("focusout", (event) => {
      if (!showcase.contains(event.relatedTarget)) {
        startRotation();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopRotation();
      } else {
        startRotation();
      }
    });

    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", startRotation);
    }

    setSlide(0);
    startRotation();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHome, { once: true });
  } else {
    initHome();
  }
})();
