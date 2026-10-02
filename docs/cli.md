# Stickman Video Director CLI

For a detailed Vietnamese walkthrough with UI, CLI, ElevenLabs, subtitles, and
troubleshooting examples, see [Hướng dẫn sử dụng](huong-dan-su-dung.vi.md).

`stickman-director` is a local-first project workspace for the
`directing-stickman-videos` Skill. It does not replace the Skill, call a video
model, or bypass approval. Instead, it stores the source and settings, creates
handoff prompts for Codex, tracks approval, and creates draft subtitle files
from approved narration.

## Install

From this repository:

```bash
npm install
npm link
```

Or run it without linking:

```bash
node bin/stickman-director.mjs --help
```

## Workflow

### 1. Initialize a project

```bash
stickman-director init projects/strasbourg \
  --source-file notes.txt \
  --aspect 9:16 \
  --duration 60 \
  --theme light \
  --external-voiceover
```

The command creates `projects/strasbourg/.stickman-video/` with `project.json`,
the source, and `phase-a-request.md`.

### 2. Create and capture Phase A

Copy `phase-a-request.md` into Codex. Save the returned director's proposal to
a local Markdown file, then capture it:

```bash
stickman-director capture-phase-a projects/strasbourg phase-a.md
```

### 3. Approve and create the Phase B handoff

Only run this after explicitly approving the captured proposal:

```bash
stickman-director approve projects/strasbourg
stickman-director phase-b projects/strasbourg
```

Copy `.stickman-video/phase-b-request.md` into Codex to create the production
prompts. In external-voiceover mode, those prompts require music and ambient
SFX only; narration remains an editor-only cue.

### 4. Create subtitles

Put the approved narration into a UTF-8 text file with one paragraph per
10-second clip. Then create a draft subtitle file:

```bash
stickman-director subtitle projects/strasbourg \
  --transcript narration.en.txt \
  --format srt
```

The generated `.srt` stays inside approved clip boundaries. Retiming it against
the final ElevenLabs or human voice recording is still required before release.

## Commands

```text
init <project-dir>                 Create a workflow project and Phase A handoff.
phase-a <project-dir>              Regenerate the Phase A handoff.
capture-phase-a <dir> <file>       Save the current Phase A proposal.
approve <project-dir>              Unlock the Phase B handoff.
phase-b <project-dir>              Create the Phase B handoff.
subtitle <dir> --transcript <file> Create a draft .srt or .vtt.
status <project-dir>               Show project state and artifact paths.
```
