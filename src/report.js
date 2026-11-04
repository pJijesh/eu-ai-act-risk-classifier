// Turns a classification result into a Markdown report (used by the CLI and the "Download report" button).

import { QUESTIONS } from './rules.js';

const fmtDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function toMarkdown(r, { title = 'EU AI Act risk classification' } = {}) {
  const out = [];
  out.push(`# ${title}`, '');
  out.push(`**Result: ${r.tierLabel}**`, '', r.summary, '');

  out.push('## Why', '');
  for (const x of r.reasons) out.push(`- ${x.text} (${x.ref})`);
  out.push('');

  for (const layer of r.layers) {
    out.push(`## ${layer.title}`, '', `Applies to: ${layer.who}`, '');
    for (const o of layer.obligations) {
      const prefix = o.who && o.forYou === false ? `[${o.who}, not your role] ` : '';
      out.push(`- ${prefix}${o.text} (${o.ref})`);
    }
    out.push('');
  }

  if (r.timeline.length) {
    out.push('## Key dates', '');
    for (const t of r.timeline) {
      const status = t.status === 'in_force' ? 'in force' : `in ${t.daysUntil} days`;
      out.push(`- ${fmtDate(t.date)} (${status}): ${t.label}`);
    }
    out.push('');
  }

  if (r.penalties.length) {
    out.push('## Penalties', '');
    for (const p of r.penalties) out.push(`- ${p}`);
    out.push('');
  }

  out.push('## Your answers', '');
  for (const q of QUESTIONS) {
    const v = r.answers[q.id];
    if (v === undefined || (Array.isArray(v) && v.length === 0)) continue;
    const labelOf = (val) => q.options.find((o) => o.value === val)?.label ?? val;
    out.push(`- ${q.title} ${Array.isArray(v) ? v.map(labelOf).join('; ') : labelOf(v)}`);
  }
  out.push('');

  out.push('## Caveats', '');
  for (const c of r.caveats) out.push(`- ${c}`);
  out.push('', `> ${r.disclaimer}`, '', `Ruleset ${r.rulesetVersion}, dates verified ${r.verifiedOn}.`, '');
  return out.join('\n');
}
