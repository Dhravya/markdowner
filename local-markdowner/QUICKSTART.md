# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies

```bash
cd local-markdowner
npm install
```

This will install:
- `express` - Web server
- `puppeteer` - Browser automation (will download Chromium ~170MB)
- `express-rate-limit` - Rate limiting
- `node-cache` - Caching
- TypeScript and development tools

### Step 2: Run the Server

```bash
npm run dev
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║          Local Markdowner - Self-Hosted Edition           ║
║  🚀 Server running on http://localhost:3000              ║
╚════════════════════════════════════════════════════════════╝
```

### Step 3: Test It!

Open another terminal and try these commands:

**Test 1: Simple webpage**
```bash
curl 'http://localhost:3000/?url=https://example.com'
```

**Test 2: Help page**
Open in browser: `http://localhost:3000`

**Test 3: JSON response**
```bash
curl -H "Content-Type: application/json" \
  'http://localhost:3000/?url=https://news.ycombinator.com'
```

**Test 4: Health check**
```bash
curl http://localhost:3000/health
```

## 🎯 Real-World Examples

### Convert a blog post
```bash
curl 'http://localhost:3000/?url=https://blog.example.com/post' > article.md
```

### Get detailed response (full page HTML)
```bash
curl 'http://localhost:3000/?url=https://example.com&enableDetailedResponse=true'
```

### Crawl a site and get 10 subpages
```bash
curl -H "Content-Type: application/json" \
  'http://localhost:3000/?url=https://example.com&crawlSubpages=true' | jq .
```

### Fetch a tweet
```bash
curl 'http://localhost:3000/?url=https://twitter.com/elonmusk/status/1234567890'
```

## 🐳 Docker Quick Start

If you prefer Docker:

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Test
curl http://localhost:3000/health

# Stop
docker-compose down
```

## 🔧 Customization

### Change port
```bash
PORT=8080 npm run dev
```

Or create `.env` file:
```bash
cp .env.example .env
# Edit .env and set PORT=8080
```

### Add authentication
```bash
export BACKEND_SECURITY_TOKEN="my-secret-token"
npm run dev
```

Then use:
```bash
curl -H "Authorization: Bearer my-secret-token" \
  'http://localhost:3000/?url=https://example.com'
```

## 📊 Monitoring

Watch cache performance:
```bash
watch -n 5 'curl -s http://localhost:3000/health | jq .'
```

## 🐛 Common Issues

**Puppeteer download fails:**
```bash
# Use system Chromium instead
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
npm install
```

**Port already in use:**
```bash
PORT=3001 npm run dev
```

**Memory errors:**
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

## 📚 Next Steps

1. ✅ Read the full [README.md](README.md) for production deployment
2. ✅ Check out the [original Markdowner](https://github.com/dhravya/markdowner)
3. ✅ Star the repo if you find it useful!
4. ✅ Deploy to your VPS using the systemd service guide

---

**Happy markdown converting! 🎉**
