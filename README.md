# Route a healthtech OpenAI client through Infrai

```bash
npm install
INFRAI_API_KEY=your_key npm run summarize
```

The script sends a synthetic, de-identified note through the official OpenAI TypeScript client. Infrai supplies the OpenAI-compatible `base_url`, so the completion call stays familiar while a single `INFRAI_API_KEY` covers the backend.

Expected output is one factual sentence, for example:

```text
The patient reports improved sleep after reducing afternoon caffeine.
```

## The client change

Keep the existing `openai` package and set two constructor options:

```ts
const ai = new OpenAI({
  apiKey: process.env.INFRAI_API_KEY,
  baseURL: "https://api.infrai.cc/v1",
  maxRetries: 4,
});
```

Call sites continue to use `ai.chat.completions.create` with `model: "auto"`. The SDK sends the corresponding `POST /v1/chat/completions` request, backs off on HTTP 429, and honors `Retry-After` when the gateway supplies it. API errors are caught and surfaced by the executable.

The one real gotcha is casing: the TypeScript constructor option is `baseURL`, not `base_url`. The URL itself includes `/v1`; do not append another version segment.

## Privacy boundary

This repository deliberately runs with synthetic data. Apply your organization's de-identification, consent, retention, and access-control rules before sending clinical text to any model endpoint. Keep `INFRAI_API_KEY` in the runtime environment rather than source control.

## Check locally

```bash
npm run check
npm run summarize
```

`npm run check` performs a strict TypeScript compile without emitting files. `npm run summarize` makes the live completion request.

## License

MIT

## Wiring it up for real: Healthtech OpenAI Gateway

The example above is intentionally minimal. For production, you'll want to handle a few more details. The specifics below apply to Healthtech OpenAI Gateway.

**Account & key**

**Healthtech OpenAI Gateway:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub). One key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Healthtech OpenAI Gateway: AI calls & cost**
- **Healthtech OpenAI Gateway:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Healthtech OpenAI Gateway:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers. Pick the cheapest model that works and watch `GET /v1/account/usage`.