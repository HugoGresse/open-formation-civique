# Quick Start Guide

## Installation & First Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the crawler:**
   ```bash
   npm start
   ```

   The crawler will:
   - Fetch the main "Fiches par thématique" page
   - Extract the 5 thematic categories
   - Crawl up to 3 pages total
   - Save data to `./storage/datasets/default/`

3. **Process the data:**
   ```bash
   npm run process
   ```

   This consolidates all JSON files into a single `formation-civique-data.json` file.

4. **View the results:**
   ```bash
   npm run example
   ```

   This displays a formatted view of the scraped content with examples.

## Complete Workflow

```bash
# Clean any previous data
npm run clean

# Run the crawler
npm start

# Process the results
npm run process

# View the data
npm run example
```

## Output Files

- `./storage/datasets/default/*.json` - Raw crawled data (one file per page)
- `./formation-civique-data.json` - Consolidated data (created by `npm run process`)

## Using Playwright (if needed)

If the basic crawler doesn't extract content properly:

```bash
npm run start:playwright
```

This uses a headless browser to render JavaScript.

## Troubleshooting

**No data extracted?**
- Try the Playwright version: `npm run start:playwright`
- Check your internet connection
- The website structure may have changed

**Want to crawl more pages?**
- Edit `crawler.js` and change `maxRequestsPerCrawl: 3` to a higher number

**Rate limiting issues?**
- The crawler is already set to respectful defaults (1 concurrent request)
- If needed, add delays in the crawler configuration

## Next Steps

After getting the data, you can:
- Import `formation-civique-data.json` into your application
- Parse it with the `example-usage.js` as a template
- Build a search interface
- Create a static site from the content
- Analyze the content for insights

## Need Help?

Check the main [README.md](README.md) for detailed documentation.
