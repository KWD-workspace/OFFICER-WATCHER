(function () {
  "use strict";

  const list = document.getElementById("weekly-news");
  const status = document.getElementById("sync-status");
  const syncButton = document.getElementById("sync-button");
  const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  function safeDate(value) {
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? "Date non précisée" : dateFormat.format(date);
  }

  function validItem(item) {
    if (!item || typeof item !== "object") return false;
    try {
      return Boolean(
        item.title && item.publishedAt && item.sourceTitle && item.summary &&
        item.sourceUrl && new URL(item.sourceUrl).protocol === "https:"
      );
    } catch {
      return false;
    }
  }

  function makeText(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function makeCard(item) {
    const card = document.createElement("article");
    card.className = "news-card";

    const top = document.createElement("div");
    top.className = "news-meta";
    top.append(makeText("span", "news-category", item.category || "Actualité"));
    top.append(makeText("span", "news-date", safeDate(item.publishedAt)));
    if (item.priority === 1) top.append(makeText("span", "priority-badge", "À connaître"));

    const title = makeText("h3", "news-title", item.title);
    const summary = makeText("p", "news-summary", item.summary);
    const reason = makeText("p", "news-relevance", item.whyItMatters || "");

    card.append(top, title, summary);
    if (item.legalStatus) card.append(makeText("p", "legal-status", item.legalStatus));

    if (Array.isArray(item.keyPoints) && item.keyPoints.length) {
      const points = document.createElement("ul");
      points.className = "news-points";
      item.keyPoints.slice(0, 3).forEach((point) => points.append(makeText("li", "", point)));
      card.append(points);
    }

    if (reason.textContent) card.append(reason);

    const sources = [{ title: item.sourceTitle, url: item.sourceUrl }]
      .concat(Array.isArray(item.sources) ? item.sources : [])
      .filter((source) => source?.title && typeof source.url === "string" && source.url.startsWith("https://"));
    const sourceList = document.createElement("div");
    sourceList.className = "source-list";
    sources.forEach((sourceInfo) => {
      const source = document.createElement("a");
      source.className = "source-link";
      source.href = sourceInfo.url;
      source.target = "_blank";
      source.rel = "noopener noreferrer";
      source.append(makeText("span", "source-dot", "↗"), makeText("span", "", sourceInfo.title));
      sourceList.append(source);
    });
    if (sourceList.childElementCount) card.append(sourceList);
    return card;
  }

  function render(data) {
    const items = Array.isArray(data?.items) ? data.items.filter(validItem) : [];
    list.replaceChildren();

    if (!items.length) {
      list.append(makeText("div", "empty-card", data?.emptyMessage || "Aucune actualité suffisamment sourcée dans ce fichier de veille."));
      status.textContent = "Aucun contenu vérifié à afficher";
      return;
    }

    items.sort((a, b) => (a.priority || 3) - (b.priority || 3) || b.publishedAt.localeCompare(a.publishedAt));
    items.forEach((item) => list.append(makeCard(item)));

    const start = data.periodStart ? safeDate(data.periodStart) : "";
    const end = data.periodEnd ? safeDate(data.periodEnd) : "";
    const updated = data.updatedAt ? new Date(data.updatedAt) : null;
    const updatedText = updated && !Number.isNaN(updated.getTime())
      ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }).format(updated)
      : "date inconnue";
    status.textContent = `${items.length} actualités · semaine du ${start} au ${end} · synchronisée le ${updatedText}`;
  }

  function sync() {
    syncButton.disabled = true;
    syncButton.classList.add("is-syncing");
    syncButton.querySelector(".sync-icon").textContent = "…";
    status.textContent = "Actualisation du fichier hebdomadaire…";

    const script = document.createElement("script");
    script.src = `data/veille.js?sync=${Date.now()}`;
    script.onload = () => {
      render(window.OFFICIER_WATCH_DATA);
      syncButton.disabled = false;
      syncButton.classList.remove("is-syncing");
      syncButton.querySelector(".sync-icon").textContent = "↻";
    };
    script.onerror = () => {
      status.textContent = "Synchronisation impossible ; la veille affichée est conservée.";
      syncButton.disabled = false;
      syncButton.classList.remove("is-syncing");
      syncButton.querySelector(".sync-icon").textContent = "↻";
    };
    document.body.append(script);
  }

  syncButton.addEventListener("click", sync);
  render(window.OFFICIER_WATCH_DATA);
})();
