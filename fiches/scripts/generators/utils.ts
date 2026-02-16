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
