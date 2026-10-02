# Repository Guide

## Purpose

This repository ships the `directing-stickman-videos` Codex Skill. It turns
source material into an approved director's proposal and then a production
package of standalone English Gemini Omni Flash prompts for animated stickman
videos. It is a documentation-and-prompt-contract repository, not a runtime
application.

## Repository Map

- `skills/directing-stickman-videos/SKILL.md` is the authoritative behavior
  contract for the Skill.
- `skills/directing-stickman-videos/references/` holds the required Phase A
  storyboard, style, example, and Phase B Omni Flash prompt contracts.
- `skills/directing-stickman-videos/agents/openai.yaml` supplies the Skill's
  display metadata and default prompt.
- `README.md` and the localized `README.*.md` files are the public showcase
  and installation documentation.
- `assets/readme/` contains the media referenced by the READMEs; do not rename
  or remove assets without updating every affected README and validation.
- `tests/scenarios/` and `tests/evaluation-rubric.md` define behavior fixtures
  and acceptance criteria. `tests/verify-readmes.sh` validates the README
  contract.
- `docs/superpowers/specs/` and `docs/superpowers/plans/` are historical design
  and implementation context, not the current source of truth when they
  conflict with the Skill or tests.

## Skill Invariants

Treat these requirements in `SKILL.md` as non-negotiable when changing the
Skill, its references, examples, or public documentation:

1. Collect source material, aspect ratio (`16:9` or `9:16`), and visual
   style/theme before planning. Ask only for missing required inputs. Default
   an omitted duration to 60 seconds; duration must resolve to a 10-second
   multiple.
2. Produce Phase A in the user's language, including English voiceover and a
   reference translation. Use the five-stage narrative engine and exactly
   `duration / 10` storyboard rows, each with three timed beats and sufficient
   visual variety.
3. Stop Phase A and request explicit approval. Never emit Phase B production
   prompts before approval, even under time, cost, or client-pressure requests.
4. Any global revision (ratio, duration, style, theme, narration, scene
   structure, or overall direction) invalidates approval. Recompose Phase A
   with new staging/camera/text placement, then request approval again.
5. After approval, emit exactly one independently usable English prompt per
   ten-second clip. Preserve visual, narrator, audio, and transition continuity
   across the package while repeating necessary constraints in each prompt.
6. Preserve source meaning. Do not invent facts, statistics, quotations, or
   product claims. Keep generated visuals free of captions, subtitles, visible
   UI copy, and technical color notation; optional overlays belong only in
   separate post-production notes.
7. For factual topics, run the Research Review before Phase A. Extract factual
   claims, use authoritative sources, classify every load-bearing claim as
   supported, qualified, unresolved, or removed, and retain uncertainty in the
   script. Stop for user direction when research materially conflicts with the
   core source claim.

## Editing Guidance

- Read the relevant reference contract before changing output requirements:
  - Phase A/storyboards: `references/storyboard-template.md` and
    `references/style-catalog.md`.
  - Phase B production prompts: `references/omni-flash-prompt-contract.md`.
  - Factual research review: `references/research-review-contract.md`.
  - Concrete examples only: `references/examples.md`.
- Keep the cross-file contract synchronized. A behavior change commonly needs
  coordinated edits to `SKILL.md`, relevant reference files, scenarios/rubric,
  and every localized README that describes it.
- Do not weaken setup or approval gates just to accommodate scenario wording.
- Maintain the Style 1 accent-color and pure-light-canvas constraints, and the
  Style 2 Modern Beanie Zeke character-continuity wording.
- When editing READMEs, retain required `<!-- readme:... -->` markers, shared
  installation/link tokens, demo paths, and all language links. Keep localized
  versions semantically aligned; do not assume the default README language from
  old design docs—follow the current files and validator.
- Avoid unsupported marketing promises (for example, guaranteed viral results
  or views) and avoid personal/local identity data in public documentation.

## Validation

Run focused checks for the files changed:

```bash
bash tests/verify-readmes.sh
```

For Skill behavior changes, review the matching files in `tests/scenarios/`
against `tests/evaluation-rubric.md`. The repository has no automated model
response runner; record any manual scenario evaluation only when the task calls
for it.

## Change Hygiene

- Keep changes small and contract-driven; do not modify demo binaries unless
  the task explicitly requires regenerated media.
- Use UTF-8 Markdown and preserve the current heading, table, HTML-comment,
  and code-block conventions.
- Do not commit, rewrite history, or alter unrelated localization content.
