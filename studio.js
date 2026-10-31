(function () {
  "use strict";

  const list = document.getElementById("weekly-news");
  const status = document.getElementById("sync-status");
  const syncButton = document.getElementById("sync-button");
  const rangeButtons = [...document.querySelectorAll(".range-button")];
  const dateFrom = document.getElementById("date-from");
  const dateTo = document.getElementById("date-to");
  const applyCustomRange = document.getElementById("apply-custom-range");
  const searchInput = document.getElementById("news-search");
  const categoryTags = document.getElementById("category-tags");
  const favoritesToggle = document.getElementById("favorites-toggle");
  const favoriteCount = document.getElementById("favorite-count");
  const favoritesNav = document.getElementById("favorites-nav");
  const sidebarFavoriteCount = document.getElementById("sidebar-favorite-count");
  const quizSummary = document.getElementById("quiz-summary");
  const quizIntro = document.getElementById("quiz-intro");
  const quizPlay = document.getElementById("quiz-play");
  const quizStart = document.getElementById("quiz-start");
  const quizProgress = document.getElementById("quiz-progress");
  const quizQuestion = document.getElementById("quiz-question");
  const quizAnswers = document.getElementById("quiz-answers");
  const quizFeedback = document.getElementById("quiz-feedback");
  const quizNext = document.getElementById("quiz-next");
  const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const favoritesStorageKey = "officier-watch:favorites:v1";

  let selectedRange = 30;
  let customDates = null;
  let selectedCategory = "";
  let showFavorites = false;
  let favoriteItems = loadFavorites();
  let quizQuestions = [];
  let quizIndex = 0;
  let quizScore = 0;

  function loadFavorites() {
    try {
      const saved = JSON.parse(localStorage.getItem(favoritesStorageKey) || "{}");
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) return new Map();
      return new Map(Object.entries(saved).filter(([, item]) => validItem(item)));
    } catch {
      return new Map();
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(favoritesStorageKey, JSON.stringify(Object.fromEntries(favoriteItems)));
    } catch {
      status.textContent = "Le navigateur n’a pas pu enregistrer les favoris.";
    }
    updateFavoriteControls();
  }

  function updateFavoriteControls() {
    favoriteCount.textContent = String(favoriteItems.size);
    sidebarFavoriteCount.textContent = String(favoriteItems.size);
    favoritesToggle.setAttribute("aria-pressed", String(showFavorites));
    favoritesToggle.classList.toggle("is-active", showFavorites);
    favoritesToggle.querySelector("[aria-hidden]").textContent = showFavorites ? "★" : "☆";
    const wasFavoritesActive = favoritesNav.classList.contains("selected");
    favoritesNav.classList.toggle("selected", showFavorites);
    if (showFavorites) {
      document.querySelectorAll(".main-nav .nav-link").forEach((link) => link.classList.toggle("selected", link === favoritesNav));
    } else if (wasFavoritesActive) {
      document.querySelector('.main-nav .nav-link[href="#veille"]')?.classList.add("selected");
    }
  }

  function safeDate(value) {
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? "Date non précisée" : dateFormat.format(date);
  }

  function validItem(item) {
    if (!item || typeof item !== "object") return false;
    try {
      return Boolean(
        item.id && item.title && item.publishedAt && item.sourceTitle && item.summary &&
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

    const isFavorite = favoriteItems.has(item.id);
    const favoriteButton = document.createElement("button");
    favoriteButton.className = `favorite-button${isFavorite ? " is-favorite" : ""}`;
    favoriteButton.type = "button";
    favoriteButton.setAttribute("aria-pressed", String(isFavorite));
    favoriteButton.setAttribute("aria-label", isFavorite ? "Retirer des favoris" : "Ajouter aux favoris");
    favoriteButton.textContent = isFavorite ? "★ Favori" : "☆ Favoris";
    favoriteButton.addEventListener("click", () => {
      if (favoriteItems.has(item.id)) favoriteItems.delete(item.id);
      else favoriteItems.set(item.id, item);
      saveFavorites();
      render(window.OFFICIER_WATCH_DATA);
    });
    top.append(favoriteButton);

    const title = makeText("h3", "news-title", item.title);
    const summary = makeText("p", "news-summary", item.summary);
    const reason = makeText("p", "news-relevance", item.whyItMatters || "");

    card.append(top, title, summary);
    if (item.legalStatus) card.append(makeText("p", "legal-status", item.legalStatus));

    if (Array.isArray(item.tags) && item.tags.length) {
      const tags = document.createElement("div");
      tags.className = "news-item-tags";
      item.tags.slice(0, 6).forEach((tag) => tags.append(makeText("span", "news-item-tag", tag)));
      card.append(tags);
    }

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

  function getDateRange() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (customDates) {
      return {
        start: new Date(`${customDates.from}T00:00:00`),
        end: new Date(`${customDates.to}T23:59:59.999`),
        label: `du ${safeDate(customDates.from)} au ${safeDate(customDates.to)}`
      };
    }
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - selectedRange + 1);
    return { start, end: today, label: selectedRange === 365 ? "1 an" : `${selectedRange} jours` };
  }

  function categoryMatches(item) {
    if (!selectedCategory) return true;
    return (item.category || "Actualité") === selectedCategory;
  }

  function searchMatches(item, query) {
    if (!query) return true;
    const searchable = [
      item.title, item.category, item.summary, item.whyItMatters, item.legalStatus,
      ...(Array.isArray(item.keyPoints) ? item.keyPoints : []),
      ...(Array.isArray(item.tags) ? item.tags : [])
    ].filter(Boolean).join(" ").toLocaleLowerCase("fr-FR");
    return searchable.includes(query);
  }

  function renderCategoryTags(items) {
    const categories = [...new Set(items.map((item) => item.category || "Actualité"))].sort((a, b) => a.localeCompare(b, "fr"));
    if (selectedCategory && !categories.includes(selectedCategory)) selectedCategory = "";
    categoryTags.replaceChildren();

    const choices = [{ label: "Toutes", value: "" }, ...categories.map((category) => ({ label: category, value: category }))];
    choices.forEach(({ label, value }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `category-tag${selectedCategory === value ? " is-active" : ""}`;
      button.textContent = label;
      button.setAttribute("aria-pressed", String(selectedCategory === value));
      button.addEventListener("click", () => {
        selectedCategory = value;
        render(window.OFFICIER_WATCH_DATA);
      });
      categoryTags.append(button);
    });
  }

  function buildQuizQuestions(items) {
    const factPool = items.flatMap((item) => (Array.isArray(item.keyPoints) ? item.keyPoints : [])
      .filter((point) => typeof point === "string" && point.trim())
      .map((point) => ({ point: point.trim(), itemId: item.id })));

    return items.map((item) => {
      const ownFacts = (Array.isArray(item.keyPoints) ? item.keyPoints : []).filter((point) => typeof point === "string" && point.trim());
      const correct = ownFacts[0]?.trim() || item.summary;
      const distractors = [...new Set(factPool
        .filter((fact) => fact.itemId !== item.id && fact.point !== correct)
        .map((fact) => fact.point))];
      const choices = shuffle([correct, ...shuffle(distractors).slice(0, 3)]);
      return { title: item.title, correct, choices };
    });
  }

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function updateQuizAvailability(items) {
    quizQuestions = buildQuizQuestions(items);
    quizSummary.textContent = `${items.length} actualité${items.length === 1 ? "" : "s"} dans le quiz`;
    quizStart.disabled = !items.length;
    if (!items.length) quizStart.textContent = "Quiz indisponible";
    else if (quizStart.textContent === "Quiz indisponible") quizStart.textContent = "Commencer le quiz →";
  }

  function showQuizQuestion() {
    const question = quizQuestions[quizIndex];
    quizProgress.textContent = `Question ${quizIndex + 1} sur ${quizQuestions.length} · ${quizScore} bonne${quizScore === 1 ? "" : "s"} réponse${quizScore === 1 ? "" : "s"}`;
    quizQuestion.textContent = `Pour « ${question.title} », quel élément figure dans la veille ?`;
    quizAnswers.replaceChildren();
    quizFeedback.textContent = "";
    quizNext.hidden = true;
    question.choices.forEach((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quiz-answer";
      button.textContent = choice;
      button.addEventListener("click", () => {
        [...quizAnswers.querySelectorAll("button")].forEach((candidate) => { candidate.disabled = true; });
        const isCorrect = choice === question.correct;
        if (isCorrect) quizScore += 1;
        button.classList.add(isCorrect ? "is-correct" : "is-wrong");
        if (!isCorrect) {
          [...quizAnswers.querySelectorAll("button")].find((candidate) => candidate.textContent === question.correct)?.classList.add("is-correct");
        }
        quizFeedback.textContent = isCorrect ? "Bonne réponse !" : `La bonne réponse était : ${question.correct}`;
        quizProgress.textContent = `Question ${quizIndex + 1} sur ${quizQuestions.length} · ${quizScore} bonne${quizScore === 1 ? "" : "s"} réponse${quizScore === 1 ? "" : "s"}`;
        quizNext.textContent = quizIndex + 1 === quizQuestions.length ? "Voir mon résultat" : "Question suivante →";
        quizNext.hidden = false;
      });
      quizAnswers.append(button);
    });
  }

  function startQuiz() {
    if (!quizQuestions.length) return;
    quizQuestions = shuffle(quizQuestions);
    quizIndex = 0;
    quizScore = 0;
    quizIntro.hidden = true;
    quizPlay.hidden = false;
    showQuizQuestion();
  }

  function renderQuizResult() {
    quizProgress.textContent = "Quiz terminé";
    quizQuestion.textContent = `Ton résultat : ${quizScore} / ${quizQuestions.length}`;
    quizAnswers.replaceChildren();
    quizFeedback.textContent = quizScore === quizQuestions.length
      ? "Parfait, tu as retenu tous les points clés de la veille !"
      : "Tu peux refaire le quiz ou consulter les actualités pour revoir les points clés.";
    quizNext.hidden = true;
    quizIntro.hidden = false;
    quizStart.textContent = "Recommencer le quiz →";
  }

  function render(data) {
    const allItems = Array.isArray(data?.items) ? data.items.filter(validItem) : [];
    list.replaceChildren();
    renderCategoryTags(allItems);
    updateFavoriteControls();
    updateQuizAvailability(allItems);

    const { start, end, label } = getDateRange();
    const query = searchInput.value.trim().toLocaleLowerCase("fr-FR");
    const dateItems = showFavorites
      ? [...favoriteItems.values()]
      : allItems.filter((item) => {
        const published = new Date(`${item.publishedAt}T12:00:00`);
        return !Number.isNaN(published.getTime()) && published >= start && published <= end;
      });
    const items = dateItems.filter((item) => categoryMatches(item) && searchMatches(item, query));

    if (!items.length) {
      const message = showFavorites
        ? "Aucun favori ne correspond à cette recherche. Les favoris restent enregistrés dans ce navigateur."
        : allItems.length
          ? `Aucune actualité ne correspond à cette période et à ces filtres (${label}).`
          : (data?.emptyMessage || "Aucune actualité suffisamment sourcée dans ce fichier de veille.");
      list.append(makeText("div", "empty-card", message));
      status.textContent = showFavorites
        ? `${favoriteItems.size} favori${favoriteItems.size === 1 ? "" : "s"} enregistré${favoriteItems.size === 1 ? "" : "s"}`
        : `${allItems.length} actualité${allItems.length === 1 ? "" : "s"} archivée${allItems.length === 1 ? "" : "s"} · ${label}`;
      return;
    }

    items.sort((a, b) => (a.priority || 3) - (b.priority || 3) || b.publishedAt.localeCompare(a.publishedAt));
    items.forEach((item) => list.append(makeCard(item)));

    const updated = data.updatedAt ? new Date(data.updatedAt) : null;
    const updatedText = updated && !Number.isNaN(updated.getTime())
      ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }).format(updated)
      : "date inconnue";
    const filterLabel = showFavorites ? "favoris" : label;
    status.textContent = `${items.length} actualité${items.length === 1 ? "" : "s"} affichée${items.length === 1 ? "" : "s"} · ${allItems.length} dans l’archive · ${filterLabel} · synchronisée le ${updatedText}`;
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

  searchInput.addEventListener("input", () => render(window.OFFICIER_WATCH_DATA));
  favoritesToggle.addEventListener("click", () => {
    showFavorites = !showFavorites;
    render(window.OFFICIER_WATCH_DATA);
  });
  favoritesNav.addEventListener("click", (event) => {
    event.preventDefault();
    showFavorites = true;
    render(window.OFFICIER_WATCH_DATA);
    document.getElementById("veille").scrollIntoView({ behavior: "smooth" });
  });
  document.querySelectorAll(".main-nav .nav-link:not(#favorites-nav)").forEach((link) => {
    link.addEventListener("click", () => {
      showFavorites = false;
      document.querySelectorAll(".main-nav .nav-link").forEach((candidate) => candidate.classList.toggle("selected", candidate === link));
      updateFavoriteControls();
      render(window.OFFICIER_WATCH_DATA);
    });
  });
  quizStart.addEventListener("click", startQuiz);
  quizNext.addEventListener("click", () => {
    quizIndex += 1;
    if (quizIndex >= quizQuestions.length) renderQuizResult();
    else showQuizQuestion();
  });
  syncButton.addEventListener("click", sync);
  render(window.OFFICIER_WATCH_DATA);
})();
