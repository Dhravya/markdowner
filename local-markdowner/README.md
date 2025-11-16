# Local Markdowner ⚡📝

A self-hosted, open-source clone of [Markdowner](https://github.com/dhravya/markdowner) - Convert any website into LLM-ready markdown data without Cloudflare dependencies.

## ✨ Features

- 🔄 **Website → Markdown conversion** using Readability + Turndown
- 🐦 **Twitter/X support** - Direct API integration for tweets
- 🕸️ **Subpage crawling** - Automatically process up to 10 linked pages
- 💾 **Smart caching** - In-memory cache with 1-hour TTL
- 🛡️ **Rate limiting** - 10 requests per 60 seconds per IP
- 🔓 **100% free** - No API keys, no external dependencies
- 🏠 **Self-hosted** - Complete control over your data

## 🚀 Quick Start (5 minutes)

### Prerequisites

- Node.js 18+ and npm
- That's it!

### Installation

```bash
# Clone or copy the local-markdowner directory
cd local-markdowner

# Install dependencies
npm install

# Run in development mode
npm run dev
```

The server will start on `http://localhost:3000`

### Usage

**Simple conversion:**
```bash
curl 'http://localhost:3000/?url=https://example.com'
```

**Detailed response (full page):**
```bash
curl 'http://localhost:3000/?url=https://example.com&enableDetailedResponse=true'
```

**JSON response:**
```bash
curl -H "Content-Type: application/json" \
  'http://localhost:3000/?url=https://example.com'
```

**Crawl subpages:**
```bash
curl -H "Content-Type: application/json" \
  'http://localhost:3000/?url=https://example.com&crawlSubpages=true'
```

**Twitter/X support:**
```bash
curl 'http://localhost:3000/?url=https://twitter.com/user/status/123456789'
```

## 📚 API Documentation

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | The website URL to convert into markdown |

### Optional Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enableDetailedResponse` | boolean | `false` | Full HTML content vs article-only extraction |
| `crawlSubpages` | boolean | `false` | Crawl and return markdown for up to 10 subpages |

### Response Types

Set the `Content-Type` header:
- `text/plain` - Plain text markdown (default)
- `application/json` - JSON response with metadata

### Response Format

**Text response:**
```
# Article Title

Article content in markdown...
```

**JSON response:**
```json
[
  {
    "url": "https://example.com",
    "md": "# Article Title\n\nArticle content..."
  }
]
```

## 🏗️ Architecture

**Local Markdowner** replicates the original Markdowner functionality without Cloudflare:

| Original (Cloudflare) | Local Alternative |
|-----------------------|-------------------|
| Cloudflare Workers | Node.js + Express |
| Durable Objects | Singleton browser manager |
| KV Storage | node-cache (in-memory) |
| Browser Rendering API | Puppeteer |
| Rate Limiter binding | express-rate-limit |
| Cloudflare AI | ❌ (optional, removed) |

## 🖥️ Production Deployment

### Option 1: Local PC

```bash
# Build the project
npm run build

# Start in production
npm start
```

**Running in background:**
```bash
# Using PM2
npm install -g pm2
pm2 start dist/index.js --name markdowner
pm2 save
pm2 startup
```

### Option 2: VPS (Arch Linux)

**1. Install dependencies:**
```bash
sudo pacman -S nodejs npm chromium
```

**2. Setup Puppeteer to use system Chromium:**
```bash
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

**3. Build and run:**
```bash
cd local-markdowner
npm install
npm run build
npm start
```

**4. Create systemd service:**
```bash
sudo nano /etc/systemd/system/markdowner.service
```

```ini
[Unit]
Description=Local Markdowner Service
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/path/to/local-markdowner
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable markdowner
sudo systemctl start markdowner
sudo systemctl status markdowner
```

**5. Setup nginx reverse proxy:**
```bash
sudo pacman -S nginx
sudo nano /etc/nginx/sites-available/markdowner
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/markdowner /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 3: Docker (Coming Soon)

```dockerfile
# Dockerfile included in future versions
```

## 🔐 Security

### Authentication (Optional)

Set a backend security token to bypass rate limiting for trusted clients:

```bash
export BACKEND_SECURITY_TOKEN="your-secret-token"
npm start
```

**Usage:**
```bash
curl -H "Authorization: Bearer your-secret-token" \
  'http://localhost:3000/?url=https://example.com'
```

### Rate Limiting

Default: 10 requests per 60 seconds per IP address.

To modify, edit `src/index.ts`:
```typescript
const limiter = rateLimit({
  windowMs: 60 * 1000,  // Window in milliseconds
  max: 10,              // Max requests per window
  // ...
});
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `BACKEND_SECURITY_TOKEN` | `""` | Optional auth token to bypass rate limits |

### Cache Settings

Edit `src/cache.ts` to modify caching behavior:
```typescript
constructor() {
  this.cache = new NodeCache({
    stdTTL: 3600,      // TTL in seconds (1 hour)
    checkperiod: 600,  // Check for expired keys every 10 min
  });
}
```

### Browser Keep-Alive

Edit `src/browser.ts` to modify browser timeout:
```typescript
const KEEP_BROWSER_ALIVE_IN_SECONDS = 60;  // Close browser after 60s idle
```

## 📊 Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "browser": "connected",
  "cache": {
    "keys": 42,
    "hits": 128,
    "misses": 15
  }
}
```

## 🆚 Comparison

| Feature | Local Markdowner | Cloudflare Markdowner |
|---------|------------------|----------------------|
| **Cost** | $0 (PC) / $3-5 (VPS) | $5-25/month |
| **Setup** | 5 minutes | 10 minutes |
| **Dependencies** | None | Cloudflare account |
| **Customization** | Full control | Limited |
| **Scalability** | Manual | Auto-scaling |
| **Latency** | Single location | Global edge |
| **LLM Filtering** | ❌ (can add) | ✅ |

## 🐛 Troubleshooting

### Browser launch fails

**Error:** `Could not start browser instance`

**Solution:** Install Chromium/Chrome:
```bash
# Arch Linux
sudo pacman -S chromium

# Ubuntu/Debian
sudo apt install chromium-browser

# macOS
brew install chromium
```

### Memory issues

**Error:** `JavaScript heap out of memory`

**Solution:** Increase Node.js memory limit:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### Permission errors

**Error:** `EACCES: permission denied`

**Solution:** Don't run as root, use proper user permissions:
```bash
sudo chown -R $USER:$USER .
```

## 🤝 Contributing

This is a self-hosted clone of the original Markdowner. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - Feel free to use, modify, and distribute.

## 🙏 Credits

Based on [Markdowner](https://github.com/dhravya/markdowner) by [@dhravya](https://github.com/dhravya)

## 🔗 Related Projects

- [Markdowner (Original)](https://github.com/dhravya/markdowner) - Cloudflare Workers version
- [Jina Reader](https://github.com/jina-ai/reader) - Alternative markdown converter
- [Crawl4AI](https://github.com/unclecode/crawl4ai) - Python-based web crawler
- [Firecrawl](https://github.com/mendableai/firecrawl) - Web data API for AI

## 📮 Support

- **Issues:** Open an issue on GitHub
- **Questions:** Check the original Markdowner documentation

---

**Made with ⚡ by adapting Markdowner for self-hosting**
