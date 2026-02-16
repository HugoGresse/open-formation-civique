import { readFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { CrawlerData } from './generators/types.js';
import { generateIndexPage } from './generators/index-page.js';
import { generateSectionPages } from './generators/section-pages.js';
import { generateQuizPages } from './generators/quiz-pages.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

// Read the JSON data
const data: CrawlerData = JSON.parse(
  readFileSync(join(__dirname, '../../crawler/formation-civique-data.json'), 'utf-8')
);

// Create content directory structure
const contentDir = join(ROOT_DIR, 'src/content/docs');
mkdirSync(contentDir, { recursive: true });

// Copy crawler images to public/images/
const crawlerImagesDir = join(__dirname, '../../crawler/images');
const publicImagesDir = join(ROOT_DIR, 'public/images');
if (existsSync(crawlerImagesDir)) {
  cpSync(crawlerImagesDir, publicImagesDir, { recursive: true });
  console.log('✓ Copied crawler images to public/images/');
}

// Generate all pages
generateIndexPage(data, contentDir);
generateSectionPages(data, contentDir);
generateQuizPages(data, contentDir, ROOT_DIR);

console.log('\n✅ All pages generated successfully!');
