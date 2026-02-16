import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { OpenRouter } from '@openrouter/sdk';
import pLimit from 'p-limit';

const __dirname = dirname(fileURLToPath(import.meta.url));

const INPUT_PATH = join(__dirname, '../../crawler/formation-civique-data.json');
const OUTPUT_PATH = join(__dirname, '../../crawler/formation-civique-data-with-quizz.json');
const MODEL = 'openai/gpt-oss-120b';

const SYSTEM_PROMPT = `Tu es un expert en formation civique française. À partir du contenu pédagogique fourni, génère des questions à choix multiples (QCM) en français.

Règles :
- Génère entre 3 et 7 questions selon la richesse du contenu
- Chaque question doit avoir exactement 4 options de réponse
- Une seule réponse correcte par question
- Les questions doivent être variées et couvrir les points clés du contenu
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

function loadData() {
  // Resume support: if output already exists, use it to skip already-processed pages
  if (existsSync(OUTPUT_PATH)) {
    console.log('📂 Resuming from existing output file...');
    return JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'));
  }

  console.log('📂 Starting fresh from source data...');
  return JSON.parse(readFileSync(INPUT_PATH, 'utf-8'));
}

function extractTextContent(markdown) {
  // Remove image markdown, source references, and keep only textual content
  return markdown
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/^> \*\*Références\*\*[\s\S]*$/m, '') // Remove references block
    .replace(/^_Source photo.*$/gm, '') // Remove source photo lines
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
    .replaceAll('* * *', '')
    .trim();
}

async function generateQuestions(openRouter, markdown, title) {
  const textContent = extractTextContent(markdown);

  const completion = await openRouter.chat.send({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Contenu de la fiche "${title}" :\n\n${textContent}` },
    ],
    stream: false,
    temperature: 0.4,
  });

  const raw = completion.choices[0].message.content.trim();

  // Extract JSON array from the response (handle potential markdown code blocks)
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`No JSON array found in response: ${raw.substring(0, 200)}`);
  }

  const questions = JSON.parse(jsonMatch[0]);

  // Validate structure
  for (const q of questions) {
    if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 ||
        typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3 ||
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
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  const tasks = data.contentPages.map((page, i) => limit(async () => {
    const label = page.subPageTitle || page.ficheTitle || page.title;

    // Skip if already has questions (resume support)
    if (page.questions && page.questions.length > 0) {
      skipped++;
      console.log(`[${i + 1}/${totalPages}] ⏭ Skipping (already done): ${label}`);
      return;
    }

    console.log(`[${i + 1}/${totalPages}] 🔄 Processing: ${label}`);

    try {
      const questions = await generateQuestions(openRouter, page.markdown, label);
      data.contentPages[i].questions = questions;
      processed++;
      console.log(`[${i + 1}/${totalPages}] ✅ Generated ${questions.length} questions`);
    } catch (err) {
      console.log(err);
      failed++;
      console.error(`[${i + 1}/${totalPages}] ❌ Failed: ${err.message}`);
    }
  }));

  await Promise.all(tasks);

  // Save all results
  writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`\n📊 Results:`);
  console.log(`  Total pages: ${totalPages}`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped (already done): ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log(`\n✅ Output written to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
