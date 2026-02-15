import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Process and consolidate scraped data from Crawlee
 * Reads all JSON files from the dataset and creates a single output file
 * Merges split pages (1/N, 2/N) and consolidates references
 */

const DATASET_DIR = './storage/datasets/default';
const OUTPUT_FILE = './formation-civique-data.json';

/**
 * Strip the part suffix from a split page title: "L'égalité (2/3)" → "L'égalité"
 */
function getBaseTitle(title) {
    return title.replace(/\s*\(\d+\/\d+\)\s*$/, '').trim();
}

/**
 * Get the part number from a split page title: "L'égalité (2/3)" → 2, non-split → 0
 */
function getPartNumber(title) {
    const match = title.match(/\((\d+)\/\d+\)$/);
    return match ? parseInt(match[1], 10) : 0;
}

/**
 * Build a markdown references blockquote from page URLs + external links
 */
function buildReferencesMarkdown(pageUrls, externalLinks) {
    if (pageUrls.length === 0 && externalLinks.length === 0) return '';

    let md = '\n\n> **Références**\n';
    for (const url of pageUrls) {
        md += `> - [Page originale](${url})\n`;
    }
    // Deduplicate external links by href
    const seen = new Set();
    for (const link of externalLinks) {
        if (!seen.has(link.href)) {
            seen.add(link.href);
            md += `> - [${link.text}](${link.href})\n`;
        }
    }
    return md;
}

/**
 * Merge split pages (1/N, 2/N...) within a list of content pages.
 * Pages with matching base titles are combined: markdown is concatenated,
 * URLs and references are collected into a single references block.
 * Non-split pages get their own references block appended too.
 */
function mergeSplitPages(pages) {
    // Group pages by base title (without the (N/M) suffix)
    const groups = new Map();
    const result = [];

    for (const page of pages) {
        const title = page.subPageTitle || '';
        const partNum = getPartNumber(title);

        if (partNum > 0) {
            const baseTitle = getBaseTitle(title);
            const key = `${page.ficheTitle}::${baseTitle}`;
            if (!groups.has(key)) {
                groups.set(key, { baseTitle, parts: [] });
            }
            groups.get(key).parts.push({ ...page, _partNumber: partNum });
        } else {
            // Non-split page: append references and pass through
            const refs = buildReferencesMarkdown(
                [page.url],
                page.references || [],
            );
            result.push({
                ...page,
                subPageTitle: title,
                markdown: page.markdown + refs,
            });
        }
    }

    // Merge each group of split pages
    for (const [, group] of groups) {
        // Sort by part number
        group.parts.sort((a, b) => a._partNumber - b._partNumber);

        const mergedMarkdown = group.parts.map(p => p.markdown).join('\n\n');
        const allUrls = group.parts.map(p => p.url);
        const allRefs = group.parts.flatMap(p => p.references || []);
        const refs = buildReferencesMarkdown(allUrls, allRefs);

        // Use the first part as the base, with merged content
        const first = group.parts[0];
        result.push({
            title: first.title,
            thematicTitle: first.thematicTitle,
            ficheTitle: first.ficheTitle,
            subPageTitle: group.baseTitle,
            url: first.url,
            breadcrumb: first.breadcrumb,
            markdown: mergedMarkdown + refs,
        });
    }

    return result;
}

async function processData() {
    try {
        console.log('Reading scraped data...');

        // Read all JSON files from the dataset directory
        const files = await readdir(DATASET_DIR);
        const jsonFiles = files.filter(f => f.endsWith('.json'));

        if (jsonFiles.length === 0) {
            console.error('No data found. Run the crawler first with: npm start');
            process.exit(1);
        }

        console.log(`Found ${jsonFiles.length} data file(s)`);

        // Read and parse all JSON files
        const data = [];
        for (const file of jsonFiles) {
            const filePath = join(DATASET_DIR, file);
            const content = await readFile(filePath, 'utf-8');
            const jsonData = JSON.parse(content);
            data.push(jsonData);
        }

        // Organize data by level
        const mainPage = data.find(d => d.type === 'main_page');
        const thematicPages = data.filter(d => d.type === 'thematic_page');
        const ficheIndexPages = data.filter(d => d.type === 'fiche_index');
        const ficheContentPages = data.filter(d => d.type === 'fiche_content');
        const rawContentPages = data.filter(d => d.type === 'content_page');

        // Merge split pages (1/N, 2/N) and consolidate references
        const contentPages = mergeSplitPages(rawContentPages);
        const mergedCount = rawContentPages.length - contentPages.length;
        if (mergedCount > 0) {
            console.log(`✓ Merged ${mergedCount} split pages (${rawContentPages.length} → ${contentPages.length})`);
        }

        // Also handle ficheContentPages references (no split pages at this level)
        const processedFicheContentPages = ficheContentPages.map(page => {
            const refs = buildReferencesMarkdown(
                [page.url],
                page.references || [],
            );
            return {
                title: page.title,
                thematicTitle: page.thematicTitle,
                ficheTitle: page.ficheTitle,
                url: page.url,
                breadcrumb: page.breadcrumb,
                markdown: page.markdown + refs,
            };
        });

        const consolidatedData = {
            crawledAt: new Date().toISOString(),
            source: 'formation-civique.interieur.gouv.fr',
            totalPages: data.length,
            levels: {
                level1: mainPage ? 1 : 0,
                level2: thematicPages.length,
                level3_index: ficheIndexPages.length,
                level3_content: ficheContentPages.length,
                level4: rawContentPages.length,
                level4_after_merge: contentPages.length,
            },
            mainPage: mainPage ? {
                title: mainPage.title,
                url: mainPage.url,
                thematics: mainPage.thematics,
            } : null,
            thematicPages: thematicPages.map(page => ({
                title: page.title,
                thematicTitle: page.thematicTitle,
                url: page.url,
                breadcrumb: page.breadcrumb,
                fiches: page.fiches,
            })),
            ficheIndexPages: ficheIndexPages.map(page => ({
                title: page.title,
                thematicTitle: page.thematicTitle,
                ficheTitle: page.ficheTitle,
                url: page.url,
                breadcrumb: page.breadcrumb,
                subPages: page.subPages,
            })),
            ficheContentPages: processedFicheContentPages,
            contentPages: contentPages.map(page => ({
                title: page.title,
                thematicTitle: page.thematicTitle,
                ficheTitle: page.ficheTitle,
                subPageTitle: page.subPageTitle,
                url: page.url,
                breadcrumb: page.breadcrumb,
                markdown: page.markdown,
            })),
        };

        // Save consolidated data
        await writeFile(OUTPUT_FILE, JSON.stringify(consolidatedData, null, 2));

        console.log('\n✅ Data processed successfully!');
        console.log(`📄 Output saved to: ${OUTPUT_FILE}`);
        console.log('\n' + '='.repeat(60));
        console.log('CRAWL SUMMARY:');
        console.log('='.repeat(60));
        console.log(`  Total pages crawled: ${data.length}`);
        console.log(`  - Level 1 (Main page): ${consolidatedData.levels.level1}`);
        console.log(`  - Level 2 (Thematic pages): ${consolidatedData.levels.level2}`);
        console.log(`  - Level 3 (Fiche index pages): ${consolidatedData.levels.level3_index}`);
        console.log(`  - Level 3 (Fiche content pages): ${consolidatedData.levels.level3_content}`);
        console.log(`  - Level 4 (Sub-page content): ${consolidatedData.levels.level4}`);

        if (mainPage && mainPage.thematics) {
            console.log(`\n📋 ${mainPage.thematics.length} Thematic Categories Found:`);
            mainPage.thematics.forEach((t, i) => {
                console.log(`  ${i + 1}. ${t.title}`);
            });
        }

        if (thematicPages.length > 0) {
            console.log(`\n📂 Thematic Pages (${thematicPages.length}):`);
            thematicPages.forEach((page, i) => {
                const ficheCount = page.fiches?.length || 0;
                console.log(`  ${i + 1}. ${page.thematicTitle || page.title}`);
                console.log(`     → ${ficheCount} fiches found`);
            });
        }

        if (ficheIndexPages.length > 0) {
            console.log(`\n📑 Fiche Index Pages (${ficheIndexPages.length}):`);
            const byThematic = {};
            ficheIndexPages.forEach(page => {
                const theme = page.thematicTitle || 'Unknown';
                if (!byThematic[theme]) byThematic[theme] = 0;
                byThematic[theme] += page.subPages?.length || 0;
            });

            Object.keys(byThematic).forEach(theme => {
                console.log(`  ${theme}: ${byThematic[theme]} sub-pages`);
            });
        }

        const totalContentPages = ficheContentPages.length + contentPages.length;
        if (totalContentPages > 0) {
            console.log(`\n📄 Content Pages (${totalContentPages} total):`);
            console.log(`  - Level 3 direct content: ${ficheContentPages.length}`);
            console.log(`  - Level 4 sub-page content: ${contentPages.length}`);
        }

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error('❌ Dataset directory not found. Run the crawler first with: npm start');
        } else {
            console.error('❌ Error processing data:', error.message);
        }
        process.exit(1);
    }
}

processData();
