import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read the JSON data
const data = JSON.parse(
  readFileSync(join(__dirname, '../crawler/formation-civique-data.json'), 'utf-8')
);

// Create a slug from a title
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Escape and quote YAML values to handle special characters like colons
function yamlValue(text) {
  // Escape double quotes and wrap in quotes
  return `"${text.replace(/"/g, '\\"')}"`;
}

// Map thematic titles to directory names
const thematicDirMap = {
  'Principes et valeurs de la République': 'principes-et-valeurs',
  'Système institutionnel et politique': 'systeme-institutionnel',
  'Droits et devoirs': 'droits-et-devoirs',
  'Histoire, géographie et culture': 'histoire-geographie-culture',
  'Vivre dans la société française': 'vivre-en-france',
};

// Create content directory structure
const contentDir = join(__dirname, 'src/content/docs');

// Generate index page
const indexContent = `---
title: Formation Civique
description: Bienvenue sur le site de la formation civique
template: splash
hero:
  title: Formation Civique
  tagline: Fiches thématiques pour comprendre les principes et valeurs de la République française
  actions:
    - text: Découvrir les fiches
      link: /principes-et-valeurs/
      icon: right-arrow
      variant: primary
---

## Les 5 thématiques

${data.mainPage.thematics
  .map(
    (thematic) => `
### ${thematic.title}

${thematic.description}
`
  )
  .join('\n')}
`;

writeFileSync(join(contentDir, 'index.mdx'), indexContent);
console.log('✓ Created index page');

// Group content pages by thematic and fiche
const contentByThematic = {};

data.contentPages.forEach((page) => {
  const thematicTitle = page.thematicTitle;
  const ficheTitle = page.ficheTitle;

  if (!contentByThematic[thematicTitle]) {
    contentByThematic[thematicTitle] = {};
  }

  if (!contentByThematic[thematicTitle][ficheTitle]) {
    contentByThematic[thematicTitle][ficheTitle] = [];
  }

  contentByThematic[thematicTitle][ficheTitle].push(page);
});

// Generate pages for each thematic
Object.entries(contentByThematic).forEach(([thematicTitle, fiches]) => {
  const thematicDir = thematicDirMap[thematicTitle];
  if (!thematicDir) {
    console.warn(`No directory mapping for thematic: ${thematicTitle}`);
    return;
  }

  const thematicPath = join(contentDir, thematicDir);
  mkdirSync(thematicPath, { recursive: true });

  // Generate pages for each fiche
  Object.entries(fiches).forEach(([ficheTitle, pages]) => {
    const ficheSlug = slugify(ficheTitle);

    // If there's only one page, create a single file
    if (pages.length === 1) {
      const page = pages[0];
      const content = `---
title: ${yamlValue(ficheTitle)}
description: ${yamlValue(page.subPageTitle || ficheTitle)}
---

${page.markdown}
`;

      writeFileSync(join(thematicPath, `${ficheSlug}.md`), content);
      console.log(`✓ Created ${thematicDir}/${ficheSlug}.md`);
    } else {
      // If there are multiple pages, create a directory with index and subpages
      const ficheDir = join(thematicPath, ficheSlug);
      mkdirSync(ficheDir, { recursive: true });

      pages.forEach((page, index) => {
        const subPageSlug = index === 0 ? 'index' : slugify(page.subPageTitle);
        const content = `---
title: ${yamlValue(page.subPageTitle || ficheTitle)}
description: ${yamlValue(page.subPageTitle || ficheTitle)}
---

${page.markdown}
`;

        writeFileSync(join(ficheDir, `${subPageSlug}.md`), content);
        console.log(`✓ Created ${thematicDir}/${ficheSlug}/${subPageSlug}.md`);
      });
    }
  });
});

console.log('\n✅ All pages generated successfully!');
console.log(`Total pages created: ${data.contentPages.length + 1} (including index)`);
