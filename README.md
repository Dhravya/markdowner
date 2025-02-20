# Markdowner ⚡📝

A fast tool to convert any website into LLM-ready markdown data.

## 👀 Why?

I'm building an AI app called Supermemory - https://git.new/memory. Where users can store website content in the app and then query it using AI. One thing I noticed was - when data is structured and predictable (in markdown format), the LLM responses are _much_ better.

There are other solutions available for this - https://r.jina.ai, https://firecrawl.dev, etc. But they are either:

- too expensive / proprietary
- or too limited.
- very difficult to deploy

Here's a quote from my friend [@nexxeln](https://github.com/nexxeln)
![what users think](https://i.dhr.wtf/r/Clipboard_May_9,_2024_at_12.35 AM.png)

So naturally, we fix it ourselves ⚡

## Features 🚀

- Convert any website into markdown
- LLM Filtering
- Detailed markdown mode
- Auto Crawler (without sitemap!)
- Text and JSON responses
- Easy to self-host
- ... All that and more, for FREE!

## Usage

To use the API, just make GET a request to https://md.dhr.wtf

Usage example:

```
$ curl 'https://md.dhr.wtf/?url=https://example.com'
```

##### _REQUIRED PARAMETERS_

url (string) -> The website URL to convert into markdown.

##### _OPTIONAL PARAMETERS_

`enableDetailedResponse` (boolean: false) -> Toggle for detailed response with full HTML content.
`crawlSubpages` (boolean: false) -> Crawl and return markdown for up to 10 subpages.
`llmFilter` (boolean: false) -> Filter out unnecessary information using LLM.

##### _Response Types_

Add `Content-Type: text/plain` in headers for plain text response.
Add `Content-Type: application/json` in headers for JSON response.

## Tech

Under the hood, Markdowner utilises Cloudflare's [Browser rendering](https://developers.cloudflare.com/browser-rendering/) and [Durable objects](https://developers.cloudflare.com/durable-objects/) to spin up browser instances and then convert it to markdown using Turndown.

![Architecture diagram](https://i.dhr.wtf/r/Clipboard_May_9,_2024_at_12.25 AM.png)

## Self hosting

You can easily self host this project. To use the browser rendering and Durable Objects, you need the [Workers paid plan](https://developers.cloudflare.com/workers-ai/platform/pricing/)

1. Clone the repo and download dependencies

```
git clone https://github.com/dhravya/markdowner
npm i
```

2. Run this command:
   ```
   npx wrangler kv:namespace create MD_CACHE
   ```
3. Open Wrangler.toml and change the IDs accordingly
4. Run `npm run deploy`
5. That's it 👍

## Support

Support me by simply starring this repository! ⭐
