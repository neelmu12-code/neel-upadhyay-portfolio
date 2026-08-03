const withSecurityHeaders = (response) => {
  const headers = new Headers(response.headers);
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const direct = await env.ASSETS.fetch(request);

    if (direct.status !== 404 || url.pathname.includes(".")) {
      return withSecurityHeaders(direct);
    }

    const htmlUrl = new URL(`${url.pathname.replace(/\/$/, "")}.html`, url);
    const htmlResponse = await env.ASSETS.fetch(new Request(htmlUrl, request));
    return withSecurityHeaders(htmlResponse);
  },
};
