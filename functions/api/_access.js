/* ============================================================
   Cloudflare Access identity — verified server side
   ------------------------------------------------------------
   Every request that reaches a Function through Access carries a
   signed JWT in the Cf-Access-Jwt-Assertion header. This module
   checks that signature against Cloudflare's published keys and
   hands back the caller's email.

   The signature check is the whole security boundary. Reading the
   email out of the token without verifying it would let anyone
   forge a header and post as any member, so never shortcut it.
   ============================================================ */

const CERTS_TTL_MS = 60 * 60 * 1000;

let jwksCache = { url: null, keys: null, at: 0 };

export class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

function base64urlToBytes(part) {
    let s = part.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const binary = atob(s);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function decodeSegment(part) {
    return JSON.parse(new TextDecoder().decode(base64urlToBytes(part)));
}

async function signingKeys(teamDomain) {
    const url = "https://" + teamDomain + "/cdn-cgi/access/certs";
    const now = Date.now();

    if (jwksCache.url === url && jwksCache.keys && now - jwksCache.at < CERTS_TTL_MS) {
        return jwksCache.keys;
    }

    const res = await fetch(url, { cf: { cacheTtl: 3600 } });
    if (!res.ok) throw new ApiError(503, "Could not reach the Access signing keys.");

    const body = await res.json();
    const keys = body.keys || [];
    if (!keys.length) throw new ApiError(503, "Access published no signing keys.");

    jwksCache = { url: url, keys: keys, at: now };
    return keys;
}

async function verify(token, teamDomain, aud) {
    const parts = token.split(".");
    if (parts.length !== 3) throw new ApiError(401, "Malformed access token.");

    const header = decodeSegment(parts[0]);
    if (header.alg !== "RS256") throw new ApiError(401, "Unexpected token algorithm.");

    const keys = await signingKeys(teamDomain);
    const jwk = keys.find(k => k.kid === header.kid);
    if (!jwk) throw new ApiError(401, "Token signed with an unknown key.");

    const key = await crypto.subtle.importKey(
        "jwk",
        { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["verify"]
    );

    const signed = new TextEncoder().encode(parts[0] + "." + parts[1]);
    const ok = await crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        key,
        base64urlToBytes(parts[2]),
        signed
    );
    if (!ok) throw new ApiError(401, "Access token signature does not check out.");

    const payload = decodeSegment(parts[1]);
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) throw new ApiError(401, "Access token has expired.");
    if (payload.nbf && payload.nbf > now + 60) throw new ApiError(401, "Access token is not valid yet.");
    if (payload.iss !== "https://" + teamDomain) throw new ApiError(401, "Access token issued by another team.");

    /* aud is the Application Audience tag of one specific Access
       application. Without this check a token minted for any other
       app on the same team would open this one. */
    const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audience.includes(aud)) throw new ApiError(401, "Access token is for a different application.");

    if (!payload.email) throw new ApiError(401, "Access token carries no email.");

    return { email: String(payload.email).toLowerCase(), sub: payload.sub || null };
}

/* Who is calling. Throws ApiError for anything that is not a
   verified member, so route handlers can assume an identity. */
export async function identify(request, env) {
    const teamDomain = env.ACCESS_TEAM_DOMAIN;
    const aud = env.ACCESS_AUD;

    if (teamDomain && aud) {
        const token = request.headers.get("Cf-Access-Jwt-Assertion");
        if (!token) throw new ApiError(401, "No Access token on this request.");
        return verify(token, teamDomain, aud);
    }

    /* Local development only. wrangler reads DEV_EMAIL from .dev.vars,
       which is gitignored and never deployed. Note the ordering above:
       once ACCESS_TEAM_DOMAIN and ACCESS_AUD are set, a stray DEV_EMAIL
       cannot be used to bypass the real check. */
    if (env.DEV_EMAIL) {
        return { email: String(env.DEV_EMAIL).toLowerCase(), sub: "dev", dev: true };
    }

    /* Misconfigured rather than open: refuse instead of guessing. */
    throw new ApiError(503, "Access is not configured for this deployment.");
}

/* Admins can see and moderate everyone's submissions. Set
   ADMIN_EMAILS in the Pages project as a comma-separated list. */
export function isAdmin(email, env) {
    const raw = env.ADMIN_EMAILS || "";
    return raw
        .split(",")
        .map(e => e.trim().toLowerCase())
        .filter(Boolean)
        .includes(String(email).toLowerCase());
}
