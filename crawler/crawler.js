import { CheerioCrawler, Dataset } from 'crawlee';
import TurndownService from 'turndown';

/**
 * Crawler for formation-civique.interieur.gouv.fr
 * Crawls up to 4 levels deep:
 * - Level 1: Main page with 5 thematic categories
 * - Level 2: Each thematic page with multiple fiches
 * - Level 3: Each fiche page (may have sub-pages or direct content)
 * - Level 4: Sub-page content (if Level 3 has sub-pages)
 */

const BASE_URL = 'https://formation-civique.interieur.gouv.fr';
const START_URL = `${BASE_URL}/fiches-par-thematiques/`;

/**
 * Create a configured TurndownService with custom rules for DSFR components
 */
function createTurndownService() {
    const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
    });

    // Handle fr-content-media figures: extract image with alt + figcaption
    turndownService.addRule('frContentMedia', {
        filter: (node) => {
            return node.nodeName === 'FIGURE' &&
                node.getAttribute('class')?.includes('fr-content-media');
        },
        replacement: (content, node) => {
            const img = node.querySelector('img');
            const figcaption = node.querySelector('.fr-content-media__caption');
            if (!img) return content;

            const alt = img.getAttribute('alt') || '';
            const src = img.getAttribute('src') || '';
            let md = `![${alt}](${src})`;
            if (figcaption) {
                md += `\n*${figcaption.textContent.trim()}*`;
            }
            return `\n\n${md}\n\n`;
        },
    });

    // Handle fr-transcription: extract content from the modal dialog
    turndownService.addRule('frTranscription', {
        filter: (node) => {
            return node.getAttribute('class')?.includes('fr-transcription');
        },
        replacement: (content, node) => {
            const modalContent = node.querySelector('.fr-modal__content');
            if (!modalContent) return '';

            // Get inner HTML and convert it via a fresh turndown pass
            const innerTurndown = new TurndownService({
                headingStyle: 'atx',
                codeBlockStyle: 'fenced',
            });
            // Skip the h2 "Transcription" title inside the modal
            innerTurndown.addRule('skipTranscriptionTitle', {
                filter: (n) => n.nodeName === 'H2' && n.getAttribute('class')?.includes('fr-modal__title'),
                replacement: () => '',
            });
            const transcriptionMd = innerTurndown.turndown(modalContent.innerHTML);
            return `\n\n<details>\n<summary>Transcription</summary>\n\n${transcriptionMd.trim()}\n\n</details>\n\n`;
        },
    });

    // Remove "Pour aller plus loin" callout blocks (handled separately)
    turndownService.addRule('removeCallout', {
        filter: (node) => {
            const cls = node.getAttribute('class') || '';
            if (cls.includes('cmsfr-block-callout')) return true;
            // Also match the inner fr-callout div (when the outer container is stripped)
            if (cls.includes('fr-callout')) {
                const title = node.querySelector('.fr-callout__title');
                if (title && title.textContent.includes('Pour aller plus loin')) return true;
            }
            return false;
        },
        replacement: () => '',
    });

    // Remove sr-only spans (screen reader text like "(Ouvre une nouvelle fenêtre)")
    turndownService.addRule('removeSrOnly', {
        filter: (node) => {
            return node.nodeName === 'SPAN' &&
                node.getAttribute('class')?.includes('fr-sr-only');
        },
        replacement: () => '',
    });

    return turndownService;
}

/**
 * Extract "Pour aller plus loin" links from the page as structured data
 */
function extractPourAllerPlusLoin($) {
    const links = [];
    $('.cmsfr-block-callout').each((_, callout) => {
        const $callout = $(callout);
        const title = $callout.find('.fr-callout__title').text().trim();
        if (!title.includes('Pour aller plus loin')) return;

        $callout.find('.fr-callout__text a').each((_, a) => {
            const $a = $(a);
            const href = $a.attr('href');
            // Get link text, removing the sr-only span text
            const text = $a.text().replace(/\(Ouvre une nouvelle fenêtre\)/g, '').trim();
            if (href && text) {
                links.push({ text, href });
            }
        });
    });
    return links;
}

const crawler = new CheerioCrawler({
    // No limit - crawl all pages across 3 levels
    maxRequestsPerCrawl: 1000,

    // Be respectful to the government server
    maxConcurrency: 2,
    minConcurrency: 1,
    maxRequestRetries: 3,

    async requestHandler({ request, $, log, enqueueLinks }) {
        log.info(`Processing [${request.userData.type || 'main'}]: ${request.url}`);

        const title = $('title').text().trim();
        const pageType = request.userData.type || 'main';

        if (pageType === 'main') {
            // LEVEL 1: Main page - Extract the 5 thematic categories
            log.info('📚 LEVEL 1: Extracting thematic categories from main page');

            const thematics = [];

            // Find all thematic category links in .fr-tile elements
            // Structure: .fr-tile > .fr-tile__body > .fr-tile__content > h2.fr-tile__title > a
            $('.fr-tile h2.fr-tile__title a, .fr-tile .fr-tile__title a').each((_, element) => {
                const $link = $(element);
                const href = $link.attr('href');
                const tileTitle = $link.text().trim();

                // Get description from sibling p.fr-tile__desc elements
                const $tile = $link.closest('.fr-tile');
                const descriptions = [];
                $tile.find('p.fr-tile__desc').each((_, p) => {
                    descriptions.push($(p).text().trim());
                });
                const description = descriptions.join(' • ');

                if (href && tileTitle) {
                    const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
                    // Avoid duplicates
                    if (!thematics.find(t => t.url === fullUrl)) {
                        thematics.push({
                            title: tileTitle,
                            description,
                            url: fullUrl,
                        });
                    }
                }
            });

            log.info(`✓ Found ${thematics.length} thematic categories`);

            await Dataset.pushData({
                url: request.url,
                type: 'main_page',
                level: 1,
                title,
                thematics,
                scrapedAt: new Date().toISOString(),
            });

            // Enqueue ALL thematic category pages (Level 2)
            for (const thematic of thematics) {
                await enqueueLinks({
                    urls: [thematic.url],
                    userData: {
                        type: 'thematic',
                        level: 2,
                        thematicTitle: thematic.title
                    },
                });
            }

            log.info(`📤 Enqueued ${thematics.length} thematic pages for crawling`);

        } else if (pageType === 'thematic') {
            // LEVEL 2: Thematic page - Extract fiches (sub-topics)
            log.info(`📂 LEVEL 2: Extracting fiches from: ${request.userData.thematicTitle}`);

            const breadcrumb = [];
            $('nav[aria-label*="breadcrumb"] a, .fr-breadcrumb a').each((_, el) => {
                breadcrumb.push($(el).text().trim());
            });

            // Extract all fiche links from this thematic page
            const fiches = [];
            $('article a, .fr-card a, a.fr-tile__link').each((_, element) => {
                const $link = $(element);
                const href = $link.attr('href');
                const ficheTitle = $link.find('h2, h3, h4, .fr-card__title, .fr-tile__title').text().trim()
                    || $link.text().trim();
                const description = $link.find('p, .fr-card__desc').text().trim();

                if (href && ficheTitle && href.includes(request.url.split('/').pop())) {
                    const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
                    // Avoid duplicates and self-references
                    if (!fiches.find(f => f.url === fullUrl) && fullUrl !== request.url) {
                        fiches.push({
                            title: ficheTitle,
                            description,
                            url: fullUrl,
                        });
                    }
                }
            });

            log.info(`✓ Found ${fiches.length} fiches in this thematic`);

            await Dataset.pushData({
                url: request.url,
                type: 'thematic_page',
                level: 2,
                title,
                thematicTitle: request.userData.thematicTitle,
                breadcrumb,
                fiches,
                scrapedAt: new Date().toISOString(),
            });

            // Enqueue ALL fiche pages (Level 3)
            for (const fiche of fiches) {
                await enqueueLinks({
                    urls: [fiche.url],
                    userData: {
                        type: 'fiche',
                        level: 3,
                        thematicTitle: request.userData.thematicTitle,
                        ficheTitle: fiche.title
                    },
                });
            }

            log.info(`📤 Enqueued ${fiches.length} fiche pages for content extraction`);

        } else if (pageType === 'fiche') {
            // LEVEL 3: Fiche page - Check if it has sub-pages or is content
            log.info(`📄 LEVEL 3: Processing fiche: ${request.userData.ficheTitle}`);

            const breadcrumb = [];
            $('nav[aria-label*="breadcrumb"] a, .fr-breadcrumb a').each((_, el) => {
                breadcrumb.push($(el).text().trim());
            });

            // Check if this page has sub-pages (Pages section with fr-card)
            const subPages = [];
            $('#posts-list .fr-card h3.fr-card__title a, #posts-list .fr-card .fr-card__title a').each((_, element) => {
                const $link = $(element);
                const href = $link.attr('href');
                const subPageTitle = $link.text().trim();
                const $card = $link.closest('.fr-card');
                const description = $card.find('p.fr-card__desc').text().trim();

                if (href && subPageTitle) {
                    const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
                    if (!subPages.find(p => p.url === fullUrl)) {
                        subPages.push({
                            title: subPageTitle,
                            description,
                            url: fullUrl,
                        });
                    }
                }
            });

            if (subPages.length > 0) {
                // This is an index page with sub-pages - save and enqueue
                log.info(`📑 Found ${subPages.length} sub-pages, enqueueing...`);

                await Dataset.pushData({
                    url: request.url,
                    type: 'fiche_index',
                    level: 3,
                    title,
                    thematicTitle: request.userData.thematicTitle,
                    ficheTitle: request.userData.ficheTitle,
                    breadcrumb,
                    subPages,
                    scrapedAt: new Date().toISOString(),
                });

                // Enqueue sub-pages as Level 4
                for (const subPage of subPages) {
                    await enqueueLinks({
                        urls: [subPage.url],
                        userData: {
                            type: 'content',
                            level: 4,
                            thematicTitle: request.userData.thematicTitle,
                            ficheTitle: request.userData.ficheTitle,
                            subPageTitle: subPage.title
                        },
                    });
                }

                log.info(`📤 Enqueued ${subPages.length} sub-pages for content extraction`);
            } else {
                // No sub-pages - extract content directly
                log.info(`📝 No sub-pages found, extracting content...`);

                const turndownService = createTurndownService();

                // Extract "Pour aller plus loin" links before conversion
                const references = extractPourAllerPlusLoin($);

                // Extract the main content
                const mainContent = $('main, article, .fr-container').first();
                const htmlContent = mainContent.html();

                // Convert HTML to Markdown
                const markdown = htmlContent ? turndownService.turndown(htmlContent) : '';

                log.info(`✓ Extracted and converted content to markdown`);

                await Dataset.pushData({
                    url: request.url,
                    type: 'fiche_content',
                    level: 3,
                    title,
                    thematicTitle: request.userData.thematicTitle,
                    ficheTitle: request.userData.ficheTitle,
                    breadcrumb,
                    markdown,
                    references,
                    scrapedAt: new Date().toISOString(),
                });
            }
        } else if (pageType === 'content') {
            // LEVEL 4: Content page - Extract actual content from sub-pages
            log.info(`📝 LEVEL 4: Extracting content from: ${request.userData.subPageTitle}`);

            const breadcrumb = [];
            $('nav[aria-label*="breadcrumb"] a, .fr-breadcrumb a').each((_, el) => {
                breadcrumb.push($(el).text().trim());
            });

            const turndownService = createTurndownService();

            // Extract "Pour aller plus loin" links before conversion
            const references = extractPourAllerPlusLoin($);

            // Extract ALL containers starting from the 4th .fr-container in #content
            const containers = $('#content > .fr-container');
            let combinedHtml = '';

            if (containers.length >= 4) {
                // Get all containers from index 3 (4th container) onwards
                for (let i = 3; i < containers.length; i++) {
                    combinedHtml += containers.eq(i).html() || '';
                }
                log.info(`✓ Extracted content from ${containers.length - 3} containers (4th onwards)`);
            } else {
                // Fallback to main content if less than 4 containers
                combinedHtml = $('main, article, .fr-container').first().html() || '';
                log.info(`✓ Fallback: Extracted content from main element`);
            }

            // Convert HTML to Markdown
            const markdown = combinedHtml ? turndownService.turndown(combinedHtml) : '';

            await Dataset.pushData({
                url: request.url,
                type: 'content_page',
                level: 4,
                title,
                thematicTitle: request.userData.thematicTitle,
                ficheTitle: request.userData.ficheTitle,
                subPageTitle: request.userData.subPageTitle,
                breadcrumb,
                markdown,
                references,
                scrapedAt: new Date().toISOString(),
            });
        }
    },

    failedRequestHandler({ request, log }) {
        log.error(`Request ${request.url} failed too many times.`);
    },
});

// Run the crawler
await crawler.run([START_URL]);

console.log('Crawler finished!');
console.log('Check the ./storage/datasets/default/ directory for results.');
