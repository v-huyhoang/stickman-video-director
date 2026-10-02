# Local Web UI

For a detailed Vietnamese walkthrough with UI, CLI, ElevenLabs, subtitles, and
troubleshooting examples, see [Hướng dẫn sử dụng](huong-dan-su-dung.vi.md).

The local browser workspace uses Flask, installed into the repository-local
`.python-packages/` directory. It does not require a global Flask installation:

```bash
python3 -m pip install --target .python-packages -r requirements.txt
python3 app.py
```

Open `http://127.0.0.1:8765` in a browser. The UI stores project workspaces in
`.director-projects/` and delegates every state-changing workflow operation to
`bin/stickman-director.mjs`.

## Core Contract Preservation

- Creating a project writes a Phase A handoff only.
- The UI requires a pasted current Phase A proposal before the approval button
  becomes available.
- Approval is required before it creates the Phase B handoff.
- Subtitle export requires the approved project state and one narration
  paragraph per approved clip.
- External-voiceover projects retain music and ambient-SFX-only prompts; the UI
  never sends narration to the video model.

The Flask server binds only to `127.0.0.1`; it does not upload source material
or call Codex, Gemini, or ElevenLabs APIs.
