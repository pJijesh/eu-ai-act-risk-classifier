// Browser front end. Plain ES modules, no framework, no build step.
// All logic lives in ../src (shared with the CLI). Answers never leave the browser.

import { classify, visibleQuestions, ValidationError } from '../src/engine.js';
import { toMarkdown } from '../src/report.js';
import { META } from '../src/rules.js';

const EXAMPLES = [
  ['cv-screening-provider', 'CV screening tool'],
  ['credit-scoring-deployer', 'Bank using credit scoring'],
  ['support-chatbot-provider', 'Support chatbot'],
  ['social-scoring', 'Social scoring'],
  ['interview-scheduler-exempt', 'Interview scheduler'],
  ['foundation-model', 'Frontier language model'],
  ['spam-filter', 'Spam filter'],
];

const app = document.getElementById('app');
document.getElementById('disclaimer').textContent = META.disclaimer;

const state = { answers: {}, step: 0, view: 'intro' };

// ---------------------------------------------------------------- helpers

function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

const fmtDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function mount(...nodes) {
  app.replaceChildren(...nodes.flat().filter(Boolean));
  const target = app.querySelector('.focus-target');
  if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: false }); }
  else window.scrollTo(0, 0);
}

function encodeHash(answers) {
  try { return 'r=' + btoa(JSON.stringify(answers)); } catch { return ''; }
}
function decodeHash() {
  const m = location.hash.match(/^#r=(.+)$/);
  if (!m) return null;
  try { return JSON.parse(atob(m[1])); } catch { return null; }
}

// ---------------------------------------------------------------- views

function renderIntro(message) {
  mount(
    h('h1', { class: 'focus-target' }, 'Where does your AI system sit under the EU AI Act?'),
    h('p', { class: 'lede' }, 'Answer up to ten short questions. You get the risk tier, what you have to do, and the dates that matter. It takes about three minutes.'),
    message ? h('p', { class: 'disclaimer', role: 'alert' }, message) : null,
    h('div', { class: 'actions' },
      h('button', { class: 'primary', onclick: () => { state.answers = {}; state.step = 0; renderQuestion(); } }, 'Start the questionnaire'),
    ),
    h('h2', {}, 'Or try an example'),
    h('div', { class: 'examples' },
      EXAMPLES.map(([file, label]) => h('button', { onclick: () => loadExample(file) }, label))),
    h('p', { class: 'disclaimer' }, META.disclaimer),
  );
}

async function loadExample(file) {
  try {
    const res = await fetch(`examples/${file}.json`);
    if (!res.ok) throw new Error(res.statusText);
    state.answers = await res.json();
    renderResult();
  } catch (err) {
    renderIntro(`Could not load that example (${err.message}). If you opened this file directly, serve it over HTTP instead.`);
  }
}

function renderQuestion() {
  const questions = visibleQuestions(state.answers);
  state.step = Math.min(state.step, questions.length - 1);
  const q = questions[state.step];
  const current = state.answers[q.id];
  const isMulti = q.type === 'multi';
  const answered = isMulti ? true : current !== undefined;

  const set = (value, checked) => {
    if (isMulti) {
      const list = new Set(state.answers[q.id] ?? []);
      checked ? list.add(value) : list.delete(value);
      state.answers[q.id] = [...list];
    } else {
      state.answers[q.id] = value;
    }
    nextBtn.disabled = !(isMulti || state.answers[q.id] !== undefined);
    // Later questions depend on this one: refresh the progress line only.
    const total = visibleQuestions(state.answers).length;
    progressBar.style.width = `${((state.step + 1) / total) * 100}%`;
    progressLabel.textContent = `Question ${state.step + 1} of ${total}`;
    nextBtn.textContent = state.step + 1 >= total ? 'See result' : 'Next';
  };

  const options = [];
  let lastGroup = null;
  for (const o of q.options) {
    if (q.grouped && o.group !== lastGroup) {
      options.push(h('p', { class: 'group-title' }, o.group));
      lastGroup = o.group;
    }
    const id = `${q.id}-${o.value}`;
    const checked = isMulti ? (current ?? []).includes(o.value) : current === o.value;
    options.push(
      h('label', { class: 'opt', for: id },
        h('input', { id, type: isMulti ? 'checkbox' : 'radio', name: q.id, value: o.value, checked, onchange: (e) => set(o.value, e.target.checked) }),
        h('span', {},
          h('span', { class: 't' }, o.label),
          o.ref ? h('span', { class: 'r' }, o.ref) : null,
          o.help ? h('span', { class: 'hint' }, o.help) : null,
        ),
      ),
    );
  }

  const total = questions.length;
  const progressBar = h('div', { style: `width:${((state.step + 1) / total) * 100}%` });
  const progressLabel = h('p', { class: 'progress-label', 'aria-live': 'polite' }, `Question ${state.step + 1} of ${total}`);
  const nextBtn = h('button', { class: 'primary', disabled: !answered, onclick: () => {
    const now = visibleQuestions(state.answers);
    if (state.step + 1 >= now.length) renderResult();
    else { state.step += 1; renderQuestion(); }
  } }, state.step + 1 >= total ? 'See result' : 'Next');

  mount(
    h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': state.step + 1 }, progressBar),
    progressLabel,
    h('fieldset', {},
      h('legend', { class: 'focus-target' }, q.title),
      h('p', { class: 'help' }, q.help),
      options,
    ),
    h('div', { class: 'actions' },
      h('button', { onclick: () => { if (state.step === 0) renderIntro(); else { state.step -= 1; renderQuestion(); } } }, 'Back'),
      h('span', { class: 'spacer' }),
      nextBtn,
    ),
  );
}

function renderResult() {
  let r;
  try { r = classify(state.answers); }
  catch (err) {
    if (err instanceof ValidationError) { renderIntro(err.message); return; }
    throw err;
  }
  history.replaceState(null, '', `#${encodeHash(state.answers)}`);

  const reasons = h('div', { class: 'card' },
    h('h3', {}, 'Why'),
    h('ul', { class: 'plain' }, r.reasons.map((x) => h('li', {}, h('span', { class: 'ref' }, x.ref), x.text))),
  );

  const layers = r.layers.map((l) => h('section', { class: 'card' },
    h('h3', {}, l.title),
    h('p', { class: 'note' }, `Applies to: ${l.who}`),
    h('ul', { class: 'plain' }, l.obligations.map((o) => h('li', {},
      h('span', { class: 'ref' }, o.ref), o.text,
      o.who && o.forYou === false ? h('span', { class: 'note' }, `This duty sits with ${o.who.toLowerCase()}, not your role. Check your counterparty meets it.`) : null,
    ))),
  ));

  const timeline = r.timeline.length ? h('section', { class: 'card' },
    h('h3', {}, 'Key dates'),
    h('ul', { class: 'plain timeline' }, r.timeline.map((t) => h('li', {},
      h('span', { class: 'when' }, fmtDate(t.date),
        h('span', { class: 'state' }, t.status === 'in_force' ? 'Already in force' : `In ${t.daysUntil.toLocaleString('en-GB')} days`)),
      h('span', {}, t.label),
    ))),
  ) : null;

  const penalties = r.penalties.length ? h('section', { class: 'card' },
    h('h3', {}, 'Penalties'),
    h('ul', { class: 'plain' }, r.penalties.map((p) => h('li', {}, p))),
  ) : null;

  const caveats = h('section', { class: 'card' },
    h('h3', {}, 'Things to keep in mind'),
    h('ul', { class: 'plain' }, r.caveats.map((c) => h('li', {}, c))),
  );

  mount(
    h('div', { class: 'result-head' },
      h('span', { class: `badge tone-${r.tone}` }, r.tierLabel),
      h('h1', { class: 'focus-target' }, r.summary),
    ),
    reasons, layers, timeline, penalties, caveats,
    h('p', { class: 'disclaimer' }, r.disclaimer, ` Ruleset ${r.rulesetVersion}, dates verified ${fmtDate(r.verifiedOn)}.`),
    h('div', { class: 'actions' },
      h('button', { class: 'primary', onclick: () => download(r) }, 'Download report (Markdown)'),
      h('button', { onclick: () => window.print() }, 'Print'),
      h('button', { onclick: copyLink }, 'Copy link to this result'),
      h('span', { class: 'spacer' }),
      h('button', { onclick: () => { state.step = 0; history.replaceState(null, '', location.pathname); renderQuestion(); } }, 'Edit answers'),
      h('button', { onclick: () => { state.answers = {}; history.replaceState(null, '', location.pathname); renderIntro(); } }, 'Start over'),
    ),
  );
}

function download(r) {
  const blob = new Blob([toMarkdown(r)], { type: 'text/markdown' });
  const a = h('a', { href: URL.createObjectURL(blob), download: 'ai-act-classification.md' });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function copyLink(e) {
  const btn = e.currentTarget;
  try { await navigator.clipboard.writeText(location.href); btn.textContent = 'Link copied'; }
  catch { btn.textContent = 'Copy failed, use the address bar'; }
  setTimeout(() => { btn.textContent = 'Copy link to this result'; }, 2500);
}

// ---------------------------------------------------------------- boot

const shared = decodeHash();
if (shared) { state.answers = shared; renderResult(); } else renderIntro();
