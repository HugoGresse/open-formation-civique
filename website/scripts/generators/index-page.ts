import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { CrawlerData, Question } from './types.js';
import { thematicDirMap } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function countQuestions(): { thematic: number; csp: number; cr: number } {
  let thematic = 0;
  let csp = 0;
  let cr = 0;

  const quizDataPath = join(__dirname, '../../../crawler/formation-civique-data-with-quizz.json');
  if (existsSync(quizDataPath)) {
    const quizData: CrawlerData = JSON.parse(readFileSync(quizDataPath, 'utf-8'));
    for (const page of quizData.contentPages) {
      thematic += page.questions?.length || 0;
    }
  }

  for (const [key, target] of [['csp', 'csp'], ['cr', 'cr']] as const) {
    const path = join(__dirname, `../../../crawler/officials-${key}-questions-with-answers.json`);
    if (!existsSync(path)) continue;
    const data: Record<string, { questions: Question[] }> = JSON.parse(readFileSync(path, 'utf-8'));
    const count = Object.values(data).reduce((sum, { questions }) => sum + questions.length, 0);
    if (target === 'csp') csp = count;
    else cr = count;
  }

  return { thematic, csp, cr };
}

export function generateIndexPage(data: CrawlerData, contentDir: string): void {
  const counts = countQuestions();
  const totalQuestions = counts.thematic + counts.csp + counts.cr;

  const thematicCards = data.mainPage.thematics
    .map(
      (thematic) =>
        `<LinkCard title=${JSON.stringify(thematic.title)} description=${JSON.stringify(thematic.description)} href="${thematicDirMap[thematic.title]}/" />`
    )
    .join('\n  ');

  const indexContent = `---
title: "Formation Civique 2026 – Fiches thématiques et Quiz gratuits"
description: "Préparez votre formation civique avec ${totalQuestions > 0 ? totalQuestions + ' questions de quiz,' : ''} des fiches thématiques gratuites et les quiz officiels CSP et Carte de Résident. Valeurs de la République, institutions, droits et devoirs."
template: splash
hero:
  title: Formation Civique Gratuite
  tagline: "Fiches thématiques et quiz gratuits pour comprendre les valeurs de la République française et préparer votre formation civique (CSP, Carte de Résident)."
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

## Quiz de formation civique

${totalQuestions > 0 ? `Plus de **${totalQuestions} questions** pour tester vos connaissances sur la formation civique.` : ''}

<CardGrid>
  <LinkCard title="Quiz thématiques" description="${counts.thematic} questions générées à partir du contenu des fiches" href="/quiz/" />
  <LinkCard title="Quiz officiels CSP" description="${counts.csp} questions officielles du Contrat de Séjour Pluriannuel" href="/quiz/csp-principes-et-valeurs/" />
  <LinkCard title="Quiz officiels CR" description="${counts.cr} questions officielles de la Carte de Résident" href="/quiz/cr-principes-et-valeurs/" />
</CardGrid>

## Les 5 thématiques de la formation civique

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
    Les questions des quiz thématiques sont générées automatiquement à partir du contenu des fiches. Elles peuvent contenir quelques erreurs ou imprécisions.
  </Card>
  <Card title="Source officielle" icon="open-book">
    Les fiches sont issues du site officiel du [Ministère de l'Intérieur](https://formation-civique.interieur.gouv.fr/fiches-par-thematiques/).
  </Card>
</CardGrid>

## Questions fréquentes sur la formation civique

**Qu'est-ce que la formation civique ?**

La formation civique est une obligation pour les étrangers qui signent un Contrat d'Intégration Républicaine (CIR) en France. Elle vise à faire connaître les valeurs de la République française, les institutions, les droits et les devoirs des citoyens.

**Qui doit suivre la formation civique ?**

Tout étranger primo-arrivant signataire d'un Contrat d'Intégration Républicaine (CIR) doit suivre la formation civique. Elle est également utile pour les candidats à la naturalisation française ou à la Carte de Résident (10 ans).

**Comment préparer le quiz de la formation civique ?**

Utilisez nos fiches thématiques pour réviser les 5 grands thèmes : principes et valeurs de la République, système institutionnel, droits et devoirs, histoire et géographie, et vivre dans la société française. Entraînez-vous ensuite avec nos quiz gratuits, dont les quiz officiels CSP et CR.

**Les ressources sont-elles gratuites ?**

Oui, toutes les ressources de ce site sont entièrement gratuites. Vous pouvez également télécharger l'intégralité des fiches en [format PDF](/formation-civique.pdf).
`;

  writeFileSync(join(contentDir, 'index.mdx'), indexContent);
  console.log('✓ Created index page');
}
