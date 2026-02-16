/** Create a URL-safe slug from a title */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/** Escape and quote YAML values to handle special characters like colons */
export function yamlValue(text: string): string {
  return `"${text.replace(/"/g, '\\"')}"`;
}

/** Map thematic titles to directory names */
export const thematicDirMap: Record<string, string> = {
  'Principes et valeurs de la République': 'principes-et-valeurs',
  'Système institutionnel et politique': 'systeme-institutionnel',
  'Droits et devoirs': 'droits-et-devoirs',
  'Histoire, géographie et culture': 'histoire-geographie-culture',
  'Vivre dans la société française': 'vivre-en-france',
};

/** ID prefixes for quiz questions */
export const thematicIdPrefixMap: Record<string, string> = {
  'principes-et-valeurs': 'pv',
  'systeme-institutionnel': 'si',
  'droits-et-devoirs': 'dd',
  'histoire-geographie-culture': 'hgc',
  'vivre-en-france': 'vf',
};

/** All quiz thematic IDs */
export const quizThematicIds = Object.keys(thematicIdPrefixMap);

/** Map for official CSP quiz directories */
export const officialCspDirMap: Record<string, string> = {
  'Principes et valeurs de la République': 'csp-principes-et-valeurs',
  'Système institutionnel et politique': 'csp-systeme-institutionnel',
  'Droits et devoirs': 'csp-droits-et-devoirs',
  'Histoire, géographie et culture': 'csp-histoire-geographie-culture',
  'Vivre dans la société française': 'csp-vivre-en-france',
  'Mise en situation': 'csp-mise-en-situation'
};

/** Map for official CR quiz directories */
export const officialCrDirMap: Record<string, string> = {
  'Principes et valeurs de la République': 'cr-principes-et-valeurs',
  'Système institutionnel et politique': 'cr-systeme-institutionnel',
  'Droits et devoirs': 'cr-droits-et-devoirs',
  'Mise en situation': 'cr-mise-en-sitation'
};

/** ID prefixes for official quiz questions */
export const officialIdPrefixMap: Record<string, string> = {
  'csp-principes-et-valeurs': 'csp-pv',
  'csp-systeme-institutionnel': 'csp-si',
  'csp-droits-et-devoirs': 'csp-dd',
  'csp-histoire-geographie-culture': 'csp-hgc',
  'csp-vivre-en-france': 'csp-vf',
  'csp-mise-en-situation': 'csp-ms',
  'cr-principes-et-valeurs': 'cr-pv',
  'cr-systeme-institutionnel': 'cr-si',
  'cr-droits-et-devoirs': 'cr-dd',
  'cr-mise-en-situation': 'cr-ms',
};

/** All quiz IDs including official quizzes */
export const allQuizThematicIds = [...quizThematicIds, ...Object.keys(officialIdPrefixMap)];
