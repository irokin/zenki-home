// ZENKI LLM proxy — Cloudflare Worker
// Keeps the Anthropic API key on the server so the public page never sees it.
// Secrets: ANTHROPIC_API_KEY (required), ACCESS_CODE (optional)
// Vars:    ALLOWED_ORIGINS (comma separated), MODEL, MAX_TOKENS
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "content-type": "application/json; charset=utf-8" } });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "https://irokin.github.io").split(",").map(s => s.trim()).filter(Boolean);
    const okOrigin = allowed.includes(origin);
    const cors = {
      "Access-Control-Allow-Origin": okOrigin ? origin : allowed[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, x-zenki-code",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method === "GET") return json({ ok: true, service: "zenki-llm-proxy", model: env.MODEL || "claude-sonnet-5-5", needsCode: !!env.ACCESS_CODE }, 200, cors);
    if (request.method !== "POST") return json({ error: { message: "Method not allowed" } }, 405, cors);
    if (!okOrigin) return json({ error: { message: "Origin not allowed" } }, 403, cors);
    if (!env.ANTHROPIC_API_KEY) return json({ error: { message: "Proxy is missing ANTHROPIC_API_KEY" } }, 500, cors);
    if (env.ACCESS_CODE && request.headers.get("x-zenki-code") !== env.ACCESS_CODE) return json({ error: { message: "访问码不正确" } }, 401, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: { message: "Invalid JSON" } }, 400, cors); }
    if (!Array.isArray(body.messages) || !body.messages.length || body.messages.length > 40) return json({ error: { message: "messages must be a non-empty array (max 40)" } }, 400, cors);

    const cap = Number(env.MAX_TOKENS) || 1500;
    const payload = {
      model: env.MODEL || "claude-sonnet-5-5",
      max_tokens: Math.min(Number(body.max_tokens) || 1024, cap),
      messages: body.messages
    };
    if (typeof body.system === "string") payload.system = body.system.slice(0, 120000);
    if (Array.isArray(body.tools) && body.tools.length) payload.tools = body.tools.slice(0, 8);

    const upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(payload)
    });
    return new Response(await upstream.text(), { status: upstream.status, headers: { ...cors, "content-type": "application/json; charset=utf-8" } });
  }
};
