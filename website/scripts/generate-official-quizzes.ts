import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { OpenRouter } from '@openrouter/sdk';
import pLimit from 'p-limit';
import cliProgress from 'cli-progress';
import type { CrawlerData, Question } from './generators/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CRAWLER_DATA_PATH = join(__dirname, '../../crawler/formation-civique-data.json');
const MODEL = 'google/gemini-3-pro-preview';
const BATCH_SIZE = 6;
const MAX_CONTEXT_CHARS = 30_000;

const SOURCES = [
  { key: 'csp', label: 'CSP' },
  { key: 'cr', label: 'CR' },
] as const;

/** Normalize thematic titles to match the crawler data keys */
const TITLE_NORMALIZE: Record<string, string> = {
  'Histoire géographie et culture': 'Histoire, géographie et culture',
};

const SYSTEM_PROMPT = `Tu es un expert en formation civique française. À partir des questions officielles fournies et du contenu pédagogique de référence, génère les réponses possibles (QCM) pour chaque question.

Règles :
- Pour chaque question fournie, génère entre 2 et 5 options de réponse
- Une seule réponse correcte par question
- Les mauvaises réponses doivent être plausibles mais clairement fausses
- L'explication doit être concise et pédagogique
- Utilise le contenu pédagogique fourni comme référence pour les réponses correctes
- Le texte de la question doit rester EXACTEMENT identique à celui fourni

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ni après, au format :
[
  {
    "question": "Le texte exact de la question fournie ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Explication courte de la bonne réponse."
  }
]`;

type OfficialQuizOutput = Record<string, { questions: Question[] }>;

function normalizeTitle(title: string): string {
  return TITLE_NORMALIZE[title] || title;
}

function extractTextContent(markdown: string): string {
  return markdown
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/^> \*\*Références\*\*[\s\S]*$/m, '')
    .replace(/^_Source photo.*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replaceAll('* * *', '')
    .trim();
}

function loadContextByThematic(crawlerData: CrawlerData): Record<string, string> {
  const contextMap: Record<string, string> = {};

  for (const page of crawlerData.contentPages) {
    const title = page.thematicTitle;
    const text = extractTextContent(page.markdown);
    if (!contextMap[title]) {
      contextMap[title] = '';
    }
    contextMap[title] += `\n\n--- ${page.ficheTitle || page.title} ---\n${text}`;
  }

  for (const [title, content] of Object.entries(contextMap)) {
    if (content.length > MAX_CONTEXT_CHARS) {
      contextMap[title] = content.substring(0, MAX_CONTEXT_CHARS) + '\n[...contenu tronqué...]';
    }
  }

  return contextMap;
}

async function generateAnswersForBatch(
  openRouter: OpenRouter,
  questions: string[],
  thematicContext: string,
  thematicTitle: string,
): Promise<Question[]> {
  const questionsText = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');

  const completion = await openRouter.chat.send({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Thématique : "${thematicTitle}"

Contenu pédagogique de référence :
${thematicContext}

Questions officielles auxquelles il faut générer les réponses possibles :
${questionsText}`,
      },
    ],
    stream: false,
    temperature: 0.3,
    reasoning: { effort: 'medium' },
  });

  const raw = completion.choices[0].message.content!.trim();

  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`No JSON array found in response: ${raw.substring(0, 200)}`);
  }

  const parsed: Question[] = JSON.parse(jsonMatch[0]);

  if (parsed.length !== questions.length) {
    throw new Error(`Expected ${questions.length} questions, got ${parsed.length}`);
  }

  for (const q of parsed) {
    if (
      !q.question ||
      !Array.isArray(q.options) ||
      q.options.length < 2 ||
      q.options.length > 5 ||
      typeof q.correctAnswer !== 'number' ||
      q.correctAnswer < 0 ||
      q.correctAnswer >= q.options.length ||
      !q.explanation
    ) {
      throw new Error(`Invalid question structure: ${JSON.stringify(q).substring(0, 200)}`);
    }

    // Shuffle options so the correct answer isn't always first
    const correctOption = q.options[q.correctAnswer];
    const indices = q.options.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    q.options = indices.map((i) => q.options[i]);
    q.correctAnswer = q.options.indexOf(correctOption);
  }

  return parsed;
}

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY environment variable is required');
    process.exit(1);
  }

  const openRouter = new OpenRouter({ apiKey });
  const crawlerData: CrawlerData = JSON.parse(readFileSync(CRAWLER_DATA_PATH, 'utf-8'));
  const contextMap = loadContextByThematic(crawlerData);
  const limit = pLimit(10);

  // Count total questions to process across both sources
  let totalQuestions = 0;
  let alreadyDone = 0;

  for (const source of SOURCES) {
    const inputPath = join(__dirname, `../../crawler/officials-${source.key}-questions.json`);
    if (!existsSync(inputPath)) continue;

    const input: Record<string, string[]> = JSON.parse(readFileSync(inputPath, 'utf-8'));
    const outputPath = join(
      __dirname,
      `../../crawler/officials-${source.key}-questions-with-answers.json`,
    );
    const existing: OfficialQuizOutput = existsSync(outputPath)
      ? JSON.parse(readFileSync(outputPath, 'utf-8'))
      : {};

    for (const [rawTitle, questions] of Object.entries(input)) {
      const title = normalizeTitle(rawTitle);
      const existingQuestions = new Set(
        (existing[title]?.questions || []).map((q) => q.question),
      );
      const remaining = questions.filter((q) => !existingQuestions.has(q));
      totalQuestions += remaining.length;
      alreadyDone += questions.length - remaining.length;
    }
  }

  console.log(
    `\n📊 ${totalQuestions + alreadyDone} questions total, ${alreadyDone} already done, ${totalQuestions} to process\n`,
  );

  if (totalQuestions === 0) {
    console.log('✅ Nothing to process!');
    return;
  }

  const bar = new cliProgress.SingleBar({
    format: '{bar} {percentage}% | {value}/{total} | {status}',
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true,
  });

  let processed = 0;
  let failed = 0;

  bar.start(totalQuestions, 0, { status: 'Starting...' });

  for (const source of SOURCES) {
    const inputPath = join(__dirname, `../../crawler/officials-${source.key}-questions.json`);
    if (!existsSync(inputPath)) {
      console.error(`\n⚠ ${inputPath} not found, skipping ${source.label}`);
      continue;
    }

    const input: Record<string, string[]> = JSON.parse(readFileSync(inputPath, 'utf-8'));
    const outputPath = join(
      __dirname,
      `../../crawler/officials-${source.key}-questions-with-answers.json`,
    );

    const output: OfficialQuizOutput = existsSync(outputPath)
      ? JSON.parse(readFileSync(outputPath, 'utf-8'))
      : {};

    for (const [rawTitle, questions] of Object.entries(input)) {
      const title = normalizeTitle(rawTitle);

      if (!output[title]) {
        output[title] = { questions: [] };
      }

      const existingQuestions = new Set(output[title].questions.map((q) => q.question));
      const remaining = questions.filter((q) => !existingQuestions.has(q));

      if (remaining.length === 0) continue;

      const context = contextMap[title] || '';
      if (!context) {
        console.error(`\n⚠ No context found for thematic "${title}"`);
      }

      // Process in batches with concurrency
      const batches: string[][] = [];
      for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
        batches.push(remaining.slice(i, i + BATCH_SIZE));
      }

      const batchTasks = batches.map((batch) =>
        limit(async () => {
          const label = `${source.label} - ${title.substring(0, 30)}`;
          try {
            const generated = await generateAnswersForBatch(openRouter, batch, context, title);
            output[title].questions.push(...generated);
            processed += batch.length;
            bar.increment(batch.length, { status: `✅ ${label}` });

            // Save after each batch for resume
            writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
          } catch (err) {
            failed += batch.length;
            bar.increment(batch.length, { status: `❌ ${label}` });
            console.error(
              `\n❌ Failed batch "${label}": ${err instanceof Error ? err.message : err}`,
            );
          }
        }),
      );

      await Promise.all(batchTasks);
    }
  }

  bar.stop();

  console.log(`\n📊 Results:`);
  console.log(`  Total questions: ${totalQuestions + alreadyDone}`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Already done: ${alreadyDone}`);
  console.log(`  Failed: ${failed}`);
  console.log(`\n✅ Done!`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
