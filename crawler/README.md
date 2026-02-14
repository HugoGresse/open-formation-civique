# Formation Civique Crawler

A Crawlee-based web crawler to extract content from the French civic formation website (formation-civique.interieur.gouv.fr).

## Features

- ✅ **4-Level Deep Crawling**:
  - **Level 1**: Main page with 5 thematic categories
  - **Level 2**: Each thematic page with multiple fiches (sub-topics)
  - **Level 3**: Each fiche page (index or direct content)
  - **Level 4**: Sub-page content (when Level 3 is an index page)
- ✅ **HTML to Markdown Conversion**: Preserves all formatting (bold, italic, lists, links, etc.)
- ✅ Extracts complete educational content with proper structure
- ✅ Respectful crawling with rate limiting (2 concurrent requests max)
- ✅ Structured data output in JSON format
- ✅ Built with Crawlee 3.16+ and Turndown for markdown conversion
- ✅ Automatic retry on failures
- ✅ Data consolidation scripts included

## Installation

```bash
npm install
```

## Usage

Run the crawler:

```bash
npm start
```

Process and consolidate the scraped data:

```bash
npm run process
```

This will create a single `formation-civique-data.json` file with all the scraped content.

Clean previous crawl data:

```bash
npm run clean
```

## Output

The crawler saves data to `./storage/datasets/default/`:
- Each page is saved as a separate JSON file
- **Level 1**: Main page with 5 thematic categories
- **Level 2**: Thematic pages with fiche links
- **Level 3**: Fiche pages (either index with sub-pages OR direct content)
- **Level 4**: Sub-page content (extracted from 4th container onwards)

### Data Structure

**Level 1 - Main Page:**
```json
{
  "url": "https://formation-civique.interieur.gouv.fr/fiches-par-thematiques/",
  "type": "main_page",
  "level": 1,
  "title": "Fiches par thématiques — Formation civique",
  "thematics": [
    {
      "title": "Principes et valeurs de la République",
      "description": "...",
      "url": "https://..."
    }
  ],
  "scrapedAt": "2026-02-14T..."
}
```

**Level 2 - Thematic Page:**
```json
{
  "url": "https://...",
  "type": "thematic_page",
  "level": 2,
  "title": "Page title",
  "thematicTitle": "Principes et valeurs de la République",
  "breadcrumb": ["Accueil", "Fiches par thématique", "..."],
  "fiches": [
    {
      "title": "La laïcité",
      "description": "...",
      "url": "https://..."
    }
  ],
  "scrapedAt": "2026-02-14T..."
}
```

**Level 3 - Fiche Index (with sub-pages):**
```json
{
  "url": "https://...",
  "type": "fiche_index",
  "level": 3,
  "title": "Page title",
  "thematicTitle": "Principes et valeurs de la République",
  "ficheTitle": "La laïcité",
  "breadcrumb": ["Accueil", "Fiches par thématique", "...", "La laïcité"],
  "subPages": [
    {
      "title": "Sub-page title",
      "description": "...",
      "url": "https://..."
    }
  ],
  "scrapedAt": "2026-02-14T..."
}
```

**Level 3 - Fiche Content (direct content, no sub-pages):**
```json
{
  "url": "https://...",
  "type": "fiche_content",
  "level": 3,
  "title": "Page title",
  "thematicTitle": "Principes et valeurs de la République",
  "ficheTitle": "La laïcité",
  "breadcrumb": ["Accueil", "Fiches par thématique", "...", "La laïcité"],
  "markdown": "## Section Title\n\nParagraph content with **bold** and *italic* text...\n\n- List item 1\n- List item 2\n\nMore content...",
  "scrapedAt": "2026-02-14T..."
}
```

**Level 4 - Content Page (sub-page content):**
```json
{
  "url": "https://...",
  "type": "content_page",
  "level": 4,
  "title": "Page title",
  "thematicTitle": "Principes et valeurs de la République",
  "ficheTitle": "La laïcité",
  "subPageTitle": "Specific topic",
  "breadcrumb": ["Accueil", "Fiches par thématique", "...", "La laïcité", "Specific topic"],
  "markdown": "## Section Title\n\nDetailed content with **formatting** preserved...\n\n1. Ordered list item 1\n2. Ordered list item 2\n\n[Links](https://example.com) are also preserved.",
  "scrapedAt": "2026-02-14T..."
}
```

## Configuration

Edit `crawler.js` to customize:
- `maxRequestsPerCrawl`: Maximum number of pages to crawl (default: 1000 for complete crawl)
- `maxConcurrency`: Number of parallel requests (default: 2 for respectful crawling)
- `maxRequestRetries`: Retry attempts for failed requests (default: 3)

The crawler will automatically:
- Crawl all 5 thematic categories
- Crawl all fiches within each thematic
- Extract all content from each fiche page (including sub-pages)
- Convert all HTML content to markdown with formatting preserved

Typical crawl size: ~50-150+ pages across all 4 levels

## Legal & Ethics

- This crawler respects robots.txt
- Rate-limited to be respectful to government servers
- For educational and research purposes
- Always check the website's terms of service before scraping

## Troubleshooting

**Issue: No data extracted**
- The website structure may have changed
- Check the CSS selectors in the crawler
- Try using PlaywrightCrawler instead of CheerioCrawler

**Issue: 403 Forbidden**
- The server may be blocking requests
- Increase delays between requests
- Add user-agent headers

## License

MIT
