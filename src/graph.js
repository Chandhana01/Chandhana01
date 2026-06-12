/* graph.js — dependency-free force-directed graph on a 2D canvas.
   Handles pan, zoom, node drag, hover + click, subfield clustering,
   and "pale → bright" node rendering driven by an external fill function. */
(function () {
  function mix(a, b, t) {
    const ah = parseInt(a.slice(1), 16), bh = parseInt(b.slice(1), 16);
    const ar = ah >> 16, ag = (ah >> 8) & 255, ab = ah & 255;
    const br = bh >> 16, bg = (bh >> 8) & 255, bb = bh & 255;
    const r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), bl = Math.round(ab + (bb - ab) * t);
    return `rgb(${r},${g},${bl})`;
  }

  class Graph {
    constructor(canvas, opts) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.opts = opts || {};
      this.nodes = [];
      this.links = [];
      this.byId = {};
      this.scale = 1;
      this.offset = { x: 0, y: 0 };
      this.clusterCenters = {};
      this.hovered = null;
      this.dragNode = null;
      this.panning = false;
      this.last = { x: 0, y: 0 };
      this.alpha = 1;            // simulation "temperature"
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this._bindEvents();
      this._resize();
      window.addEventListener("resize", () => this._resize());
      this._loop = this._loop.bind(this);
      requestAnimationFrame(this._loop);
    }

    setData(nodes, links, clusterKeys) {
      // preserve positions on refresh
      const prev = this.byId;
      this.nodes = nodes.map(n => {
        const old = prev[n.id];
        return Object.assign({
          x: old ? old.x : (Math.random() - 0.5) * 600,
          y: old ? old.y : (Math.random() - 0.5) * 600,
          vx: 0, vy: 0
        }, n);
      });
      this.byId = {};
      this.nodes.forEach(n => this.byId[n.id] = n);
      this.links = links.filter(l => this.byId[l.source] && this.byId[l.target])
        .map(l => ({ s: this.byId[l.source], t: this.byId[l.target] }));
      // cluster centers arranged on a circle
      this.clusterKeys = clusterKeys || [];
      const R = 360;
      this.clusterKeys.forEach((k, i) => {
        const a = (i / this.clusterKeys.length) * Math.PI * 2 - Math.PI / 2;
        this.clusterCenters[k] = { x: Math.cos(a) * R, y: Math.sin(a) * R };
      });
      this.alpha = 1;
    }

    reheat() { this.alpha = Math.max(this.alpha, 0.6); }

    _resize() {
      const r = this.canvas.parentElement.getBoundingClientRect();
      this.W = r.width; this.H = r.height;
      this.canvas.width = r.width * this.dpr;
      this.canvas.height = r.height * this.dpr;
      this.canvas.style.width = r.width + "px";
      this.canvas.style.height = r.height + "px";
      if (!this._centered) { this.offset.x = this.W / 2; this.offset.y = this.H / 2; this._centered = true; }
    }

    _tick() {
      if (this.alpha < 0.005) return;
      const nodes = this.nodes;
      const visible = nodes.filter(n => n.visible !== false);
      const k = this.alpha;
      // repulsion (O(n^2), fine for ~125 nodes)
      for (let i = 0; i < visible.length; i++) {
        const a = visible[i];
        for (let j = i + 1; j < visible.length; j++) {
          const b = visible[j];
          let dx = a.x - b.x, dy = a.y - b.y;
          let d2 = dx * dx + dy * dy || 0.01;
          if (d2 > 90000) continue;
          const d = Math.sqrt(d2);
          const force = (3400 / d2);
          const fx = (dx / d) * force, fy = (dy / d) * force;
          a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
        }
      }
      // springs
      for (const l of this.links) {
        const a = l.s, b = l.t;
        if (a.visible === false || b.visible === false) continue;
        let dx = b.x - a.x, dy = b.y - a.y;
        let d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const target = 95;
        const f = (d - target) * 0.012;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
      // cluster gravity + global centering
      for (const n of visible) {
        const c = this.clusterCenters[n.cluster];
        if (c) { n.vx += (c.x - n.x) * 0.009; n.vy += (c.y - n.y) * 0.009; }
        n.vx += (0 - n.x) * 0.0012; n.vy += (0 - n.y) * 0.0012;
      }
      // integrate
      for (const n of visible) {
        if (n === this.dragNode) { n.vx = 0; n.vy = 0; continue; }
        n.vx *= 0.82; n.vy *= 0.82;
        n.x += n.vx * k; n.y += n.vy * k;
      }
      this.alpha *= 0.992;
    }

    _toScreen(p) { return { x: p.x * this.scale + this.offset.x, y: p.y * this.scale + this.offset.y }; }
    _toWorld(sx, sy) { return { x: (sx - this.offset.x) / this.scale, y: (sy - this.offset.y) / this.scale }; }

    nodeRadius(n) {
      const base = n.weight ? 7 + n.weight * 5 : 9;
      return base;
    }

    _draw() {
      const ctx = this.ctx;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.W, this.H);

      // links
      ctx.lineWidth = 1;
      for (const l of this.links) {
        if (l.s.visible === false || l.t.visible === false) continue;
        const a = this._toScreen(l.s), b = this._toScreen(l.t);
        const hot = this.hovered && (l.s === this.hovered || l.t === this.hovered);
        ctx.strokeStyle = hot ? "rgba(244,201,93,.5)" : "rgba(120,140,165,.10)";
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }

      // nodes
      for (const n of this.nodes) {
        if (n.visible === false) continue;
        const p = this._toScreen(n);
        const fill = this.opts.fillFn ? this.opts.fillFn(n) : 0;       // 0..1 engagement
        const r = this.nodeRadius(n) * this.scale * (0.85 + fill * 0.4);
        const base = "#3a4150";                                        // pale/dull
        const col = mix(base, n.color, 0.25 + fill * 0.75);
        const isHover = n === this.hovered;
        if (fill > 0.05 || isHover) {
          ctx.shadowColor = n.color; ctx.shadowBlur = (6 + fill * 16) * (isHover ? 1.6 : 1);
        } else ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill();
        ctx.shadowBlur = 0;
        // ring for studied
        if (fill > 0.05) { ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.stroke(); }
        if (isHover) { ctx.lineWidth = 2; ctx.strokeStyle = "#fff"; ctx.stroke(); }

        // labels when zoomed in or hovered
        if (this.scale > 1.15 || isHover) {
          ctx.fillStyle = isHover ? "#fff" : "rgba(231,236,243,.75)";
          ctx.font = `${isHover ? "700 " : ""}${11}px -apple-system, sans-serif`;
          ctx.textAlign = "center";
          const label = n.label.length > 22 && !isHover ? n.label.slice(0, 20) + "…" : n.label;
          ctx.fillText(label, p.x, p.y + r + 13);
        }
      }
    }

    _loop() { this._tick(); this._draw(); requestAnimationFrame(this._loop); }

    _pick(sx, sy) {
      for (let i = this.nodes.length - 1; i >= 0; i--) {
        const n = this.nodes[i];
        if (n.visible === false) continue;
        const p = this._toScreen(n);
        const r = this.nodeRadius(n) * this.scale + 4;
        if ((sx - p.x) ** 2 + (sy - p.y) ** 2 <= r * r) return n;
      }
      return null;
    }

    _bindEvents() {
      const c = this.canvas;
      const rel = e => { const b = c.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };

      c.addEventListener("mousedown", e => {
        const { x, y } = rel(e);
        const n = this._pick(x, y);
        if (n) { this.dragNode = n; this.reheat(); }
        else { this.panning = true; }
        this.last = { x, y };
      });
      window.addEventListener("mousemove", e => {
        const b = c.getBoundingClientRect();
        const x = e.clientX - b.left, y = e.clientY - b.top;
        if (this.dragNode) {
          const w = this._toWorld(x, y);
          this.dragNode.x = w.x; this.dragNode.y = w.y; this.reheat();
        } else if (this.panning) {
          this.offset.x += x - this.last.x; this.offset.y += y - this.last.y;
          this.last = { x, y };
        } else if (x >= 0 && y >= 0 && x <= this.W && y <= this.H) {
          const n = this._pick(x, y);
          if (n !== this.hovered) {
            this.hovered = n;
            if (this.opts.onHover) this.opts.onHover(n, { x, y });
          } else if (n && this.opts.onHover) {
            this.opts.onHover(n, { x, y }); // update position
          }
        }
      });
      window.addEventListener("mouseup", e => {
        const b = c.getBoundingClientRect();
        const x = e.clientX - b.left, y = e.clientY - b.top;
        if (this.dragNode) {
          const moved = Math.hypot(x - this.last0x, y - this.last0y);
        }
        this.dragNode = null; this.panning = false;
      });

      // click vs drag distinction
      c.addEventListener("mousedown", e => { const p = rel(e); this.last0x = p.x; this.last0y = p.y; });
      c.addEventListener("click", e => {
        const { x, y } = rel(e);
        if (Math.hypot(x - this.last0x, y - this.last0y) > 5) return; // was a drag
        const n = this._pick(x, y);
        if (n && this.opts.onClick) this.opts.onClick(n);
      });

      c.addEventListener("wheel", e => {
        e.preventDefault();
        const { x, y } = rel(e);
        const w = this._toWorld(x, y);
        const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        this.scale = Math.max(0.25, Math.min(4, this.scale * factor));
        // zoom toward cursor
        this.offset.x = x - w.x * this.scale;
        this.offset.y = y - w.y * this.scale;
      }, { passive: false });
    }

    zoomBy(f) {
      const cx = this.W / 2, cy = this.H / 2;
      const w = this._toWorld(cx, cy);
      this.scale = Math.max(0.25, Math.min(4, this.scale * f));
      this.offset.x = cx - w.x * this.scale;
      this.offset.y = cy - w.y * this.scale;
    }

    fit() {
      const vis = this.nodes.filter(n => n.visible !== false);
      if (!vis.length) return;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const n of vis) { minX = Math.min(minX, n.x); minY = Math.min(minY, n.y); maxX = Math.max(maxX, n.x); maxY = Math.max(maxY, n.y); }
      const pad = 80;
      const w = (maxX - minX) || 1, h = (maxY - minY) || 1;
      this.scale = Math.max(0.25, Math.min(2.4, Math.min((this.W - pad) / w, (this.H - pad) / h)));
      this.offset.x = this.W / 2 - ((minX + maxX) / 2) * this.scale;
      this.offset.y = this.H / 2 - ((minY + maxY) / 2) * this.scale;
    }

    centerOn(id) {
      const n = this.byId[id]; if (!n) return;
      this.scale = Math.max(this.scale, 1.4);
      this.offset.x = this.W / 2 - n.x * this.scale;
      this.offset.y = this.H / 2 - n.y * this.scale;
    }
  }

  window.Graph = Graph;
})();
