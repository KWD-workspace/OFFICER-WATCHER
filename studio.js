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
  const copilotForm = document.getElementById("copilot-form");
  const copilotQuery = document.getElementById("copilot-query");
  const copilotResponse = document.getElementById("copilot-response");
  const legalList = document.getElementById("legal-list");
  const librarySearch = document.getElementById("library-search");
  const libraryList = document.getElementById("library-list");
  const libraryResultCount = document.getElementById("library-result-count");
  const progressSummary = document.getElementById("progress-summary");
  const progressBar = document.getElementById("progress-bar");
  const readCount = document.getElementById("read-count");
  const bestQuizScoreElement = document.getElementById("best-quiz-score");
  const progressTrack = document.querySelector(".progress-track");
  const progressBreakdown = document.getElementById("progress-breakdown");
  const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const favoritesStorageKey = "officier-watch:favorites:v1";
  const readStorageKey = "officier-watch:read:v1";
  const quizScoreStorageKey = "officier-watch:quiz-best:v1";

  let selectedRange = 30;
  let customDates = null;
  let selectedCategory = "";
  let showFavorites = false;
  let favoriteItems = loadFavorites();
  let readArticleIds = loadReadArticleIds();
  let quizQuestions = [];
  let quizIndex = 0;
  let quizScore = 0;
  let bestQuizScore = loadBestQuizScore();

  function loadReadArticleIds() {
    try {
      const saved = JSON.parse(localStorage.getItem(readStorageKey) || "[]");
      return new Set(Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : []);
    } catch {
      return new Set();
    }
  }

  function loadBestQuizScore() {
    try {
      const saved = JSON.parse(localStorage.getItem(quizScoreStorageKey) || "null");
      return saved && Number.isInteger(saved.score) && Number.isInteger(saved.total)
        ? saved
        : null;
    } catch {
      return null;
    }
  }

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

    const readButton = document.createElement("button");
    const isRead = readArticleIds.has(item.id);
    readButton.className = `read-toggle${isRead ? " is-read" : ""}`;
    readButton.type = "button";
    readButton.setAttribute("aria-pressed", String(isRead));
    readButton.textContent = isRead ? "✓ Révisée" : "Marquer comme révisée";
    readButton.addEventListener("click", () => {
      if (readArticleIds.has(item.id)) readArticleIds.delete(item.id);
      else readArticleIds.add(item.id);
      try {
        localStorage.setItem(readStorageKey, JSON.stringify([...readArticleIds]));
      } catch {
        status.textContent = "Le navigateur n’a pas pu enregistrer ta progression.";
      }
      render(window.OFFICIER_WATCH_DATA);
    });
    const actions = document.createElement("div");
    actions.className = "news-card-actions";
    actions.append(readButton);
    card.append(actions);
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

  function normalizeText(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-FR");
  }

  function searchMatches(item, query) {
    if (!query) return true;
    const searchable = [
      item.title, item.category, item.summary, item.whyItMatters, item.legalStatus,
      ...(Array.isArray(item.keyPoints) ? item.keyPoints : []),
      ...(Array.isArray(item.tags) ? item.tags : [])
    ].filter(Boolean).join(" ");
    return normalizeText(searchable).includes(normalizeText(query));
  }

  function makeSourceLink(title, url) {
    const link = document.createElement("a");
    link.className = "source-link";
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append(makeText("span", "source-dot", "↗"), makeText("span", "", title));
    return link;
  }

  function renderLegalList(items) {
    const legalItems = items.filter((item) => item.category === "Justice & droit" ||
      (Array.isArray(item.tags) && item.tags.some((tag) => /loi|projet|justice|droit|parquet|pnat|pnaco|jirs|reforme|juridique/i.test(normalizeText(tag)))))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    legalList.replaceChildren();
    if (!legalItems.length) {
      legalList.append(makeText("div", "empty-card", "Aucun texte ou statut juridique n’est encore renseigné dans l’archive."));
      return;
    }
    legalItems.forEach((item) => {
      const card = document.createElement("article");
      card.className = "legal-card";
      const heading = document.createElement("div");
      heading.className = "legal-card-heading";
      heading.append(makeText("span", "legal-category", item.category || "Droit"));
      heading.append(makeText("time", "legal-date", safeDate(item.publishedAt)));
      card.append(heading, makeText("h3", "", item.title));
      card.append(makeText("p", "legal-card-status", item.legalStatus || "Actualité juridique — consulte la source pour le statut détaillé."));
      card.append(makeText("p", "legal-card-summary", item.summary));
      card.append(makeSourceLink(item.sourceTitle, item.sourceUrl));
      legalList.append(card);
    });
  }

  function renderLibrary(items) {
    const query = normalizeText(librarySearch.value.trim());
    const matches = items.filter((item) => searchMatches(item, query));
    libraryResultCount.textContent = `${matches.length} / ${items.length}`;
    libraryList.replaceChildren();
    if (!matches.length) {
      libraryList.append(makeText("div", "empty-card", items.length
        ? "Aucun contenu ne correspond à ta recherche. Essaie un autre mot-clé ou un tag."
        : "L’archive est vide pour le moment."));
      return;
    }
    matches.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    matches.forEach((item) => libraryList.append(makeCard(item)));
  }

  function renderProgress(items) {
    const studied = items.filter((item) => readArticleIds.has(item.id));
    const percentage = items.length ? Math.round((studied.length / items.length) * 100) : 0;
    readCount.textContent = `${studied.length} / ${items.length}`;
    progressSummary.textContent = items.length
      ? `${percentage} % de l’archive marquée comme révisée. Cette progression est enregistrée dans ce navigateur.`
      : "Aucune actualité disponible pour calculer la progression.";
    progressBar.style.width = `${percentage}%`;
    progressTrack.setAttribute("aria-valuenow", String(percentage));
    bestQuizScoreElement.textContent = bestQuizScore ? `${bestQuizScore.score} / ${bestQuizScore.total}` : "—";
    progressBreakdown.replaceChildren();

    const categories = [...new Set(items.map((item) => item.category || "Actualité"))].sort((a, b) => a.localeCompare(b, "fr"));
    categories.forEach((category) => {
      const categoryItems = items.filter((item) => (item.category || "Actualité") === category);
      const categoryRead = categoryItems.filter((item) => readArticleIds.has(item.id)).length;
      const row = document.createElement("div");
      row.className = "progress-category";
      row.append(makeText("span", "", category));
      row.append(makeText("strong", "", `${categoryRead} / ${categoryItems.length}`));
      progressBreakdown.append(row);
    });
  }

  function answerCopilot(items, query) {
    copilotResponse.replaceChildren();
    const terms = normalizeText(query).split(/\s+/).filter((term) => term.length > 1);
    if (!terms.length) {
      copilotResponse.append(makeText("p", "tool-hint", "Entre un thème ou une notion pour chercher dans l’archive."));
      return;
    }
    const results = items.map((item) => {
      const fields = [item.title, item.category, item.summary, item.whyItMatters, item.legalStatus,
        ...(Array.isArray(item.keyPoints) ? item.keyPoints : []),
        ...(Array.isArray(item.tags) ? item.tags : [])].filter(Boolean).map(normalizeText);
      const score = terms.reduce((total, term) => total + fields.reduce((sum, field, index) => {
        if (!field.includes(term)) return sum;
        return sum + (index === 0 ? 3 : index <= 2 ? 2 : 1);
      }, 0), 0);
      return { item, score };
    }).filter((result) => result.score > 0).sort((a, b) => b.score - a.score || b.item.publishedAt.localeCompare(a.item.publishedAt)).slice(0, 5);

    if (!results.length) {
      copilotResponse.append(makeText("p", "tool-hint", "Je n’ai pas trouvé de réponse dans l’archive actuelle. Essaie un autre mot-clé ; le copilote ne complète pas les informations manquantes par supposition."));
      return;
    }
    copilotResponse.append(makeText("p", "copilot-result-intro", `${results.length} source${results.length === 1 ? "" : "s"} de la veille correspondent à « ${query} » :`));
    const resultList = document.createElement("div");
    resultList.className = "copilot-results";
    results.forEach(({ item }) => {
      const card = document.createElement("article");
      card.className = "copilot-result";
      card.append(makeText("span", "news-date", `${item.category || "Actualité"} · ${safeDate(item.publishedAt)}`));
      card.append(makeText("h4", "", item.title));
      card.append(makeText("p", "", item.summary));
      if (item.whyItMatters) card.append(makeText("p", "copilot-relevance", item.whyItMatters));
      card.append(makeSourceLink(item.sourceTitle, item.sourceUrl));
      resultList.append(card);
    });
    copilotResponse.append(resultList);
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
    const result = { score: quizScore, total: quizQuestions.length };
    const previousRatio = bestQuizScore ? bestQuizScore.score / bestQuizScore.total : -1;
    const currentRatio = result.total ? result.score / result.total : 0;
    if (!bestQuizScore || currentRatio > previousRatio) {
      bestQuizScore = result;
      try {
        localStorage.setItem(quizScoreStorageKey, JSON.stringify(bestQuizScore));
      } catch {
        // Le résultat de cette partie reste visible même si le navigateur refuse son stockage.
      }
    }
    quizProgress.textContent = "Quiz terminé";
    quizQuestion.textContent = `Ton résultat : ${quizScore} / ${quizQuestions.length}`;
    quizAnswers.replaceChildren();
    quizFeedback.textContent = quizScore === quizQuestions.length
      ? "Parfait, tu as retenu tous les points clés de la veille !"
      : "Tu peux refaire le quiz ou consulter les actualités pour revoir les points clés.";
    quizNext.hidden = true;
    quizIntro.hidden = false;
    quizStart.textContent = "Recommencer le quiz →";
    renderProgress(window.OFFICIER_WATCH_DATA?.items?.filter(validItem) || []);
  }

  function render(data) {
    const allItems = Array.isArray(data?.items) ? data.items.filter(validItem) : [];
    list.replaceChildren();
    renderCategoryTags(allItems);
    updateFavoriteControls();
    updateQuizAvailability(allItems);
    renderLegalList(allItems);
    renderLibrary(allItems);
    renderProgress(allItems);

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
  copilotForm.addEventListener("submit", (event) => {
    event.preventDefault();
    answerCopilot(Array.isArray(window.OFFICIER_WATCH_DATA?.items)
      ? window.OFFICIER_WATCH_DATA.items.filter(validItem)
      : [], copilotQuery.value.trim());
  });
  librarySearch.addEventListener("input", () => {
    const items = Array.isArray(window.OFFICIER_WATCH_DATA?.items)
      ? window.OFFICIER_WATCH_DATA.items.filter(validItem)
      : [];
    renderLibrary(items);
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
