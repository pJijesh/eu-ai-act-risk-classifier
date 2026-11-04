#!/usr/bin/env node
// Command-line front end for the EU AI Act risk classifier.
//   node bin/classify.js examples/cv-screening-provider.json
//   node bin/classify.js answers.json --json
//   node bin/classify.js --interactive

import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout, argv, exit } from 'node:process';
import { classify, visibleQuestions, ValidationError } from '../src/engine.js';
import { toMarkdown } from '../src/report.js';

const args = argv.slice(2);
const flag = (f) => args.includes(f);
const file = args.find((a) => !a.startsWith('--'));

if (flag('--help') || flag('-h') || (!file && !flag('--interactive'))) {
  console.log(`EU AI Act risk classifier

Usage:
  node bin/classify.js <answers.json>        classify from a JSON file (Markdown report)
  node bin/classify.js <answers.json> --json print the result as JSON
  node bin/classify.js --interactive         answer the questions in the terminal

Answers files use the question ids from src/rules.js. See examples/ for samples.
This is an educational triage tool, not legal advice.`);
  exit(file || flag('--interactive') ? 0 : 1);
}

async function interactive() {
  const rl = createInterface({ input: stdin, output: stdout });
  const answers = {};
  for (;;) {
    const next = visibleQuestions(answers).find((q) => !(q.id in answers));
    if (!next) break;
    console.log(`\n${next.title}\n${next.help}`);
    next.options.forEach((o, i) => console.log(`  ${i + 1}. ${o.label}`));
    const hint = next.type === 'multi' ? 'numbers separated by commas, or Enter for none' : 'number';
    const raw = (await rl.question(`> (${hint}) `)).trim();
    const picks = raw ? raw.split(',').map((s) => next.options[Number(s.trim()) - 1]?.value).filter(Boolean) : [];
    if (next.type === 'multi') answers[next.id] = picks;
    else if (picks[0]) answers[next.id] = picks[0];
    else console.log('Please choose one option.');
  }
  rl.close();
  return answers;
}

try {
  const answers = file ? JSON.parse(readFileSync(file, 'utf8')) : await interactive();
  const result = classify(answers);
  console.log(flag('--json') ? JSON.stringify(result, null, 2) : toMarkdown(result));
} catch (err) {
  if (err instanceof ValidationError) { console.error(err.message); exit(2); }
  if (err instanceof SyntaxError) { console.error(`Could not parse ${file}: ${err.message}`); exit(2); }
  throw err;
}
