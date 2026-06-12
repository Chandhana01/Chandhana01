/* store.js — local persistence for notes, flashcards, jargon "known" state,
   and per-prize mastery. Everything lives in localStorage so the page works
   fully offline with no server.

   Cards are stored as ONE flat deck (not nested per prize) so they can be
   created, browsed, and studied all together. Each card optionally links to a
   prize (prizeId) and carries free-text tags, so you can still filter "cards
   from this prize" while studying the whole pile in one place. */
(function () {
  const KEY = "nobelAtlas.v2";
  const OLD_KEY = "nobelAtlas.v1";
  const DAY = 86400000;

  // mastery ladder
  const MASTERY = ["Not started", "Skimmed", "Understand", "Can explain", "Can rebuild"];

  function blank() { return { notes: {}, cards: [], known: {}, mastery: {}, theme: "light", meta: { created: Date.now() } }; }

  function migrate(old) {
    // v1 cards were { prizeId: [card,...] } — flatten to a single array
    const s = blank();
    s.notes = old.notes || {};
    s.known = old.known || {};
    s.meta = old.meta || { created: Date.now() };
    if (Array.isArray(old.cards)) s.cards = old.cards;
    else if (old.cards && typeof old.cards === "object") {
      for (const pid in old.cards) (old.cards[pid] || []).forEach(c => s.cards.push(Object.assign({ prizeId: pid, tags: [] }, c)));
    }
    s.mastery = old.mastery || {};
    return s;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const s = JSON.parse(raw); if (!s.cards) s.cards = []; if (!Array.isArray(s.cards)) s = migrate(s); return Object.assign(blank(), s); }
      const oldRaw = localStorage.getItem(OLD_KEY);
      if (oldRaw) return migrate(JSON.parse(oldRaw));
    } catch (e) { /* corrupted — start fresh */ }
    return blank();
  }

  let state = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn("save failed", e); } }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  const Store = {
    MASTERY,

    /* ---- Notes ---- */
    getNote(prizeId) { return state.notes[prizeId] || ""; },
    setNote(prizeId, text) { if (text && text.trim()) state.notes[prizeId] = text; else delete state.notes[prizeId]; save(); },

    /* ---- Jargon known ---- */
    isKnown(prizeId, term) { return !!(state.known[prizeId] && state.known[prizeId][term]); },
    toggleKnown(prizeId, term) {
      state.known[prizeId] = state.known[prizeId] || {};
      if (state.known[prizeId][term]) delete state.known[prizeId][term];
      else state.known[prizeId][term] = true;
      if (Object.keys(state.known[prizeId]).length === 0) delete state.known[prizeId];
      save();
    },

    /* ---- Mastery (0..4) ---- */
    getMastery(prizeId) { return state.mastery[prizeId] || 0; },
    setMastery(prizeId, level) {
      level = Math.max(0, Math.min(4, level | 0));
      if (level === 0) delete state.mastery[prizeId]; else state.mastery[prizeId] = level;
      save();
    },

    /* ---- Flashcards (flat deck) ---- */
    allCards() { return state.cards.slice(); },
    getCards(prizeId) { return state.cards.filter(c => c.prizeId === prizeId); },
    addCard(front, back, opts) {
      opts = opts || {};
      const card = {
        id: uid(), front, back,
        prizeId: opts.prizeId || null,
        tags: (opts.tags || []).map(t => t.trim()).filter(Boolean),
        seed: !!opts.seed,
        ease: 2.5, interval: 0, reps: 0, due: Date.now(), created: Date.now()
      };
      state.cards.push(card); save(); return card;
    },
    updateCard(id, fields) { const c = state.cards.find(x => x.id === id); if (c) { Object.assign(c, fields); if (fields.tags) c.tags = fields.tags.map(t => t.trim()).filter(Boolean); save(); } },
    deleteCard(id) { state.cards = state.cards.filter(c => c.id !== id); save(); },

    hasSeeded(prizeId) { return state.cards.some(c => c.prizeId === prizeId && c.seed); },
    seedCards(prizeId, pairs) {
      if (this.hasSeeded(prizeId)) return;
      pairs.forEach(p => this.addCard(p.front, p.back, { prizeId, seed: true, tags: [] }));
    },

    allTags() {
      const m = {};
      state.cards.forEach(c => (c.tags || []).forEach(t => m[t] = (m[t] || 0) + 1));
      return m;
    },

    /* SM-2-ish scheduling. grade: 0 again, 1 hard, 2 good, 3 easy */
    gradeCard(id, grade) {
      const c = state.cards.find(x => x.id === id); if (!c) return;
      if (grade === 0) { c.reps = 0; c.interval = 0; c.ease = Math.max(1.3, c.ease - 0.2); c.due = Date.now() + 60000; }
      else {
        c.reps += 1;
        if (grade === 1) { c.ease = Math.max(1.3, c.ease - 0.15); c.interval = Math.max(1, c.interval * 1.2 || 1); }
        else if (grade === 2) { c.interval = c.reps === 1 ? 1 : (c.reps === 2 ? 3 : Math.round(c.interval * c.ease)); }
        else { c.ease += 0.1; c.interval = c.reps === 1 ? 2 : Math.round((c.interval || 1) * c.ease * 1.3); }
        c.due = Date.now() + Math.max(1, c.interval) * DAY;
      }
      save();
    },

    dueCards(filterFn) {
      const now = Date.now();
      return state.cards.filter(c => c.due <= now && (!filterFn || filterFn(c))).sort((a, b) => a.due - b.due);
    },
    dueCount() { return this.dueCards().length; },

    /* ---- Engagement ---- */
    isStudied(prizeId) {
      if (this.getMastery(prizeId) > 0) return true;
      if ((state.notes[prizeId] || "").trim()) return true;
      if (state.cards.some(c => c.prizeId === prizeId && !c.seed)) return true;
      if (state.known[prizeId]) return true;
      return false;
    },
    // 0..1 fill score for node brightness — driven mostly by mastery level
    fillScore(prizeId, prize) {
      const m = this.getMastery(prizeId);
      let s = m > 0 ? 0.2 + (m / 4) * 0.65 : 0;          // mastery is the main driver
      if ((state.notes[prizeId] || "").trim()) s += 0.08;
      const userCards = state.cards.filter(c => c.prizeId === prizeId && !c.seed).length;
      s += Math.min(0.12, userCards * 0.05);
      const known = state.known[prizeId] ? Object.keys(state.known[prizeId]).length : 0;
      const totalJargon = prize && prize.deepDive && prize.deepDive.jargon ? prize.deepDive.jargon.length : 6;
      if (known) s += Math.min(0.1, (known / Math.max(1, totalJargon)) * 0.1);
      return Math.min(1, s);
    },
    studiedCount() {
      const ids = new Set();
      Object.keys(state.mastery).forEach(id => ids.add(id));
      Object.keys(state.notes).forEach(id => { if ((state.notes[id] || "").trim()) ids.add(id); });
      Object.keys(state.known).forEach(id => ids.add(id));
      state.cards.forEach(c => { if (c.prizeId && !c.seed) ids.add(c.prizeId); });
      return ids.size;
    },

    /* ---- Theme ---- */
    getTheme() { return state.theme || "light"; },
    setTheme(t) { state.theme = t; save(); },

    /* ---- Import / export ---- */
    exportData() { return JSON.stringify(state, null, 2); },
    importData(json) {
      const incoming = JSON.parse(json);
      if (!incoming || typeof incoming !== "object") throw new Error("bad file");
      state = Array.isArray(incoming.cards) ? Object.assign(blank(), incoming) : migrate(incoming);
      save();
    }
  };

  window.Store = Store;
})();
