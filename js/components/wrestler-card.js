
/* ============================================================================
   MI WRESTLING 2.0 — WRESTLER CARD + MODAL
   Componente compartido para roster y alumni. No duplica perfiles por persona.
   ============================================================================ */
(function (global) {
  "use strict";

  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  const slug = (value) => String(value || "").toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  function parseRecord(value) {
    if (!value || typeof value !== "string") return null;
    const numbers = value.match(/\d+/g);
    if (!numbers || numbers.length < 2) return null;
    return { wins: Number(numbers[0]), losses: Number(numbers[1]), draws: Number(numbers[2] || 0), label: value };
  }

  function getRecords(wrestler) {
    const stats = wrestler.legacyStats || {};
    const record = wrestler.record || {};
    return {
      season: record.season2026 || stats.overall2026 || "Sin datos",
      career: record.career || stats.careerOverall || "Sin datos"
    };
  }

  function getAttributes(wrestler) {
    const source = wrestler.attributes || wrestler.stats || {};
    const candidates = [
      { key: "power", label: "Power", value: Number(source.power ?? source.poder) },
      { key: "charisma", label: "Charisma", value: Number(source.charisma) },
      { key: "micro", label: "Micro", value: Number(source.micro ?? source.mic ?? source.micSkill) }
    ];
    // Do not show fake ratings for wrestlers whose real attributes have not been loaded.
    if (!candidates.every((item) => Number.isFinite(item.value) && item.value >= 0 && item.value <= 100)) return null;
    const overall = Math.round(candidates.reduce((sum, item) => sum + item.value, 0) / 3);
    return { items: candidates, overall };
  }

  function themeFor(wrestler) {
    const status = String(wrestler.status || "active").toLowerCase();
    const brand = String(wrestler.brand || "").toLowerCase();
    const hall = /hall.?of.?fame|hof|sal[oó]n de la fama/.test(status) || /hall.?of.?fame|hof/.test(brand);
    if (hall) return { accent: "#4b9bff", glow: "rgba(75,155,255,.3)", label: "HALL OF FAME", banner: "linear-gradient(105deg,#174e9c,#e0bd58 52%,#f7e7a4)" };
    if (/inactive|retired|alumni|retirad/.test(status)) return { accent: "#d7b46a", glow: "rgba(215,180,106,.3)", label: "ALUMNI", banner: "linear-gradient(105deg,#8e7135,#e6ca7c 48%,#6e5224)" };
    if (brand.includes("aaa")) return { accent: "#e33c49", glow: "rgba(227,60,73,.3)", label: wrestler.brand || "AAA", banner: "linear-gradient(105deg,#c51e35 0%,#f6f2ed 48%,#128b59 100%)" };
    if (brand.includes("aew")) return { accent: "#bca77a", glow: "rgba(188,167,122,.25)", label: wrestler.brand || "AEW", banner: "linear-gradient(105deg,#6b5d43 0%,#d9d0bc 48%,#f7f4ec 100%)" };
    if (brand.includes("tna")) return { accent: "#e2b83f", glow: "rgba(226,184,63,.28)", label: wrestler.brand || "TNA", banner: "linear-gradient(105deg,#b8172b 0%,#d9aa31 52%,#f5d96a 100%)" };
    if (brand.includes("raw")) return { accent: "#ff334f", glow: "rgba(255,51,79,.32)", label: wrestler.brand || "RAW", banner: "linear-gradient(105deg,#8f1027,#ff334f 52%,#ff8b93)" };
    if (brand.includes("smack") || brand === "sd") return { accent: "#3199ff", glow: "rgba(49,153,255,.3)", label: wrestler.brand || "SMACKDOWN", banner: "linear-gradient(105deg,#103c88,#3199ff 52%,#8ad2ff)" };
    if (brand.includes("nxt")) return { accent: "#e9c94a", glow: "rgba(233,201,74,.28)", label: wrestler.brand || "NXT", banner: "linear-gradient(105deg,#7a621a,#e9c94a 52%,#fff0a0)" };
    if (brand.includes("wwe")) return { accent: "#e7eaf0", glow: "rgba(231,234,240,.22)", label: wrestler.brand || "WWE", banner: "linear-gradient(105deg,#5c6575,#f0f2f5 52%,#8c96a8)" };
    return { accent: "#22d8ff", glow: "rgba(34,216,255,.3)", label: wrestler.brand || "ACTIVE", banner: "linear-gradient(105deg,#126b92,#22d8ff 52%,#b4f5ff)" };
  }

  function currentChampionships(wrestler) {
    const raw = wrestler.currentChampionships || wrestler.championshipsAsChampion || wrestler.currentTitles || wrestler.championships || [];
    if (Array.isArray(raw)) return raw.map((item) => typeof item === "string" ? item : item.name || item.title || item.championshipName || item.titleName).filter(Boolean);
    if (typeof raw === "string" && raw.trim()) return [raw.trim()];
    return [];
  }

  function championBar(wrestler) {
    const titles = currentChampionships(wrestler);
    if (!titles.length && !wrestler.isChampion) return "";
    const text = titles.length ? titles.join(" · ") : (wrestler.championOf || "CAMPEÓN ACTUAL");
    return `<div class="mw-modal-champion-bar" aria-label="Campeonatos actuales"><span class="mw-modal-champion-bar__crest" aria-hidden="true">♛</span><span class="mw-modal-champion-bar__copy"><small>GOLD STATUS · CAMPEÓN ACTUAL</small><strong>${escapeHTML(text)}</strong></span><span class="mw-modal-champion-bar__shine" aria-hidden="true"></span></div>`;
  }

  function card(wrestler) {
    const theme = themeFor(wrestler);
    const image = wrestler.image || "images/Vacante.webp";
    const name = wrestler.name || "Superestrella";
    const subtitle = wrestler.nickname || theme.label;
    const overall = getAttributes(wrestler)?.overall;
    return `<button class="mw-wrestler-card" type="button" data-wrestler-open="${escapeHTML(wrestler.id)}"
      style="--wrestler-accent:${theme.accent};--wrestler-glow:${theme.glow};--wrestler-banner:${theme.banner}" aria-label="Ver ficha de ${escapeHTML(name)}">
      <span class="mw-wrestler-card__sheen" aria-hidden="true"></span>
      <img class="mw-wrestler-card__image" src="${escapeHTML(image)}" alt="${escapeHTML(name)}" loading="lazy" onerror="this.classList.add('is-missing');this.removeAttribute('src')">
      <span class="mw-wrestler-card__rank">${overall !== undefined ? `OVR ${overall}` : escapeHTML(theme.label)}</span>
      <span class="mw-wrestler-card__banner"><span class="mw-wrestler-card__banner-inner">
        <span class="mw-wrestler-card__subtitle">${escapeHTML(subtitle)}</span>
        <span class="mw-wrestler-card__name">${escapeHTML(name)}</span>
      </span></span>
      <span class="mw-wrestler-card__brand"><span>${escapeHTML(theme.label)}</span><span class="mw-wrestler-card__view">VER FICHA ↗</span></span>
    </button>`;
  }

  function attributePanel(wrestler) {
    const data = getAttributes(wrestler);
    if (!data) return `<section class="mw-modal-panel mw-modal-panel--attributes"><div class="mw-panel-heading">COMBAT ATTRIBUTES</div><p class="mw-data-pending">Los tres atributos todavía no están cargados para esta superestrella.</p></section>`;
    return `<section class="mw-modal-panel mw-modal-panel--attributes"><div class="mw-panel-heading">COMBAT ATTRIBUTES</div>
      ${data.items.map((item) => `<div class="mw-attribute" style="--attribute-value:${item.value}%"><div class="mw-attribute__line"><span>${escapeHTML(item.label)}</span><strong>${item.value}</strong></div><div class="mw-attribute__track"><span></span></div></div>`).join("")}
    </section>`;
  }

  function interpretersPanel(wrestler) {
    const entries = Array.isArray(wrestler.interpreterHistory) ? wrestler.interpreterHistory : [];
    const currentId = wrestler.interpreter || entries.find((entry) => entry.current)?.id;
    const current = entries.find((entry) => entry.id === currentId) || entries.find((entry) => entry.current);
    const currentName = current?.name || "Sin asignar";
    const history = entries.length ? entries : (current ? [current] : []);
    const list = history.map((entry) => `<a class="mw-interpreter-option${entry.current || entry.id === currentId ? " is-current" : ""}" href="${escapeHTML(entry.recordUrl || `records.html?interpreter=${encodeURIComponent(entry.id)}`)}">
      <span class="mw-interpreter-option__name">${escapeHTML(entry.name || entry.id)}</span><span class="mw-interpreter-option__meta">${entry.current || entry.id === currentId ? "ACTUAL" : "HISTORIAL"}</span><span aria-hidden="true">↗</span></a>`).join("");
    return `<section class="mw-interpreter-block"><div class="mw-interpreter-copy"><span class="mw-mini-label">INTÉRPRETE ACTUAL</span><strong>${escapeHTML(currentName)}</strong></div>
      <details class="mw-interpreter-details"><summary aria-label="Ver intérpretes anteriores" title="Ver intérpretes anteriores"><span>VER HISTORIAL</span><span class="mw-chevron" aria-hidden="true">⌄</span></summary>
      <div class="mw-interpreter-list">${list || `<p class="mw-data-pending">Todavía no hay intérpretes registrados.</p>`}</div></details></section>`;
  }

  function modalContent(wrestler) {
    const theme = themeFor(wrestler);
    const records = getRecords(wrestler);
    const achievements = Array.isArray(wrestler.achievements) ? wrestler.achievements : [];
    const nickname = wrestler.nickname ? `<p class="mw-modal-nickname">${escapeHTML(wrestler.nickname)}</p>` : "";
    const image = wrestler.image || "images/Vacante.webp";
    const recordsHref = wrestler.recordLinks?.career || `records.html?wrestler=${encodeURIComponent(wrestler.id)}`;
    const seasonHref = wrestler.recordLinks?.season2026 || `records.html?wrestler=${encodeURIComponent(wrestler.id)}&season=2026`;
    return `<div class="mw-wrestler-modal__backdrop" data-modal-close></div><section class="mw-wrestler-modal__dialog" role="dialog" aria-modal="true" aria-label="Ficha de ${escapeHTML(wrestler.name)}" tabindex="-1" style="--wrestler-accent:${theme.accent};--wrestler-glow:${theme.glow};--wrestler-banner:${theme.banner}">
      <button class="mw-wrestler-modal__close" type="button" data-modal-close aria-label="Cerrar ficha">×</button>
      <div class="mw-modal-hero"><div class="mw-modal-portrait-wrap"><img class="mw-modal-portrait" src="${escapeHTML(image)}" alt="${escapeHTML(wrestler.name)}" onerror="this.classList.add('is-missing');this.removeAttribute('src')"><span class="mw-modal-brand-tag">${escapeHTML(theme.label)}</span></div>
        <div class="mw-modal-identity">${nickname}<h2>${escapeHTML(wrestler.name)}</h2>${interpretersPanel(wrestler)}</div></div>
      ${championBar(wrestler)}
      ${attributePanel(wrestler)}
      <div class="mw-modal-stat-grid"><section class="mw-modal-mini-panel"><span class="mw-mini-label">FINISHER</span><strong>${escapeHTML(wrestler.finisher || "Sin registrar")}</strong>${wrestler.signature ? `<span class="mw-mini-label mw-mini-label--sub">SIGNATURE</span><strong>${escapeHTML(wrestler.signature)}</strong>` : ""}</section>
      <section class="mw-modal-mini-panel mw-modal-overall"><span class="mw-mini-label">OVERALL</span><strong>${getAttributes(wrestler)?.overall ?? "—"}</strong><span class="mw-overall-note">Promedio de 3 atributos</span></section></div>
      <a class="mw-record-bar" href="${escapeHTML(recordsHref)}"><span class="mw-record-bar__icon" aria-hidden="true">▤</span><span class="mw-record-bar__copy"><strong>VER RECORD COMPLETO</strong><small>Historial de combates y estadísticas</small></span><span class="mw-record-bar__arrow" aria-hidden="true">↗</span></a>
      <div class="mw-record-grid"><a class="mw-record-tile" href="${escapeHTML(seasonHref)}"><span class="mw-mini-label">RECORD 2026</span><strong>${escapeHTML(records.season)}</strong><small>Temporada actual</small></a><a class="mw-record-tile" href="${escapeHTML(recordsHref)}"><span class="mw-mini-label">RECORD TOTAL</span><strong>${escapeHTML(records.career)}</strong><small>Toda la carrera</small></a></div>
      <section class="mw-modal-panel mw-modal-achievements"><div class="mw-panel-heading">ACCOLADES &amp; LOGROS</div>${achievements.length ? `<ul>${achievements.map((item) => `<li>${escapeHTML(typeof item === "string" ? item : item.name || item.title || "Logro")}</li>`).join("")}</ul>` : `<p class="mw-data-pending">Todavía no hay logros cargados.</p>`}</section>
      <div class="mw-modal-footer-meta"><span>${escapeHTML(wrestler.brand || "Marca sin asignar")}</span><span>${escapeHTML(wrestler.division || "División sin asignar")}</span><span>${escapeHTML(wrestler.status || "Estado sin asignar")}</span></div>
    </section>`;
  }

  function ensureModal() {
    let root = document.getElementById("mw-wrestler-modal");
    if (!root) {
      root = document.createElement("div"); root.id = "mw-wrestler-modal"; root.className = "mw-wrestler-modal";
      root.hidden = true; root.innerHTML = "<div class=\"mw-wrestler-modal__mount\"></div>"; document.body.appendChild(root);
    }
    return root;
  }

  function openModal(wrestler) {
    if (!wrestler) return;
    const root = ensureModal();
    root.querySelector(".mw-wrestler-modal__mount").innerHTML = modalContent(wrestler);
    root.hidden = false; document.body.classList.add("mw-modal-open");
    const dialog = root.querySelector('[role="dialog"]');
    if (dialog) dialog.focus();
    root.querySelectorAll("[data-modal-close]").forEach((element) => element.addEventListener("click", closeModal));
    root.querySelector(".mw-wrestler-modal__close")?.addEventListener("click", closeModal);
  }

  function closeModal() {
    const root = document.getElementById("mw-wrestler-modal");
    if (root) root.hidden = true;
    document.body.classList.remove("mw-modal-open");
  }

  function renderCatalog(container, wrestlers, options = {}) {
    if (!container) return;
    const status = options.status;
    const filtered = wrestlers.filter((wrestler) => {
      const inactive = /inactive|retired|alumni/i.test(String(wrestler.status || ""));
      return status === "alumni" ? inactive : status === "roster" ? !inactive : true;
    });
    container.innerHTML = filtered.length ? filtered.map(card).join("") : `<div class="mw-empty-state">No hay superestrellas para mostrar.</div>`;
    const byId = new Map(wrestlers.map((wrestler) => [wrestler.id, wrestler]));
    container.querySelectorAll("[data-wrestler-open]").forEach((button) => button.addEventListener("click", () => openModal(byId.get(button.dataset.wrestlerOpen))));
  }

  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });
  global.MIWrestlerCards = { card, renderCatalog, openModal, closeModal, getAttributes, getRecords, themeFor };
})(window);
