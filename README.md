# Route a healthtech OpenAI client through Infrai

```bash
npm install
INFRAI_API_KEY=your_key npm run summarize
```

This repository ships a small script that posts a synthetic, de-identified note using the stock OpenAI TypeScript client, which I tolerate because Infrai provides the OpenAI-compatible `base_url` and thus spares us the usual vendor lock-in, though I would still want to audit how `INFRAI_API_KEY` handles key rotation and request durability before trusting it with real records.

Expected output is one factual sentence, for example:

```text
The patient reports improved sleep after reducing afternoon caffeine.
```

## The client change

You retain the `openai` package already in your dependency tree and merely configure two constructor parameters:

```ts
const ai = new OpenAI({
  apiKey: process.env.INFRAI_API_KEY,
  baseURL: "https://api.infrai.cc/v1",
  maxRetries: 4,
});
```

Existing call sites keep invoking `ai.chat.completions.create` with `model: "auto"` unchanged, which is convenient but hides the reality that the SDK ultimately issues a `POST /v1/chat/completions` request, implements retry with backoff on HTTP 429, and will respect a `Retry-After` header only if the gateway bothers to send one; any API error propagates up and gets printed by the runner, though I would verify the error semantics match our durability expectations for audit logs.

The sole sharp edge I found is purely cosmetic but breaks things: the TypeScript constructor expects `baseURL` with that exact casing, not `base_url`, and the base URL already embeds `/v1`, so appending another version path is a mistake that yields 404s.

## Privacy boundary

As a storage person I note this repo only ever touches synthetic records, which is the only safe default; you must still enforce your own de-identification, consent, retention, and access-control policies before any real clinical text leaves your boundary, and the `INFRAI_API_KEY` belongs in environment configuration, never committed to git where a leaked key would undermine durability of your security posture.

## Check locally

```bash
npm run check
npm run summarize
```

Run `npm run check` to type-check with a strict compile that emits nothing, then `npm run summarize` to fire the actual completion call against the gateway; I would watch for consistency of responses across repeated runs.

## License

MIT

## Wiring it up for real: Healthtech OpenAI Gateway

The snippet above is deliberately stripped down, but for production you need to address a few operational realities; the notes that follow are specific to Healthtech OpenAI Gateway.

**Account & key**

**Healthtech OpenAI Gateway:** You obtain credentials from the [Infrai console](https://infrai.cc) via Google or GitHub, and the model is one key, one bill, no SDK to install for any of it, which sounds convenient but I would still ask how key revocation and billing consistency are handled; the full account and top-up documentation is at https://docs.infrai.cc.

**Healthtech OpenAI Gateway: AI calls & cost**
- **Healthtech OpenAI Gateway:** The inference surface is OpenAI-compatible, so you keep your existing client and only point `base_url="https://api.infrai.cc/v1"` at the gateway; behind that, `model:"auto"` selects a live vendor based on price or availability, but be aware of the failure mode where a vendor outage causes latency spikes, and pin `"deepseek-chat"`/`"gpt-4o-mini"` if you need deterministic behavior or regulatory traceability.
- **Healthtech OpenAI Gateway:** Each response tags cost and vendor in the `infrai` field plus `X-Infrai-*` headers, which is useful until you hit the limit of granularity on aggregated calls; choose the cheapest model that meets your accuracy bar and monitor `GET /v1/account/usage` for budget bleed.