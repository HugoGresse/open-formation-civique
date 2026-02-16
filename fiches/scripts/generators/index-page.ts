import { writeFileSync } from 'fs';
import { join } from 'path';
import type { CrawlerData } from './types.js';
import { thematicDirMap } from './utils.js';

export function generateIndexPage(data: CrawlerData, contentDir: string): void {
  const thematicCards = data.mainPage.thematics
    .map(
      (thematic) =>
        `<LinkCard title=${JSON.stringify(thematic.title)} description=${JSON.stringify(thematic.description)} href="${thematicDirMap[thematic.title]}/" />`
    )
    .join('\n  ');

  const indexContent = `---
title: Formation Civique
description: Bienvenue sur le site de la formation civique
template: splash
hero:
  title: Formation Civique
  tagline: Fiches thématiques pour comprendre les principes et valeurs de la République française
  actions:
    - text: Découvrir les fiches
      link: principes-et-valeurs/
      icon: right-arrow
      variant: primary
    - text: Tester vos connaissances
      link: /quiz/
      icon: pencil
      variant: secondary
    - text: Télécharger en PDF
      link: /formation-civique.pdf
      icon: document
      variant: minimal
      attrs:
        download: true
---

import { LinkCard, CardGrid } from '@astrojs/starlight/components';

## Les 5 thématiques

<CardGrid>
  ${thematicCards}
</CardGrid>
`;

  writeFileSync(join(contentDir, 'index.mdx'), indexContent);
  console.log('✓ Created index page');
}
