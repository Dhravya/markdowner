import { Page } from 'puppeteer';

/**
 * Convert webpage to markdown using Readability + Turndown
 * Replicates Markdowner's fetchAndProcessPage() at src/index.ts:267-318
 *
 * The key insight: Inject Readability.js and Turndown.js into the page
 * and run the conversion in the browser context, not in Node.js
 */
export async function fetchAndProcessPage(
  page: Page,
  url: string,
  enableDetailedResponse: boolean
): Promise<string> {
  try {
    console.log(`Navigating to: ${url}`);

    // Navigate to URL with networkidle0 - crucial for JS-heavy sites
    // Matches src/index.ts:269
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log(`Page loaded, extracting markdown...`);

    // Run markdown extraction in browser context
    // Matches src/index.ts:270-315
    const markdown = await page.evaluate((enableDetailedResponse) => {
      function extractArticleMarkdown(): Promise<string> {
        // Inject Readability.js
        const readabilityScript = document.createElement('script');
        readabilityScript.src = 'https://unpkg.com/@mozilla/readability/Readability.js';
        document.head.appendChild(readabilityScript);

        // Inject Turndown.js
        const turndownScript = document.createElement('script');
        turndownScript.src = 'https://unpkg.com/turndown/dist/turndown.js';
        document.head.appendChild(turndownScript);

        // Wait for both libraries to load
        return Promise.all([
          new Promise((resolve) => (readabilityScript.onload = resolve)),
          new Promise((resolve) => (turndownScript.onload = resolve)),
        ]).then(() => {
          // Create Readability instance
          const reader = new (window as any).Readability(document.cloneNode(true), {
            charThreshold: 0,
            keepClasses: true,
            nbTopCandidates: 500,
          });

          // Parse article content
          const article = reader.parse();

          // Create Turndown instance
          const turndownService = new (window as any).TurndownService();

          let markdown: string;

          if (enableDetailedResponse) {
            // Full page mode - convert entire document
            const documentWithoutScripts = document.cloneNode(true) as Document;
            documentWithoutScripts.querySelectorAll('script').forEach((el: any) => el.remove());
            documentWithoutScripts.querySelectorAll('style').forEach((el: any) => el.remove());
            documentWithoutScripts.querySelectorAll('iframe').forEach((el: any) => el.remove());
            documentWithoutScripts.querySelectorAll('noscript').forEach((el: any) => el.remove());

            markdown = turndownService.turndown(documentWithoutScripts.body || documentWithoutScripts);
          } else {
            // Article mode - use Readability extraction
            if (!article || !article.content) {
              return 'No article content found';
            }
            markdown = turndownService.turndown(article.content);
          }

          return markdown;
        });
      }

      return extractArticleMarkdown();
    }, enableDetailedResponse);

    console.log(`Markdown extracted successfully (${markdown.length} characters)`);
    return markdown;

  } catch (error: any) {
    console.error(`Error processing page ${url}:`, error.message);
    throw new Error(`Failed to process page: ${error.message}`);
  }
}

/**
 * Extract all links from a page that start with baseUrl
 * Replicates Markdowner's extractLinks() at src/index.ts:154-160
 */
export async function extractLinks(page: Page, baseUrl: string): Promise<string[]> {
  return await page.evaluate((baseUrl) => {
    return Array.from(document.querySelectorAll('a'))
      .map((link) => (link as HTMLAnchorElement).href)
      .filter((link) => link.startsWith(baseUrl));
  }, baseUrl);
}
