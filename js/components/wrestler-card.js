
/* ============================================================================
   TRIVIAS WRESTLING — WRESTLER CARD + MODAL
   Componente visual compartido por roster.html y alumni.html.
   No administra bases de datos ni calcula historiales.
   ============================================================================ */

(function (global) {
  "use strict";

  /* 1. UTILIDADES */

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));

  const slug = value => String(value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  /* 2. RECORDS */

  function parseRecord(value) {
    if (!value || typeof value !== "string") return null;

    const numbers = value.match(/\d+/g);
    if (!numbers || numbers.length < 2) return null;

    return {
      wins: Number(numbers[0]),
      losses: Number(numbers[1]),
      draws: Number(numbers[2] || 0),
      label: value
    };
  }

  function getRecords(wrestler) {
    const stats = wrestler.legacyStats || {};
    const record = wrestler.record || {};

    return {
      season: record.season2026 || stats.overall2026 || "Sin datos",
      career: record.career || stats.careerOverall || "Sin datos"
    };
  }

  /* 3. ATRIBUTOS */

  function getAttributes(wrestler) {
    const source = wrestler.attributes || wrestler.stats || {};

    const candidates = [
      {
        key: "power",
        label: "Power",
        value: Number(source.power ?? source.poder)
      },
      {
        key: "charisma",
        label: "Charisma",
        value: Number(source.charisma)
      },
      {
        key: "micro",
        label: "Micro",
        value: Number(source.micro ?? source.mic ?? source.micSkill)
      }
    ];

    if (!candidates.every(item =>
      Number.isFinite(item.value) &&
      item.value >= 0 &&
      item.value <= 100
    )) return null;

    return {
      items: candidates,
      overall: Math.round(
        candidates.reduce((sum, item) => sum + item.value, 0) / 3
      )
    };
  }

  /* 4. TEMAS VISUALES */

  function themeFor(wrestler) {
    const status = String(wrestler.status || "").toLowerCase();
    const brand = String(wrestler.brand || "").toLowerCase();

    if (
      /hall.?of.?fame|hof|sal[oó]n de la fama/.test(status) ||
      /hall.?of.?fame|hof/.test(brand)
    ) {
      return {
        accent: "#91bfff",
        glow: "rgba(75,155,255,.2)",
        label: "HALL OF FAME",
        banner: "linear-gradient(110deg,#101722,#405779 38%,#c8d0da 54%,#9d8148 72%,#17191e)"
      };
    }

    if (
      brand === "alumni" ||
      /inactive|retired|alumni|retirad/.test(status)
    ) {
      return {
        accent: "#cbb783",
        glow: "rgba(203,183,131,.16)",
        label: "ALUMNI",
        banner: "linear-gradient(110deg,#171614,#51452f 35%,#c5ad75 53%,#77633b 72%,#171614)"
      };
    }

    if (brand.includes("aaa")) {
      return {
        label: "AAA",
        accent: "#009B3A",
        glow: "rgba(0,155,58,.38)",
        banner: "linear-gradient(110deg,#050505 0%,#006B2D 35%,#FFFFFF 55%,#D71920 78%,#050505 100%)"
      };
    }

    if (brand.includes("raw")) {
      return {
        accent: "#ff2638",
        glow: "rgba(255,38,56,.22)",
        label: wrestler.brand || "RAW",
        banner: "linear-gradient(110deg,#080808 0%,#26090d 38%,#a20f20 72%,#130709 100%)"
      };
    }

    if (brand.includes("smack") || brand === "sd") {
      return {
        accent: "#2589ff",
        glow: "rgba(37,137,255,.22)",
        label: wrestler.brand || "SMACKDOWN",
        banner: "linear-gradient(110deg,#050811 0%,#0b2048 38%,#125fc2 72%,#050914 100%)"
      };
    }

    if (brand.includes("nxt")) {
      return {
        accent: "#d9dee7",
        glow: "rgba(217,222,231,.14)",
        label: wrestler.brand || "NXT",
        banner: "linear-gradient(110deg,#08090b 0%,#20242b 42%,#444b56 72%,#101114 100%)"
      };
    }

    if (brand.includes("aew")) {
      return {
        accent: "#c7b98e",
        glow: "rgba(199,185,142,.15)",
        label: wrestler.brand || "AEW",
        banner: "linear-gradient(105deg,#111,#514b40 35%,#c7c0b0 52%,#514b40 72%,#111)"
      };
    }

    if (brand.includes("tna")) {
      return {
        accent: "#d8dce2",
        glow: "rgba(216,220,226,.15)",
        label: wrestler.brand || "TNA",
        banner: "linear-gradient(105deg,#111216,#555b65 35%,#d8dce2 52%,#a51e2d 76%,#111216)"
      };
    }

    if (brand.includes("wwe")) {
      return {
        accent: "#d8dce2",
        glow: "rgba(216,220,226,.15)",
        label: wrestler.brand || "WWE",
        banner: "linear-gradient(105deg,#101114,#525760 35%,#e1e4e9 52%,#8b929d 72%,#101114)"
      };
    }

    return {
      accent: "#e3263e",
      glow: "rgba(227,38,62,.18)",
      label: wrestler.brand || "ACTIVE",
      banner: "linear-gradient(110deg,#09090b 0%,#292126 42%,#8f1729 72%,#09090b 100%)"
    };
  }

  /* 5. CAMPEONATOS */

  function currentChampionships(wrestler) {
    const raw =
      wrestler.currentChampionships ||
      wrestler.championshipsAsChampion ||
      wrestler.currentTitles ||
      wrestler.championships ||
      [];

    if (Array.isArray(raw)) {
      return raw.map(item =>
        typeof item === "string"
          ? item
          : item.name ||
            item.title ||
            item.championshipName ||
            item.titleName
      ).filter(Boolean);
    }

    if (typeof raw === "string" && raw.trim()) {
      return [raw.trim()];
    }

    return [];
  }

  function championBar(wrestler) {
    const titles = currentChampionships(wrestler);

    if (!titles.length && !wrestler.isChampion) return "";

    const text = titles.length
      ? titles.join(" · ")
      : (wrestler.championOf || "CAMPEÓN ACTUAL");

    return `
      <div class="mw-modal-champion-bar" aria-label="Campeonatos actuales">
        <span class="mw-modal-champion-bar__crest" aria-hidden="true">♛</span>
        <span class="mw-modal-champion-bar__copy">
          <small>GOLD STATUS · CAMPEÓN ACTUAL</small>
          <strong>${escapeHTML(text)}</strong>
        </span>
        <span class="mw-modal-champion-bar__shine" aria-hidden="true"></span>
      </div>
    `;
  }

  /* 6. TARJETA */

  function card(wrestler) {
    const theme = themeFor(wrestler);
    const image = wrestler.image || "images/renders/Vacante.webp";
    const name = wrestler.displayName || wrestler.name || "Superestrella";
    const subtitle = wrestler.nickname || theme.label;
    const overall = getAttributes(wrestler)?.overall;

    return `
      <button
        class="mw-wrestler-card"
        type="button"
        data-wrestler-open="${escapeHTML(wrestler.name)}"
        style="
          --wrestler-accent:${theme.accent};
          --wrestler-glow:${theme.glow};
          --wrestler-banner:${theme.banner};
        "
        aria-label="Ver ficha de ${escapeHTML(name)}"
      >
        <span class="mw-wrestler-card__sheen" aria-hidden="true"></span>

        <img
          class="mw-wrestler-card__image"
          src="${escapeHTML(image)}"
          alt="${escapeHTML(name)}"
          loading="lazy"
          onerror="this.classList.add('is-missing');this.removeAttribute('src')"
        >

        <span class="mw-wrestler-card__rank">
          ${overall !== undefined
            ? `OVR ${overall}`
            : escapeHTML(theme.label)}
        </span>

        <span class="mw-wrestler-card__banner">
          <span class="mw-wrestler-card__banner-inner">
            <span class="mw-wrestler-card__subtitle"
              style="color:${theme.accent}">
              ${escapeHTML(subtitle)}
            </span>
            <span class="mw-wrestler-card__name">
              ${escapeHTML(name)}
            </span>
          </span>
        </span>

        <span class="mw-wrestler-card__brand">
          <span>${escapeHTML(theme.label)}</span>
          <span class="mw-wrestler-card__view">VER FICHA ↗</span>
        </span>
      </button>
    `;
  }

  /* 7. ATRIBUTOS DEL MODAL */

  function attributePanel(wrestler) {
    const data = getAttributes(wrestler);

    if (!data) {
      return `
        <section class="mw-modal-panel mw-modal-panel--attributes">
          <div class="mw-panel-heading">COMBAT ATTRIBUTES</div>
          <p class="mw-data-pending">
            Los tres atributos todavía no están cargados para esta superestrella.
          </p>
        </section>
      `;
    }

    return `
      <section class="mw-modal-panel mw-modal-panel--attributes">
        <div class="mw-panel-heading">COMBAT ATTRIBUTES</div>

        ${data.items.map(item => `
          <div class="mw-attribute"
            style="--attribute-value:${item.value}%">
            <div class="mw-attribute__line">
              <span>${escapeHTML(item.label)}</span>
              <strong>${item.value}</strong>
            </div>
            <div class="mw-attribute__track">
              <span></span>
            </div>
          </div>
        `).join("")}
      </section>
    `;
  }

  /* 8. INTÉRPRETES */

  function interpretersPanel(wrestler) {
    const entries = Array.isArray(wrestler.interpreterHistory)
      ? wrestler.interpreterHistory
      : [];

    const current = entries.find(entry => entry.current);
    const currentName = current?.name || "Sin asignar";

    const list = entries.map(entry => `
      <a
        class="mw-interpreter-option${entry.current ? " is-current" : ""}"
        href="${escapeHTML(
          entry.recordUrl ||
          `records.html?interpreter=${encodeURIComponent(entry.id)}`
        )}"
      >
        <span class="mw-interpreter-option__name">
          ${escapeHTML(entry.country)} ${escapeHTML(entry.name || entry.id)}
        </span>

        <span class="mw-interpreter-option__meta">
          ${escapeHTML(entry.from)} — ${escapeHTML(entry.to || "ACTUALIDAD")}
        </span>

        <span class="mw-interpreter-option__status">
          ${entry.current ? "ACTUAL" : "HISTORIAL"}
        </span>

        <span aria-hidden="true">↗</span>
      </a>
    `).join("");

    return `
      <section class="mw-interpreter-block">
        <div class="mw-interpreter-copy">
          <span class="mw-mini-label">INTÉRPRETE ACTUAL</span>
          <strong>
            ${escapeHTML(current?.country || "")}
            ${escapeHTML(currentName)}
          </strong>
        </div>

        <details class="mw-interpreter-details">
          <summary
            aria-label="Ver historial de intérpretes"
            title="Ver historial de intérpretes"
          >
            <span>VER HISTORIAL (${entries.length})</span>
            <span class="mw-chevron" aria-hidden="true">⌄</span>
          </summary>

          <div class="mw-interpreter-list">
            ${list || `
              <p class="mw-data-pending">
                Todavía no hay intérpretes registrados.
              </p>
            `}
          </div>
        </details>
      </section>
    `;
  }

  /* 9. CONTENIDO DEL MODAL */

  function modalContent(wrestler) {
    const theme = themeFor(wrestler);
    const records = getRecords(wrestler);

    const achievements = Array.isArray(wrestler.achievements)
      ? wrestler.achievements
      : [];

    const displayName =
      wrestler.displayName ||
      wrestler.name ||
      "Superestrella";

    const nickname = wrestler.nickname
      ? `<p class="mw-modal-nickname">${escapeHTML(wrestler.nickname)}</p>`
      : "";

    const image = wrestler.image || "images/renders/Vacante.webp";

    const recordsHref =
      wrestler.recordLinks?.career ||
      `records.html?wrestler=${encodeURIComponent(wrestler.name)}`;

    const seasonHref =
      wrestler.recordLinks?.season2026 ||
      `records.html?wrestler=${encodeURIComponent(wrestler.name)}&season=2026`;

    return `
      <div class="mw-wrestler-modal__backdrop" data-modal-close></div>

      <section
        class="mw-wrestler-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Ficha de ${escapeHTML(displayName)}"
        tabindex="-1"
        style="
          --wrestler-accent:${theme.accent};
          --wrestler-glow:${theme.glow};
          --wrestler-banner:${theme.banner};
        "
      >
        <button
          class="mw-wrestler-modal__close"
          type="button"
          data-modal-close
          aria-label="Cerrar ficha"
        >×</button>

        <div class="mw-modal-hero">
          <div class="mw-modal-portrait-wrap">
            <img
              class="mw-modal-portrait"
              src="${escapeHTML(image)}"
              alt="${escapeHTML(displayName)}"
              onerror="this.classList.add('is-missing');this.removeAttribute('src')"
            >
            <span class="mw-modal-brand-tag">
              ${escapeHTML(theme.label)}
            </span>
          </div>

          <div class="mw-modal-identity">
            ${nickname}
            <h2>${escapeHTML(displayName)}</h2>
            ${interpretersPanel(wrestler)}
          </div>
        </div>

        ${championBar(wrestler)}
        ${attributePanel(wrestler)}

        <div class="mw-modal-stat-grid">
          <section class="mw-modal-mini-panel">
            <span class="mw-mini-label">FINISHER</span>
            <strong>${escapeHTML(wrestler.finisher || "Sin registrar")}</strong>

            ${wrestler.signature ? `
              <span class="mw-mini-label mw-mini-label--sub">SIGNATURE</span>
              <strong>${escapeHTML(wrestler.signature)}</strong>
            ` : ""}
          </section>

          <section class="mw-modal-mini-panel mw-modal-overall">
            <span class="mw-mini-label">OVERALL</span>
            <strong>${getAttributes(wrestler)?.overall ?? "—"}</strong>
            <span class="mw-overall-note">Promedio de 3 atributos</span>
          </section>
        </div>

        <a class="mw-record-bar" href="${escapeHTML(recordsHref)}">
          <span class="mw-record-bar__icon" aria-hidden="true">▤</span>
          <span class="mw-record-bar__copy">
            <strong>VER RECORD COMPLETO</strong>
            <small>Historial de combates y estadísticas</small>
          </span>
          <span class="mw-record-bar__arrow" aria-hidden="true">↗</span>
        </a>

        <div class="mw-record-grid">
          <a class="mw-record-tile" href="${escapeHTML(seasonHref)}">
            <span class="mw-mini-label">RECORD 2026</span>
            <strong>${escapeHTML(records.season)}</strong>
            <small>Temporada actual</small>
          </a>

          <a class="mw-record-tile" href="${escapeHTML(recordsHref)}">
            <span class="mw-mini-label">RECORD TOTAL</span>
            <strong>${escapeHTML(records.career)}</strong>
            <small>Toda la carrera</small>
          </a>
        </div>

        <section class="mw-modal-panel mw-modal-achievements">
          <div class="mw-panel-heading">ACCOLADES &amp; LOGROS</div>

          ${achievements.length ? `
            <ul>
              ${achievements.map(item => `
                <li>
                  ${escapeHTML(
                    typeof item === "string"
                      ? item
                      : item.name || item.title || "Logro"
                  )}
                </li>
              `).join("")}
            </ul>
          ` : `
            <p class="mw-data-pending">
              Todavía no hay logros cargados.
            </p>
          `}
        </section>

        <div class="mw-modal-footer-meta">
          <span>${escapeHTML(wrestler.brand || "Marca sin asignar")}</span>
          <span>${escapeHTML(wrestler.stable || "Sin facción")}</span>
          <span>${escapeHTML(wrestler.name)}</span>
        </div>
      </section>
    `;
  }

  /* 10. CONTENEDOR */

  function ensureModal() {
    let root = document.getElementById("mw-wrestler-modal");

    if (!root) {
      root = document.createElement("div");
      root.id = "mw-wrestler-modal";
      root.className = "mw-wrestler-modal";
      root.hidden = true;
      root.innerHTML = `
        <div class="mw-wrestler-modal__mount"></div>
      `;
      document.body.appendChild(root);
    }

    return root;
  }

  /* 11. ABRIR MODAL */

  function openModal(wrestler) {
    if (!wrestler) return;

    const root = ensureModal();
    const mount = root.querySelector(".mw-wrestler-modal__mount");

    if (!mount) return;

    mount.innerHTML = modalContent(wrestler);
    root.hidden = false;
    document.body.classList.add("mw-modal-open");

    const dialog = root.querySelector('[role="dialog"]');
    if (dialog) dialog.focus();
  }

  /* 12. CERRAR MODAL */

  function closeModal() {
    const root = document.getElementById("mw-wrestler-modal");

    if (root) root.hidden = true;

    document.body.classList.remove("mw-modal-open");
  }

  document.addEventListener("click", event => {
    if (event.target.closest("[data-modal-close]")) {
      closeModal();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
  });

  /* 13. CATÁLOGO LEGACY */

  function renderCatalog(container, wrestlers, options = {}) {
    if (!container) return;

    const status = options.status;

    const filtered = wrestlers.filter(wrestler => {
      const brand = String(wrestler.brand || "").toLowerCase();
      const inactive = brand === "alumni" || brand === "hof";

      return status === "alumni"
        ? brand === "alumni"
        : status === "roster"
          ? !inactive
          : true;
    });

    container.innerHTML = filtered.length
      ? filtered.map(card).join("")
      : `
        <div class="mw-empty-state">
          No hay superestrellas para mostrar.
        </div>
      `;

    const byName = new Map(
      filtered.map(wrestler => [wrestler.name, wrestler])
    );

    container.querySelectorAll("[data-wrestler-open]")
      .forEach(button => {
        button.addEventListener("click", () => {
          openModal(byName.get(button.dataset.wrestlerOpen));
        });
      });
  }

  /* 14. API GLOBAL */

  global.MIWrestlerCards = {
    card,
    renderCatalog,
    openModal,
    closeModal,
    getAttributes,
    getRecords,
    themeFor
  };

})(window);
