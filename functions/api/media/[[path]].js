/* ============================================================
   GET /api/media/<object key>
   ------------------------------------------------------------
   The bucket is private. Files come back through here so the same
   rules that govern the listing govern the bytes: a member sees
   approved files and their own, an admin sees everything.

   Serving R2 publicly instead would make every pending upload
   readable by anyone who guessed the URL, review or no review.
   ============================================================ */
import { ApiError } from "../_access.js";

export async function onRequestGet(context) {
    const { env, params, data, request } = context;

    const key = Array.isArray(params.path) ? params.path.join("/") : String(params.path || "");
    if (!key) throw new ApiError(400, "No file named.");

    const row = await env.DB.prepare("SELECT * FROM submissions WHERE object_key = ?").bind(key).first();
    if (!row) throw new ApiError(404, "No such file.");

    const owns = row.member_email === data.identity.email;
    if (!data.isAdmin && !owns && row.status !== "approved") {
        throw new ApiError(403, "That file is still under review.");
    }

    /* R2 takes the Headers object here, not the Request — passing the
       request silently disables range support, and video scrubbing
       stops working. */
    const object = await env.MEDIA.get(key, {
        range: request.headers.has("range") ? request.headers : undefined
    });
    if (!object) throw new ApiError(404, "That file is no longer stored.");

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    /* private: approved or not, this is member material and must not
       sit in a shared cache. */
    headers.set("cache-control", "private, max-age=3600");
    if (object.range) headers.set("content-range",
        "bytes " + object.range.offset + "-" + (object.range.offset + object.range.length - 1) + "/" + object.size);

    return new Response(object.body, { status: object.range ? 206 : 200, headers: headers });
}
