import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { ContentPage, CrawlerData } from './types.js';
import { slugify, yamlValue, thematicDirMap } from './utils.js';

/** Map thematic titles to SEO-optimized descriptions for section index pages */
const thematicSeoDescriptions: Record<string, string> = {
  'Principes et valeurs de la République':
    'Découvrez les principes fondamentaux et les valeurs de la République française : laïcité, liberté, égalité, fraternité, démocratie. Fiches thématiques et quiz gratuits.',
  'Système institutionnel et politique':
    'Comprenez le système institutionnel et politique français : le Président de la République, le Parlement, le gouvernement et les collectivités territoriales. Fiches et quiz gratuits.',
  'Droits et devoirs':
    "Connaissez vos droits et devoirs en France : droit de vote, liberté d'expression, obligation scolaire, respect des lois. Fiches thématiques et quiz gratuits.",
  'Histoire, géographie et culture':
    "Explorez l'histoire, la géographie et la culture françaises : repères historiques, régions, patrimoine culturel et artistique. Fiches thématiques et quiz gratuits.",
  'Vivre dans la société française':
    'Tout savoir sur la vie en France : santé, éducation, travail, logement et intégration. Fiches thématiques et quiz gratuits.',
};

export function generateSectionPages(data: CrawlerData, contentDir: string): void {
  // Group content pages by thematic and fiche
  const contentByThematic: Record<string, Record<string, ContentPage[]>> = {};

  data.contentPages.forEach((page) => {
    if (!contentByThematic[page.thematicTitle]) {
      contentByThematic[page.thematicTitle] = {};
    }
    if (!contentByThematic[page.thematicTitle][page.ficheTitle]) {
      contentByThematic[page.thematicTitle][page.ficheTitle] = [];
    }
    contentByThematic[page.thematicTitle][page.ficheTitle].push(page);
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

    // Generate section index page
    const ficheLinks = Object.keys(fiches)
      .map((ficheTitle) => `- [${ficheTitle}](${slugify(ficheTitle)}/)`)
      .join('\n');

    const rawDescription =
      data.mainPage.thematics.find((t) => t.title === thematicTitle)?.description || thematicTitle;
    const seoDescription = thematicSeoDescriptions[thematicTitle] || rawDescription;

    const sectionIndexContent = `---
title: ${yamlValue(thematicTitle)}
description: ${yamlValue(seoDescription)}
sidebar:
  label: ${yamlValue(thematicTitle)}
---

${ficheLinks}
`;

    writeFileSync(join(thematicPath, 'index.md'), sectionIndexContent);
    console.log(`✓ Created ${thematicDir}/index.md`);

    // Generate pages for each fiche - combine all sub-pages into one
    Object.entries(fiches).forEach(([ficheTitle, pages]) => {
      const ficheSlug = slugify(ficheTitle);

      // Combine all pages into a single markdown content, bumping headings up one level
      const combinedMarkdown = pages
        .map((page) => page.markdown)
        .join('\n\n---\n\n')
        .replace(/^##### /gm, '#### ')
        .replace(/^#### /gm, '### ')
        .replace(/^### /gm, '## ');

      // Build a richer description for individual fiche pages
      const ficheShortDesc = pages[0]?.subPageTitle || ficheTitle;
      const ficheDescription = `${ficheTitle} – ${ficheShortDesc}. Fiche thématique de formation civique sur ${thematicTitle}.`;

      const content = `---
title: ${yamlValue(ficheTitle)}
description: ${yamlValue(ficheDescription)}
---

${combinedMarkdown}

---
`;

      writeFileSync(join(thematicPath, `${ficheSlug}.md`), content);
      console.log(
        `✓ Created ${thematicDir}/${ficheSlug}.md (${pages.length} section${pages.length > 1 ? 's' : ''})`
      );
    });
  });
}
