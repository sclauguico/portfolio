# Sandy Twin — Cloudflare Worker

A tiny backend that sits between the portfolio frontend (GitHub Pages) and OpenRouter. Holds the API key, injects Sandy's bio as the system prompt, and streams responses back to the browser.

Runs free on Cloudflare Workers (100k req/day) with OpenRouter free models ($0).

## First-time setup (5 min)

```bash
cd worker
npm install
npx wrangler login             # opens browser, sign in to Cloudflare
npx wrangler secret put OPENROUTER_API_KEY
# paste the key from https://openrouter.ai → Keys
```

## Deploy

```bash
npm run deploy
```

Wrangler will print a URL like:

```
https://sandy-twin.<your-subdomain>.workers.dev
```

Copy that URL. You'll need it on the frontend.

## Tell the frontend where to call

Create `portfolio/.env` (at the repo root, NOT inside `worker/`):

```
PUBLIC_AI_ENDPOINT=https://sandy-twin.<your-subdomain>.workers.dev
```

Then `npm run dev` in the portfolio root. Refresh — the AI twin card in the Contact section becomes an actual chat.

For GitHub Pages deploys, set `PUBLIC_AI_ENDPOINT` as a repository secret and reference it in `.github/workflows/deploy.yml` (the build step).

## Local iteration

```bash
npm run dev      # runs the worker on http://localhost:8787
npm run tail     # stream production logs
```

Point the frontend at `http://localhost:8787` during local worker dev.

## Edit the bio / context

`src/system-prompt.ts` is a plain TS file with Sandy's bio, project list, and
tone rules. Edit and `npm run deploy` — takes ~5 seconds.

## Switching models

Edit `MODEL` in `wrangler.toml`. Free OpenRouter options:

- `meta-llama/llama-3.3-70b-instruct:free` — general quality (default)
- `google/gemini-2.0-flash-exp:free` — fastest
- `deepseek/deepseek-chat-v3-0324:free` — strong reasoning
- `qwen/qwen-2.5-72b-instruct:free` — balanced

Redeploy to apply.

## Custom domain (optional)

To serve at `api.sailauguico.io` instead of `*.workers.dev`:

1. Move DNS for `sailauguico.io` from GoDaddy to Cloudflare (free, ~10 min).
2. Uncomment the `[[routes]]` block in `wrangler.toml`.
3. `npm run deploy`.

If you don't want to move DNS, the `*.workers.dev` URL works perfectly fine.

## Rate limits & safety

The worker caps:
- Message length: 1000 chars
- History window: last 8 messages

Cloudflare automatically shields against DDoS and bot abuse at the edge. If you want explicit per-IP rate limiting, add a `[[unsafe.bindings]]` Rate Limiter block — free tier allows 1000 req/min per key.

## Cost

| Component | Free tier | What you'll use |
| --- | --- | --- |
| Cloudflare Worker | 100k req/day | < 100/day realistically |
| OpenRouter free models | ~50 req/day per model | Plenty |
| **Total** | — | **$0/month** |
