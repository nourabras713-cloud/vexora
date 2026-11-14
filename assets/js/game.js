(() => {
  const byId = id => document.getElementById(id);
  const status = byId("gameStatus");
  const content = byId("gameContent");
  if (!status || !content) return;
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get("game") || document.body.dataset.game;
  let currentGame = null;
  const safeText = value => String(value || "");
  const validHttpsUrl = value => {
    try { const url = new URL(value); return url.protocol === "https:" ? url.href : null; }
    catch { return null; }
  };
  const escapeHTML = value => safeText(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function showError(message) {
    status.textContent = message;
    status.classList.add("error");
    content.hidden = true;
  }
  function addRelated(games) {
    const related = games.filter(game => game.id !== currentGame.id && game.category === currentGame.category).slice(0, 3);
    const fallback = related.length ? related : games.filter(game => game.id !== currentGame.id).slice(0, 3);
    const target = byId("relatedGames");
    if (!target) return;
    if (!fallback.length) { target.innerHTML = '<p class="related-empty">More games are coming soon.</p>'; return; }
    target.innerHTML = fallback.map(game => '<a class="related-card" href="games/' + encodeURIComponent(game.id) + '.html"><span class="related-icon">🎮</span><span><b>' + escapeHTML(game.title) + '</b><small>' + escapeHTML(game.category) + '</small></span><span class="related-arrow">↗</span></a>').join("");
  }
  function setupPlayer(game) {
    const stage = byId("playerStage");
    const openButton = byId("openGame");
    if (!stage || !openButton) return;
    stage.replaceChildren();
    const externalUrl = validHttpsUrl(game.sourceUrl);
    const sourceLabel = safeText(game.sourceLabel || "CrazyGames");
    const toolbarLabel = stage.closest(".player-panel")?.querySelector(".player-toolbar span:last-child");
    if (toolbarLabel) toolbarLabel.textContent = "Opens on " + sourceLabel;
    let embedSrc = null;
    if (game.playMode === "embed" && typeof game.embedUrl === "string") {
      try {
        const resolved = new URL(game.embedUrl, document.baseURI);
        const localEmbed = resolved.origin === window.location.origin && /^(?:assets|games)\/[a-zA-Z0-9_./-]+$/.test(game.embedUrl);
        const approvedExternalEmbed = resolved.protocol === "https:" && resolved.hostname === "www.miniplay.com" && resolved.pathname === "/embed/kour.io";
        if (localEmbed || approvedExternalEmbed) embedSrc = resolved.href;
      } catch (_) {}
    }
    openButton.hidden = true;
    if (embedSrc) {
      const frame = document.createElement("iframe");
      frame.src = embedSrc;
      frame.title = game.title + " game";
      frame.loading = "eager";
      frame.allow = "fullscreen; gamepad; autoplay; accelerometer; gyroscope; clipboard-read; clipboard-write; web-share";
      frame.allowFullscreen = true;
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      frame.style.width = "100%";
      frame.style.height = "100%";
      frame.style.minHeight = "620px";
      frame.style.border = "0";
      if (new URL(embedSrc).hostname === window.location.hostname) frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups");
      frame.style.minHeight = "0";
      if (game.aspectRatio) stage.style.aspectRatio = game.aspectRatio;
      if (game.aspectRatio === "2 / 3") {
        stage.style.width = "min(100%, 420px)";
        stage.style.marginInline = "auto";
      }
      stage.appendChild(frame);
      if (externalUrl) {
        openButton.href = externalUrl;
        openButton.target = game.openInSameTab ? "_self" : "_blank";
        openButton.textContent = "Open original game ↗";
        openButton.hidden = false;
      }
    } else if (externalUrl) {
      openButton.href = externalUrl;
      openButton.target = game.openInSameTab ? "_self" : "_blank";
      openButton.textContent = "PLAY NOW ↗";
      openButton.hidden = false;
      const launch = document.createElement("a");
      launch.className = "player-launch";
      launch.href = externalUrl;
      launch.target = game.openInSameTab ? "_self" : "_blank";
      launch.rel = "noopener noreferrer";
      launch.innerHTML = '<span>▶</span><b>Play this game</b><small>Opens the original game page on ' + escapeHTML(sourceLabel) + '</small>';
      stage.appendChild(launch);
    } else {
      stage.innerHTML = '<div class="player-placeholder"><span>⚠</span><b>Game file unavailable</b><small>The game source is not configured yet.</small></div>';
    }
  }
  function setupGameplayVideo(game) {
    const panel = document.querySelector(".player-panel");
    if (!panel || !game.videoId || !/^[a-zA-Z0-9_-]{11}$/.test(game.videoId)) return;
    let section = document.getElementById("gameplayVideo");
    if (!section) {
      section = document.createElement("section");
      section.id = "gameplayVideo";
      section.className = "gameplay-video-section";
      panel.insertAdjacentElement("afterend", section);
    }
    const title = escapeHTML(game.title);
    const credit = escapeHTML(game.videoCredit || "Gameplay video");
    section.innerHTML = '<div class="section-kicker">WATCH GAMEPLAY</div><h2>' + title + ' — Gameplay Video</h2><div class="gameplay-video-frame"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(game.videoId) + '" title="' + title + ' gameplay video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><p class="video-credit">' + credit + ' · Embedded from YouTube.</p>';
  }
  function render(game, games) {
    currentGame = game;
    document.title = game.seoTitle || (game.title + " — Play on VEXORA");
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) descriptionMeta.content = safeText(game.metaDescription || game.description).slice(0, 160);
    const title = byId("gameTitle");
    if (title) title.textContent = game.title;
    const assign = (id, value) => { const el = byId(id); if (el) el.textContent = value; };
    assign("gameCategory", safeText(game.category).toUpperCase());
    const heading = document.querySelector(".game-detail-heading");
    if (heading && game.thumbnail) {
      let art = document.getElementById("gameFeatureArt");
      if (!art) {
        art = document.createElement("div");
        art.id = "gameFeatureArt";
        art.className = "game-feature-art";
        heading.parentNode.insertBefore(art, heading);
      }
      const artUrl = new URL(game.thumbnail, document.baseURI).href;
      art.innerHTML = '<img src="' + escapeHTML(artUrl) + '" alt="' + escapeHTML(game.title) + ' game preview" loading="eager">';
    }
    assign("gameDescription", game.description || "");
    assign("gameInstructions", game.instructions || "Use the controls shown inside the game.");
    assign("gameLongDescription", game.longDescription || game.description || "Discover this game on VEXORA.");
    assign("gameAttribution", game.attribution || "Game and trademarks belong to their respective owners.");
    assign("gameLicense", game.license || "See the original project for licensing details.");
    const sourceLink = byId("gameSource");
    const sourceUrl = validHttpsUrl(game.repositoryUrl || game.sourceUrl);
    if (sourceLink) {
      if (sourceUrl) { sourceLink.href = sourceUrl; sourceLink.hidden = false; }
      else sourceLink.hidden = true;
    }
    setupPlayer(game);
    setupGameplayVideo(game);
    addRelated(games);
    status.hidden = true;
    content.hidden = false;
  }
  const year = byId("year");
  if (year) year.textContent = new Date().getFullYear();
  const full = byId("fullscreenButton");
  full?.addEventListener("click", () => {
    const frame = byId("playerStage")?.querySelector("iframe");
    const target = frame || byId("playerStage");
    if (document.fullscreenElement) document.exitFullscreen?.();
    else target?.requestFullscreen?.();
  });
  if (!requestedId) { showError("Choose a game from the VEXORA homepage."); return; }
  const catalogUrl = new URL("games/games.json", document.baseURI);
  fetch(catalogUrl.href, {cache:"no-cache"})
    .then(response => { if (!response.ok) throw new Error("catalog"); return response.json(); })
    .then(data => {
      const games = Array.isArray(data.games) ? data.games : [];
      const found = games.find(item => item && item.id === requestedId);
      if (!found) { showError("This game could not be found in the VEXORA library."); return; }
      render(found, games);
    })
    .catch(() => showError("The game library could not be loaded. Please refresh and try again."));
})();