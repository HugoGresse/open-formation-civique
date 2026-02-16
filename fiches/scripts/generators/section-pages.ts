import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { ContentPage, CrawlerData } from './types.js';
import { slugify, yamlValue, thematicDirMap } from './utils.js';

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

    const description =
      data.mainPage.thematics.find((t) => t.title === thematicTitle)?.description || thematicTitle;

    const sectionIndexContent = `---
title: ${yamlValue(thematicTitle)}
description: ${yamlValue(description)}
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

      const ficheDescription = pages[0]?.subPageTitle || ficheTitle;

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
