# Subtitle Package Contract

Use this reference only after the current Phase A is approved and Phase B has
been delivered, when the user requests subtitles, captions, an `.srt`, a
`.vtt`, or external narration.

## Inputs

Use only:

- the approved narration, including its language and exact wording;
- the approved duration and clip boundaries;
- the user's requested subtitle language, format, and any supplied final
  voiceover timing.

If the user has not specified a subtitle language, use the narration language.
If the user has not supplied final audio timing, create a **draft** timing plan
from the approved clip boundaries and clearly label it for editorial review.
Never transcribe or translate beyond the approved narration without asking.

## Deliverables

Provide, in this order:

1. A short timing note identifying whether timings are draft or aligned to
   final voiceover audio.
2. A UTF-8 `.srt` code block by default. Provide `.vtt` only when requested.
3. A concise post-production styling note.

Do not place the subtitle file inside a Gemini Omni Flash prompt. It is an
editor asset to import after video generation.

## SRT Rules

- Use sequential cue numbers beginning at `1`.
- Use `HH:MM:SS,mmm --> HH:MM:SS,mmm` timestamps.
- Keep every cue inside its approved clip's time range; never overlap cues.
- Divide narration into readable phrases, usually one or two lines per cue.
- Prefer no more than two displayed lines and roughly 42 characters per line;
  adjust naturally for the target language rather than breaking names or words.
- Preserve names, hedging, numbers, and punctuation from the approved
  narration. Do not add claims or normalize uncertainty away.
- Cover every approved narration passage in order. Do not introduce subtitles
  for audio that is not present in the approved script.

## External Voiceover Mode

When the user will record or synthesize voice externally:

- Generate no voice, dialogue, or vocal sounds in Phase B prompts.
- Use the approved narration as an editor-only cue and as the subtitle source.
- If the final recorded delivery changes timing, retime cue boundaries without
  changing the approved words unless the user approves a script revision.
- Recommend creating automatic captions from the final voice track, then
  replacing the generated text with the supplied `.srt` wording where needed.

## Post-Production Style Note

Recommend readable sans-serif captions, a maximum of two lines, high contrast,
and placement inside the platform-safe lower area without covering the
subject's key action. Caption styling is an editing decision; it must not alter
the selected video-generation style or introduce visible text into model prompts.
