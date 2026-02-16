import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { CrawlerData, ContentPage } from './types.js';
import { yamlValue, thematicDirMap, thematicIdPrefixMap, quizThematicIds } from './utils.js';

export function generateQuizPages(
  data: CrawlerData,
  contentDir: string,
  rootDir: string
): void {
  const quizzesDir = join(rootDir, 'src/data/quizzes');
  mkdirSync(quizzesDir, { recursive: true });

  // Generate quiz data from LLM-generated questions if available
  const quizDataPath = join(rootDir, '../crawler/formation-civique-data-with-quizz.json');

  if (existsSync(quizDataPath)) {
    console.log('\n📝 Generating quiz files from formation-civique-data-with-quizz.json...');
    const quizData: CrawlerData = JSON.parse(readFileSync(quizDataPath, 'utf-8'));

    // Aggregate questions by thematic
    const questionsByThematic: Record<
      string,
      { title: string; questions: ContentPage['questions'] }
    > = {};

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

      questionsByThematic[thematicDir].questions!.push(...page.questions);
    });

    // Write quiz JSON files
    Object.entries(questionsByThematic).forEach(([thematicDir, { title, questions }]) => {
      const prefix = thematicIdPrefixMap[thematicDir];
      const description =
        data.mainPage.thematics.find((t) => t.title === title)?.description || title;

      const quizJson = {
        id: thematicDir,
        title,
        description: `Testez vos connaissances : ${description}`,
        questions: questions!.map((q, i) => ({
          id: `${prefix}-q${i + 1}`,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
      };

      writeFileSync(
        join(quizzesDir, `${thematicDir}.json`),
        JSON.stringify(quizJson, null, 2) + '\n'
      );
      console.log(`✓ Generated ${thematicDir}.json (${questions!.length} questions)`);
    });
  } else {
    console.log(
      '\n⚠ No formation-civique-data-with-quizz.json found, skipping quiz generation from LLM data.'
    );
  }

  // Generate quiz pages from quiz JSON data
  const quizContentDir = join(contentDir, 'quiz');
  mkdirSync(quizContentDir, { recursive: true });

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
  quizThematicIds.forEach((quizId) => {
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
}
