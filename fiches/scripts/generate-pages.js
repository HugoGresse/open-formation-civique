import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

// Read the JSON data
const data = JSON.parse(
  readFileSync(join(__dirname, '../../crawler/formation-civique-data.json'), 'utf-8')
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

// ID prefixes for quiz questions
const thematicIdPrefixMap = {
  'principes-et-valeurs': 'pv',
  'systeme-institutionnel': 'si',
  'droits-et-devoirs': 'dd',
  'histoire-geographie-culture': 'hgc',
  'vivre-en-france': 'vf',
};

const PDF_LINK = `[Télécharger toutes les fiches en PDF](/formation-civique.pdf)`;

// Create content directory structure
const contentDir = join(ROOT_DIR, 'src/content/docs');
mkdirSync(contentDir, { recursive: true });

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

## Les 5 thématiques

${data.mainPage.thematics
  .map(
    (thematic) => `
### [${thematic.title}](${thematicDirMap[thematic.title]}/)

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

  // Generate section index page
  const ficheLinks = Object.keys(fiches)
    .map((ficheTitle) => `- [${ficheTitle}](${slugify(ficheTitle)}/)`)
    .join('\n');

  const sectionIndexContent = `---
title: ${yamlValue(thematicTitle)}
description: ${yamlValue(data.mainPage.thematics.find((t) => t.title === thematicTitle)?.description || thematicTitle)}
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
    const combinedMarkdown = pages.map(page => page.markdown).join('\n\n---\n\n')
      .replace(/^##### /gm, '#### ')
      .replace(/^#### /gm, '### ')
      .replace(/^### /gm, '## ');

    // Use the first page's description or the fiche title
    const description = pages[0]?.subPageTitle || ficheTitle;

    const content = `---
title: ${yamlValue(ficheTitle)}
description: ${yamlValue(description)}
---

${combinedMarkdown}

---
`;

    writeFileSync(join(thematicPath, `${ficheSlug}.md`), content);
    console.log(`✓ Created ${thematicDir}/${ficheSlug}.md (${pages.length} section${pages.length > 1 ? 's' : ''})`);
  });
});

// Generate quiz data from LLM-generated questions if available
const quizDataPath = join(__dirname, '../../crawler/formation-civique-data-with-quizz.json');
const quizzesDir = join(ROOT_DIR, 'src/data/quizzes');
mkdirSync(quizzesDir, { recursive: true });

if (existsSync(quizDataPath)) {
  console.log('\n📝 Generating quiz files from formation-civique-data-with-quizz.json...');
  const quizData = JSON.parse(readFileSync(quizDataPath, 'utf-8'));

  // Aggregate questions by thematic
  const questionsByThematic = {};

  quizData.contentPages.forEach((page) => {
    if (!page.questions || page.questions.length === 0) return;

    const thematicDir = thematicDirMap[page.thematicTitle];
    if (!thematicDir) return;

    if (!questionsByThematic[thematicDir]) {
      questionsByThematic[thematicDir] = {
        title: page.thematicTitle,
        questions: [],
      };
    }

    questionsByThematic[thematicDir].questions.push(...page.questions);
  });

  // Write quiz JSON files
  Object.entries(questionsByThematic).forEach(([thematicDir, { title, questions }]) => {
    const prefix = thematicIdPrefixMap[thematicDir];
    const description = data.mainPage.thematics.find((t) => t.title === title)?.description || title;

    const quizJson = {
      id: thematicDir,
      title,
      description: `Testez vos connaissances : ${description}`,
      questions: questions.map((q, i) => ({
        id: `${prefix}-q${i + 1}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
    };

    writeFileSync(join(quizzesDir, `${thematicDir}.json`), JSON.stringify(quizJson, null, 2) + '\n');
    console.log(`✓ Generated ${thematicDir}.json (${questions.length} questions)`);
  });
} else {
  console.log('\n⚠ No formation-civique-data-with-quizz.json found, skipping quiz generation from LLM data.');
}

// Generate quiz pages from quiz JSON data
const quizContentDir = join(contentDir, 'quiz');
mkdirSync(quizContentDir, { recursive: true });

const quizFiles = ['principes-et-valeurs', 'systeme-institutionnel', 'droits-et-devoirs', 'histoire-geographie-culture', 'vivre-en-france'];

// Quiz index page with QuizSummary component
const quizIndexContent = `---
title: "Quiz"
description: "Testez vos connaissances sur la formation civique"
tableOfContents: false
---

import QuizSummary from '../../../components/QuizSummary.astro';

<QuizSummary />
`;

writeFileSync(join(quizContentDir, 'index.mdx'), quizIndexContent);
console.log('✓ Created quiz/index.mdx');

// Individual quiz pages
quizFiles.forEach((quizId) => {
  const quizFilePath = join(quizzesDir, `${quizId}.json`);
  if (!existsSync(quizFilePath)) {
    console.warn(`⚠ Quiz file not found: ${quizId}.json, skipping`);
    return;
  }

  const quizFileData = JSON.parse(readFileSync(quizFilePath, 'utf-8'));

  const quizPageContent = `---
title: ${yamlValue(quizFileData.title)}
description: ${yamlValue(quizFileData.description)}
tableOfContents: false
---

import Quiz from '../../../components/Quiz.astro';
import quizData from '../../../data/quizzes/${quizId}.json';

<Quiz quizData={JSON.stringify(quizData)} />
`;

  writeFileSync(join(quizContentDir, `${quizId}.mdx`), quizPageContent);
  console.log(`✓ Created quiz/${quizId}.mdx`);
});

console.log('\n✅ All pages generated successfully!');
console.log(`Total pages created: ${data.contentPages.length + 1 + quizFiles.length + 1} (including index and quiz pages)`);
