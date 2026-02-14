import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Process and consolidate scraped data from Crawlee
 * Reads all JSON files from the dataset and creates a single output file
 */

const DATASET_DIR = './storage/datasets/default';
const OUTPUT_FILE = './formation-civique-data.json';

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
        const contentPages = data.filter(d => d.type === 'content_page');

        const consolidatedData = {
            crawledAt: new Date().toISOString(),
            source: 'formation-civique.interieur.gouv.fr',
            totalPages: data.length,
            levels: {
                level1: mainPage ? 1 : 0,
                level2: thematicPages.length,
                level3_index: ficheIndexPages.length,
                level3_content: ficheContentPages.length,
                level4: contentPages.length,
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
            ficheContentPages: ficheContentPages.map(page => ({
                title: page.title,
                thematicTitle: page.thematicTitle,
                ficheTitle: page.ficheTitle,
                url: page.url,
                breadcrumb: page.breadcrumb,
                sections: page.sections,
                lists: page.lists,
            })),
            contentPages: contentPages.map(page => ({
                title: page.title,
                thematicTitle: page.thematicTitle,
                ficheTitle: page.ficheTitle,
                subPageTitle: page.subPageTitle,
                url: page.url,
                breadcrumb: page.breadcrumb,
                sections: page.sections,
                lists: page.lists,
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
