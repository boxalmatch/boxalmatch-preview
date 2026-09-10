/* ============================================================
   POST /api/upload  — the file bytes, nothing else
   ------------------------------------------------------------
   The body is streamed straight into R2 rather than read into
   memory: request.formData() would buffer the whole file, and a
   phone video would blow the Worker's memory ceiling long before
   it reached the bucket.

   The browser calls this first, then POSTs /api/submissions with
   the returned key and the title. Two calls, because metadata in
   a multipart body would force the buffering this avoids.
   ============================================================ */
import { ApiError } from "./_access.js";
import { json } from "./_middleware.js";
import {
    MAX_UPLOAD_BYTES, ALLOWED_TYPES,
    lookupMember, requireMember, objectKey, newId, safeName
} from "./_store.js";

export async function onRequestPost(context) {
    const { request, env, data } = context;
    const email = data.identity.email;

    requireMember(await lookupMember(env, request, email), email);

    const contentType = (request.headers.get("content-type") || "").split(";")[0].trim();
    if (!ALLOWED_TYPES.includes(contentType)) {
        throw new ApiError(415, "That file type is not accepted: " + (contentType || "unknown") + ".");
    }

    const declared = Number(request.headers.get("content-length") || 0);
    if (declared > MAX_UPLOAD_BYTES) {
        throw new ApiError(413, "That file is larger than the " +
            Math.round(MAX_UPLOAD_BYTES / 1024 / 1024) + " MB limit.");
    }
    if (!request.body) throw new ApiError(400, "No file in that request.");

    const id = newId();
    const filename = safeName(request.headers.get("x-file-name"));
    const key = objectKey(id, filename);

    const object = await env.MEDIA.put(key, request.body, {
        httpMetadata: { contentType: contentType },
        customMetadata: { uploadedBy: email, originalName: filename }
    });

    /* R2 reports the size it actually stored; content-length is only
       what the browser promised. Trust the bucket. */
    if (object.size > MAX_UPLOAD_BYTES) {
        await env.MEDIA.delete(key);
        throw new ApiError(413, "That file is larger than the limit.");
    }

    return json({ id: id, key: key, filename: filename, sizeBytes: object.size, contentType: contentType }, 201);
}
