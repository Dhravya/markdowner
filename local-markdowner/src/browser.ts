import puppeteer, { Browser, Page } from 'puppeteer';

const KEEP_BROWSER_ALIVE_IN_SECONDS = 60;
const TEN_SECONDS = 10000;

/**
 * BrowserManager - Manages Puppeteer browser sessions with keep-alive
 * Replaces Cloudflare Durable Objects from original Markdowner
 */
class BrowserManager {
  private browser: Browser | undefined;
  private keptAliveInSeconds: number = 0;
  private cleanupTimer: NodeJS.Timeout | undefined;

  /**
   * Ensure browser is running, with retry logic
   * Based on Markdowner's ensureBrowser() at src/index.ts:83-110
   */
  async ensureBrowser(): Promise<boolean> {
    let retries = 3;

    while (retries > 0) {
      if (!this.browser || !this.browser.isConnected()) {
        try {
          console.log('Launching browser instance...');
          this.browser = await puppeteer.launch({
            headless: 'new',
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--disable-gpu'
            ]
          });

          this.scheduleCleanup();
          console.log('Browser instance launched successfully');
          return true;
        } catch (e) {
          console.error(`Browser Manager: Could not start browser instance. Error: ${e}`);
          retries--;

          if (!retries) {
            return false;
          }

          // Try to clean up any zombie sessions
          if (this.browser) {
            try {
              await this.browser.close();
            } catch (err) {
              console.error('Error closing zombie browser:', err);
            }
          }

          console.log(`Retrying to start browser instance. Retries left: ${retries}`);
        }
      } else {
        // Browser is already running and connected
        this.resetKeepAlive();
        return true;
      }
    }

    return false;
  }

  /**
   * Create a new page instance
   */
  async newPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }
    return await this.browser.newPage();
  }

  /**
   * Reset the keep-alive timer
   */
  private resetKeepAlive(): void {
    this.keptAliveInSeconds = 0;
  }

  /**
   * Schedule browser cleanup after idle timeout
   * Based on Markdowner's alarm() at src/index.ts:330-341
   */
  private scheduleCleanup(): void {
    // Clear existing timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.keptAliveInSeconds = 0;

    this.cleanupTimer = setInterval(async () => {
      this.keptAliveInSeconds += 10;

      if (this.keptAliveInSeconds >= KEEP_BROWSER_ALIVE_IN_SECONDS) {
        console.log('Browser idle timeout reached, closing browser...');
        if (this.browser) {
          try {
            await this.browser.close();
            this.browser = undefined;
            console.log('Browser closed successfully');
          } catch (err) {
            console.error('Error closing browser:', err);
          }
        }

        if (this.cleanupTimer) {
          clearInterval(this.cleanupTimer);
          this.cleanupTimer = undefined;
        }
      }
    }, TEN_SECONDS);
  }

  /**
   * Check if browser is connected
   */
  isConnected(): boolean {
    return this.browser?.isConnected() ?? false;
  }

  /**
   * Force close the browser
   */
  async close(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
    }
  }
}

// Singleton instance
export const browserManager = new BrowserManager();
