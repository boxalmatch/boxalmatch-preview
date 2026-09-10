/* ============================================================
   Runs before every /api/* route.
   Attaches the verified caller to context.data and turns thrown
   ApiErrors into JSON, so route handlers stay short.
   ============================================================ */
import { identify, isAdmin, ApiError } from "./_access.js";

export function json(body, status) {
    return new Response(JSON.stringify(body), {
        status: status || 200,
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store"
        }
    });
}

export async function onRequest(context) {
    const { request, env, next, data } = context;

    try {
        const identity = await identify(request, env);
        data.identity = identity;
        data.isAdmin = isAdmin(identity.email, env);

        if (!env.DB) throw new ApiError(503, "No database bound to this deployment.");
        if (!env.MEDIA) throw new ApiError(503, "No media bucket bound to this deployment.");

        return await next();
    } catch (err) {
        if (err instanceof ApiError) {
            return json({ error: err.message, code: err.status }, err.status);
        }
        /* Unexpected: log for `wrangler pages deployment tail`, but do
           not hand internals to the browser. */
        console.error("api error", err && err.stack ? err.stack : err);
        return json({ error: "Something went wrong handling that request.", code: 500 }, 500);
    }
}
