import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';

const cli = new URL('../bin/stickman-director.mjs', import.meta.url).pathname;

function run(...args) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
}

test('keeps the Phase B approval gate and creates a subtitle draft', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'stickman-director-'));
  const project = join(directory, 'strasbourg');
  const proposal = join(directory, 'phase-a.md');
  const transcript = join(directory, 'narration.txt');

  let result = run(
    'init', project,
    '--source', 'A small action can interrupt a loop of hesitation.',
    '--aspect', '9:16',
    '--duration', '30',
    '--theme', 'light',
    '--external-voiceover'
  );
  assert.equal(result.status, 0, result.stderr);

  result = run('phase-b', project);
  assert.equal(result.status, 1);

  await writeFile(proposal, '# Phase A\nApproved proposal text.\n', 'utf8');
  result = run('capture-phase-a', project, proposal);
  assert.equal(result.status, 0, result.stdout);
  result = run('approve', project);
  assert.equal(result.status, 0, result.stdout);
  result = run('phase-b', project);
  assert.equal(result.status, 0, result.stdout);

  const phaseB = await readFile(join(project, '.stickman-video', 'phase-b-request.md'), 'utf8');
  assert.match(phaseB, /music and ambient SFX only/);
  assert.match(phaseB, /Do not generate narration/);

  await writeFile(transcript, [
    'One small action starts the change. Keep moving.',
    'The loop weakens when action begins. Try again.',
    'A tiny step can reset the whole pattern. What will you start?'
  ].join('\n\n'), 'utf8');
  result = run('subtitle', project, '--transcript', transcript);
  assert.equal(result.status, 0, result.stdout);

  const subtitle = await readFile(join(project, '.stickman-video', 'subtitles.srt'), 'utf8');
  assert.match(subtitle, /^1\n00:00:00,000 -->/);
  assert.match(subtitle, /What will you start\?/);
});
