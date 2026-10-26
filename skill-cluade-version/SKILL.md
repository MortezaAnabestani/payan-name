---
name: kodabiyat-transpassage
description: Turn a print literary work (story, novel, poem, essay, play) into an electronic literary work (kodabiyat) or a literary game using the media-specific formalism of the "transpassage" (تراگشت) model, which transfers a work's literary FUNCTION instead of its form. Use this skill whenever the user wants to convert, adapt, remake, port, gamify or "make interactive/digital" a literary text, design electronic literature or an interactive/procedural/game version of a book, analyze which devices of a print text can or cannot survive in a computational medium, or design a game genre grounded in literary theory. Also trigger on Persian terms such as تراگشت، کدبیات، ادبیات الکترونیک، مسلط رسانه‌ای، مسلط‌زدایی، تبدیل داستان به بازی، even if the user never says "transpassage". Produces a diagnosis, unit cards, composition rules, a failure review and, if asked, a working prototype.
---

# Kodabiyat transpassage: from print literature to electronic literature and literary games

This skill encodes a theory of how a literary work can pass from the printed page to the computational medium **without losing what makes it literary**. The theory (media-specific formalism, from a doctoral dissertation on modeling the passage of the literary work from the written layer to the computational layer) says:

> Literariness is not inside the text. It is an *event* that happens when a work **de-dominantizes** (مسلط‌زدایی) the naturalized *protocols* of a medium's **dominant** (مسلط), so that the subject's automatic relation to the medium is rearranged, within a frame where the subject can read this as deliberate.

So the conversion is **not** translation, porting, adaptation or putting a page on a screen. It is **transpassage (تراگشت)**: find, in the computer, a de-dominantizing situation **equivalent in function** to the print one, built with the computer's *native materials* (rules, state, delay, chance, interface behavior).

Why this matters in practice: a device copied by form into the new medium usually does nothing (a non-linear jump is the *default* of a database, a page-turn on screen is a gimmick), and an "interactive" layer added on top usually *reinforces* the medium's automatic habits instead of disturbing them. Most bad electronic adaptations fail in one of these two ways; this skill's procedure is built to avoid them.

## When to use
Use for any request to turn a literary source into a digital/interactive/game form, to judge what can be transferred, or to design a game form of literature. Also use it to explain or apply the model itself. Do **not** use it for plain translation, e-book formatting, generic quiz/"gamification" of learning content, or game design with no literary source (unless the user wants the new-genre framework, see `references/07-game-genre-framework.md`).

## Core procedure (read the references as you go)

1. **Intake** (Phase 0). Establish: the source (full text or a passage; if only a title is given, work from what you reliably know and say so), the target form (web piece, game, installation…), the platform/skill of the user (default: a single-file HTML/JS work that runs anywhere, and say so), the assumed audience, and the depth wanted (see "Depth modes"). If the source is missing, ask for it; otherwise state assumptions and proceed.
2. **Diagnose the source** (Phase 1) → `references/03-diagnosis-and-spectrum.md`. Describe the print medium's materiality and dominants, mark where the work breaks the reader's expectations, and cut the work into **units**: each a *cognitive-procedural event* (subject, protocol, intervention), not a sentence or scene. Place each unit on the **five-level spectrum** of dependence on the print dominant.
3. **Name the dominants** (Phase 2) → `references/02-dominants-catalog.md`. For each unit: which print dominant and protocol does it attack, and which computational dominant(s) (platform, gamification/game, algorithm-, procedure-, flow-generated, LLM…) will be your target? The computer has *several* dominants at once; choose and state them.
4. **Choose technique and write the equivalence chain** (Phase 3) → `references/04-techniques.md` (and the lookup `references/08-device-matrix.md` for 104 known devices). Each chain is two three-step lines (print / computer) whose **last element, the function, is identical**. If it is not identical, you changed the work.
5. **Design the macro architecture** (Phase 4) → `references/05-architecture.md` sections 1, 5, 6, 7. Topology of the whole, recurring motifs as functions, perceptual environment, state variables, the **procedural paratext** that builds the interpretive pact.
6. **Fill one unit card per unit, all 12 fields** (Phase 5) → `references/05-architecture.md` section 8 and `assets/unit-card-template.md`. Field 10, **composition rules** (triggers, state variables, transitions, timing, randomness), is where the work becomes playable: never leave it empty. See `references/09-worked-example.md` for a finished card.
7. **Review against the four failures** (Phase 6) → `references/06-evaluation-and-failures.md`: A alignment with the dominant, B padding, C technical misreading, D agency illusion; plus declared **non-transferability**.
8. **Deliver** (Phase 7) as the dossier (`assets/dossier-template.md`), and, if asked, a **working prototype** of the most diagnostic units (see "Building a prototype").
9. **Iterate** (Phase 8): revise units that fail review; record each decision in the free-space register.

## The decision rules, in one place

| Level (dependence on print) | What the device attacks | Default move |
|---|---|---|
| **1** medium-specific | the material/phonetic body of language or the physical book | transpose the *function* with native materials (smoothness / magic circle / meta-dominant), or declare **non-transferable** |
| **2** high | big contracts: narrator trust, narrative levels, fiction contract, institution of print | **dialectical inversion** and/or **magic-circle reconfiguration** (the computer lacks the default that print breaks, so do the inverse) |
| **3** medium | temporal-causal sequence | **reconfigure discontinuity**: spatialize time into nodes, distribute perspectives, proceduralize repetition |
| **4** low | referential transparency (figures of speech) | **perceptual equivalence**: transfer the effect, not the figure |
| **5** zero | nothing: "colorless" writing whose force is the transparent event | **preserve the verbal text verbatim**, give it a sanctuary, add nothing |

Mapping aids: Barthes **nuclei → nodes and conditions**, **catalysts → tempo, navigation, friction**.

## Output standards

**Depth modes.** Choose from the request; state which you used.
- *Quick triage:* a unit table (unit, level, technique, native materials, main risk), the 3 to 5 decisions that matter most, and what will not transfer.
- *Full dossier:* media analysis, macro architecture, all unit cards, free-space register, non-transferables, failure review, honest limits (use the template).
- *Prototype:* the dossier for the units being built, plus a working vertical slice.
For a short text (a poem, one passage), do full cards but expect few units.

**Language.** Answer in the language of the user. For Persian users keep the Persian technical terms (with the English gloss from `references/01-theory-core.md` when useful). Quote the source sparingly: a short phrase per unit is enough; paraphrase the rest. Never reproduce long passages of a protected text.

**Format.** Tables for matrices (unit table, chains, free-space register), short prose for reasoning. Keep each unit card specific to its unit; generic theory belongs in the references, not pasted into cards.

## Rules of conduct (and why)

1. **Function over form.** The question is never "how do I show this device on screen?" but "what expectation did it break, and what is the equivalent expectation here?" Form-copying is the main source of failure (B).
2. **Always name the dominant.** A device is de-dominantizing only *relative to a dominant*. Without naming it, you cannot tell whether the device does anything.
3. **Do not decorate.** Graphics, sound or "interactivity" that does not break a protocol are failure A. Prefer *behavioral* intensity (rules, delay, state) to rendering intensity.
4. **Every input must change something in the system.** Narrative progress may be absent (loops and returns are legitimate), but "no system change" is failure D. Use a hidden state if needed.
5. **Build the interpretive pact before the disruption.** Friction without a frame is read as a bug (C). Coherence among reconfigurations matters as much as each one.
6. **Level-5 text stays as it is.** Adding image, sound or interaction to colorless writing only adds an interpretive layer.
7. **Declare non-transferability honestly.** A reasoned "this cannot be carried" (with what you tried and what is lost) is a valid result. Never fake an equivalent.
8. **Document every free-space decision** with options and consequences. Another competent modeler might decide differently; that is fine, hiding the choice is not.
9. **Do not overclaim.** The work designs *conditions* of literariness; it cannot guarantee the event. One transpassage tests the model; it does not prove a genre. Say this in the dossier.
10. **Separate what the model says from what you infer.** Where this skill's references mark *[extension]*, or you extrapolate (for example genre definition, accessibility alternatives, user testing), label it as your inference.
11. **Practical notes for Persian (and other right-to-left) works** *(practical advice, not part of the theory)*: reveal text by word or grapheme cluster rather than by code point so joined letters do not break; test fonts and right-to-left layout early; when a transposition relies on letter-level effects (such as incremental reveal for additive paronomasia), check that the script still reads correctly.
12. **Accessibility** *(practical advice)*: deliberate friction should never become a barrier with no way in. Provide a configurable alternative that preserves the *function* (for example a timing control), and document it in the free space.

## Building a prototype (only when asked)

- Default to a **single self-contained HTML file** (HTML + CSS + vanilla JS) unless the user names a platform; it runs anywhere and is easy to review.
- Implement the dossier, not a free redesign: one **unit registry** (id, function, status, handlers), a **global state object** (visible and hidden variables), and the **transition rules** from field 10. Put timing, thresholds and randomness bounds in a config block at the top so they can be tuned.
- Build the **vertical slice**: the unit(s) that most clearly carry the thesis (usually the opening unit that builds the interpretive threshold, one level-2 or level-3 unit, and one level-5 sanctuary), not the whole work.
- Add a toggleable **debug view** showing hidden variables so the user can check that inputs change the system (anti-D).
- Keep source text minimal or placeholder when the source is protected; use the user's own text only if they provide it.
- After building, review it with the four failure tests and say honestly what was not built.

## Reference map (load only what you need)

| File | Read it when |
|---|---|
| `references/01-theory-core.md` | first use; you need the definitions, the eight-node chain, why not "adaptation", the EN↔FA glossary |
| `references/02-dominants-catalog.md` | naming dominants/protocols in print and computer, choosing target dominants |
| `references/03-diagnosis-and-spectrum.md` | cutting the work into units, placing them on the five levels |
| `references/04-techniques.md` | choosing a technique, writing chains, routes and illustrations |
| `references/05-architecture.md` | the three pillars, macro design, paratext, the 12-field unit card, feedback loop |
| `references/06-evaluation-and-failures.md` | reviewing, declaring non-transferability, honest limits |
| `references/07-game-genre-framework.md` | the target is a game, or the user wants a genre framework (marked as extension) |
| `references/08-device-matrix.md` | you have a named rhetorical/narratological device and want a default placement |
| `references/09-worked-example.md` | you need a finished example of a card and macro level ("Three Drops of Blood") |
| `assets/unit-card-template.md`, `assets/dossier-template.md` | producing deliverables |

## Quality bar before you answer

- Every unit is an *event*, has a level, a named dominant and an equivalence chain whose function matches.
- No unit is justified by "it would look cool" or "it makes it interactive".
- Field 10 is written for every unit you present as designed.
- You listed what will not transfer and what remains uncertain.
- You stated your assumptions (audience, platform, depth) and which parts are your inference.
