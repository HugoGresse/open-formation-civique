import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { OpenRouter } from '@openrouter/sdk';
import pLimit from 'p-limit';
import cliProgress from 'cli-progress';
import type { CrawlerData, ContentPage, Question } from './generators/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const INPUT_PATH = join(__dirname, '../../crawler/formation-civique-data.json');
const OUTPUT_PATH = join(__dirname, '../../crawler/formation-civique-data-with-quizz.json');
const MODEL = 'google/gemini-3-pro-preview';

const SYSTEM_PROMPT = `Tu es un expert en formation civique française. À partir du contenu pédagogique fourni, génère des questions à choix multiples (QCM) en français.

Règles :
- Génère entre 2 et 4 questions grand maximum selon la richesse du contenu
- Chaque question doit avoir de 2 à 5 options de réponse (en fonction du contenu)
- Une seule réponse correcte par question
- Les questions doivent être variées et couvrir les points clés du contenu à destinations des réfugiés
- Les mauvaises réponses doivent être plausibles mais clairement fausses
- L'explication doit être concise et pédagogique
- Ne pose pas de questions sur les images ou les sources/références

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ni après, au format :
[
  {
    "question": "La question en français ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Explication courte de la bonne réponse."
  }
]`;

function loadData(): CrawlerData {
  if (existsSync(OUTPUT_PATH)) {
    console.log('📂 Resuming from existing output file...');
    return JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'));
  }

  console.log('📂 Starting fresh from source data...');
  return JSON.parse(readFileSync(INPUT_PATH, 'utf-8'));
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

async function generateQuestions(openRouter: OpenRouter, markdown: string, title: string): Promise<Question[]> {
  const textContent = extractTextContent(markdown);

  const completion = await openRouter.chat.send({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Contenu de la fiche "${title}" :\n\n${textContent}` },
    ],
    stream: false,
    temperature: 0.4,
    reasoning: { effort: 'medium' },
  });

  const raw = completion.choices[0].message.content!.trim();

  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`No JSON array found in response: ${raw.substring(0, 200)}`);
  }

  const questions: Question[] = JSON.parse(jsonMatch[0]);

  if (questions.length < 2 || questions.length > 4) {
    throw new Error(`Expected 2-4 questions, got ${questions.length}`);
  }

  for (const q of questions) {
    if (!q.question || !Array.isArray(q.options) || q.options.length < 2 || q.options.length > 5 ||
        typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= q.options.length ||
        !q.explanation) {
      throw new Error(`Invalid question structure: ${JSON.stringify(q).substring(0, 200)}`);
    }
  }

  return questions;
}

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY environment variable is required');
    process.exit(1);
  }

  const openRouter = new OpenRouter({ apiKey });
  const data = loadData();
  const limit = pLimit(10);

  const totalPages = data.contentPages.length;
  const alreadyDone = data.contentPages.filter((p) => p.questions && p.questions.length > 0).length;
  const toProcess = totalPages - alreadyDone;

  const bar = new cliProgress.SingleBar({
    format: '{bar} {percentage}% | {value}/{total} | {status}',
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true,
  });

  let processed = 0;
  let failed = 0;

  console.log(`\n📊 ${totalPages} pages total, ${alreadyDone} already done, ${toProcess} to process\n`);
  bar.start(toProcess, 0, { status: 'Starting...' });

  const tasks = data.contentPages.map((page, i) => limit(async () => {
    const label = page.subPageTitle || page.ficheTitle || page.title;

    if (page.questions && page.questions.length > 0) {
      return;
    }

    try {
      const questions = await generateQuestions(openRouter, page.markdown, label);
      data.contentPages[i].questions = questions;
      processed++;
      bar.increment(1, { status: `✅ ${label.substring(0, 40)}` });
    } catch (err) {
      failed++;
      bar.increment(1, { status: `❌ ${label.substring(0, 40)}` });
      console.error(`\n❌ Failed "${label}": ${err instanceof Error ? err.message : err}`);
    }
  }));

  await Promise.all(tasks);

  bar.stop();

  writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`\n📊 Results:`);
  console.log(`  Total pages: ${totalPages}`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped (already done): ${alreadyDone}`);
  console.log(`  Failed: ${failed}`);
  console.log(`\n✅ Output written to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
