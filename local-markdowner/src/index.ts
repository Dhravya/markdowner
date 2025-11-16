import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { browserManager } from './browser';
import { mdCache } from './cache';
import { fetchAndProcessPage, extractLinks } from './converter';
import { getTweet, formatTweetMarkdown, isTwitterUrl, extractTweetId } from './twitter';
import { html } from './response';

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_SECURITY_TOKEN = process.env.BACKEND_SECURITY_TOKEN || '';

/**
 * Rate limiter - 10 requests per 60 seconds per IP
 * Replicates Cloudflare Rate Limiter from src/index.ts:9
 */
const limiter = rateLimit({
  windowMs: 60 * 1000, // 60 seconds
  max: 10, // 10 requests per window
  message: 'Rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting if valid auth token provided
  skip: (req) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    return token === BACKEND_SECURITY_TOKEN && BACKEND_SECURITY_TOKEN !== '';
  }
});

// Apply rate limiter to all routes
app.use(limiter);

/**
 * Validate URL format
 * Replicates isValidUrl() from src/index.ts:326-328
 */
function isValidUrl(url: string): boolean {
  return /^(http|https):\/\/[^ "]+$/.test(url);
}

/**
 * Process single page
 * Replicates processSinglePage() from src/index.ts:134-152
 */
async function processSinglePage(
  url: string,
  enableDetailedResponse: boolean,
  contentType: string
): Promise<{ status: number; body: any }> {
  const results = await getWebsiteMarkdown([url], enableDetailedResponse);

  if (contentType === 'json') {
    const status = results.some((item) => item.md === 'Rate limit exceeded') ? 429 : 200;
    return { status, body: results };
  } else {
    const result = results[0];
    return {
      status: result.md === 'Rate limit exceeded' ? 429 : 200,
      body: result.md
    };
  }
}

/**
 * Crawl subpages and return markdown for each
 * Replicates crawlSubpages() from src/index.ts:112-132
 */
async function crawlSubpages(
  baseUrl: string,
  enableDetailedResponse: boolean
): Promise<{ status: number; body: any }> {
  const isBrowserActive = await browserManager.ensureBrowser();
  if (!isBrowserActive) {
    return { status: 500, body: [{ url: baseUrl, md: 'Could not start browser instance' }] };
  }

  const page = await browserManager.newPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  const links = await extractLinks(page, baseUrl);
  await page.close();

  const uniqueLinks = Array.from(new Set(links)).slice(0, 10);
  const results = await getWebsiteMarkdown(uniqueLinks, enableDetailedResponse);

  const status = results.some((item) => item.md === 'Rate limit exceeded') ? 429 : 200;
  return { status, body: results };
}

/**
 * Get markdown for multiple URLs
 * Replicates getWebsiteMarkdown() from src/index.ts:183-265
 */
async function getWebsiteMarkdown(
  urls: string[],
  enableDetailedResponse: boolean
): Promise<Array<{ url: string; md: string }>> {
  const isBrowserActive = await browserManager.ensureBrowser();

  if (!isBrowserActive) {
    return [{ url: urls[0], md: 'Could not start browser instance' }];
  }

  return await Promise.all(
    urls.map(async (url) => {
      // Cache key includes URL and options
      const cacheKey = url + (enableDetailedResponse ? '-detailed' : '');
      const cached = mdCache.get(cacheKey);

      // Special Twitter/X handling (src/index.ts:218-240)
      if (isTwitterUrl(url)) {
        const tweetID = extractTweetId(url);
        if (!tweetID) {
          return { url, md: 'Invalid tweet URL' };
        }

        const tweetCached = mdCache.get(tweetID);
        if (tweetCached) {
          return { url, md: tweetCached };
        }

        console.log(`Fetching tweet ${tweetID}...`);
        const tweet = await getTweet(tweetID);

        if (!tweet || !tweet.text) {
          return { url, md: 'Tweet not found' };
        }

        const tweetMd = formatTweetMarkdown(tweet);
        mdCache.put(tweetID, tweetMd);
        return { url, md: tweetMd };
      }

      // Return cached if available
      if (cached) {
        console.log(`Cache hit for ${url}`);
        return { url, md: cached };
      }

      // Fetch and process the page
      try {
        const page = await browserManager.newPage();
        const markdown = await fetchAndProcessPage(page, url, enableDetailedResponse);
        await page.close();

        // Cache the result
        mdCache.put(cacheKey, markdown);

        return { url, md: markdown };
      } catch (error: any) {
        console.error(`Error processing ${url}:`, error.message);
        return { url, md: `Error: ${error.message}` };
      }
    })
  );
}

/**
 * Main route handler
 * Replicates fetch() handler from src/index.ts:45-81
 */
app.get('/', async (req: Request, res: Response) => {
  // Extract query parameters
  const url = req.query.url as string | undefined;
  const enableDetailedResponse = req.query.enableDetailedResponse === 'true';
  const crawlSubpages = req.query.crawlSubpages === 'true';
  const contentType = req.headers['content-type'] === 'application/json' ? 'json' : 'text';

  // Show help page if no URL provided
  if (!url) {
    return res.send(html);
  }

  // Validate URL
  if (!isValidUrl(url)) {
    return res.status(400).send('Invalid URL provided, should be a full URL starting with http:// or https://');
  }

  // Check for incompatible options
  if (contentType === 'text' && crawlSubpages) {
    return res.status(400).send('Error: Crawl subpages can only be enabled with JSON content type');
  }

  try {
    let result;

    if (crawlSubpages) {
      result = await crawlSubpages(url, enableDetailedResponse);
    } else {
      result = await processSinglePage(url, enableDetailedResponse, contentType);
    }

    // Set appropriate content-type header
    if (contentType === 'json') {
      res.setHeader('Content-Type', 'application/json');
    } else {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }

    return res.status(result.status).send(
      contentType === 'json' ? JSON.stringify(result.body, null, 2) : result.body
    );

  } catch (error: any) {
    console.error('Request error:', error);
    return res.status(500).send(`Internal server error: ${error.message}`);
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  const stats = mdCache.getStats();
  res.json({
    status: 'ok',
    browser: browserManager.isConnected() ? 'connected' : 'disconnected',
    cache: {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses
    }
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          Local Markdowner - Self-Hosted Edition           ║
║                                                            ║
║  🚀 Server running on http://localhost:${PORT}              ║
║                                                            ║
║  📝 Usage: http://localhost:${PORT}/?url=https://example.com ║
║                                                            ║
║  Features:                                                 ║
║    ✅ Website → Markdown conversion                        ║
║    ✅ Twitter/X support                                    ║
║    ✅ Subpage crawling (up to 10)                         ║
║    ✅ In-memory caching (1hr TTL)                         ║
║    ✅ Rate limiting (10 req/60s)                          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await browserManager.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await browserManager.close();
  process.exit(0);
});
