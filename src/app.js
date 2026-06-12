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
    measurement: "Measurement"
  };

  const colorFor = d => SUBFIELD_COLOR[d.subfield] || SUBFIELD_COLOR.Other;

  // ---------- Filter state ----------
  const filter = {
    engage: "all",
    subfields: new Set(),     // empty = all
    categories: new Set(),    // empty = all
    tags: new Set(),
    search: ""
  };

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
        <div class="detail-chips">
          <span class="chip subfield" style="color:${colorFor(d)};border-color:${colorFor(d)}">${d.subfield}</span>
          ${(d.categories || []).map(c => `<span class="chip cat">${CATEGORY_LABEL[c] || c}</span>`).join("")}
        </div>
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
      Store.addCard(d.id, f, b);
      refreshFill(d.id); updateProgress(); updateDue(); renderTab(d, dd);
    };
    if (canSeed) document.getElementById("fcSeed").onclick = () => {
      Store.seedCards(d.id, seeds); updateDue(); renderTab(d, dd);
    };
    body.querySelectorAll(".fc-card").forEach(el => {
      el.querySelector(".fc-del").onclick = () => { Store.deleteCard(d.id, el.dataset.id); refreshFill(d.id); updateProgress(); updateDue(); renderTab(d, dd); };
    });
  }

  // delegate related-link clicks
  detail.addEventListener("click", e => {
    const a = e.target.closest("[data-goto]");
    if (a) { e.preventDefault(); openDetail(a.dataset.goto); }
  });

  // ---------- Review overlay (cross-prize SRS) ----------
  const reviewOverlay = document.getElementById("reviewOverlay");
  let reviewQueue = [], reviewIdx = 0, reviewShown = false;
  function startReview() {
    reviewQueue = Store.dueCards();
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
    Store.gradeCard(c.prizeId, c.id, g);
    refreshFill(c.prizeId);
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
    document.getElementById("reviewBtn").onclick = startReview;
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
        <h3>Filters</h3>
        <p>Use the left rail to filter by engagement (studied / not started / cards due), subfield, category, and tags, or search anything.</p>
        <h3>Your data</h3>
        <p>Everything you write lives in this browser's local storage. Use <b>Export</b> to back it up or move it to another device, and <b>Import</b> to restore.</p>
      </div></div>`;
    ov.hidden = false;
    ov.querySelector(".modal-close").onclick = () => ov.hidden = true;
  }

  // ---------- keyboard ----------
  document.addEventListener("keydown", e => {
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
    renderRail();
    wireHeader();
    buildGraph();
    updateProgress();
    updateDue();
  }
  boot();
  window.__nobel = { graph, Store, DATA, openDetail };
})();
