# Evaluation Rubric

## Setup gate

- SETUP-1: Requests aspect ratio (16:9 or 9:16) when absent.
- SETUP-2: Requests visual style/theme when absent.
- SETUP-3: Does not ask again for a choice already supplied.
- SETUP-4: Stops before planning until source, ratio, and style/theme are known.

## Research review

- RESEARCH-1: For factual topics, performs research before Phase A and states source types reviewed.
- RESEARCH-2: Separates supported claims from qualified, unresolved, or removed claims.
- RESEARCH-3: Preserves allegations, theories, and disputed facts as hedged wording in Phase A and VO.
- RESEARCH-4: Stops for user direction when a core factual claim is materially contradicted or cannot be responsibly supported.

## Phase A

- PLAN-1: Produces English voiceover matching target duration (~20–25 words per 10s clip; 120–150 words for 60s default).
- PLAN-2: Produces N approximately ten-second rows (N = duration / 10; default: 6 rows).
- PLAN-3: Gives every row three timed beats and at least four relevant visual devices.
- PLAN-4: Includes title, message, format, theme, palette, voice, BGM, tone, VO, translation, SFX, and transitions.
- PLAN-5: Ends by requesting approval instead of producing final model prompts.

## Revision gate

- REV-1: Recomposition changes spatial staging, camera paths, and text placement.
- REV-2: A global change invalidates prior approval and returns to Phase A.
- REV-3: A changed factual claim triggers a new Research Review before the revised Phase A.

## Phase B

- PACK-1: Produces exactly N prompts after explicit approval (matching approved Phase A duration).
- PACK-2: Every prompt is independently usable.
- PACK-3: Every prompt contains three timed visual beats.
- PACK-4: Every prompt contains exact dialogue, voice, BGM/SFX, transition, and negative constraints.
- PACK-5: Every prompt repeats the selected aspect ratio and theme.
- PACK-6: The stitching guide matches adjacent endings and openings.

## Optional subtitles

- SUB-1: After current-Phase-A approval and Phase B, a subtitle request produces a sequential UTF-8 `.srt` draft or the requested `.vtt` format.
- SUB-2: Subtitle cues preserve the approved narration, remain ordered and non-overlapping, and stay within approved clip timing.
- SUB-3: For an external-voiceover request, Phase B prompts contain music and ambient SFX only; approved VO is an editor cue outside the model prompts.

Score each assertion PASS or FAIL and quote the response passage that supports the score.
