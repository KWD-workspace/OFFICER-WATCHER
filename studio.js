(function () {
  "use strict";

  const list = document.getElementById("weekly-news");
  const status = document.getElementById("sync-status");
  const syncButton = document.getElementById("sync-button");
  const rangeButtons = [...document.querySelectorAll(".range-button")];
  const dateFrom = document.getElementById("date-from");
  const dateTo = document.getElementById("date-to");
  const applyCustomRange = document.getElementById("apply-custom-range");
  const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  let selectedRange = 30;
  let customDates = null;

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
    const allItems = Array.isArray(data?.items) ? data.items.filter(validItem) : [];
    list.replaceChildren();

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const cutoff = customDates ? new Date(`${customDates.from}T00:00:00`) : new Date();
    if (!customDates) {
      cutoff.setHours(0, 0, 0, 0);
      cutoff.setDate(cutoff.getDate() - selectedRange + 1);
    }
    const rangeEnd = customDates ? new Date(`${customDates.to}T23:59:59.999`) : today;
    const rangeLabel = customDates
      ? `du ${safeDate(customDates.from)} au ${safeDate(customDates.to)}`
      : (selectedRange === 365 ? "1 an" : `${selectedRange} jours`);
    const items = allItems.filter((item) => {
      const published = new Date(`${item.publishedAt}T12:00:00`);
      return !Number.isNaN(published.getTime()) && published >= cutoff && published <= rangeEnd;
    });

    if (!items.length) {
      const message = allItems.length
        ? `Aucune actualité sourcée ${customDates ? rangeLabel : `sur les ${selectedRange === 365 ? "12 derniers mois" : `${selectedRange} derniers jours`}`}.`
        : (data?.emptyMessage || "Aucune actualité suffisamment sourcée dans ce fichier de veille.");
      list.append(makeText("div", "empty-card", message));
      status.textContent = `${allItems.length} actualité${allItems.length === 1 ? "" : "s"} archivée${allItems.length === 1 ? "" : "s"} · ${rangeLabel}`;
      return;
    }

    items.sort((a, b) => (a.priority || 3) - (b.priority || 3) || b.publishedAt.localeCompare(a.publishedAt));
    items.forEach((item) => list.append(makeCard(item)));

    const updated = data.updatedAt ? new Date(data.updatedAt) : null;
    const updatedText = updated && !Number.isNaN(updated.getTime())
      ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }).format(updated)
      : "date inconnue";
    status.textContent = `${items.length} actualité${items.length === 1 ? "" : "s"} · ${rangeLabel} · synchronisée le ${updatedText}`;
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

  rangeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedRange = Number(button.dataset.range) || 30;
      customDates = null;
      applyCustomRange.classList.remove("is-active");
      rangeButtons.forEach((candidate) => {
        const isActive = candidate === button;
        candidate.classList.toggle("is-active", isActive);
        candidate.setAttribute("aria-pressed", String(isActive));
      });
      render(window.OFFICIER_WATCH_DATA);
    });
  });

  applyCustomRange.addEventListener("click", () => {
    if (!dateFrom.value || !dateTo.value || dateFrom.value > dateTo.value) {
      status.textContent = "Choisis une date de début et une date de fin valides.";
      return;
    }
    customDates = { from: dateFrom.value, to: dateTo.value };
    applyCustomRange.classList.add("is-active");
    rangeButtons.forEach((candidate) => {
      candidate.classList.remove("is-active");
      candidate.setAttribute("aria-pressed", "false");
    });
    render(window.OFFICIER_WATCH_DATA);
  });

  syncButton.addEventListener("click", sync);
  render(window.OFFICIER_WATCH_DATA);
})();
