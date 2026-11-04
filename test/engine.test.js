import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { classify, normalise, visibleQuestions, ValidationError } from '../src/engine.js';
import { toMarkdown } from '../src/report.js';
import { QUESTIONS, ANNEX_III, PROHIBITED, DEROGATIONS, TRANSPARENCY, DATES } from '../src/rules.js';

const NOW = new Date('2026-11-04T12:00:00Z');
const base = { role: 'provider', euNexus: 'yes', annexI: 'no' };
const run = (extra) => classify({ ...base, ...extra }, NOW);
const example = (name) => JSON.parse(readFileSync(new URL(`../examples/${name}.json`, import.meta.url), 'utf8'));

test('every bundled example classifies to its expected tier', () => {
  const expected = {
    'cv-screening-provider': 'high_risk',
    'credit-scoring-deployer': 'high_risk',
    'support-chatbot-provider': 'limited',
    'social-scoring': 'prohibited',
    'spam-filter': 'minimal',
    'foundation-model': 'gpai',
    'interview-scheduler-exempt': 'high_risk_exempt',
    'non-eu-internal-tool': 'out_of_scope',
    'medical-device-manufacturer': 'high_risk',
  };
  const files = readdirSync(new URL('../examples/', import.meta.url)).map((f) => f.replace('.json', ''));
  assert.deepEqual(files.sort(), Object.keys(expected).sort(), 'example list and expectations must match');
  for (const [name, tier] of Object.entries(expected)) {
    assert.equal(classify(example(name), NOW).tier, tier, name);
  }
});

test('no EU nexus is out of scope, and so is each Art 2 exclusion', () => {
  assert.equal(run({ euNexus: 'no' }).tier, 'out_of_scope');
  for (const e of ['military', 'research', 'prelaunch', 'personal']) {
    assert.equal(run({ exclusions: [e] }).tier, 'out_of_scope', e);
  }
});

test('scope is checked before prohibited practices', () => {
  assert.equal(run({ euNexus: 'no', prohibited: ['social_scoring'] }).tier, 'out_of_scope');
});

test('every prohibited practice yields the prohibited tier and wins over high-risk', () => {
  for (const p of PROHIBITED) {
    const r = run({ prohibited: [p.value], annexIII: ['4a'], profiling: 'yes' });
    assert.equal(r.tier, 'prohibited', p.value);
    assert.ok(r.reasons.some((x) => x.ref === p.ref));
  }
});

test('every Annex III use case with profiling is high-risk', () => {
  for (const u of ANNEX_III) {
    assert.equal(run({ annexIII: [u.value], profiling: 'yes' }).tier, 'high_risk', u.value);
  }
});

test('profiling removes the Art 6(3) exemption even when a condition is selected', () => {
  const r = run({ annexIII: ['4a'], profiling: 'yes', derogation: ['narrow'] });
  assert.equal(r.tier, 'high_risk');
  assert.deepEqual(r.answers.derogation, []);
});

test('each Art 6(3) condition gives the exempt tier when there is no profiling', () => {
  for (const d of DEROGATIONS) {
    assert.equal(run({ annexIII: ['3b'], profiling: 'no', derogation: [d.value] }).tier, 'high_risk_exempt', d.value);
  }
});

test('Annex III with no profiling and no condition is high-risk', () => {
  assert.equal(run({ annexIII: ['3a'], profiling: 'no' }).tier, 'high_risk');
});

test('Annex I route is high-risk and uses the 2028 date, not the 2027 date', () => {
  const r = run({ annexI: 'yes' });
  assert.equal(r.tier, 'high_risk');
  const dates = r.timeline.map((t) => t.date);
  assert.ok(dates.includes(DATES.annexI.date));
  assert.ok(!dates.includes(DATES.annexIII.date));
});

test('Annex I wins over an Art 6(3) exemption claimed for an Annex III use case', () => {
  const r = run({ annexI: 'yes', annexIII: ['4a'], profiling: 'no', derogation: ['preparatory'] });
  assert.equal(r.tier, 'high_risk');
});

test('obligations depend on role', () => {
  const refs = (role) => classify({ ...base, role, annexIII: ['5b'], profiling: 'yes' }, NOW)
    .layers.find((l) => l.id === 'high_risk').obligations.map((o) => o.ref).join(' ');
  assert.match(refs('provider'), /Art 9/);
  assert.match(refs('manufacturer'), /Art 9/);
  assert.match(refs('deployer'), /Art 26/);
  assert.match(refs('importer'), /Art 23/);
  assert.match(refs('distributor'), /Art 24/);
});

test('deployer of a transparency trigger that belongs to providers is flagged as not for them', () => {
  const r = classify({ ...base, role: 'deployer', transparency: ['interaction', 'deepfake_text'] }, NOW);
  const t = r.layers.find((l) => l.id === 'transparency').obligations;
  assert.equal(t.find((o) => o.ref === 'Art 50(1)').forYou, false);
  assert.equal(t.find((o) => o.ref === 'Art 50(4)').forYou, true);
});

test('every transparency trigger produces an obligation', () => {
  for (const t of TRANSPARENCY) {
    const r = run({ transparency: [t.value] });
    assert.equal(r.tier, 'limited', t.value);
  }
});

test('GPAI: systemic risk adds Art 52 and Art 55; non-providers cannot be GPAI providers', () => {
  const sys = run({ gpai: 'systemic' });
  const refs = sys.layers.find((l) => l.id === 'gpai').obligations.map((o) => o.ref);
  assert.ok(refs.includes('Art 52') && refs.includes('Art 55'));
  const plain = run({ gpai: 'model' });
  assert.ok(!plain.layers.find((l) => l.id === 'gpai').obligations.some((o) => o.ref === 'Art 55'));
  assert.notEqual(classify({ ...base, role: 'deployer', gpai: 'systemic' }, NOW).tier, 'gpai');
});

test('high-risk plus GPAI keeps high-risk as the primary tier and lists both layers', () => {
  const r = run({ annexIII: ['4a'], profiling: 'yes', gpai: 'model' });
  assert.equal(r.tier, 'high_risk');
  assert.deepEqual(r.layers.map((l) => l.id).sort(), ['gpai', 'high_risk', 'literacy']);
});

test('timeline status follows the injected clock', () => {
  const before = classify({ ...base, annexIII: ['4a'], profiling: 'yes' }, new Date('2026-11-04T00:00:00Z'));
  const after = classify({ ...base, annexIII: ['4a'], profiling: 'yes' }, new Date('2028-01-01T00:00:00Z'));
  assert.equal(before.timeline.find((t) => t.key === 'annexIII').status, 'upcoming');
  assert.equal(after.timeline.find((t) => t.key === 'annexIII').status, 'in_force');
  assert.ok(before.timeline.find((t) => t.key === 'annexIII').daysUntil > 0);
});

test('Art 50 is in force at the verification date but marking grace period is still running', () => {
  const r = run({ transparency: ['synthetic'] });
  assert.equal(r.timeline.find((t) => t.key === 'transparency').status, 'in_force');
  assert.equal(r.timeline.find((t) => t.key === 'markingLegacy').status, 'upcoming');
});

test('invalid input is rejected with readable problems', () => {
  assert.throws(() => classify({}), ValidationError);
  assert.throws(() => classify({ ...base, role: 'wizard' }), /unknown value "wizard"/);
  assert.throws(() => classify({ ...base, prohibited: ['nope'] }), /unknown value "nope"/);
  assert.throws(() => classify({ ...base, annexIII: ['4a'] }), /"profiling" is required/);
});

test('question flow: follow-ups only appear when relevant', () => {
  const ids = (a) => visibleQuestions(a).map((q) => q.id);
  assert.ok(!ids({ role: 'deployer' }).includes('gpai'));
  assert.ok(ids({ role: 'provider' }).includes('gpai'));
  assert.ok(!ids({}).includes('profiling'));
  assert.ok(ids({ annexIII: ['4a'] }).includes('profiling'));
  assert.ok(!ids({ annexIII: ['4a'], profiling: 'yes' }).includes('derogation'));
  assert.ok(ids({ annexIII: ['4a'], profiling: 'no' }).includes('derogation'));
});

test('question ids and options are unique and consistent with the engine', () => {
  assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, QUESTIONS.length);
  for (const q of QUESTIONS) {
    assert.equal(new Set(q.options.map((o) => o.value)).size, q.options.length, q.id);
  }
});

test('Markdown report contains the result, dates and disclaimer', () => {
  const md = toMarkdown(run({ annexIII: ['4a'], profiling: 'yes' }));
  assert.match(md, /\*\*Result: High-risk\*\*/);
  assert.match(md, /2 December 2027/);
  assert.match(md, /not legal advice/i);
});

test('normalise does not mutate its input', () => {
  const input = { ...base, annexIII: ['4a'], profiling: 'yes', derogation: ['narrow'] };
  const snapshot = JSON.stringify(input);
  normalise(input);
  assert.equal(JSON.stringify(input), snapshot);
});
