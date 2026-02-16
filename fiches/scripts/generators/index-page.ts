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
title: Quizz et fiches complètes et gratuits.
description: Bienvenue sur le site de la formation civique
template: splash
hero:
  title: Open-Formation-Civique.fr
  tagline: Fiches thématiques et quiz, gratuits et open source, pour comprendre les principes et les valeurs de la République française.
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
next: false
prev: false
---

import { LinkCard, CardGrid, Card } from '@astrojs/starlight/components';

## Les 5 thématiques

<CardGrid>
  ${thematicCards}
</CardGrid>

## À propos

<CardGrid>
  <Card title="Open Source et gratuit" icon="github">
    Ce projet est entièrement open source et gratuit. Le code source est disponible sur [GitHub](https://github.com/HugoGresse/open-formation-civique). Les contributions sont les bienvenues !
  </Card>
  <Card title="RGPD et sans cookie" icon="approve-check">
    Ce site respecte votre vie privée. Aucun cookie n'est utilisé et aucune donnée personnelle n'est collectée. Les analytics sont anonymes et conformes au RGPD.
  </Card>
  <Card title="Quiz générés par IA" icon="puzzle">
    Les questions des quiz sont générées automatiquement par à partir du contenu des fiches. Elles peuvent contenir quelques erreurs ou imprécisions.
  </Card>
  <Card title="Source officielle" icon="open-book">
    Les fiches sont issues du site officiel du [Ministère de l'Intérieur](https://formation-civique.interieur.gouv.fr/fiches-par-thematiques/).
  </Card>
</CardGrid>
`;

  writeFileSync(join(contentDir, 'index.mdx'), indexContent);
  console.log('✓ Created index page');
}
