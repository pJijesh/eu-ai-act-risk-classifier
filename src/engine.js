// Classification engine. Pure functions, no dependencies, runs in the browser and in Node.

import {
  META, DATES, ROLES, EXCLUSIONS, PROHIBITED, ANNEX_III, DEROGATIONS, TRANSPARENCY, GPAI,
  OBLIGATIONS, TRANSPARENCY_OBLIGATIONS, PENALTIES, TIERS, CAVEATS, QUESTIONS,
} from './rules.js';

export class ValidationError extends Error {
  constructor(problems) {
    super(`Invalid answers:\n- ${problems.join('\n- ')}`);
    this.name = 'ValidationError';
    this.problems = problems;
  }
}

const values = (list) => list.map((o) => o.value);
const byValue = (list, v) => list.find((o) => o.value === v);

/** Check the shape of an answers object and fill in defaults. Throws ValidationError. */
export function normalise(input = {}) {
  const problems = [];
  const a = {
    role: input.role,
    euNexus: input.euNexus,
    exclusions: input.exclusions ?? [],
    prohibited: input.prohibited ?? [],
    annexI: input.annexI,
    annexIII: input.annexIII ?? [],
    profiling: input.profiling,
    derogation: input.derogation ?? [],
    transparency: input.transparency ?? [],
    gpai: input.gpai ?? 'no',
  };

  const single = (key, allowed, required) => {
    if (a[key] === undefined || a[key] === null || a[key] === '') {
      if (required) problems.push(`"${key}" is required (one of: ${allowed.join(', ')})`);
    } else if (!allowed.includes(a[key])) {
      problems.push(`"${key}" has unknown value "${a[key]}" (expected one of: ${allowed.join(', ')})`);
    }
  };
  const multi = (key, allowed) => {
    if (!Array.isArray(a[key])) { problems.push(`"${key}" must be a list`); return; }
    for (const v of a[key]) if (!allowed.includes(v)) problems.push(`"${key}" has unknown value "${v}"`);
  };

  single('role', values(ROLES), true);
  single('euNexus', ['yes', 'no'], true);
  single('annexI', ['yes', 'no'], true);
  single('gpai', values(GPAI), false);
  multi('exclusions', values(EXCLUSIONS));
  multi('prohibited', values(PROHIBITED));
  multi('annexIII', values(ANNEX_III));
  multi('derogation', values(DEROGATIONS));
  multi('transparency', values(TRANSPARENCY));

  if (Array.isArray(a.annexIII) && a.annexIII.length > 0) {
    single('profiling', ['yes', 'no'], true);
  } else {
    a.profiling = a.profiling ?? 'no';
    a.derogation = [];
  }
  if (a.profiling === 'yes') a.derogation = [];
  if (a.role !== 'provider' && a.role !== 'manufacturer') a.gpai = 'no';

  if (problems.length) throw new ValidationError(problems);
  return a;
}

/** Which questions apply for a given set of answers. Used by the UI and the CLI. */
export function visibleQuestions(answers) {
  return QUESTIONS.filter((q) => !q.when || q.when(answers));
}

/**
 * Classify a system.
 * @param {object} input answers keyed by question id
 * @param {Date} [now] injectable clock so tests are deterministic
 */
export function classify(input, now = new Date()) {
  const a = normalise(input);
  const actor = a.role === 'manufacturer' ? 'provider' : a.role;
  const reasons = [];
  const layers = [];
  const dateKeys = new Set();

  const finish = (tier, extra = {}) => {
    const t = TIERS[tier];
    return {
      tier,
      tierLabel: t.label,
      tone: t.tone,
      summary: t.summary,
      reasons,
      layers,
      timeline: buildTimeline(dateKeys, now),
      penalties: extra.penalties ?? [],
      caveats: CAVEATS,
      disclaimer: META.disclaimer,
      rulesetVersion: META.rulesetVersion,
      verifiedOn: META.verifiedOn,
      answers: a,
    };
  };

  // 1. Territorial scope and exclusions (Art 2)
  if (a.euNexus === 'no') {
    reasons.push({ ref: 'Art 2(1)', text: 'The system and its output are not placed on the market, put into service or used in the EU.' });
    return finish('out_of_scope');
  }
  if (a.exclusions.length) {
    for (const v of a.exclusions) {
      const e = byValue(EXCLUSIONS, v);
      reasons.push({ ref: e.ref, text: e.label });
    }
    return finish('out_of_scope');
  }

  // 2. Prohibited practices (Art 5). These end the assessment.
  if (a.prohibited.length) {
    for (const v of a.prohibited) {
      const p = byValue(PROHIBITED, v);
      reasons.push({ ref: p.ref, text: p.label });
    }
    dateKeys.add('prohibitions');
    if (a.prohibited.includes('intimate_imagery')) dateKeys.add('newProhibition');
    layers.push({ id: 'prohibited', title: 'Prohibited practice', who: 'Everyone', obligations: OBLIGATIONS.prohibited });
    return finish('prohibited', { penalties: [PENALTIES.prohibited] });
  }

  // 3. High-risk (Art 6, Annex I and Annex III)
  let highRisk = false;
  let exempt = false;

  if (a.annexI === 'yes') {
    highRisk = true;
    dateKeys.add('annexI');
    reasons.push({ ref: 'Art 6(1), Annex I', text: 'The AI is a safety component of, or is itself, a product covered by Annex I harmonisation law that needs a third-party conformity assessment.' });
  }
  if (a.annexIII.length) {
    for (const v of a.annexIII) {
      const u = byValue(ANNEX_III, v);
      reasons.push({ ref: u.ref, text: u.label });
    }
    dateKeys.add('annexIII');
    if (a.profiling === 'yes') {
      highRisk = true;
      reasons.push({ ref: 'Art 6(3)', text: 'The system profiles natural persons, so the exemption from high-risk status is not available.' });
    } else if (a.derogation.length) {
      if (!highRisk) exempt = true;
      for (const v of a.derogation) {
        const d = byValue(DEROGATIONS, v);
        reasons.push({ ref: d.ref, text: d.label });
      }
    } else {
      highRisk = true;
    }
  }

  if (highRisk) {
    layers.push(highRiskLayer(actor));
  } else if (exempt) {
    layers.push({ id: 'derogation', title: 'Documenting the Art 6(3) exemption', who: 'Providers', obligations: OBLIGATIONS.derogation });
  }

  // 4. General-purpose AI models (Arts 51-55)
  if (a.gpai !== 'no') {
    dateKeys.add('gpai');
    reasons.push({ ref: a.gpai === 'systemic' ? 'Arts 51-52' : 'Art 51', text: byValue(GPAI, a.gpai).label });
    const obligations = a.gpai === 'systemic'
      ? [...OBLIGATIONS.gpaiModel, ...OBLIGATIONS.gpaiSystemic]
      : OBLIGATIONS.gpaiModel;
    layers.push({
      id: 'gpai',
      title: a.gpai === 'systemic' ? 'General-purpose AI model with systemic risk' : 'General-purpose AI model',
      who: 'Providers',
      obligations,
    });
  }

  // 5. Transparency (Art 50)
  if (a.transparency.length) {
    dateKeys.add('transparency');
    const obligations = a.transparency.map((v) => {
      const o = TRANSPARENCY_OBLIGATIONS[v];
      const meta = byValue(TRANSPARENCY, v);
      const forYou = meta.roles.includes(actor);
      return { ref: o.ref, text: o.text, who: o.who, forYou };
    });
    if (a.transparency.includes('synthetic')) dateKeys.add('markingLegacy');
    layers.push({ id: 'transparency', title: 'Transparency obligations', who: 'Providers and deployers', obligations });
    for (const v of a.transparency) {
      const meta = byValue(TRANSPARENCY, v);
      reasons.push({ ref: meta.ref, text: meta.label });
    }
  }

  // 6. AI literacy applies to every in-scope provider and deployer
  dateKeys.add('prohibitions');
  layers.push({ id: 'literacy', title: 'AI literacy', who: 'Providers and deployers', obligations: OBLIGATIONS.literacy });

  // 7. Choose the primary tier
  let tier;
  if (highRisk) tier = 'high_risk';
  else if (exempt) tier = 'high_risk_exempt';
  else if (a.gpai !== 'no') tier = 'gpai';
  else if (a.transparency.length) tier = 'limited';
  else {
    tier = 'minimal';
    layers.unshift({ id: 'minimal', title: 'Minimal risk', who: 'Everyone', obligations: OBLIGATIONS.minimal });
    reasons.push({ ref: 'Arts 5, 6, 50', text: 'None of the prohibited, high-risk or transparency triggers were selected.' });
  }

  const penalties = [];
  if (highRisk || exempt || a.transparency.length) penalties.push(PENALTIES.other);
  if (a.gpai !== 'no') penalties.push(PENALTIES.gpai);

  return finish(tier, { penalties });
}

function highRiskLayer(actor) {
  switch (actor) {
    case 'deployer':
      return { id: 'high_risk', title: 'High-risk obligations for deployers', who: 'Deployers', obligations: OBLIGATIONS.highRiskDeployer };
    case 'importer':
      return { id: 'high_risk', title: 'High-risk obligations for importers', who: 'Importers', obligations: OBLIGATIONS.highRiskImporter };
    case 'distributor':
      return { id: 'high_risk', title: 'High-risk obligations for distributors', who: 'Distributors', obligations: OBLIGATIONS.highRiskDistributor };
    default:
      return { id: 'high_risk', title: 'High-risk obligations for providers', who: 'Providers', obligations: OBLIGATIONS.highRiskProvider };
  }
}

function buildTimeline(keys, now) {
  return [...keys]
    .map((k) => ({ key: k, ...DATES[k] }))
    .sort((x, y) => x.date.localeCompare(y.date))
    .map((d) => {
      const when = new Date(`${d.date}T00:00:00Z`);
      const inForce = now.getTime() >= when.getTime();
      const days = Math.ceil((when.getTime() - now.getTime()) / 86400000);
      return { key: d.key, date: d.date, label: d.label, status: inForce ? 'in_force' : 'upcoming', daysUntil: inForce ? 0 : days };
    });
}
