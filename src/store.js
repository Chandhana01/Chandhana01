/* store.js — local persistence for notes, flashcards, jargon "known" state.
   Everything lives in localStorage so the page works fully offline with no server. */
(function () {
  const KEY = "nobelAtlas.v1";
  const DAY = 86400000;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* corrupted — start fresh */ }
    return { notes: {}, cards: {}, known: {}, meta: { created: Date.now() } };
  }

  let state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.warn("Could not save (storage full?)", e); }
  }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  const Store = {
    /* ---- Notes ---- */
    getNote(prizeId) { return state.notes[prizeId] || ""; },
    setNote(prizeId, text) {
      if (text && text.trim()) state.notes[prizeId] = text;
      else delete state.notes[prizeId];
      save();
    },

    /* ---- Jargon known ---- */
    isKnown(prizeId, term) { return !!(state.known[prizeId] && state.known[prizeId][term]); },
    toggleKnown(prizeId, term) {
      state.known[prizeId] = state.known[prizeId] || {};
      if (state.known[prizeId][term]) delete state.known[prizeId][term];
      else state.known[prizeId][term] = true;
      if (Object.keys(state.known[prizeId]).length === 0) delete state.known[prizeId];
      save();
    },

    /* ---- Flashcards ---- */
    getCards(prizeId) { return (state.cards[prizeId] || []).slice(); },
    addCard(prizeId, front, back, opts) {
      opts = opts || {};
      state.cards[prizeId] = state.cards[prizeId] || [];
      const card = {
        id: uid(), front, back,
        seed: !!opts.seed,                 // came from the dataset vs user-authored
        ease: 2.5, interval: 0, reps: 0,
        due: Date.now(),                   // due immediately
        created: Date.now()
      };
      state.cards[prizeId].push(card);
      save();
      return card;
    },
    deleteCard(prizeId, cardId) {
      if (!state.cards[prizeId]) return;
      state.cards[prizeId] = state.cards[prizeId].filter(c => c.id !== cardId);
      if (state.cards[prizeId].length === 0) delete state.cards[prizeId];
      save();
    },
    // Has the seed deck for this prize been imported yet?
    hasSeeded(prizeId) {
      return (state.cards[prizeId] || []).some(c => c.seed);
    },
    seedCards(prizeId, pairs) {
      if (this.hasSeeded(prizeId)) return;
      pairs.forEach(p => this.addCard(prizeId, p.front, p.back, { seed: true }));
    },

    /* SM-2-ish scheduling. grade: 0 again, 1 hard, 2 good, 3 easy */
    gradeCard(prizeId, cardId, grade) {
      const list = state.cards[prizeId]; if (!list) return;
      const c = list.find(x => x.id === cardId); if (!c) return;
      if (grade === 0) {
        c.reps = 0; c.interval = 0; c.ease = Math.max(1.3, c.ease - 0.2);
        c.due = Date.now() + 60 * 1000; // ~1 min, effectively this session
      } else {
        c.reps += 1;
        if (grade === 1) { c.ease = Math.max(1.3, c.ease - 0.15); c.interval = Math.max(1, c.interval * 1.2 || 1); }
        else if (grade === 2) { c.interval = c.reps === 1 ? 1 : (c.reps === 2 ? 3 : Math.round(c.interval * c.ease)); }
        else { c.ease += 0.1; c.interval = c.reps === 1 ? 2 : Math.round((c.interval || 1) * c.ease * 1.3); }
        c.due = Date.now() + Math.max(1, c.interval) * DAY;
      }
      save();
    },

    /* All cards due now, flattened with prize context */
    dueCards() {
      const now = Date.now(); const out = [];
      for (const pid in state.cards) {
        for (const c of state.cards[pid]) {
          if (c.due <= now) out.push(Object.assign({ prizeId: pid }, c));
        }
      }
      return out.sort((a, b) => a.due - b.due);
    },
    dueCount() { return this.dueCards().length; },

    /* ---- Engagement: is a prize "studied"? ---- */
    isStudied(prizeId) {
      const hasNote = !!(state.notes[prizeId] && state.notes[prizeId].trim());
      const userCards = (state.cards[prizeId] || []).some(c => !c.seed);
      const known = !!state.known[prizeId];
      return hasNote || userCards || known;
    },
    // 0..1 fill score used to brighten nodes
    fillScore(prizeId, prize) {
      let s = 0;
      const note = (state.notes[prizeId] || "").trim();
      if (note) s += Math.min(0.5, 0.18 + note.length / 1400);
      const cards = state.cards[prizeId] || [];
      const userCards = cards.filter(c => !c.seed).length;
      s += Math.min(0.3, userCards * 0.1);
      const known = state.known[prizeId] ? Object.keys(state.known[prizeId]).length : 0;
      const totalJargon = prize && prize.deepDive && prize.deepDive.jargon ? prize.deepDive.jargon.length : 6;
      if (known) s += Math.min(0.25, (known / Math.max(1, totalJargon)) * 0.25);
      const reviewed = cards.filter(c => c.reps > 0).length;
      s += Math.min(0.2, reviewed * 0.05);
      return Math.min(1, s);
    },
    studiedCount() {
      const ids = new Set();
      Object.keys(state.notes).forEach(id => { if ((state.notes[id]||"").trim()) ids.add(id); });
      Object.keys(state.known).forEach(id => ids.add(id));
      for (const id in state.cards) if (state.cards[id].some(c => !c.seed)) ids.add(id);
      return ids.size;
    },

    /* ---- Import / export ---- */
    exportData() { return JSON.stringify(state, null, 2); },
    importData(json) {
      const incoming = JSON.parse(json);
      if (!incoming || typeof incoming !== "object") throw new Error("bad file");
      state = {
        notes: incoming.notes || {},
        cards: incoming.cards || {},
        known: incoming.known || {},
        meta: incoming.meta || { created: Date.now() }
      };
      save();
    }
  };

  window.Store = Store;
})();
