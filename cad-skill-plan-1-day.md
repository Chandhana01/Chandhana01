# 1-Day CAD Skill-Building Plan

An intensive, hands-on plan to go from zero (or rusty) to confidently modeling real parts in parametric 3D CAD in a single day (~9–10 hours including breaks).

**Recommended software:** Autodesk Fusion 360 (free for personal use) — it's beginner-friendly, industry-relevant, and runs on modest hardware.
**Alternatives:** FreeCAD (fully free/open-source), Onshape (browser-based, free public plan), SolidWorks (if you have access).

The plan below is software-agnostic; every block works in any parametric CAD tool.

---

## Goal for the Day

By the end of the day you will be able to:

1. Sketch with dimensions and constraints (fully-defined sketches).
2. Turn sketches into solids with extrude, revolve, fillet, chamfer, shell, and patterns.
3. Model a real-world object from measurements.
4. Assemble multiple parts with joints/mates.
5. Export a technical drawing and an STL for 3D printing.

---

## Schedule

### Hour 0–1 · Setup & Orientation (8:00–9:00)

- [ ] Install your chosen CAD package and create an account if needed.
- [ ] Learn the viewport: orbit, pan, zoom, view cube / standard views (front, top, iso).
- [ ] Tour the interface: sketch mode vs. solid mode, the timeline/feature tree, the browser/model tree.
- [ ] Set your units (mm recommended) and make a "sandbox" project folder.

**Checkpoint:** You can navigate around a default cube comfortably without thinking about the mouse.

### Hour 1–2.5 · Sketching Fundamentals (9:00–10:30)

The single most important CAD skill. Don't rush this block.

- [ ] Draw basic entities: lines, rectangles, circles, arcs, polygons.
- [ ] Apply dimensions to every entity (smart/driven dimensions).
- [ ] Learn the core constraints: horizontal/vertical, coincident, tangent, parallel, perpendicular, equal, symmetric, concentric.
- [ ] Practice until sketches turn "fully defined" (usually shown by a color change or lock icon).
- [ ] Use construction lines and sketch mirroring.

**Drills (do all three):**
1. A 60×40 mm rounded rectangle with 4 symmetric holes.
2. A "keyhole" slot shape using tangent arcs.
3. A hex profile centered on the origin, fully defined with 2 dimensions.

**Checkpoint:** Every drill sketch is fully defined — zero loose entities.

### Hour 2.5–4 · From Sketch to Solid (10:30–12:00)

- [ ] **Extrude:** new body, join, cut, and intersect operations.
- [ ] **Revolve:** model a simple flowerpot or chess pawn.
- [ ] **Fillet & chamfer:** edges vs. faces, when each is appropriate.
- [ ] **Shell:** hollow out a box into an open container.
- [ ] **Holes:** the dedicated hole tool (counterbore, countersink, tapped).
- [ ] **Patterns:** rectangular and circular patterns; **Mirror** for symmetric features.

**Drills:**
1. A dice (cube + filleted edges + patterned dimple cuts).
2. A simple bracket: L-profile extrusion, mounting holes, fillets at the stress corner.
3. A pulley or bottle cap using revolve + circular pattern.

**Checkpoint:** You can predict what each feature will do before you click OK.

### Lunch break (12:00–12:45)

Step away from the screen — spatial reasoning consolidates during rest.

### Hour 4.5–6.5 · Model Real Objects (12:45–14:45)

This is where skills become real. Grab calipers (or a ruler) and model physical objects near you.

- [ ] **Object 1 (simple, ~30 min):** a whiteboard eraser, soap bar, or phone stand.
- [ ] **Object 2 (medium, ~45 min):** a coffee mug (revolve body + swept handle) or a TV remote (lofted/filleted shell with button cutouts).
- [ ] **Object 3 (challenge, ~45 min):** something with mating features — a jar with a threaded or snap-fit lid, or a pen with a cap.

**Rules for this block:**
- Sketch on the correct plane deliberately; don't just accept the default.
- Every sketch fully defined before moving on.
- Name your features in the timeline/tree as you go.

**Checkpoint:** Object 3's two parts actually fit each other dimensionally (check with a section view).

### Hour 6.5–7.5 · Assemblies (14:45–15:45)

- [ ] Insert multiple parts/components into one design.
- [ ] Learn joints/mates: rigid, revolute (hinge), slider, cylindrical.
- [ ] Set a component as grounded/fixed.
- [ ] Check motion: drag components and watch degrees of freedom.

**Drill:** Build a 3-part hinge (two leaves + pin) and make it rotate. Bonus: add joint limits so it only opens 180°.

**Checkpoint:** Your hinge moves correctly and nothing floats loose.

### Hour 7.5–8.5 · Outputs: Drawings & 3D Printing (15:45–16:45)

- [ ] Create a 2D technical drawing from your bracket: front/top/side views, an isometric view, dimensions, and a title block.
- [ ] Add a section view and a detail view.
- [ ] Export the drawing as PDF.
- [ ] Export a part as STL/3MF and open it in a slicer (e.g., PrusaSlicer or Cura) to sanity-check printability — wall thickness, overhangs, orientation.

**Checkpoint:** A PDF drawing another person could manufacture from, and a sliceable STL.

### Hour 8.5–9.5 · Capstone Project (16:45–17:45)

Design something useful from scratch, unguided. Pick one:

- A desk phone stand with a cable slot, angled 60–70°.
- A parametric drawer organizer (change 2 dimensions, whole model updates).
- A wall hook rated for your headphone weight, with 2 screw holes.
- A custom enclosure for a Raspberry Pi / Arduino (lookup the board's mounting-hole spec).

**Requirements:** fully-defined sketches, at least one pattern or mirror, fillets on user-facing edges, exported STL.

### Final 15 min · Review & Next Steps (17:45–18:00)

- [ ] Scrub through your timelines/feature trees: could someone else follow your modeling intent?
- [ ] Write down the 3 things that slowed you down most — that's tomorrow's practice list.
- [ ] Save/organize all files.

---

## Key Habits to Build From Day One

| Habit | Why it matters |
|---|---|
| Fully define every sketch | Prevents models breaking when edited later |
| Sketch on origin planes, centered on origin | Makes mirroring, patterns, and edits vastly easier |
| Name features and components | Your model tree is documentation |
| Model design *intent*, not just shape | Parametric edits should update the whole part correctly |
| Fillets last | Fillets early in the timeline cause downstream failures |

## If You Only Have 4 Hours

Do: Hour 0–1 (setup) → Sketching (60 min, drills 1–2) → Sketch-to-solid (60 min, drills 1–2) → Model one real object (45 min) → Export an STL (15 min).

## Resources

- **Fusion 360:** Autodesk's official "Fusion 360 for beginners" learning path; *Product Design Online* (YouTube) — "Learn Fusion 360 in 30 Days" series.
- **FreeCAD:** *MangoJelly Solutions* (YouTube) beginner series; the FreeCAD wiki tutorials.
- **Onshape:** Onshape Learning Center self-paced courses (free, excellent).
- **Practice prompts:** r/cad and "Too Tall Toby" daily CAD challenges — timed modeling from drawings, ideal for day 2 onward.

## After Day 1 — Where to Go Next

1. **Week 1:** One "Too Tall Toby"-style timed model per day (20–30 min each).
2. **Week 2:** Learn lofts, sweeps, and basic surfacing; model something curvy (a computer mouse).
3. **Week 3:** Parametric design with user variables/equations; design-for-3D-printing tolerances (clearance fits, snap fits).
4. **Ongoing:** Pick a real project you'll actually manufacture or print — nothing accelerates CAD like real constraints.
