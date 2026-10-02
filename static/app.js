const state = { project: null, artifactMode: null };

const setupForm = document.querySelector('#setup');
const styleSelect = document.querySelector('#style');
const themeField = document.querySelector('#theme-field');
const feedback = document.querySelector('#form-feedback');
const projectContent = document.querySelector('#project-content');
const emptyState = document.querySelector('#empty-state');
const artifactPanel = document.querySelector('#artifact-panel');
const artifactContent = document.querySelector('#artifact-content');
const projectPicker = document.querySelector('#project-picker');

function api(path, options = {}) {
  return fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  }).then(async (response) => {
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Request failed.');
    return body;
  });
}

function setFeedback(message = '', kind = '') {
  feedback.textContent = message;
  feedback.className = `feedback ${kind}`;
}

function setThemeAvailability() {
  const isClassic = styleSelect.value === 'classic';
  themeField.hidden = !isClassic;
  themeField.querySelector('select').disabled = !isClassic;
}

function phaseLabel(phase) {
  return phase.replaceAll('_', ' ');
}

function renderWorkflow(phase) {
  const stageByPhase = {
    draft: 0,
    awaiting_approval: 1,
    approved: 2,
    phase_b_ready: 3,
  };
  const activeStage = stageByPhase[phase] ?? 0;
  document.querySelectorAll('[data-stage]').forEach((element, index) => {
    element.classList.toggle('active', index === activeStage);
    element.classList.toggle('complete', index < activeStage);
  });
}

function setButtonState(buttonId, enabled) {
  document.querySelector(buttonId).disabled = !enabled;
}

function renderTimeline(duration) {
  const timeline = document.querySelector('#timeline');
  const template = document.querySelector('#timeline-item-template');
  timeline.replaceChildren();
  for (let clip = 0; clip < duration / 10; clip += 1) {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector('.timeline-time').textContent = `${String(clip * 10).padStart(2, '0')}–${String((clip + 1) * 10).padStart(2, '0')}s`;
    fragment.querySelector('.timeline-label').textContent = `Clip ${clip + 1}`;
    timeline.append(fragment);
  }
}

function renderProject(project) {
  state.project = project;
  const { settings } = project.state;
  document.querySelector('#project-title').textContent = project.id;
  document.querySelector('#project-phase').textContent = phaseLabel(project.state.phase);
  document.querySelector('#project-phase').classList.toggle('muted', project.state.phase === 'draft');
  renderWorkflow(project.state.phase);
  document.querySelector('#project-meta').innerHTML = [
    ['Format', `${settings.aspect} · ${settings.duration}s`],
    ['Style', settings.style.replaceAll('-', ' ')],
    ['Audio', settings.externalVoiceover ? 'External voiceover' : 'Generated voiceover'],
    ['Subtitle', settings.subtitleFormat.toUpperCase()],
    ['Workspace', project.workspace],
  ].map(([term, detail]) => `<dt>${term}</dt><dd>${detail}</dd>`).join('');
  renderTimeline(settings.duration);

  emptyState.hidden = true;
  projectContent.hidden = false;
  const hasPhaseA = Boolean(project.phaseA);
  const isAwaitingApproval = project.state.phase === 'awaiting_approval';
  const hasApproval = ['approved', 'phase_b_ready'].includes(project.state.phase);
  setButtonState('#open-phase-a', true);
  setButtonState('#capture-phase-a', project.state.phase === 'draft');
  setButtonState('#approve-phase-a', isAwaitingApproval && hasPhaseA);
  setButtonState('#open-phase-b', hasApproval);
  setButtonState('#create-subtitle', hasApproval);
  projectPicker.value = project.id;
}

async function loadProjects() {
  try {
    const { projects } = await api('/api/projects');
    const selectedProject = projectPicker.value;
    projectPicker.replaceChildren(new Option('Select a project', ''));
    for (const project of projects) {
      projectPicker.add(new Option(`${project.id} · ${phaseLabel(project.phase)}`, project.id));
    }
    projectPicker.value = selectedProject;
  } catch (error) {
    setFeedback(error.message, 'error');
  }
}

function showArtifact({ kicker, title, description, content, actions = [] }) {
  state.artifactMode = { kicker, title, description };
  document.querySelector('#artifact-kicker').textContent = kicker;
  document.querySelector('#artifact-title').textContent = title;
  document.querySelector('#artifact-description').textContent = description;
  artifactContent.value = content || '';
  const actionContainer = document.querySelector('#artifact-actions');
  actionContainer.replaceChildren();
  for (const action of actions) {
    const button = document.createElement('button');
    button.className = `button ${action.primary ? 'primary' : 'secondary'}`;
    button.type = 'button';
    button.textContent = action.label;
    button.addEventListener('click', action.onClick);
    actionContainer.append(button);
  }
  artifactPanel.hidden = false;
  artifactPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showPhaseA() {
  showArtifact({
    kicker: '02 · Phase A',
    title: 'Copy the Research + Phase A request',
    description: 'For factual topics, the core Skill performs a Research Review before the director proposal. Paste the reviewed proposal back here before approval.',
    content: state.project.phaseARequest,
  });
}

function showPhaseB() {
  showArtifact({
    kicker: '04 · Phase B',
    title: 'Copy the approved production request',
    description: 'This handoff preserves the current Phase A approval and selected audio mode.',
    content: state.project.phaseBRequest,
  });
}

function showCapturePhaseA() {
  showArtifact({
    kicker: '02 · Capture Phase A',
    title: 'Paste the current director proposal',
    description: 'Capture the proposal exactly as returned by Codex. This does not approve it.',
    content: '',
    actions: [{ label: 'Save Phase A', primary: true, onClick: async () => {
      try {
        const project = await api(`/api/projects/${state.project.id}/capture-phase-a`, {
          method: 'POST', body: JSON.stringify({ proposal: artifactContent.value }),
        });
        renderProject(project);
        showArtifact({ kicker: '03 · Approval', title: 'Review captured proposal', description: 'When you explicitly approve this proposal, unlock the Phase B handoff.', content: project.phaseA });
      } catch (error) { alert(error.message); }
    }}],
  });
}

function showSubtitle() {
  const clipCount = state.project.state.settings.duration / 10;
  showArtifact({
    kicker: '04 · Subtitles',
    title: `Paste approved narration in ${clipCount} paragraphs`,
    description: 'Use one non-empty paragraph per 10-second clip. The output is a draft timed to scene boundaries; retime against the final voice recording.',
    content: '',
    actions: [{ label: `Create ${state.project.state.settings.subtitleFormat.toUpperCase()} draft`, primary: true, onClick: async () => {
      try {
        const project = await api(`/api/projects/${state.project.id}/subtitle`, {
          method: 'POST', body: JSON.stringify({ transcript: artifactContent.value }),
        });
        renderProject(project);
        showArtifact({ kicker: '04 · Subtitle export', title: `${project.state.settings.subtitleFormat.toUpperCase()} draft`, description: 'Review timestamps against the final ElevenLabs or human narration before publishing.', content: project.subtitle });
      } catch (error) { alert(error.message); }
    }}],
  });
}

setupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!setupForm.reportValidity()) return;
  const fields = new FormData(setupForm);
  const payload = {
    projectId: fields.get('projectId'),
    source: fields.get('source'),
    aspect: fields.get('aspect'),
    duration: Number(fields.get('duration')),
    style: fields.get('style'),
    theme: fields.get('style') === 'classic' ? fields.get('theme') : null,
    subtitleFormat: fields.get('subtitleFormat'),
    externalVoiceover: fields.get('externalVoiceover') === 'on',
  };
  setFeedback('Creating local workspace…');
  try {
    const project = await api('/api/projects', { method: 'POST', body: JSON.stringify(payload) });
    renderProject(project);
    await loadProjects();
    setFeedback('Project created. Copy the Phase A request into Codex.', 'success');
    showPhaseA();
  } catch (error) {
    setFeedback(error.message, 'error');
  }
});

styleSelect.addEventListener('change', setThemeAvailability);
projectPicker.addEventListener('change', async () => {
  if (!projectPicker.value) return;
  try {
    renderProject(await api(`/api/projects/${projectPicker.value}`));
    setFeedback('Existing project opened.', 'success');
  } catch (error) {
    setFeedback(error.message, 'error');
  }
});
document.querySelector('#open-phase-a').addEventListener('click', showPhaseA);
document.querySelector('#capture-phase-a').addEventListener('click', showCapturePhaseA);
document.querySelector('#open-phase-b').addEventListener('click', showPhaseB);
document.querySelector('#create-subtitle').addEventListener('click', showSubtitle);
document.querySelector('#approve-phase-a').addEventListener('click', async () => {
  if (!confirm('Approve the currently captured Phase A and unlock Phase B?')) return;
  try {
    const project = await api(`/api/projects/${state.project.id}/approve`, { method: 'POST', body: '{}' });
    renderProject(project);
    showArtifact({ kicker: '03 · Approved', title: 'Phase A is approved', description: 'You can now open the Phase B handoff and generate the production package in Codex.', content: project.phaseBRequest });
  } catch (error) { alert(error.message); }
});
document.querySelector('#copy-artifact').addEventListener('click', async () => {
  await navigator.clipboard.writeText(artifactContent.value);
  document.querySelector('#copy-artifact').textContent = 'Copied';
  setTimeout(() => { document.querySelector('#copy-artifact').textContent = 'Copy'; }, 1200);
});

setThemeAvailability();
loadProjects();
