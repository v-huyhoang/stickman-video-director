#!/usr/bin/env node

import { readFile, mkdir, writeFile, access, copyFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';

const STATE_DIRECTORY = '.stickman-video';
const STATE_FILE = 'project.json';
const VALID_ASPECTS = new Set(['16:9', '9:16']);
const VALID_STYLES = new Set(['classic', 'modern-studio-tech', 'cinematic-story']);
const VALID_THEMES = new Set(['light', 'dark']);
const VALID_SUBTITLE_FORMATS = new Set(['srt', 'vtt']);

function fail(message) {
  throw new Error(message);
}

function print(message = '') {
  output.write(`${message}\n`);
}

function printError(message) {
  process.stderr.write(`${message}\n`);
}

function usage() {
  return `Stickman Video Director CLI

Usage:
  stickman-director init <project-dir> [options]
  stickman-director phase-a <project-dir>
  stickman-director capture-phase-a <project-dir> <proposal-file>
  stickman-director approve <project-dir>
  stickman-director phase-b <project-dir>
  stickman-director subtitle <project-dir> --transcript <file> [--format srt|vtt]
  stickman-director status <project-dir>

Init options:
  --source <text>                 Source copy or notes
  --source-file <file>            Read source copy or notes from a UTF-8 file
  --aspect <16:9|9:16>            Required aspect ratio
  --duration <seconds>            Multiple of 10; defaults to 60
  --style <classic|modern-studio-tech|cinematic-story>
  --theme <light|dark>            Required for classic style
  --external-voiceover            Keep generated clips to music and ambient SFX only
  --subtitle-format <srt|vtt>     Defaults to srt

The CLI preserves the core Skill workflow: it creates handoff files for Codex,
requires a captured Phase A before approval, and never generates Gemini prompts itself.`;
}

function parseOptions(tokens) {
  const options = {};
  const positionals = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }

    const key = token.slice(2);
    if (key === 'external-voiceover') {
      options.externalVoiceover = true;
      continue;
    }

    const value = tokens[index + 1];
    if (!value || value.startsWith('--')) {
      fail(`Missing value for --${key}.`);
    }
    options[key] = value;
    index += 1;
  }

  return { options, positionals };
}

function normalizeDuration(value) {
  const duration = Number(value ?? 60);
  if (!Number.isInteger(duration) || duration <= 0 || duration % 10 !== 0) {
    fail('Duration must be a positive multiple of 10 seconds.');
  }
  return duration;
}

function normalizeSettings(options) {
  const aspect = options.aspect;
  const style = options.style ?? (options.theme ? 'classic' : undefined);
  const theme = options.theme;

  if (!VALID_ASPECTS.has(aspect)) {
    fail('Provide --aspect 16:9 or --aspect 9:16.');
  }
  if (!VALID_STYLES.has(style)) {
    fail('Provide --style classic, modern-studio-tech, or cinematic-story.');
  }
  if (style === 'classic' && !VALID_THEMES.has(theme)) {
    fail('Classic style requires --theme light or --theme dark.');
  }
  if (style !== 'classic' && theme) {
    fail('--theme is only valid with --style classic.');
  }
  if (options['subtitle-format'] && !VALID_SUBTITLE_FORMATS.has(options['subtitle-format'])) {
    fail('Subtitle format must be srt or vtt.');
  }

  return {
    aspect,
    duration: normalizeDuration(options.duration),
    style,
    theme: theme ?? null,
    externalVoiceover: Boolean(options.externalVoiceover),
    subtitleFormat: options['subtitle-format'] ?? 'srt'
  };
}

async function pathExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function workspacePath(projectDirectory) {
  return resolve(projectDirectory, STATE_DIRECTORY);
}

function filePath(projectDirectory, fileName) {
  return resolve(workspacePath(projectDirectory), fileName);
}

async function writeProjectFile(projectDirectory, fileName, content) {
  await mkdir(workspacePath(projectDirectory), { recursive: true });
  await writeFile(filePath(projectDirectory, fileName), content, 'utf8');
}

async function readState(projectDirectory) {
  const statePath = filePath(projectDirectory, STATE_FILE);
  if (!(await pathExists(statePath))) {
    fail(`No Stickman Video Director project exists in ${resolve(projectDirectory)}. Run init first.`);
  }
  return JSON.parse(await readFile(statePath, 'utf8'));
}

async function saveState(projectDirectory, state) {
  await writeProjectFile(projectDirectory, STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
}

function styleLabel(settings) {
  if (settings.style === 'classic') {
    return `Style 1 Classic ${settings.theme === 'light' ? 'Light' : 'Dark'}`;
  }
  return settings.style === 'modern-studio-tech'
    ? 'Style 2A Modern Studio Tech'
    : 'Style 2B Cinematic Story';
}

function phaseARequest(state) {
  const voiceoverLine = state.settings.externalVoiceover
    ? 'Use an external post-production voiceover. Keep generated clips to music and ambient SFX only; do not generate speech or dialogue.'
    : 'Use generated audio voiceover according to the core Skill contract.';

  return `# Phase A Request\n\nUse $directing-stickman-videos to turn this source into an English stickman video.\n\nSource:\n${state.source}\n\nAspect ratio: ${state.settings.aspect}\nDuration: ${state.settings.duration}s\nStyle: ${styleLabel(state.settings)}\n${voiceoverLine}\nSubtitle deliverable: ${state.settings.subtitleFormat.toUpperCase()} draft after Phase B.\n\nCreate Phase A only. Stop and request my explicit approval before producing Gemini Omni Flash prompts or subtitle files.\n`;
}

function phaseBRequest(state) {
  const audioLine = state.settings.externalVoiceover
    ? 'Use music and ambient SFX only in every generated clip. Do not generate narration, dialogue, vocals, speech bubbles, dialogue boxes, captions, or visible text. Keep approved VO only as editor cues outside model prompts.'
    : 'Use the approved audio voiceover and continuity locks from the current Skill contract.';

  return `# Phase B Request\n\nUse $directing-stickman-videos. The current Phase A in .stickman-video/phase-a.md is approved.\n\nProduce exactly ${state.settings.duration / 10} standalone Gemini Omni Flash prompts for the approved ${state.settings.duration}s, ${state.settings.aspect}, ${styleLabel(state.settings)} proposal.\n${audioLine}\n\nAfter Phase B, create a draft ${state.settings.subtitleFormat.toUpperCase()} subtitle package from the approved narration and clip timing. Keep subtitles as post-production assets, never as visible text in model prompts.\n`;
}

async function ask(question) {
  const terminal = createInterface({ input, output });
  try {
    return (await terminal.question(question)).trim();
  } finally {
    terminal.close();
  }
}

async function resolveSource(options) {
  if (options.source && options['source-file']) {
    fail('Use either --source or --source-file, not both.');
  }
  if (options.source) {
    return options.source.trim();
  }
  if (options['source-file']) {
    return (await readFile(resolve(options['source-file']), 'utf8')).trim();
  }
  if (!input.isTTY) {
    fail('Provide --source or --source-file when not running interactively.');
  }
  return ask('Source copy or notes: ');
}

async function initProject(projectDirectory, options) {
  const source = await resolveSource(options);
  if (!source) {
    fail('Source copy or notes cannot be empty.');
  }

  const settings = normalizeSettings(options);
  const statePath = filePath(projectDirectory, STATE_FILE);
  if (await pathExists(statePath)) {
    fail(`A project already exists in ${resolve(projectDirectory)}. Choose a different directory or remove its .stickman-video folder.`);
  }

  const state = {
    version: 1,
    phase: 'draft',
    source,
    settings,
    artifacts: {
      phaseA: null,
      phaseB: null,
      subtitles: null
    }
  };

  await saveState(projectDirectory, state);
  await writeProjectFile(projectDirectory, 'source.md', `${source}\n`);
  await writeProjectFile(projectDirectory, 'phase-a-request.md', phaseARequest(state));
  print(`Created project: ${resolve(projectDirectory)}`);
  print(`Next: copy .stickman-video/phase-a-request.md into Codex, then save the response and run capture-phase-a.`);
}

async function capturePhaseA(projectDirectory, proposalFile) {
  const state = await readState(projectDirectory);
  if (state.phase !== 'draft') {
    fail(`Cannot capture Phase A while project phase is ${state.phase}.`);
  }

  const sourcePath = resolve(proposalFile);
  if (!(await pathExists(sourcePath))) {
    fail(`Phase A proposal file not found: ${sourcePath}`);
  }
  const proposal = await readFile(sourcePath, 'utf8');
  if (!proposal.trim()) {
    fail('Phase A proposal file is empty.');
  }

  await copyFile(sourcePath, filePath(projectDirectory, 'phase-a.md'));
  state.phase = 'awaiting_approval';
  state.artifacts.phaseA = 'phase-a.md';
  await saveState(projectDirectory, state);
  print('Captured Phase A. Review it, then run approve when you explicitly approve the current proposal.');
}

async function approveProject(projectDirectory) {
  const state = await readState(projectDirectory);
  if (state.phase !== 'awaiting_approval') {
    fail('Approval requires a captured Phase A in awaiting_approval state.');
  }
  if (!(await pathExists(filePath(projectDirectory, 'phase-a.md')))) {
    fail('Missing .stickman-video/phase-a.md. Capture the current proposal before approval.');
  }

  state.phase = 'approved';
  await saveState(projectDirectory, state);
  await writeProjectFile(projectDirectory, 'phase-b-request.md', phaseBRequest(state));
  print('Phase A approved. Next: use .stickman-video/phase-b-request.md in Codex.');
}

async function createPhaseBRequest(projectDirectory) {
  const state = await readState(projectDirectory);
  if (state.phase !== 'approved' && state.phase !== 'phase_b_ready') {
    fail('Phase B requires explicit approval of the captured Phase A.');
  }
  await writeProjectFile(projectDirectory, 'phase-b-request.md', phaseBRequest(state));
  state.phase = 'phase_b_ready';
  state.artifacts.phaseB = 'phase-b-request.md';
  await saveState(projectDirectory, state);
  print('Phase B handoff is ready at .stickman-video/phase-b-request.md.');
}

function splitSentences(text) {
  return text.trim().match(/[^.!?]+[.!?]+(?:[””'"']+)?|[^.!?]+$/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
}

function wrapCaption(text, maximumLength = 42) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maximumLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function timestamp(milliseconds, format) {
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const seconds = Math.floor((milliseconds % 60_000) / 1_000);
  const remainder = milliseconds % 1_000;
  const separator = format === 'vtt' ? '.' : ',';
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}${separator}${String(remainder).padStart(3, '0')}`;
}

function captionCues(paragraphs, duration) {
  const clipDuration = duration * 1_000;
  return paragraphs.flatMap((paragraph, clipIndex) => {
    const sentences = splitSentences(paragraph);
    if (sentences.length === 0) {
      fail(`Narration paragraph ${clipIndex + 1} is empty.`);
    }
    const weights = sentences.map((sentence) => sentence.split(/\s+/).length);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let cursor = clipIndex * clipDuration;

    return sentences.map((sentence, sentenceIndex) => {
      const isLast = sentenceIndex === sentences.length - 1;
      const allocation = isLast
        ? (clipIndex + 1) * clipDuration - cursor
        : Math.max(900, Math.round((weights[sentenceIndex] / totalWeight) * clipDuration));
      const start = cursor;
      const end = Math.min((clipIndex + 1) * clipDuration, cursor + allocation);
      cursor = end;
      return { start, end, lines: wrapCaption(sentence) };
    });
  });
}

function serializeSubtitles(cues, format) {
  const blocks = cues.map((cue, index) => {
    const timing = `${timestamp(cue.start, format)} --> ${timestamp(cue.end, format)}`;
    return format === 'vtt'
      ? `${timing}\n${cue.lines.join('\n')}`
      : `${index + 1}\n${timing}\n${cue.lines.join('\n')}`;
  });
  return `${format === 'vtt' ? 'WEBVTT\n\n' : ''}${blocks.join('\n\n')}\n`;
}

async function createSubtitles(projectDirectory, options) {
  const state = await readState(projectDirectory);
  if (state.phase !== 'approved' && state.phase !== 'phase_b_ready') {
    fail('Subtitle generation requires an approved Phase A and Phase B handoff.');
  }
  if (!options.transcript) {
    fail('Subtitle generation requires --transcript <approved-narration-file>.');
  }
  const format = options.format ?? state.settings.subtitleFormat;
  if (!VALID_SUBTITLE_FORMATS.has(format)) {
    fail('Subtitle format must be srt or vtt.');
  }

  const transcript = await readFile(resolve(options.transcript), 'utf8');
  const paragraphs = transcript.trim().split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const expectedParagraphs = state.settings.duration / 10;
  if (paragraphs.length !== expectedParagraphs) {
    fail(`Transcript must contain exactly ${expectedParagraphs} non-empty paragraphs, one per approved clip.`);
  }

  const content = serializeSubtitles(captionCues(paragraphs, 10), format);
  const destination = `subtitles.${format}`;
  await writeProjectFile(projectDirectory, destination, content);
  state.artifacts.subtitles = destination;
  await saveState(projectDirectory, state);
  print(`Created draft subtitle file: .stickman-video/${destination}`);
  print('Review timestamps against the final recorded voiceover before publishing.');
}

async function status(projectDirectory) {
  const state = await readState(projectDirectory);
  print(`Project: ${resolve(projectDirectory)}`);
  print(`Phase: ${state.phase}`);
  print(`Format: ${state.settings.aspect}, ${state.settings.duration}s, ${styleLabel(state.settings)}`);
  print(`External voiceover: ${state.settings.externalVoiceover ? 'yes' : 'no'}`);
  print(`Subtitle format: ${state.settings.subtitleFormat}`);
  print(`Artifacts: ${Object.entries(state.artifacts).filter(([, value]) => value).map(([key, value]) => `${key}=${value}`).join(', ') || 'none'}`);
}

async function main() {
  const [command, ...tokens] = process.argv.slice(2);
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    print(usage());
    return;
  }

  const { options, positionals } = parseOptions(tokens);
  try {
    switch (command) {
      case 'init':
        if (positionals.length !== 1) fail('init requires exactly one <project-dir>.');
        await initProject(positionals[0], options);
        break;
      case 'phase-a': {
        if (positionals.length !== 1) fail('phase-a requires exactly one <project-dir>.');
        const state = await readState(positionals[0]);
        await writeProjectFile(positionals[0], 'phase-a-request.md', phaseARequest(state));
        print('Phase A handoff is ready at .stickman-video/phase-a-request.md.');
        break;
      }
      case 'capture-phase-a':
        if (positionals.length !== 2) fail('capture-phase-a requires <project-dir> and <proposal-file>.');
        await capturePhaseA(positionals[0], positionals[1]);
        break;
      case 'approve':
        if (positionals.length !== 1) fail('approve requires exactly one <project-dir>.');
        await approveProject(positionals[0]);
        break;
      case 'phase-b':
        if (positionals.length !== 1) fail('phase-b requires exactly one <project-dir>.');
        await createPhaseBRequest(positionals[0]);
        break;
      case 'subtitle':
        if (positionals.length !== 1) fail('subtitle requires exactly one <project-dir>.');
        await createSubtitles(positionals[0], options);
        break;
      case 'status':
        if (positionals.length !== 1) fail('status requires exactly one <project-dir>.');
        await status(positionals[0]);
        break;
      default:
        fail(`Unknown command: ${command}.\n\n${usage()}`);
    }
  } catch (error) {
    printError(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

await main();
