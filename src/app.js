/* app.js — main UI controller for Nobel Atlas. */
(function () {
  const DATA = (window.NOBEL_DATA || []).filter(d => d.awarded !== false);
  const ALL = window.NOBEL_DATA || [];

  const SUBFIELD_COLOR = {
    "Physical Chemistry": "#6cc5ff",
    "Organic Chemistry": "#ff9f6c",
    "Inorganic Chemistry": "#c79bff",
    "Biochemistry": "#5fd38a",
    "Analytical Chemistry": "#f4c95d",
    "Materials/Polymers": "#ff7aa8",
    "Nuclear/Radiochemistry": "#ffd24a",
    "Theoretical/Computational": "#7af0e0",
    "Spectroscopy/Instrumentation": "#b0b8ff",
    "Other": "#9aa7b8"
  };
  const CATEGORY_LABEL = {
    synthesis: "Synthesis from scratch", pathway: "Pathway / cycle", mechanism: "Mechanism",
    theory: "Theory / law", equipment: "Equipment / apparatus", technique: "Technique / method",
    "discovery-element": "Element / particle discovery", "structure-determination": "Structure determination",
    materials: "Materials", biomolecule: "Biomolecule", "reaction-method": "Reaction method",
    measurement: "Measurement", discovery: "Discovery / phenomenon"
  };

  const colorFor = d => SUBFIELD_COLOR[d.subfield] || SUBFIELD_COLOR.Other;

  // ---------- Filter state ----------
  const filter = {
    engage: "all",
    subfields: new Set(),     // empty = all
    categories: new Set(),    // empty = all
    tags: new Set(),
    search: "",
    trail: null               // Set of ids when a trail is focused
  };

  // ---------- Trails ----------
  const TRAILS = window.NOBEL_TRAILS || [];
  const trailById = {}; TRAILS.forEach(t => trailById[t.id] = t);
  const membership = {};      // prizeId -> [{trail, index}]
  TRAILS.forEach(t => t.steps.forEach((s, i) => {
    (membership[s.id] = membership[s.id] || []).push({ trail: t, index: i });
  }));
  let activeTrail = null, activeStep = 0;

  // ---------- Build derived indexes ----------
  const subfieldCounts = {}, categoryCounts = {}, tagCounts = {};
  DATA.forEach(d => {
    subfieldCounts[d.subfield] = (subfieldCounts[d.subfield] || 0) + 1;
    (d.categories || []).forEach(c => categoryCounts[c] = (categoryCounts[c] || 0) + 1);
    (d.tags || []).forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
  });
  const subfieldKeys = Object.keys(subfieldCounts).sort((a, b) => subfieldCounts[b] - subfieldCounts[a]);

  // ---------- Graph setup ----------
  const fillCache = {};
  function refreshFill(id) { fillCache[id] = Store.fillScore(id, byId[id]); }
  const byId = {}; DATA.forEach(d => byId[d.id] = d);

  const graph = new Graph(document.getElementById("graph"), {
    fillFn: n => (fillCache[n.id] != null ? fillCache[n.id] : (fillCache[n.id] = Store.fillScore(n.id, byId[n.id]))),
    laneColor: name => SUBFIELD_COLOR[name] || SUBFIELD_COLOR.Other,
    onClick: n => openDetail(n.id),
    onHover: (n, pos) => showHover(n, pos)
  });

  function buildGraph() {
    const nodes = DATA.map(d => ({
      id: d.id,
      label: d.laureates && d.laureates.length ? d.laureates[0].split(" ").slice(-1)[0] + " '" + String(d.year).slice(2) : String(d.year),
      color: colorFor(d),
      cluster: d.subfield,
      weight: Math.min(1, ((d.deepDive && d.deepDive.chemistryLogic ? d.deepDive.chemistryLogic.length : 200) / 1600)),
      prize: d
    }));
    const links = [];
    const seen = new Set();
    DATA.forEach(d => (d.related || []).forEach(r => {
      if (!byId[r]) return;
      const key = [d.id, r].sort().join("|");
      if (seen.has(key)) return; seen.add(key);
      links.push({ source: d.id, target: r });
    }));
    graph.setData(nodes, links, subfieldKeys);
    applyFilter();
    setTimeout(() => graph.fit(), 400);
  }

  // ---------- Filtering ----------
  function matches(d) {
    if (filter.trail && !filter.trail.has(d.id)) return false;
    if (filter.subfields.size && !filter.subfields.has(d.subfield)) return false;
    if (filter.categories.size && !(d.categories || []).some(c => filter.categories.has(c))) return false;
    if (filter.tags.size && !(d.tags || []).some(t => filter.tags.has(t))) return false;
    if (filter.engage === "studied" && !Store.isStudied(d.id)) return false;
    if (filter.engage === "empty" && Store.isStudied(d.id)) return false;
    if (filter.engage === "due" && !(Store.getCards(d.id).some(c => c.due <= Date.now()))) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const hay = [d.year, d.subfield, (d.laureates || []).join(" "), d.motivation, d.oneLiner, (d.tags || []).join(" "), (d.categories || []).join(" ")].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }
  function applyFilter() {
    let n = 0;
    graph.nodes.forEach(node => { const ok = matches(node.prize); node.visible = ok; if (ok) n++; });
    graph.reheat();
    document.getElementById("graphHint").textContent =
      n === DATA.length ? "Click any node to enter its world →" : `${n} of ${DATA.length} prizes shown · click a node`;
  }

  // ---------- Left rail rendering ----------
  function renderRail() {
    const sf = document.getElementById("subfieldFilters");
    sf.innerHTML = "";
    subfieldKeys.forEach(k => {
      const el = document.createElement("label");
      el.className = "chk";
      el.innerHTML = `<input type="checkbox" data-sf="${k}"><span class="swatch" style="background:${SUBFIELD_COLOR[k] || '#999'}"></span>${k}<span class="count">${subfieldCounts[k]}</span>`;
      sf.appendChild(el);
    });
    sf.addEventListener("change", e => {
      const k = e.target.getAttribute("data-sf"); if (!k) return;
      if (e.target.checked) filter.subfields.add(k); else filter.subfields.delete(k);
      applyFilter();
    });

    const cf = document.getElementById("categoryFilters");
    cf.innerHTML = "";
    Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]).forEach(k => {
      const el = document.createElement("label");
      el.className = "chk";
      el.innerHTML = `<input type="checkbox" data-cat="${k}">${CATEGORY_LABEL[k] || k}<span class="count">${categoryCounts[k]}</span>`;
      cf.appendChild(el);
    });
    cf.addEventListener("change", e => {
      const k = e.target.getAttribute("data-cat"); if (!k) return;
      if (e.target.checked) filter.categories.add(k); else filter.categories.delete(k);
      applyFilter();
    });

    const tc = document.getElementById("tagCloud");
    tc.innerHTML = "";
    Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]).slice(0, 40).forEach(t => {
      const el = document.createElement("span");
      el.className = "tag"; el.textContent = t; el.dataset.tag = t;
      el.onclick = () => {
        if (filter.tags.has(t)) { filter.tags.delete(t); el.classList.remove("active"); }
        else { filter.tags.add(t); el.classList.add("active"); }
        applyFilter();
      };
      tc.appendChild(el);
    });
  }

  // ---------- Hover card ----------
  const hoverCard = document.getElementById("hoverCard");
  function showHover(n, pos) {
    if (!n) { hoverCard.hidden = true; return; }
    const d = n.prize;
    const studied = Store.isStudied(d.id);
    hoverCard.innerHTML =
      `<div class="hc-year">${d.year}${studied ? " · ✦ studied" : ""}</div>
       <h4>${(d.laureates || []).join(", ")}</h4>
       <div class="hc-one">${esc(d.oneLiner || "")}</div>
       <div class="hc-meta"><span class="pill" style="color:${colorFor(d)}">${d.subfield}</span>${(d.categories || []).map(c => `<span class="pill">${CATEGORY_LABEL[c] || c}</span>`).join("")}</div>`;
    hoverCard.hidden = false;
    const wrap = document.getElementById("graphWrap").getBoundingClientRect();
    let x = pos.x + 16, y = pos.y + 16;
    if (x + 290 > wrap.width) x = pos.x - 296;
    if (y + 160 > wrap.height) y = pos.y - 160;
    hoverCard.style.left = Math.max(8, x) + "px";
    hoverCard.style.top = Math.max(8, y) + "px";
  }

  // ---------- Detail drawer ----------
  const detail = document.getElementById("detail");
  let currentId = null;
  let currentTab = "overview";

  function openDetail(id) {
    currentId = id; currentTab = "overview";
    if (activeTrail) {
      const i = activeTrail.steps.findIndex(s => s.id === id);
      if (i >= 0 && i !== activeStep) { activeStep = i; renderBanner(); }
    }
    renderDetail();
    detail.classList.remove("collapsed");
    graph.centerOn(id);
  }
  function closeDetail() { detail.classList.add("collapsed"); currentId = null; }

  function renderDetail() {
    const d = byId[currentId]; if (!d) return;
    const dd = d.deepDive || {};
    const studied = Store.isStudied(d.id);
    detail.innerHTML = `
      <div class="detail-head">
        <button class="detail-close" title="Close">×</button>
        <div class="detail-year" style="color:${colorFor(d)}">${d.year} · ${d.subfield}${studied ? ' · <span style="color:var(--good)">✦ studied</span>' : ''}</div>
        <h2 class="detail-title">${(d.laureates || []).join(" · ")}</h2>
        <div class="detail-laur">${esc(d.oneLiner || "")}</div>
        ${d.motivation ? `<div class="detail-motivation">“${esc(d.motivation)}”</div>` : ""}
        ${trailContext(d.id)}
        <div class="detail-chips">
          <span class="chip subfield" style="color:${colorFor(d)};border-color:${colorFor(d)}">${d.subfield}</span>
          ${(d.categories || []).map(c => `<span class="chip cat">${CATEGORY_LABEL[c] || c}</span>`).join("")}
        </div>
        <div class="mastery">
          <div class="mastery-label">My mastery — sets how bright this node glows</div>
          <div class="mastery-steps" id="masterySteps">
            ${[1, 2, 3, 4].map(l => `<button data-l="${l}" class="${Store.getMastery(d.id) >= l ? "on" : ""}">${Store.MASTERY[l]}</button>`).join("")}
          </div>
        </div>
        <button class="btn primary" id="learnBtn" style="margin-top:12px;width:100%;justify-content:center">▶ Learn this (focused mode)</button>
      </div>
      <div class="detail-tabs">
        ${tabBtn("overview", "Overview")}
        ${tabBtn("logic", "Chemistry logic")}
        ${tabBtn("concepts", "Concepts")}
        ${tabBtn("jargon", "Jargon")}
        ${tabBtn("learn", "Learn more")}
        ${tabBtn("notes", "My notes", !!Store.getNote(d.id).trim())}
        ${tabBtn("cards", "Flashcards", Store.getCards(d.id).length > 0)}
      </div>
      <div class="detail-body" id="detailBody"></div>`;
    detail.querySelector(".detail-close").onclick = closeDetail;
    detail.querySelectorAll(".tab").forEach(t => t.onclick = () => { currentTab = t.dataset.tab; renderDetail(); });
    const ms = detail.querySelector("#masterySteps");
    if (ms) ms.querySelectorAll("button").forEach(b => b.onclick = () => {
      const lvl = parseInt(b.dataset.l);
      Store.setMastery(d.id, Store.getMastery(d.id) === lvl ? lvl - 1 : lvl);  // click current level to step down
      refreshFill(d.id); updateProgress(); renderDetail();
    });
    const lb = detail.querySelector("#learnBtn");
    if (lb) lb.onclick = () => startLearn(d.id);
    renderTab(d, dd);
  }

  function tabBtn(id, label, dot) {
    return `<button class="tab ${currentTab === id ? "active" : ""}" data-tab="${id}">${label}${dot ? '<span class="dot"></span>' : ''}</button>`;
  }

  function renderTab(d, dd) {
    const body = document.getElementById("detailBody");
    if (currentTab === "overview") {
      body.innerHTML = `
        ${section("What won the prize (scope)", dd.scope)}
        ${section("History &amp; context", dd.history)}
        ${dd.whyItMatters ? `<h4>Why it matters</h4><p class="lead">${para(dd.whyItMatters)}</p>` : ""}
        <h4>Primary sources</h4>
        ${(d.sources || []).map(s => `<a class="source-link" href="${s.url}" target="_blank" rel="noopener">${esc(s.title || s.url)}</a>`).join("") || '<p>—</p>'}`;
    } else if (currentTab === "logic") {
      body.innerHTML = dd.chemistryLogic
        ? `<h4>The chemistry, mechanistically</h4>${para(dd.chemistryLogic)}`
        : emptyTab("Deep mechanism notes are still being written for this prize. Add your own in the Notes tab.");
    } else if (currentTab === "concepts") {
      const items = dd.concepts || [];
      body.innerHTML = items.length
        ? `<h4>Key concepts to master</h4>` + items.map(c => {
            const [head, ...rest] = String(c).split(":");
            return `<div class="concept-item"><b>${esc(head)}</b>${rest.length ? ": " + esc(rest.join(":").trim()) : ""}</div>`;
          }).join("")
        : emptyTab("No concept list yet.");
    } else if (currentTab === "jargon") {
      const items = dd.jargon || [];
      body.innerHTML = items.length
        ? `<h4>Jargon decoder <span style="text-transform:none;color:var(--text-faint);font-weight:400">— mark words you've internalised</span></h4>
           <div class="jargon-list">` + items.map(j => {
            const known = Store.isKnown(d.id, j.term);
            return `<div class="jargon-item ${known ? "known" : ""}" data-term="${esc(j.term)}">
              <div class="jargon-term"><span class="term-name">${esc(j.term)}</span>
              <button class="know-toggle">${known ? "✓ I know this" : "I understand this"}</button></div>
              <div class="jargon-def">${esc(j.definition)}</div></div>`;
          }).join("") + `</div>`
        : emptyTab("No jargon list yet.");
      body.querySelectorAll(".jargon-item").forEach(el => {
        el.querySelector(".know-toggle").onclick = () => {
          Store.toggleKnown(d.id, el.dataset.term);
          refreshFill(d.id); updateProgress(); renderTab(d, dd);
        };
      });
    } else if (currentTab === "learn") {
      const items = dd.learnMore || [];
      body.innerHTML = (items.length
        ? `<h4>Go deeper — could you rebuild it yourself?</h4>` + items.map(r =>
            `<a class="resource" href="${r.url}" target="_blank" rel="noopener"><div class="r-title">${esc(r.title)}</div>${r.note ? `<div class="r-note">${esc(r.note)}</div>` : ""}</a>`).join("")
        : emptyTab("No external resources listed yet."))
        + `<h4>Related Nobel work</h4>` + relatedLinks(d);
    } else if (currentTab === "notes") {
      renderNotes(d);
    } else if (currentTab === "cards") {
      renderCards(d, dd);
    }
  }

  function relatedLinks(d) {
    const rel = (d.related || []).filter(r => byId[r]);
    if (!rel.length) return "<p>—</p>";
    return rel.map(r => {
      const o = byId[r];
      return `<a class="source-link" data-goto="${r}" href="#">${o.year} · ${(o.laureates || [])[0] || ""} — ${esc(o.oneLiner || "")}</a>`;
    }).join("");
  }

  function renderNotes(d) {
    const body = document.getElementById("detailBody");
    body.innerHTML = `
      <h4>My lab notebook — ${d.year}</h4>
      <p style="color:var(--text-faint);font-size:13px">Write in your own words: the logic, the "aha", questions to resolve. Saved automatically &amp; locally. This is what turns the node bright.</p>
      <textarea class="notes-area" id="notesArea" placeholder="e.g. The key insight is…&#10;&#10;Why does this matter for my own work?&#10;&#10;Open questions:">${esc(Store.getNote(d.id))}</textarea>
      <div class="notes-status" id="notesStatus"></div>`;
    const ta = document.getElementById("notesArea");
    const status = document.getElementById("notesStatus");
    let timer;
    ta.addEventListener("input", () => {
      status.textContent = "saving…";
      clearTimeout(timer);
      timer = setTimeout(() => {
        Store.setNote(d.id, ta.value);
        refreshFill(d.id); updateProgress();
        status.textContent = "✓ saved locally";
        // refresh tab dots without losing focus
        detail.querySelectorAll(".tab")[5].innerHTML = `My notes${ta.value.trim() ? '<span class="dot"></span>' : ''}`;
      }, 500);
    });
  }

  function renderCards(d, dd) {
    const body = document.getElementById("detailBody");
    const cards = Store.getCards(d.id);
    const seeds = (dd.flashcards || []);
    const canSeed = seeds.length && !Store.hasSeeded(d.id);
    body.innerHTML = `
      <h4>Flashcards — ${d.year}</h4>
      <div class="fc-add">
        <input id="fcFront" placeholder="Front (question / prompt)…" />
        <textarea id="fcBack" rows="2" placeholder="Back (answer)…"></textarea>
        <button class="btn primary" id="fcAdd">+ Add card</button>
      </div>
      ${canSeed ? `<p class="fc-seed-note">${seeds.length} ready-made starter cards for this prize. <button class="btn ghost sm" id="fcSeed">Import starter deck</button></p>` : ""}
      ${cards.length ? cards.map(c => `
        <div class="fc-card" data-id="${c.id}">
          <div class="fc-front">${esc(c.front)}</div>
          <div class="fc-back">${esc(c.back)}</div>
          <div class="fc-meta"><span>${c.seed ? "starter" : "yours"} · ${c.reps ? "seen " + c.reps + "×" : "new"} · due ${dueLabel(c.due)}</span><button class="fc-del">delete</button></div>
        </div>`).join("") : (canSeed ? "" : '<p style="color:var(--text-faint)">No cards yet. Add one above to start studying this prize.</p>')}`;
    document.getElementById("fcAdd").onclick = () => {
      const f = document.getElementById("fcFront").value.trim();
      const b = document.getElementById("fcBack").value.trim();
      if (!f || !b) return;
      Store.addCard(f, b, { prizeId: d.id, tags: [d.subfield, String(d.year)] });
      refreshFill(d.id); updateProgress(); updateDue(); renderTab(d, dd);
    };
    if (canSeed) document.getElementById("fcSeed").onclick = () => {
      Store.seedCards(d.id, seeds); updateDue(); renderTab(d, dd);
    };
    body.querySelectorAll(".fc-card").forEach(el => {
      el.querySelector(".fc-del").onclick = () => { Store.deleteCard(el.dataset.id); refreshFill(d.id); updateProgress(); updateDue(); renderTab(d, dd); };
    });
  }

  // delegate related-link clicks
  detail.addEventListener("click", e => {
    const a = e.target.closest("[data-goto]");
    if (a) { e.preventDefault(); openDetail(a.dataset.goto); return; }
    const tc = e.target.closest(".tctx-name");
    if (tc) { e.preventDefault(); focusTrail(tc.dataset.trail, parseInt(tc.dataset.step)); }
  });

  // ---------- Review overlay (cross-prize SRS) ----------
  const reviewOverlay = document.getElementById("reviewOverlay");
  let reviewQueue = [], reviewIdx = 0, reviewShown = false;
  function startReview() { runReviewQueue(Store.dueCards()); }
  function runReviewQueue(cards) {
    reviewQueue = cards.slice();
    reviewIdx = 0;
    if (!reviewQueue.length) {
      reviewOverlay.innerHTML = `<div class="modal"><div class="modal-head"><h2>🎴 Review</h2><button class="modal-close">×</button></div>
      <div class="modal-body"><div class="empty-state"><div class="big">✓</div><p>No cards due right now. Add flashcards inside any prize, or come back later — spaced repetition will resurface them.</p></div></div></div>`;
      reviewOverlay.hidden = false;
      reviewOverlay.querySelector(".modal-close").onclick = () => reviewOverlay.hidden = true;
      return;
    }
    reviewOverlay.hidden = false;
    renderReview();
  }
  function renderReview() {
    if (reviewIdx >= reviewQueue.length) {
      reviewOverlay.innerHTML = `<div class="modal"><div class="modal-head"><h2>🎴 Review complete</h2><button class="modal-close">×</button></div>
      <div class="modal-body"><div class="empty-state"><div class="big">🎉</div><p>You reviewed ${reviewQueue.length} card${reviewQueue.length>1?"s":""}. Nicely done.</p></div></div></div>`;
      reviewOverlay.querySelector(".modal-close").onclick = () => { reviewOverlay.hidden = true; updateDue(); if (currentId) renderDetail(); };
      return;
    }
    reviewShown = false;
    const c = reviewQueue[reviewIdx];
    const d = byId[c.prizeId];
    reviewOverlay.innerHTML = `<div class="modal">
      <div class="modal-head"><h2>🎴 Review <span style="color:var(--text-faint);font-weight:400">${reviewIdx + 1}/${reviewQueue.length}</span></h2><button class="modal-close">×</button></div>
      <div class="modal-body">
        <div class="review-card">
          <div class="review-context">${d ? d.year + " · " + (d.laureates || [])[0] : ""}</div>
          <div class="review-front">${esc(c.front)}</div>
          <div class="review-back" id="reviewBack" style="display:none">${esc(c.back)}</div>
        </div>
        <div id="reviewControls" style="margin-top:16px">
          <button class="btn primary" id="showAns" style="width:100%;justify-content:center;padding:12px">Show answer <span class="kbd" style="margin-left:8px">space</span></button>
        </div>
        <div class="review-progress">${Store.dueCount()} due total</div>
      </div></div>`;
    reviewOverlay.querySelector(".modal-close").onclick = () => { reviewOverlay.hidden = true; updateDue(); if (currentId) renderDetail(); };
    document.getElementById("showAns").onclick = revealAnswer;
  }
  function revealAnswer() {
    reviewShown = true;
    document.getElementById("reviewBack").style.display = "block";
    document.getElementById("reviewControls").innerHTML = `
      <div class="review-actions">
        <button class="grade-btn grade-again" data-g="0">Again</button>
        <button class="grade-btn grade-hard" data-g="1">Hard</button>
        <button class="grade-btn grade-good" data-g="2">Good</button>
        <button class="grade-btn grade-easy" data-g="3">Easy</button>
      </div>`;
    document.querySelectorAll(".grade-btn").forEach(b => b.onclick = () => grade(parseInt(b.dataset.g)));
  }
  function grade(g) {
    const c = reviewQueue[reviewIdx];
    Store.gradeCard(c.id, g);
    if (c.prizeId) refreshFill(c.prizeId);
    reviewIdx++; renderReview();
  }

  // ---------- Header actions ----------
  function updateProgress() {
    document.getElementById("progressFilled").textContent = Store.studiedCount();
    document.getElementById("progressTotal").textContent = DATA.length;
  }
  function updateDue() {
    const n = Store.dueCount();
    document.getElementById("dueBadge").textContent = n;
    document.getElementById("dueBadge").style.display = n ? "" : "none";
  }

  function wireHeader() {
    document.getElementById("trailsBtn").onclick = () => openTrails();
    document.getElementById("cardsBtn").onclick = openCards;
    document.getElementById("reviewBtn").onclick = startReview;
    document.getElementById("themeBtn").onclick = () => {
      const next = Store.getTheme() === "dark" ? "light" : "dark";
      Store.setTheme(next); applyTheme(next);
    };
    let timelineOn = false;
    document.getElementById("timelineBtn").onclick = (e) => {
      timelineOn = !timelineOn;
      graph.setMode(timelineOn ? "timeline" : "cluster");
      e.currentTarget.classList.toggle("active-mode", timelineOn);
      document.getElementById("graphHint").textContent = timelineOn
        ? "Timeline: left→right by year, lanes by subfield · click a node"
        : "Click any node to enter its world →";
    };
    document.getElementById("exportBtn").onclick = () => {
      const blob = new Blob([Store.exportData()], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "nobel-atlas-notes-" + new Date().toISOString().slice(0, 10) + ".json";
      a.click();
    };
    document.getElementById("importBtn").onclick = () => document.getElementById("importFile").click();
    document.getElementById("importFile").onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try { Store.importData(r.result); Object.keys(fillCache).forEach(k => delete fillCache[k]); updateProgress(); updateDue(); applyFilter(); if (currentId) renderDetail(); alert("Imported your notes & flashcards."); }
        catch (err) { alert("Could not import: " + err.message); }
      };
      r.readAsText(f);
    };
    document.getElementById("helpBtn").onclick = showHelp;

    document.getElementById("searchBox").addEventListener("input", e => { filter.search = e.target.value; applyFilter(); });
    document.querySelectorAll('input[name="engage"]').forEach(r => r.addEventListener("change", e => { filter.engage = e.target.value; applyFilter(); }));
    document.getElementById("subAll").onclick = () => { filter.subfields.clear(); document.querySelectorAll('[data-sf]').forEach(c => c.checked = false); applyFilter(); };
    document.getElementById("catAll").onclick = () => { filter.categories.clear(); document.querySelectorAll('[data-cat]').forEach(c => c.checked = false); applyFilter(); };

    document.getElementById("zoomIn").onclick = () => graph.zoomBy(1.2);
    document.getElementById("zoomOut").onclick = () => graph.zoomBy(1 / 1.2);
    document.getElementById("zoomFit").onclick = () => graph.fit();
  }

  function showHelp() {
    const ov = document.getElementById("helpOverlay");
    ov.innerHTML = `<div class="modal"><div class="modal-head"><h2>How to use Nobel Atlas</h2><button class="modal-close">×</button></div>
      <div class="modal-body help-content">
        <p>This is a study lab for ultralearning chemistry through every Nobel Prize, 1901 to today. Each dot is one prize year.</p>
        <h3>The graph</h3>
        <ul>
          <li><b>Color</b> = subfield (see the left legend).</li>
          <li><b>Pale &amp; dull</b> = you haven't studied it yet. As you add notes, flashcards, or mark jargon as understood, the node <b>brightens and grows a white ring</b> — your knowledge web lighting up.</li>
          <li><b>Lines</b> connect conceptually related prizes. Drag nodes, scroll to zoom, drag the background to pan.</li>
        </ul>
        <h3>Inside a prize (click any node)</h3>
        <ul>
          <li><b>Overview</b> — exact scope of what won, history, why it matters, and primary sources.</li>
          <li><b>Chemistry logic</b> — the mechanism and reasoning, not just the what.</li>
          <li><b>Concepts</b> — the ideas to actually master.</li>
          <li><b>Jargon</b> — plain-language definitions. Hit <span class="kbd">I understand this</span> to dim a word once it's internalised; you can always re-reveal it.</li>
          <li><b>Learn more</b> — resources to go deeper (incl. "could you rebuild it yourself?") and links to related Nobel work.</li>
          <li><b>My notes</b> — your lab notebook, saved locally in this browser.</li>
          <li><b>Flashcards</b> — write your own or import starter decks; review them across all prizes with the 🎴 button (spaced repetition).</li>
        </ul>
        <h3>Learn mode (▶ inside a prize)</h3>
        <p>Distraction-free studying: just you and one idea at a time. It walks you through scope → history → the chemistry → key concepts → each jargon word → a quick self-test → a mastery checkpoint, with Back/Next (or ← →). This is the "actually learn it" path, as opposed to the explore-the-map view.</p>
        <h3>Mastery levels</h3>
        <p>Inside each prize, rate yourself: <b>Skimmed → Understand → Can explain → Can rebuild</b>. This is what brightens the node (pale = untouched, glowing = mastered) and feeds "recommended next". Click your current level again to step back down.</p>
        <h3>Flashcards in one place (🗂 Cards)</h3>
        <p>All your cards live in a single deck. Create a card anywhere, optionally tag it or link it to a prize, then browse/search/filter and "Study these" as one pile — real studying, not buried inside one prize. The 🎴 Review button runs spaced repetition over everything due.</p>
        <h3>Timeline (📅) &amp; theme (🌙/☀️)</h3>
        <p>Toggle <b>Timeline</b> to lay prizes left→right by year in subfield lanes — the chronology at a glance. Toggle the theme for light or dark.</p>
        <h3>Learning Trails (🧭 top bar)</h3>
        <p>Not sure what order to learn in? Trails are curated, ordered prerequisite paths through each thread (Foundations, Bonding, Structure, Synthesis, Life, Nucleus, Materials). Each step says <i>why it comes next</i>. "Focus this trail" draws the numbered path on the graph and dims everything else; use <b>prev/next</b> to walk it. Inside any prize, a banner shows which trail(s) it sits on and what comes before/after.</p>
        <h3>Study by vibe (✨ under search)</h3>
        <p>Optional and collapsed by default. Open it and describe in plain language what you want to learn — “how drugs are made as single mirror-image molecules”, “the chemistry behind AI predicting proteins” — and it backtracks across every prize's tags, concepts, mechanisms and scope to rank the best matches, with a note on <i>why</i> each matched. Hit “Make these a path on the graph” to walk them in order. With the box empty it shows <b>recommended next</b> steps based on what you've already studied.</p>
        <h3>Filters</h3>
        <p>Use the left rail to filter by engagement (studied / not started / cards due), subfield, category, and tags, or search anything.</p>
        <h3>Your data</h3>
        <p>Everything you write lives in this browser's local storage. Use <b>Export</b> to back it up or move it to another device, and <b>Import</b> to restore.</p>
      </div></div>`;
    ov.hidden = false;
    ov.querySelector(".modal-close").onclick = () => ov.hidden = true;
  }

  // ---------- Trails UI ----------
  function trailProgress(t) {
    const done = t.steps.filter(s => Store.isStudied(s.id)).length;
    return { done, total: t.steps.length };
  }
  function openTrails(selectId) {
    const ov = document.getElementById("trailsOverlay");
    let sel = selectId || (activeTrail ? activeTrail.id : (TRAILS[0] && TRAILS[0].id));
    function render() {
      const t = trailById[sel];
      ov.innerHTML = `<div class="modal" style="max-width:860px">
        <div class="modal-head"><h2>🧭 Learning Trails</h2><button class="modal-close">×</button></div>
        <div class="modal-body">
          <p style="font-size:13px;color:var(--text-dim);line-height:1.55;margin:0 0 16px">${esc(window.NOBEL_TRAIL_INTRO || "")}</p>
          <div class="trails-layout">
            <div class="trails-list">${TRAILS.map(tr => {
              const p = trailProgress(tr);
              return `<div class="trail-pick ${tr.id === sel ? "active" : ""}" data-t="${tr.id}">
                <div class="tp-name"><span class="tp-dot" style="background:${tr.color}"></span>${esc(tr.name)}</div>
                <div class="tp-meta">${p.done}/${p.total} studied</div>
                <div class="tp-bar"><i style="width:${Math.round(p.done / p.total * 100)}%;background:${tr.color}"></i></div>
              </div>`;
            }).join("")}</div>
            <div class="trail-detail">
              <h3>${esc(t.name)}</h3>
              <p class="trail-blurb">${esc(t.blurb)}</p>
              <div class="trail-actions">
                <button class="btn primary" id="focusTrail">Focus this trail on the graph →</button>
              </div>
              ${t.steps.map((s, i) => {
                const d = byId[s.id]; if (!d) return "";
                const done = Store.isStudied(s.id);
                return `<div class="trail-step" data-goto="${s.id}">
                  <div class="ts-num" style="background:${done ? 'var(--good)' : t.color}">${i + 1}</div>
                  <div class="ts-body">
                    <div class="ts-title">${d.year} · ${(d.laureates || [])[0] || ""}${done ? '<span class="ts-done">✦ studied</span>' : ''}</div>
                    <div class="ts-why">${esc(s.why)}</div>
                  </div></div>`;
              }).join("")}
            </div>
          </div>
        </div></div>`;
      ov.querySelector(".modal-close").onclick = () => ov.hidden = true;
      ov.querySelectorAll(".trail-pick").forEach(el => el.onclick = () => { sel = el.dataset.t; render(); });
      ov.querySelector("#focusTrail").onclick = () => { ov.hidden = true; focusTrail(sel); };
      ov.querySelectorAll(".trail-step").forEach(el => el.onclick = () => { ov.hidden = true; focusTrail(sel, t.steps.findIndex(s => s.id === el.dataset.goto)); });
    }
    render();
    ov.hidden = false;
  }

  function focusTrail(trailId, stepIndex) {
    const t = trailById[trailId];
    if (t) focusTrailObj(t, stepIndex);
  }
  function focusTrailObj(trail, stepIndex) {
    activeTrail = trail;
    if (!activeTrail || !activeTrail.steps.length) return;
    activeStep = stepIndex != null ? stepIndex : 0;
    filter.trail = new Set(activeTrail.steps.map(s => s.id));
    graph.setTrail(activeTrail.steps.map(s => s.id), activeTrail.color);
    applyFilter();
    setTimeout(() => graph.fit(), 350);
    renderBanner();
    if (stepIndex != null) gotoStep(activeStep);
  }
  function clearTrail() {
    activeTrail = null; filter.trail = null;
    graph.setTrail(null); applyFilter();
    document.getElementById("trailBanner").hidden = true;
    setTimeout(() => graph.fit(), 350);
  }
  function gotoStep(i) {
    if (!activeTrail) return;
    activeStep = Math.max(0, Math.min(activeTrail.steps.length - 1, i));
    openDetail(activeTrail.steps[activeStep].id);
    renderBanner();
  }
  function renderBanner() {
    const b = document.getElementById("trailBanner");
    if (!activeTrail) { b.hidden = true; return; }
    const n = activeTrail.steps.length;
    b.innerHTML = `<span class="tp-dot" style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${activeTrail.color}"></span>
      <span class="tb-name">${esc(activeTrail.name)}</span>
      <span class="tb-step">step ${activeStep + 1}/${n}</span>
      <span class="tb-nav">
        <button class="btn ghost sm" id="tbPrev" ${activeStep === 0 ? "disabled" : ""}>‹ prev</button>
        <button class="btn ghost sm" id="tbNext" ${activeStep === n - 1 ? "disabled" : ""}>next ›</button>
        <button class="btn ghost sm" id="tbExit">✕ exit</button>
      </span>`;
    b.hidden = false;
    document.getElementById("tbPrev").onclick = () => gotoStep(activeStep - 1);
    document.getElementById("tbNext").onclick = () => gotoStep(activeStep + 1);
    document.getElementById("tbExit").onclick = clearTrail;
  }

  // banner shown inside a prize's detail: where it sits across trails
  function trailContext(prizeId) {
    const mem = membership[prizeId];
    if (!mem || !mem.length) return "";
    return mem.map(m => {
      const prev = m.index > 0 ? m.trail.steps[m.index - 1].id : null;
      const next = m.index < m.trail.steps.length - 1 ? m.trail.steps[m.index + 1].id : null;
      const prevD = prev && byId[prev], nextD = next && byId[next];
      return `<div class="detail-trailctx">
        <span class="tp-dot" style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${m.trail.color};margin-right:6px"></span>
        <a href="#" class="tctx-name" data-trail="${m.trail.id}" data-step="${m.index}" title="Focus this trail on the graph"><b>${esc(m.trail.name)}</b></a> · step ${m.index + 1}/${m.trail.steps.length}
        <div class="tctx-nav">${prevD ? `← after <a href="#" data-goto="${prev}">${prevD.year} ${(prevD.laureates||[])[0]||""}</a>` : "trail start"} ·
        ${nextD ? `before <a href="#" data-goto="${next}">${nextD.year} ${(nextD.laureates||[])[0]||""}</a> →` : "trail end"}</div>
      </div>`;
    }).join("");
  }

  // ---------- Study by vibe (intent finder) ----------
  const STOP = new Set("the a an of to in on for and or with how what why is are be i want learn learning study understand about into from that this it works work all more most very really get can could would like want need know made make making made used using use as by we do my no so up at an or is it be has have had will when which who whom they them their there here out off than then also such each via per its".split(" "));
  const ACRONYMS = new Set(["ai", "ml", "dna", "rna", "atp", "nmr", "pcr", "dft", "gfp", "mri", "led", "mof", "uv", "ir"]);
  // multi-word intent phrases resolved before tokenizing (avoids e.g. "mirror-image" → imaging)
  const PHRASES = [
    [/\bmirror[\s-]?image[ds]?\b/g, ["chirality", "asymmetric", "enantiomer"]],
    [/\bsingle[\s-]?handed\b/g, ["chirality", "asymmetric"]],
    [/\bsingle[\s-]?molecule[s]?\b/g, ["microscopy", "single"]],
    [/\bprotein[\s-]?structure[s]?\b/g, ["protein", "structure", "crystallography"]],
    [/\bgreen chemistry\b/g, ["catalysis", "click", "metathesis"]],
    [/\bgenome editing\b/g, ["crispr", "genome"]],
    [/\bcross[\s-]?coupling\b/g, ["coupling", "palladium"]],
    [/\bclimate|global warming|ozone\b/g, ["ozone", "atmospheric"]]
  ];
  // intent → concept expansions (values are matched against the prize index)
  const SYNONYMS = {
    drug: ["synthesis", "asymmetric", "chirality", "medicinal", "total synthesis"], drugs: ["synthesis", "chirality", "asymmetric"],
    medicine: ["synthesis", "chirality"], pharma: ["synthesis", "asymmetric"], medicinal: ["synthesis", "chirality"],
    ai: ["alphafold", "deep learning", "computational", "machine"], ml: ["deep learning", "computational"],
    "machine": ["deep learning", "computational"], neural: ["deep learning", "alphafold"], computer: ["computational", "theory"],
    protein: ["protein", "folding", "structure", "enzyme", "amino"], proteins: ["protein", "folding", "structure"],
    fold: ["folding", "protein", "structure"], folding: ["folding", "protein"],
    dna: ["dna", "genome", "sequencing", "nucleic"], gene: ["genome", "dna", "crispr"], genetic: ["genome", "dna"],
    crispr: ["crispr", "genome", "editing"], editing: ["crispr", "mutagenesis", "genome"], genome: ["genome", "dna"],
    battery: ["lithium", "batteries", "electrochem", "materials"], batteries: ["lithium", "batteries", "electrochem"],
    energy: ["thermodynamics", "electrochem", "lithium", "photosynthesis", "atp"], electric: ["electrochem", "conductive", "lithium"],
    see: ["microscopy", "crystallography", "spectroscopy", "imaging", "diffraction"], seeing: ["microscopy", "crystallography", "spectroscopy"],
    image: ["microscopy", "imaging", "cryo"], imaging: ["microscopy", "cryo", "spectroscopy"], microscope: ["microscopy", "cryo"],
    visualize: ["microscopy", "crystallography"], structure: ["structure", "crystallography", "diffraction"],
    green: ["catalysis", "click", "metathesis", "ozone", "sustainable"], sustainable: ["catalysis", "click"], environment: ["ozone", "atmospheric", "catalysis"],
    quantum: ["quantum", "orbital", "bond", "dft", "theory"], bond: ["bond", "orbital", "valence"], bonding: ["bond", "orbital", "valence"],
    reaction: ["mechanism", "kinetics", "reaction", "catalysis"], mechanism: ["mechanism", "kinetics"], catalyst: ["catalysis", "catalyst"], catalysis: ["catalysis"],
    nuclear: ["radioactivity", "isotope", "fission", "nucleus"], radioactive: ["radioactivity", "isotope"], isotope: ["isotope", "radioactivity"], atom: ["atomic", "nucleus", "isotope"],
    material: ["materials", "polymer", "nano"], materials: ["materials", "polymer", "nano"], polymer: ["polymer", "materials"], nano: ["nano", "quantum dots", "fullerene"],
    enzyme: ["enzyme", "catalysis", "protein"], metabolism: ["pathway", "metabolic", "biochem"], photosynthesis: ["photosynthesis", "carbon", "calvin"],
    chemistry: [], chemical: []
  };

  let prizeIndex = null;
  function buildIndex() {
    prizeIndex = DATA.map(d => {
      const dd = d.deepDive || {};
      const fields = [
        { t: (d.laureates || []).join(" "), w: 2, label: "laureate" },
        { t: d.subfield || "", w: 2.5, label: "subfield" },
        { t: (d.categories || []).map(c => CATEGORY_LABEL[c] || c).join(" ") + " " + (d.categories || []).join(" "), w: 3, label: "category" },
        { t: (d.tags || []).join(" "), w: 4, label: "tag" },
        { t: d.oneLiner || "", w: 3, label: "summary" },
        { t: d.motivation || "", w: 1.5, label: "citation" },
        { t: (dd.concepts || []).join(" "), w: 3, label: "concept" },
        { t: (dd.jargon || []).map(j => j.term).join(" "), w: 2.5, label: "term" },
        { t: dd.scope || "", w: 1, label: "scope" },
        { t: [dd.chemistryLogic, dd.history, dd.whyItMatters].filter(Boolean).join(" "), w: 0.4, label: "detail" }
      ].map(f => ({ t: f.t.toLowerCase(), w: f.w, label: f.label }));
      return { prize: d, fields };
    });
  }
  function termMatch(text, term) {
    if (term.length <= 3) return new RegExp("\\b" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b").test(text);
    return text.indexOf(term) !== -1;
  }
  function rankByVibe(query) {
    if (!prizeIndex) buildIndex();
    let q = query.toLowerCase();
    const terms = [];
    // 1) resolve known phrases first, then strip them from the string
    PHRASES.forEach(([re, mapped]) => {
      if (re.test(q)) { mapped.forEach(t => terms.push({ term: t, f: 0.9 })); q = q.replace(re, " "); }
    });
    // 2) tokenize the rest
    const raw = q.split(/[^a-z0-9]+/).filter(w => w && ((w.length >= 3 && !STOP.has(w)) || ACRONYMS.has(w)));
    if (!raw.length && !terms.length) return [];
    raw.forEach(w => {
      terms.push({ term: w, f: 1 });                                  // originals weigh full
      (SYNONYMS[w] || []).forEach(e => terms.push({ term: e.toLowerCase(), f: 0.5, src: w }));  // expansions weigh less
    });
    const results = [];
    for (const entry of prizeIndex) {
      let score = 0; const hits = {};
      for (const { term, f } of terms) {
        let best = 0, bestLabel = null;
        for (const fld of entry.fields) {
          if (fld.t && termMatch(fld.t, term)) { const c = fld.w * f; if (c > best) { best = c; bestLabel = fld.label; } }
        }
        if (best > 0) { score += best; (hits[bestLabel] = hits[bestLabel] || new Set()).add(term); }
      }
      if (score > 1) {
        if (!Store.isStudied(entry.prize.id)) score *= 1.06;   // gently surface new ground
        results.push({ prize: entry.prize, score, hits });
      }
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 10);
  }
  function whyText(hits) {
    const order = ["tag", "concept", "summary", "category", "term", "subfield", "laureate", "citation", "scope", "detail"];
    const parts = [];
    order.forEach(l => { if (hits[l] && parts.length < 2) parts.push(l + ": " + [...hits[l]].slice(0, 2).join(", ")); });
    return parts.join(" · ");
  }

  // recommend next steps from studied state across trails
  function recommendNext() {
    const recs = [];
    const ranked = TRAILS.map(t => {
      const done = t.steps.filter(s => Store.isStudied(s.id)).length;
      const frontier = t.steps.findIndex(s => !Store.isStudied(s.id));
      return { trail: t, done, frontier };
    }).filter(x => x.frontier !== -1);
    const anyProgress = ranked.some(x => x.done > 0);
    if (anyProgress) {
      ranked.sort((a, b) => b.done - a.done);
      ranked.slice(0, 4).forEach(x => {
        if (x.done === 0) return;
        recs.push({ id: x.trail.steps[x.frontier].id, trail: x.trail, idx: x.frontier,
          reason: `Next in ${x.trail.name.split(":")[0]} — you've done ${x.done}/${x.trail.steps.length}` });
      });
    }
    if (recs.length < 3) {
      ["foundations", "life", "synthesis"].forEach(tid => {
        const t = trailById[tid]; if (!t) return;
        const fr = t.steps.findIndex(s => !Store.isStudied(s.id));
        if (fr !== -1 && !recs.some(r => r.id === t.steps[fr].id))
          recs.push({ id: t.steps[fr].id, trail: t, idx: fr, reason: `Start the ${t.name.split(":")[0]} trail` });
      });
    }
    return recs.slice(0, 4);
  }

  function wireFinder() {
    const toggle = document.getElementById("vibeToggle");
    const panel = document.getElementById("vibePanel");
    toggle.onclick = () => {
      const open = panel.hidden;
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      if (open && !panel.dataset.built) buildPanel();
      if (open) setTimeout(() => panel.querySelector("textarea").focus(), 50);
    };

    function buildPanel() {
      panel.dataset.built = "1";
      panel.innerHTML = `
        <textarea id="vibeInput" placeholder="Describe what you want to learn… e.g. 'I want to understand how drugs are made selectively' or 'the chemistry behind AI predicting proteins'"></textarea>
        <div class="vibe-examples">
          ${["drug synthesis", "how we see molecules", "AI & proteins", "batteries & energy", "DNA editing", "quantum bonding"].map(x => `<span class="vibe-ex">${x}</span>`).join("")}
        </div>
        <button class="btn primary vibe-go" id="vibeGo">Find my path →</button>
        <div class="vibe-results" id="vibeResults"></div>`;
      const input = panel.querySelector("#vibeInput");
      panel.querySelectorAll(".vibe-ex").forEach(c => c.onclick = () => { input.value = c.textContent; runVibe(); });
      panel.querySelector("#vibeGo").onclick = runVibe;
      input.addEventListener("keydown", e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runVibe(); });
      renderRecs();
    }

    function renderRecs() {
      const box = panel.querySelector("#vibeResults");
      const recs = recommendNext();
      box.innerHTML = `<div class="vr-head">Recommended next</div>
        <p class="vibe-empty-tip">Based on what you've studied — or type a vibe above to search all 117 prizes.</p>` +
        recs.map(r => {
          const d = byId[r.id];
          return `<div class="vibe-hit" data-goto="${r.id}">
            <div class="vh-top"><span class="vh-yr" style="color:${colorFor(d)}">${d.year}</span>
            <span class="vh-laur">${(d.laureates || [])[0] || ""}</span></div>
            <div class="vh-one">${esc(d.oneLiner || "")}</div>
            <div class="vh-why">${esc(r.reason)}</div></div>`;
        }).join("");
      box.querySelectorAll(".vibe-hit").forEach(el => el.onclick = () => openDetail(el.dataset.goto));
    }

    function runVibe() {
      const q = panel.querySelector("#vibeInput").value.trim();
      const box = panel.querySelector("#vibeResults");
      if (!q) { renderRecs(); return; }
      const hits = rankByVibe(q);
      if (!hits.length) {
        box.innerHTML = `<div class="vr-head">No strong matches</div><p class="vibe-empty-tip">Try different words — topics, techniques, or what you'd build (e.g. “making mirror-image molecules”, “reading DNA”, “seeing atoms”).</p>`;
        return;
      }
      box.innerHTML = `<div class="vr-head"><span>${hits.length} matches, best first</span></div>` +
        hits.map(h => {
          const d = h.prize, isNew = !Store.isStudied(d.id);
          return `<div class="vibe-hit" data-goto="${d.id}">
            <div class="vh-top"><span class="vh-yr" style="color:${colorFor(d)}">${d.year}</span>
            <span class="vh-laur">${(d.laureates || [])[0] || ""}</span>${isNew ? '<span class="vh-new">new</span>' : ''}</div>
            <div class="vh-one">${esc(d.oneLiner || "")}</div>
            <div class="vh-why">↳ ${esc(whyText(h.hits))}</div></div>`;
        }).join("") +
        `<button class="btn vibe-path-btn" id="vibePath">🧭 Make these a path on the graph</button>`;
      box.querySelectorAll(".vibe-hit").forEach(el => el.onclick = () => openDetail(el.dataset.goto));
      box.querySelector("#vibePath").onclick = () => {
        const ordered = hits.map(h => h.prize).sort((a, b) => a.year - b.year);
        focusTrailObj({
          id: "vibe", color: "#f4c95d",
          name: "Your path: " + (q.length > 38 ? q.slice(0, 36) + "…" : q),
          steps: ordered.map(p => ({ id: p.id, why: "Matched your search." }))
        });
      };
    }
  }

  // ---------- Global Cards deck ----------
  const cardsOverlay = document.getElementById("cardsOverlay");
  function openCards() {
    let q = "", tagF = "", dueOnly = false;
    const prizeOpts = ['<option value="">— general (no prize) —</option>']
      .concat(DATA.slice().sort((a, b) => a.year - b.year).map(d => `<option value="${d.id}">${d.year} · ${(d.laureates || [])[0] || ""}</option>`)).join("");
    function render() {
      const all = Store.allCards();
      const tags = Store.allTags();
      let list = all;
      if (dueOnly) list = list.filter(c => c.due <= Date.now());
      if (tagF) list = list.filter(c => (c.tags || []).includes(tagF));
      if (q) { const s = q.toLowerCase(); list = list.filter(c => (c.front + " " + c.back + " " + (c.tags || []).join(" ")).toLowerCase().includes(s)); }
      list = list.slice().sort((a, b) => a.due - b.due);
      cardsOverlay.innerHTML = `<div class="modal" style="max-width:720px">
        <div class="modal-head"><h2>🗂 Flashcards <span style="color:var(--text-faint);font-weight:400">${all.length} total · ${Store.dueCount()} due</span></h2><button class="modal-close">×</button></div>
        <div class="modal-body">
          <div class="card-compose">
            <div class="row"><input id="ccFront" placeholder="Front (question / prompt)…"></div>
            <div class="row"><textarea id="ccBack" placeholder="Back (answer)…"></textarea></div>
            <div class="row">
              <input id="ccTags" placeholder="tags (comma separated) — e.g. mechanisms, organic">
              <select id="ccPrize" title="Optionally link to a prize">${prizeOpts}</select>
            </div>
            <button class="btn primary" id="ccAdd" style="width:100%;justify-content:center">+ Add to deck</button>
          </div>
          <div class="cards-toolbar">
            <input id="ckSearch" placeholder="Search deck…" value="${esc(q)}" style="flex:1;min-width:140px">
            <select id="ckTag"><option value="">all tags</option>${Object.keys(tags).sort().map(t => `<option value="${esc(t)}" ${t === tagF ? "selected" : ""}>${esc(t)} (${tags[t]})</option>`).join("")}</select>
            <label class="radio" style="white-space:nowrap"><input type="checkbox" id="ckDue" ${dueOnly ? "checked" : ""}> due only</label>
            <button class="btn primary" id="ckStudy">Study these (${list.length})</button>
          </div>
          <div class="deck-list">${list.length ? list.map(c => {
            const d = c.prizeId && byId[c.prizeId];
            return `<div class="fc-card" data-id="${c.id}">
              <div class="fc-front">${esc(c.front)}</div>
              <div class="fc-back">${esc(c.back)}</div>
              <div class="fc-tags">${(c.tags || []).map(t => `<span class="fc-tag">${esc(t)}</span>`).join("")}${d ? `<span class="fc-tag" data-goto="${d.id}" style="cursor:pointer;color:var(--accent-2)">↗ ${d.year} ${(d.laureates || [])[0] || ""}</span>` : ""}</div>
              <div class="fc-meta"><span>${c.seed ? "starter" : "yours"} · ${c.reps ? "seen " + c.reps + "×" : "new"} · due ${dueLabel(c.due)}</span><button class="fc-del">delete</button></div>
            </div>`;
          }).join("") : '<div class="empty-state"><p>No cards yet. Add one above — they all live here so you can study them together.</p></div>'}</div>
        </div></div>`;
      cardsOverlay.querySelector(".modal-close").onclick = () => cardsOverlay.hidden = true;
      cardsOverlay.querySelector("#ccAdd").onclick = () => {
        const f = cardsOverlay.querySelector("#ccFront").value.trim();
        const b = cardsOverlay.querySelector("#ccBack").value.trim();
        if (!f || !b) return;
        const tg = cardsOverlay.querySelector("#ccTags").value.split(",").map(s => s.trim()).filter(Boolean);
        const pid = cardsOverlay.querySelector("#ccPrize").value || null;
        Store.addCard(f, b, { prizeId: pid, tags: tg });
        if (pid) refreshFill(pid);
        updateProgress(); updateDue(); render();
      };
      cardsOverlay.querySelector("#ckSearch").oninput = e => { q = e.target.value; render(); };
      cardsOverlay.querySelector("#ckTag").onchange = e => { tagF = e.target.value; render(); };
      cardsOverlay.querySelector("#ckDue").onchange = e => { dueOnly = e.target.checked; render(); };
      cardsOverlay.querySelector("#ckStudy").onclick = () => { if (list.length) { cardsOverlay.hidden = true; runReviewQueue(list); } };
      cardsOverlay.querySelectorAll(".fc-del").forEach(el => el.onclick = e => {
        const id = e.target.closest(".fc-card").dataset.id;
        const card = Store.allCards().find(c => c.id === id);
        Store.deleteCard(id); if (card && card.prizeId) refreshFill(card.prizeId);
        updateProgress(); updateDue(); render();
      });
      cardsOverlay.querySelectorAll("[data-goto]").forEach(el => el.onclick = () => { cardsOverlay.hidden = true; openDetail(el.dataset.goto); });
    }
    render();
    cardsOverlay.hidden = false;
  }

  // ---------- Learn mode (distraction-free, one thing at a time) ----------
  const learnEl = document.getElementById("learnMode");
  let learn = null;
  function startLearn(prizeId) {
    const d = byId[prizeId]; if (!d) return;
    const dd = d.deepDive || {};
    const stages = [{ kind: "intro" }];
    if (dd.scope) stages.push({ kind: "text", kicker: "Scope", title: "What actually won the prize", body: dd.scope });
    if (dd.history) stages.push({ kind: "text", kicker: "History", title: "How we got here", body: dd.history });
    if (dd.chemistryLogic) stages.push({ kind: "text", kicker: "The chemistry", title: "The logic, mechanistically", body: dd.chemistryLogic });
    if (dd.concepts && dd.concepts.length) stages.push({ kind: "concepts", title: "The ideas to hold onto", items: dd.concepts });
    (dd.jargon || []).forEach(j => stages.push({ kind: "jargon", term: j.term, def: j.definition }));
    if (dd.whyItMatters) stages.push({ kind: "text", kicker: "Why it matters", title: "Why this is a big deal", body: dd.whyItMatters });
    stages.push({ kind: "cards" });
    stages.push({ kind: "mastery" });
    learn = { id: prizeId, stages, i: 0, flip: false, cardIdx: 0 };
    // ensure there are cards to flip
    if (dd.flashcards && dd.flashcards.length && !Store.hasSeeded(prizeId)) Store.seedCards(prizeId, dd.flashcards);
    learnEl.hidden = false;
    document.body.style.overflow = "hidden";
    renderLearn();
  }
  function exitLearn() {
    learnEl.hidden = true; learn = null;
    refreshFill(currentId); updateProgress(); updateDue();
    if (currentId) renderDetail();
  }
  function renderLearn() {
    if (!learn) return;
    const d = byId[learn.id], dd = d.deepDive || {};
    const st = learn.stages[learn.i];
    const pct = Math.round((learn.i) / (learn.stages.length - 1) * 100);
    let inner = "";
    if (st.kind === "intro") {
      inner = `<div class="learn-kicker">${d.year} · ${d.subfield}</div>
        <h1 class="learn-h">${(d.laureates || []).join(" · ")}</h1>
        <p>${esc(d.oneLiner || "")}</p>
        ${d.motivation ? `<p class="muted">“${esc(d.motivation)}”</p>` : ""}
        <p class="muted">You'll move through this one piece at a time — scope, history, the chemistry, the key ideas, the jargon, then a few cards. At the end you'll set how well you know it.</p>`;
    } else if (st.kind === "text") {
      inner = `<div class="learn-kicker">${st.kicker}</div><h1 class="learn-h">${esc(st.title)}</h1>${para(st.body)}`;
    } else if (st.kind === "concepts") {
      inner = `<div class="learn-kicker">Concepts</div><h1 class="learn-h">${esc(st.title)}</h1>` +
        st.items.map(c => { const [h, ...r] = String(c).split(":"); return `<div class="learn-card"><b>${esc(h)}</b>${r.length ? ": " + esc(r.join(":").trim()) : ""}</div>`; }).join("");
    } else if (st.kind === "jargon") {
      inner = `<div class="learn-kicker">Jargon</div><h1 class="learn-h">Make sure this word is yours</h1>
        <div class="learn-jargon"><div class="lj-term">${esc(st.term)}</div>
        <div class="lj-def" id="ljDef" style="${learn.flip ? "" : "display:none"}">${esc(st.def)}</div></div>
        <div style="display:flex;gap:8px;margin-top:10px">
          ${learn.flip ? `<button class="btn ${Store.isKnown(learn.id, st.term) ? "primary" : ""}" id="ljKnow">${Store.isKnown(learn.id, st.term) ? "✓ I understand this" : "Mark: I understand this"}</button>` : `<button class="btn primary" id="ljReveal">Reveal meaning</button>`}
        </div>`;
    } else if (st.kind === "cards") {
      const cards = Store.getCards(learn.id);
      if (!cards.length) {
        inner = `<div class="learn-kicker">Cards</div><h1 class="learn-h">Quick self-test</h1><p class="muted">No flashcards for this prize yet. You can add some from the prize's Flashcards tab, or just continue.</p>`;
      } else {
        const c = cards[Math.min(learn.cardIdx, cards.length - 1)];
        inner = `<div class="learn-kicker">Self-test · card ${learn.cardIdx + 1}/${cards.length}</div><h1 class="learn-h">Recall before you reveal</h1>
          <div class="learn-flip" id="learnFlip"><div class="lf-q">${esc(c.front)}</div>${learn.flip ? `<div class="lf-a">${esc(c.back)}</div>` : `<div class="muted" style="margin-top:12px;font-size:13px">click to reveal</div>`}</div>
          ${learn.flip ? `<div style="display:flex;gap:8px;justify-content:center"><button class="btn" id="cardAgain">Shaky</button><button class="btn primary" id="cardGood">Got it →</button></div>` : ""}`;
      }
    } else if (st.kind === "mastery") {
      const cur = Store.getMastery(learn.id);
      inner = `<div class="learn-mastery-prompt"><div class="learn-kicker">Checkpoint</div>
        <h1 class="learn-h">How well do you know this now?</h1>
        <p class="muted">Be honest — this sets how bright the node glows and feeds your "recommended next".</p>
        <div class="lmp-row">${[1, 2, 3, 4].map(l => `<button class="btn ${cur >= l ? "primary" : ""}" data-l="${l}">${Store.MASTERY[l]}</button>`).join("")}</div>
        <p class="muted" style="margin-top:20px">Then close to return to the map and watch it light up.</p></div>`;
    }
    learnEl.innerHTML = `
      <div class="learn-top">
        <div class="lt-meta"><b>${d.year}</b> · ${(d.laureates || [])[0] || ""}</div>
        <button class="btn ghost" id="learnClose">✕ Exit focus</button>
      </div>
      <div class="learn-progress"><i style="width:${pct}%"></i></div>
      <div class="learn-stage"><div class="learn-inner">${inner}</div></div>
      <div class="learn-bottom">
        <button class="btn" id="learnPrev" ${learn.i === 0 ? "disabled" : ""}>‹ Back</button>
        <div class="lb-mid">${learn.stages.map((_, k) => `<span class="learn-dot ${k === learn.i ? "on" : ""}"></span>`).join("")}</div>
        <button class="btn primary" id="learnNext">${learn.i === learn.stages.length - 1 ? "Finish ✓" : "Next ›"}</button>
      </div>`;
    learnEl.querySelector("#learnClose").onclick = exitLearn;
    learnEl.querySelector("#learnPrev").onclick = () => { if (learn.i > 0) { learn.i--; learn.flip = false; learn.cardIdx = 0; renderLearn(); } };
    learnEl.querySelector("#learnNext").onclick = () => {
      if (learn.i === learn.stages.length - 1) { exitLearn(); return; }
      learn.i++; learn.flip = false; learn.cardIdx = 0; renderLearn();
    };
    const rv = learnEl.querySelector("#ljReveal"); if (rv) rv.onclick = () => { learn.flip = true; renderLearn(); };
    const kn = learnEl.querySelector("#ljKnow"); if (kn) kn.onclick = () => { Store.toggleKnown(learn.id, st.term); renderLearn(); };
    const fl = learnEl.querySelector("#learnFlip"); if (fl) fl.onclick = () => { if (!learn.flip) { learn.flip = true; renderLearn(); } };
    const cg = learnEl.querySelector("#cardGood"); if (cg) cg.onclick = () => advanceCard(st, 2);
    const ca = learnEl.querySelector("#cardAgain"); if (ca) ca.onclick = () => advanceCard(st, 0);
    learnEl.querySelectorAll(".lmp-row button").forEach(b => b.onclick = () => {
      const lvl = parseInt(b.dataset.l);
      Store.setMastery(learn.id, Store.getMastery(learn.id) === lvl ? lvl - 1 : lvl);
      renderLearn();
    });
  }
  function advanceCard(st, grade) {
    const cards = Store.getCards(learn.id);
    const c = cards[Math.min(learn.cardIdx, cards.length - 1)];
    if (c) Store.gradeCard(c.id, grade);
    if (learn.cardIdx < cards.length - 1) { learn.cardIdx++; learn.flip = false; renderLearn(); }
    else { learn.i++; learn.flip = false; learn.cardIdx = 0; renderLearn(); }
  }

  // ---------- keyboard ----------
  document.addEventListener("keydown", e => {
    if (!learnEl.hidden) {
      if (e.key === "Escape") exitLearn();
      else if (e.key === "ArrowRight") { const n = learnEl.querySelector("#learnNext"); if (n) n.click(); }
      else if (e.key === "ArrowLeft") { const p = learnEl.querySelector("#learnPrev"); if (p && !p.disabled) p.click(); }
      return;
    }
    if (!cardsOverlay.hidden && e.key === "Escape") { cardsOverlay.hidden = true; return; }
    if (!reviewOverlay.hidden) {
      if (e.code === "Space") { e.preventDefault(); if (!reviewShown) revealAnswer(); }
      else if (reviewShown && ["1", "2", "3", "4"].includes(e.key)) grade(parseInt(e.key) - 1);
      else if (e.key === "Escape") reviewOverlay.hidden = true;
    } else if (e.key === "Escape") {
      if (!document.getElementById("helpOverlay").hidden) document.getElementById("helpOverlay").hidden = true;
      else if (!detail.classList.contains("collapsed")) closeDetail();
    }
  });

  // ---------- helpers ----------
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function para(t) { return String(t).split(/\n\n+/).map(p => `<p>${esc(p)}</p>`).join(""); }
  function section(title, body) { return body ? `<h4>${title}</h4>${para(body)}` : ""; }
  function emptyTab(msg) { return `<div class="empty-state"><p>${msg}</p></div>`; }
  function dueLabel(ts) {
    const d = ts - Date.now();
    if (d <= 0) return "now";
    const days = Math.round(d / 86400000);
    if (days < 1) return "today";
    if (days === 1) return "1 day";
    return days + " days";
  }

  // ---------- boot ----------
  function boot() {
    if (!DATA.length) {
      document.getElementById("graphHint").textContent = "Dataset not loaded yet — data/prizes.js is empty.";
      return;
    }
    applyTheme(Store.getTheme());
    renderRail();
    wireHeader();
    wireFinder();
    buildGraph();
    updateProgress();
    updateDue();
  }

  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    graph.setTheme(t);
    graph.reheat();
    const b = document.getElementById("themeBtn");
    if (b) b.textContent = t === "dark" ? "☀️" : "🌙";
  }
  boot();
  window.__nobel = { graph, Store, DATA, openDetail };
})();
