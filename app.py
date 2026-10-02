#!/usr/bin/env python3
"""Flask UI for the local Stickman Video Director workflow."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VENDOR_ROOT = ROOT / ".python-packages"
if VENDOR_ROOT.is_dir():
    sys.path.insert(0, str(VENDOR_ROOT))

from flask import Flask, jsonify, request, send_from_directory

STATIC_ROOT = ROOT / "static"
PROJECTS_ROOT = ROOT / ".director-projects"
CLI = ROOT / "bin" / "stickman-director.mjs"
PROJECT_ID_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-]{0,62}$")
VALID_ASPECTS = {"16:9", "9:16"}
VALID_STYLES = {"classic", "modern-studio-tech", "cinematic-story"}
VALID_THEMES = {"light", "dark"}
VALID_SUBTITLE_FORMATS = {"srt", "vtt"}

app = Flask(__name__, static_folder=None)


class ApiError(ValueError):
    """An expected user-facing API validation failure."""


def read_json() -> dict:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise ApiError("Request body must be a JSON object.")
    return payload


def validate_project_payload(payload: dict) -> dict:
    project_id = str(payload.get("projectId", "")).strip().lower()
    source = str(payload.get("source", "")).strip()
    aspect = payload.get("aspect")
    duration = payload.get("duration", 60)
    style = payload.get("style", "classic")
    theme = payload.get("theme")
    subtitle_format = payload.get("subtitleFormat", "srt")

    if not PROJECT_ID_PATTERN.fullmatch(project_id):
        raise ApiError("Project name must use lowercase letters, numbers, and single hyphens.")
    if not source:
        raise ApiError("Source copy or notes are required.")
    if aspect not in VALID_ASPECTS:
        raise ApiError("Choose 16:9 or 9:16.")
    if not isinstance(duration, int) or duration <= 0 or duration % 10 != 0:
        raise ApiError("Duration must be a positive multiple of 10 seconds.")
    if style not in VALID_STYLES:
        raise ApiError("Choose a supported visual style.")
    if style == "classic" and theme not in VALID_THEMES:
        raise ApiError("Classic style requires a light or dark theme.")
    if style != "classic" and theme:
        raise ApiError("Theme only applies to Classic style.")
    if subtitle_format not in VALID_SUBTITLE_FORMATS:
        raise ApiError("Subtitle format must be srt or vtt.")

    return {
        "projectId": project_id,
        "source": source,
        "aspect": aspect,
        "duration": duration,
        "style": style,
        "theme": theme,
        "externalVoiceover": bool(payload.get("externalVoiceover", False)),
        "subtitleFormat": subtitle_format,
    }


def project_directory(project_id: str) -> Path:
    if not PROJECT_ID_PATTERN.fullmatch(project_id):
        raise ApiError("Invalid project identifier.")
    return PROJECTS_ROOT / project_id


def state_path(project_id: str) -> Path:
    return project_directory(project_id) / ".stickman-video" / "project.json"


def load_state(project_id: str) -> dict:
    path = state_path(project_id)
    if not path.is_file():
        raise ApiError("Project not found.")
    return json.loads(path.read_text(encoding="utf-8"))


def read_artifact(project_id: str, name: str) -> str | None:
    path = project_directory(project_id) / ".stickman-video" / name
    return path.read_text(encoding="utf-8") if path.is_file() else None


def run_cli(arguments: list[str]) -> str:
    completed = subprocess.run(
        ["node", str(CLI), *arguments],
        cwd=ROOT,
        check=False,
        text=True,
        capture_output=True,
    )
    if completed.returncode != 0:
        raise ApiError((completed.stderr or completed.stdout or "CLI command failed.").strip())
    return completed.stdout.strip()


def project_summary(project_id: str) -> dict:
    state = load_state(project_id)
    workspace = project_directory(project_id) / ".stickman-video"
    try:
        workspace_label = str(workspace.relative_to(ROOT))
    except ValueError:
        workspace_label = str(workspace)
    return {
        "id": project_id,
        "state": state,
        "phaseARequest": read_artifact(project_id, "phase-a-request.md"),
        "phaseA": read_artifact(project_id, "phase-a.md"),
        "phaseBRequest": read_artifact(project_id, "phase-b-request.md"),
        "subtitle": read_artifact(project_id, f"subtitles.{state['settings']['subtitleFormat']}"),
        "workspace": workspace_label,
    }


@app.errorhandler(ApiError)
def handle_api_error(error: ApiError):
    return jsonify(error=str(error)), 400


@app.get("/")
def index():
    return send_from_directory(STATIC_ROOT, "index.html")


@app.get("/static/<path:asset>")
def static_asset(asset: str):
    return send_from_directory(STATIC_ROOT, asset)


@app.get("/api/projects")
def list_projects():
    PROJECTS_ROOT.mkdir(exist_ok=True)
    projects = []
    for directory in sorted(PROJECTS_ROOT.iterdir()):
        if directory.is_dir() and (directory / ".stickman-video" / "project.json").is_file():
            state = json.loads((directory / ".stickman-video" / "project.json").read_text(encoding="utf-8"))
            projects.append({
                "id": directory.name,
                "phase": state["phase"],
                "duration": state["settings"]["duration"],
                "aspect": state["settings"]["aspect"],
            })
    return jsonify(projects=projects)


@app.get("/api/projects/<project_id>")
def get_project(project_id: str):
    return jsonify(project_summary(project_id))


@app.post("/api/projects")
def create_project():
    payload = validate_project_payload(read_json())
    directory = project_directory(payload["projectId"])
    if state_path(payload["projectId"]).exists():
        raise ApiError("A project with this name already exists.")

    arguments = [
        "init", str(directory),
        "--source", payload["source"],
        "--aspect", payload["aspect"],
        "--duration", str(payload["duration"]),
        "--style", payload["style"],
        "--subtitle-format", payload["subtitleFormat"],
    ]
    if payload["theme"]:
        arguments.extend(["--theme", payload["theme"]])
    if payload["externalVoiceover"]:
        arguments.append("--external-voiceover")
    run_cli(arguments)
    return jsonify(project_summary(payload["projectId"])), 201


@app.post("/api/projects/<project_id>/phase-a")
def refresh_phase_a(project_id: str):
    run_cli(["phase-a", str(project_directory(project_id))])
    return jsonify(project_summary(project_id))


@app.post("/api/projects/<project_id>/capture-phase-a")
def capture_phase_a(project_id: str):
    proposal = str(read_json().get("proposal", "")).strip()
    if not proposal:
        raise ApiError("Paste the current Phase A proposal before capturing it.")
    temporary_file = project_directory(project_id) / ".stickman-video" / "phase-a-paste.md"
    temporary_file.parent.mkdir(parents=True, exist_ok=True)
    temporary_file.write_text(proposal + "\n", encoding="utf-8")
    try:
        run_cli(["capture-phase-a", str(project_directory(project_id)), str(temporary_file)])
    finally:
        temporary_file.unlink(missing_ok=True)
    return jsonify(project_summary(project_id))


@app.post("/api/projects/<project_id>/approve")
def approve(project_id: str):
    run_cli(["approve", str(project_directory(project_id))])
    return jsonify(project_summary(project_id))


@app.post("/api/projects/<project_id>/phase-b")
def create_phase_b(project_id: str):
    run_cli(["phase-b", str(project_directory(project_id))])
    return jsonify(project_summary(project_id))


@app.post("/api/projects/<project_id>/subtitle")
def create_subtitle(project_id: str):
    transcript = str(read_json().get("transcript", "")).strip()
    if not transcript:
        raise ApiError("Paste approved narration with one paragraph per clip.")
    state = load_state(project_id)
    temporary_file = project_directory(project_id) / ".stickman-video" / "narration.en.txt"
    temporary_file.write_text(transcript + "\n", encoding="utf-8")
    run_cli([
        "subtitle", str(project_directory(project_id)),
        "--transcript", str(temporary_file),
        "--format", state["settings"]["subtitleFormat"],
    ])
    return jsonify(project_summary(project_id))


def main() -> None:
    PROJECTS_ROOT.mkdir(exist_ok=True)
    app.run(host="127.0.0.1", port=8765, debug=False)


if __name__ == "__main__":
    main()
