(() => {
  'use strict';

  const home = document.querySelector('.mw-game-home .mw-home');
  if (!home) return;

  const heroLayers = [...home.querySelectorAll('[data-hero-image]')];
  const modeLinks = [...home.querySelectorAll('.mw-mode')];
  const progress = home.querySelector('#mw-hero-progress');
  const prevButton = home.querySelector('[data-menu-prev]');
  const nextButton = home.querySelector('[data-menu-next]');
  const menu = home.querySelector('.mw-game-menu');

  // The hero cycles through these images. Replace the files in images/home/ with your own licensed renders.
  const heroSlides = [
    'images/home/hero-main.webp',
    'images/home/hero-arena.webp',
    'images/home/hero-champion.webp'
  ];

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slideDuration = 7200;
  let slideIndex = 0;
  let timer = null;
  let progressFrame = null;
  let startedAt = 0;
  let paused = false;

  function setHero(index, restartProgress = true) {
    slideIndex = (index + heroSlides.length) % heroSlides.length;
    heroLayers.forEach((layer, i) => {
      layer.classList.toggle('is-active', i === slideIndex);
      // Use real URL paths rather than deriving content from the selected tile.
      layer.style.backgroundImage = `url("${heroSlides[i]}")`;
    });
    if (restartProgress) startProgress();
  }

  function startProgress() {
    if (progressFrame) cancelAnimationFrame(progressFrame);
    if (progress) progress.style.width = '0%';
    startedAt = performance.now();
    if (reducedMotion || paused) return;

    const tick = (now) => {
      if (paused) return;
      const pct = Math.min(100, ((now - startedAt) / slideDuration) * 100);
      if (progress) progress.style.width = `${pct}%`;
      if (pct >= 100) {
        setHero(slideIndex + 1);
        return;
      }
      progressFrame = requestAnimationFrame(tick);
    };
    progressFrame = requestAnimationFrame(tick);
  }

  function startRotation() {
    stopRotation();
    if (reducedMotion) return;
    timer = window.setInterval(() => {
      if (!paused) setHero(slideIndex + 1);
    }, slideDuration);
  }
  function stopRotation() {
    if (timer) window.clearInterval(timer);
    timer = null;
    if (progressFrame) cancelAnimationFrame(progressFrame);
    progressFrame = null;
  }

  // Hover/focus previews the chosen section without blocking its normal link navigation.
  modeLinks.forEach((link) => {
    const activate = () => {
      modeLinks.forEach((item) => item.classList.toggle('is-active', item === link));
      const heroPath = link.dataset.hero;
      if (heroPath) {
        // A section preview uses the same cross-fade layers. Only the active layer changes,
        // so the browser doesn't continuously download or decode all section images.
        heroLayers.forEach((layer, i) => {
          layer.classList.toggle('is-active', i === 0);
          if (i === 0) layer.style.backgroundImage = `url("${heroPath}")`;
        });
        if (progress) progress.style.width = '100%';
      }
    };
    link.addEventListener('pointerenter', activate, { passive: true });
    link.addEventListener('focus', activate);
  });

  // Arrow controls scroll the horizontal menu by approximately one tile.
  function scrollMenu(direction) {
    if (!menu) return;
    const firstCard = menu.querySelector('.mw-mode');
    const distance = firstCard ? firstCard.getBoundingClientRect().width + 12 : 220;
    menu.scrollBy({ left: direction * distance * 2, behavior: reducedMotion ? 'auto' : 'smooth' });
  }
  prevButton?.addEventListener('click', () => scrollMenu(-1));
  nextButton?.addEventListener('click', () => scrollMenu(1));

  // Pause the motion-heavy bits when the tab is hidden or the user is interacting with the menu.
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (paused) stopRotation();
    else {
      startProgress();
      startRotation();
    }
  });
  menu?.addEventListener('pointerenter', () => { paused = true; });
  menu?.addEventListener('pointerleave', () => { paused = document.hidden; if (!paused) { startProgress(); startRotation(); } });

  // Restore the cinematic background rotation on the initial hero, then begin.
  setHero(0);
  startRotation();
})();
