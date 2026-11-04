// Rules for the EU AI Act risk classifier.
//
// Single source of truth: the web UI, the CLI and the tests all read from here.
// Regulation (EU) 2024/1689 ("AI Act"), as amended by the Digital Omnibus on AI (2026).
// This is an educational triage tool, not legal advice.

export const META = {
  rulesetVersion: '1.0.0',
  verifiedOn: '2026-11-04',
  regulation: 'Regulation (EU) 2024/1689',
  amendments: 'Digital Omnibus on AI (2026)',
  disclaimer:
    'Educational triage tool, not legal advice. Classification under the AI Act depends on facts and interpretation. ' +
    'Check the Official Journal text and take qualified advice before relying on a result.',
};

// Key application dates (ISO). Verified 4 Nov 2026 against secondary sources; confirm on EUR-Lex.
export const DATES = {
  prohibitions: { date: '2025-02-02', label: 'Prohibited practices (Art 5) and AI literacy (Art 4) apply' },
  gpai: { date: '2025-08-02', label: 'General-purpose AI model obligations (Arts 51-55) apply' },
  transparency: { date: '2026-08-02', label: 'Transparency obligations (Art 50) apply' },
  markingLegacy: {
    date: '2026-12-02',
    label: 'Grace period ends for machine-readable marking (Art 50(2)) on generative systems already on the market before 2 Aug 2026',
  },
  newProhibition: {
    date: '2026-12-02',
    label: 'Ban on AI generating non-consensual intimate imagery or CSAM applies (added to Art 5 by the Omnibus)',
  },
  annexIII: { date: '2027-12-02', label: 'High-risk obligations for Annex III use cases apply (moved from 2 Aug 2026)' },
  annexI: { date: '2028-08-02', label: 'High-risk obligations for AI in Annex I regulated products apply (moved from 2 Aug 2027)' },
};

export const ROLES = [
  { value: 'provider', label: 'Provider', help: 'You develop an AI system or model, or have one developed, and place it on the market or put it into service under your own name.' },
  { value: 'deployer', label: 'Deployer', help: 'You use an AI system under your own authority in a professional context.' },
  { value: 'importer', label: 'Importer', help: 'You are established in the EU and place on the market a system from a provider outside the EU.' },
  { value: 'distributor', label: 'Distributor', help: 'You make a system available on the EU market without being the provider or importer.' },
  { value: 'manufacturer', label: 'Product manufacturer', help: 'You place a product containing AI on the market under your own name (treated as the provider, Art 25(3)).' },
];

export const EXCLUSIONS = [
  { value: 'military', label: 'Used exclusively for military, defence or national security purposes', ref: 'Art 2(3)' },
  { value: 'research', label: 'Developed and used solely for scientific research and development', ref: 'Art 2(6)' },
  { value: 'prelaunch', label: 'Research, testing or development before it is placed on the market (excluding real-world testing)', ref: 'Art 2(8)' },
  { value: 'personal', label: 'Used by a person in a purely personal, non-professional activity', ref: 'Art 2(10)' },
];

export const PROHIBITED = [
  { value: 'manipulation', label: 'Uses subliminal, purposefully manipulative or deceptive techniques that materially distort behaviour and are likely to cause significant harm', ref: 'Art 5(1)(a)' },
  { value: 'vulnerabilities', label: 'Exploits vulnerabilities linked to age, disability or a specific social or economic situation to distort behaviour and cause significant harm', ref: 'Art 5(1)(b)' },
  { value: 'social_scoring', label: 'Scores or classifies people over time by social behaviour or personal traits, leading to unjustified or disproportionate detrimental treatment', ref: 'Art 5(1)(c)' },
  { value: 'crime_prediction', label: 'Predicts the risk of an individual committing a criminal offence based solely on profiling or personality traits', ref: 'Art 5(1)(d)' },
  { value: 'face_scraping', label: 'Builds facial recognition databases by untargeted scraping of facial images from the internet or CCTV', ref: 'Art 5(1)(e)' },
  { value: 'emotion_workplace', label: 'Infers emotions of people in the workplace or in education (except for medical or safety reasons)', ref: 'Art 5(1)(f)' },
  { value: 'biometric_categorisation', label: 'Categorises people by biometric data to infer race, political opinions, trade-union membership, religion, sex life or sexual orientation', ref: 'Art 5(1)(g)' },
  { value: 'rbi_realtime', label: 'Real-time remote biometric identification in publicly accessible spaces for law enforcement (narrow exceptions exist)', ref: 'Art 5(1)(h)' },
  { value: 'intimate_imagery', label: 'Generates non-consensual intimate imagery or child sexual abuse material', ref: 'Art 5 as amended by the Omnibus (applies from 2 Dec 2026)' },
];

export const ANNEX_III = [
  { value: '1a', group: '1. Biometrics', label: 'Remote biometric identification (not mere identity verification)', ref: 'Annex III(1)(a)' },
  { value: '1b', group: '1. Biometrics', label: 'Biometric categorisation by sensitive or protected attributes', ref: 'Annex III(1)(b)' },
  { value: '1c', group: '1. Biometrics', label: 'Emotion recognition', ref: 'Annex III(1)(c)' },
  { value: '2a', group: '2. Critical infrastructure', label: 'Safety component of critical digital infrastructure, road traffic, or the supply of water, gas, heating or electricity', ref: 'Annex III(2)' },
  { value: '3a', group: '3. Education and training', label: 'Determining access, admission or assignment to education or training', ref: 'Annex III(3)(a)' },
  { value: '3b', group: '3. Education and training', label: 'Evaluating learning outcomes or steering the learning process', ref: 'Annex III(3)(b)' },
  { value: '3c', group: '3. Education and training', label: 'Assessing the level of education a person will receive or can access', ref: 'Annex III(3)(c)' },
  { value: '3d', group: '3. Education and training', label: 'Monitoring or detecting prohibited behaviour of students during tests', ref: 'Annex III(3)(d)' },
  { value: '4a', group: '4. Employment and worker management', label: 'Recruitment or selection: targeted job ads, filtering or ranking applications, evaluating candidates', ref: 'Annex III(4)(a)' },
  { value: '4b', group: '4. Employment and worker management', label: 'Decisions on promotion, termination, task allocation or terms of work, or monitoring and evaluating performance and behaviour', ref: 'Annex III(4)(b)' },
  { value: '5a', group: '5. Essential services', label: 'Evaluating eligibility for public benefits and services (granting, reducing, revoking, reclaiming)', ref: 'Annex III(5)(a)' },
  { value: '5b', group: '5. Essential services', label: 'Credit scoring or assessing the creditworthiness of individuals (excluding fraud detection)', ref: 'Annex III(5)(b)' },
  { value: '5c', group: '5. Essential services', label: 'Risk assessment and pricing for life and health insurance', ref: 'Annex III(5)(c)' },
  { value: '5d', group: '5. Essential services', label: 'Classifying emergency calls, or dispatching and triaging emergency and healthcare services', ref: 'Annex III(5)(d)' },
  { value: '6a', group: '6. Law enforcement', label: 'Law enforcement: victim-risk assessment, evidence reliability, offending or re-offending risk, profiling in investigations', ref: 'Annex III(6)' },
  { value: '7a', group: '7. Migration, asylum and border control', label: 'Migration, asylum or border control: risk assessment, examining applications, detecting or identifying persons', ref: 'Annex III(7)' },
  { value: '8a', group: '8. Justice and democratic processes', label: 'Assisting a judicial authority to research and interpret facts and law, or in alternative dispute resolution', ref: 'Annex III(8)(a)' },
  { value: '8b', group: '8. Justice and democratic processes', label: 'Influencing the outcome of an election or referendum, or voting behaviour (excluding admin or logistics tools)', ref: 'Annex III(8)(b)' },
];

export const DEROGATIONS = [
  { value: 'narrow', label: 'It performs a narrow procedural task', ref: 'Art 6(3)(a)' },
  { value: 'improve', label: 'It improves the result of a previously completed human activity', ref: 'Art 6(3)(b)' },
  { value: 'patterns', label: 'It detects decision-making patterns or deviations and does not replace or influence a human assessment without proper human review', ref: 'Art 6(3)(c)' },
  { value: 'preparatory', label: 'It performs a preparatory task for an assessment relevant to an Annex III use case', ref: 'Art 6(3)(d)' },
];

export const TRANSPARENCY = [
  { value: 'interaction', label: 'It interacts directly with people (for example a chatbot or voice assistant)', ref: 'Art 50(1)', roles: ['provider', 'manufacturer'] },
  { value: 'synthetic', label: 'It generates synthetic audio, image, video or text content', ref: 'Art 50(2)', roles: ['provider', 'manufacturer'] },
  { value: 'emotion_biometric', label: 'It performs emotion recognition or biometric categorisation', ref: 'Art 50(3)', roles: ['deployer'] },
  { value: 'deepfake_text', label: 'It is used to publish deepfakes, or AI-generated text on matters of public interest', ref: 'Art 50(4)', roles: ['deployer'] },
];

export const GPAI = [
  { value: 'no', label: 'No, I do not provide a general-purpose AI model' },
  { value: 'model', label: 'Yes, I provide a general-purpose AI model (trained on broad data, capable of many tasks)' },
  { value: 'systemic', label: 'Yes, and it has systemic risk (training compute above 10^25 FLOPs, or designated by the Commission)' },
];

const yesNo = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

// Question flow. `when` decides whether a question is shown given the answers so far.
export const QUESTIONS = [
  {
    id: 'role', type: 'single', title: 'What is your role?',
    help: 'Obligations under the AI Act depend on whether you build, use, import or distribute the system.',
    options: ROLES,
  },
  {
    id: 'euNexus', type: 'single', title: 'Is the AI system, or its output, placed on the market, put into service or used in the EU?',
    help: 'The Act applies to providers placing systems on the EU market wherever they are based, to deployers in the EU, and to non-EU operators whose output is used in the EU (Art 2(1)).',
    options: yesNo,
  },
  {
    id: 'exclusions', type: 'multi', title: 'Does any of these exclusions apply?',
    help: 'Select any that apply. Leave blank if none do.',
    options: EXCLUSIONS,
  },
  {
    id: 'prohibited', type: 'multi', title: 'Does the system do any of the following?',
    help: 'These practices are banned outright. Select any that apply, or leave blank if none do.',
    options: PROHIBITED,
  },
  {
    id: 'annexI', type: 'single', title: 'Is the AI a safety component of a regulated product, or itself such a product?',
    help: 'Covers products under EU harmonisation law listed in Annex I (machinery, toys, lifts, radio equipment, medical devices, vehicles and similar) where a third-party conformity assessment is required (Art 6(1)).',
    options: yesNo,
  },
  {
    id: 'annexIII', type: 'multi', title: 'Is the system intended for any of these high-risk use cases?',
    help: 'Annex III lists the use cases. Select any that apply, or leave blank if none do.',
    options: ANNEX_III, grouped: true,
  },
  {
    id: 'profiling', type: 'single', title: 'Does the system profile natural persons?',
    help: 'Profiling means automated processing of personal data to evaluate aspects of a person such as work performance, economic situation, health, preferences, behaviour or location. If it does, the Art 6(3) exemption is not available.',
    options: yesNo,
    when: (a) => has(a.annexIII),
  },
  {
    id: 'derogation', type: 'multi', title: 'Does an Art 6(3) condition apply? (only if it poses no significant risk to health, safety or fundamental rights)',
    help: 'If one of these applies you may be able to document that the system is not high-risk. Leave blank if none apply.',
    options: DEROGATIONS,
    when: (a) => has(a.annexIII) && a.profiling === 'no',
  },
  {
    id: 'transparency', type: 'multi', title: 'Do any transparency triggers apply?',
    help: 'Select any that apply, or leave blank if none do.',
    options: TRANSPARENCY,
  },
  {
    id: 'gpai', type: 'single', title: 'Do you provide a general-purpose AI model?',
    help: 'This is about the underlying model (such as a large language model), not an application built on top of someone else\'s model.',
    options: GPAI,
    when: (a) => a.role === 'provider',
  },
];

function has(v) { return Array.isArray(v) && v.length > 0; }

// ---------------------------------------------------------------- obligations

export const OBLIGATIONS = {
  literacy: [
    { ref: 'Art 4', text: 'Support AI literacy of staff and others operating or using AI on your behalf, in proportion to their role and context.' },
  ],
  prohibited: [
    { ref: 'Art 5', text: 'Do not place on the market, put into service or use the system. Redesign it or stop. Narrow exceptions exist for some practices (for example medical or safety uses of emotion recognition), so take legal advice before relying on one.' },
  ],
  highRiskProvider: [
    { ref: 'Art 9', text: 'Run a risk management system across the whole lifecycle.' },
    { ref: 'Art 10', text: 'Apply data governance to training, validation and test data (quality, representativeness, bias examination).' },
    { ref: 'Art 11, Annex IV', text: 'Prepare technical documentation before placing the system on the market.' },
    { ref: 'Art 12', text: 'Build in automatic event logging.' },
    { ref: 'Art 13', text: 'Give deployers clear instructions for use and information on capabilities and limits.' },
    { ref: 'Art 14', text: 'Design for effective human oversight.' },
    { ref: 'Art 15', text: 'Meet appropriate levels of accuracy, robustness and cybersecurity.' },
    { ref: 'Art 17', text: 'Operate a quality management system.' },
    { ref: 'Art 43', text: 'Complete the conformity assessment (internal control or notified body, depending on the use case).' },
    { ref: 'Arts 47-48', text: 'Draw up the EU declaration of conformity and affix the CE marking.' },
    { ref: 'Art 49', text: 'Register the system in the EU database before placing it on the market (Annex III systems).' },
    { ref: 'Arts 72-73', text: 'Monitor the system after release and report serious incidents.' },
  ],
  highRiskDeployer: [
    { ref: 'Art 26(1)', text: 'Use the system in line with the provider\'s instructions for use.' },
    { ref: 'Art 26(2)', text: 'Assign human oversight to people with the competence, training and authority to do it.' },
    { ref: 'Art 26(4)', text: 'Where you control the input data, make sure it is relevant and sufficiently representative.' },
    { ref: 'Art 26(5)', text: 'Monitor operation and inform the provider and authorities of risks and serious incidents.' },
    { ref: 'Art 26(6)', text: 'Keep the logs the system generates for at least six months.' },
    { ref: 'Art 26(7)', text: 'Inform workers\' representatives and affected workers before using the system in the workplace.' },
    { ref: 'Art 26(11)', text: 'Tell people that a high-risk system is being used to make or support decisions about them (Annex III systems).' },
    { ref: 'Art 27', text: 'Carry out a fundamental rights impact assessment if you are a public body, a private entity providing public services, or you deploy credit-scoring or life and health insurance pricing systems.' },
    { ref: 'Art 26(9)', text: 'Use the provider\'s information to support your GDPR data protection impact assessment where required.' },
    { ref: 'Art 86', text: 'Be ready to explain individual decisions to affected people on request.' },
    { ref: 'Art 25', text: 'Take care: if you put your name on the system, change its intended purpose or modify it substantially, you become its provider.' },
  ],
  highRiskImporter: [
    { ref: 'Art 23', text: 'Before placing on the market, verify the conformity assessment, technical documentation, CE marking and instructions for use, and that an authorised representative was appointed.' },
    { ref: 'Art 23', text: 'Show your name and contact address on the system or its packaging, keep documentation for 10 years, and cooperate with authorities.' },
  ],
  highRiskDistributor: [
    { ref: 'Art 24', text: 'Before making the system available, verify CE marking, the declaration of conformity and instructions for use.' },
    { ref: 'Art 24', text: 'Do not supply a system you believe is non-compliant. Take corrective action, inform the provider and authorities where there is a risk.' },
  ],
  derogation: [
    { ref: 'Art 6(4)', text: 'Document your assessment that the system is not high-risk before placing it on the market, and keep it available for authorities.' },
    { ref: 'Art 49(2)', text: 'Register the system in the EU database even though you consider it not high-risk.' },
    { ref: 'Art 80', text: 'Be aware that market surveillance authorities can challenge the classification and require compliance.' },
  ],
  gpaiModel: [
    { ref: 'Art 53(1)(a)-(b)', text: 'Keep technical documentation of the model and provide information to downstream providers.' },
    { ref: 'Art 53(1)(c)', text: 'Put in place a policy to comply with EU copyright law.' },
    { ref: 'Art 53(1)(d)', text: 'Publish a sufficiently detailed summary of the training content.' },
    { ref: 'Art 54', text: 'Appoint an authorised representative in the EU if you are established outside it.' },
  ],
  gpaiSystemic: [
    { ref: 'Art 52', text: 'Notify the Commission without delay, and within two weeks of meeting the systemic-risk threshold.' },
    { ref: 'Art 55', text: 'Evaluate the model including adversarial testing, assess and mitigate systemic risks, report serious incidents and ensure adequate cybersecurity.' },
  ],
  minimal: [
    { ref: 'Art 95', text: 'No specific obligations beyond AI literacy. Voluntary codes of conduct are encouraged.' },
  ],
};

export const TRANSPARENCY_OBLIGATIONS = {
  interaction: { ref: 'Art 50(1)', who: 'Providers', text: 'Design the system so people are told they are interacting with an AI system, unless that is obvious from the context.' },
  synthetic: { ref: 'Art 50(2)', who: 'Providers', text: 'Mark synthetic audio, image, video and text outputs in a machine-readable format so they can be detected as AI-generated.' },
  emotion_biometric: { ref: 'Art 50(3)', who: 'Deployers', text: 'Inform the people exposed to emotion recognition or biometric categorisation and process their personal data in line with data protection law.' },
  deepfake_text: { ref: 'Art 50(4)', who: 'Deployers', text: 'Disclose that deepfakes are artificially generated or manipulated, and disclose AI-generated text published to inform the public on matters of public interest (unless human-reviewed under editorial responsibility).' },
};

export const PENALTIES = {
  prohibited: 'Up to EUR 35 million or 7% of worldwide annual turnover, whichever is higher (Art 99(3)). For SMEs, whichever is lower.',
  other: 'Up to EUR 15 million or 3% of worldwide annual turnover for breaches of operator obligations, whichever is higher (Art 99(4)). For SMEs, whichever is lower.',
  gpai: 'Fines on general-purpose AI model providers of up to EUR 15 million or 3% of worldwide annual turnover (Art 101).',
};

export const TIERS = {
  out_of_scope: { label: 'Out of scope', tone: 'neutral', summary: 'Based on your answers the AI Act does not appear to apply.' },
  prohibited: { label: 'Prohibited', tone: 'critical', summary: 'This looks like a banned practice under Article 5.' },
  high_risk: { label: 'High-risk', tone: 'high', summary: 'This system is likely to be high-risk and carry the heaviest compliance duties.' },
  high_risk_exempt: { label: 'Annex III use case, possible exemption', tone: 'medium', summary: 'This is an Annex III use case but you may be able to document that it is not high-risk under Article 6(3).' },
  gpai: { label: 'General-purpose AI model', tone: 'medium', summary: 'You provide a general-purpose AI model, which carries its own obligations.' },
  limited: { label: 'Transparency obligations', tone: 'low', summary: 'The system triggers disclosure and labelling duties under Article 50.' },
  minimal: { label: 'Minimal risk', tone: 'low', summary: 'No specific AI Act obligations beyond AI literacy appear to apply.' },
};

export const CAVEATS = [
  'Several definitions are still being clarified through Commission guidelines and harmonised standards, so borderline cases can change.',
  'A system can sit in more than one category. This tool reports the highest and lists the others as additional layers.',
  'The AI Act sits alongside GDPR, product safety, consumer, employment and sector rules. Those are not assessed here.',
];
