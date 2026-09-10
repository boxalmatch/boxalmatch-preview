/* ============================================================
   GET  /api/submissions  — mine, or everyone's for an admin
   POST /api/submissions  — attach a title to an uploaded file
   ============================================================ */
import { ApiError } from "./_access.js";
import { json } from "./_middleware.js";
import { lookupMember, requireMember, rowToJSON, safeName } from "./_store.js";

const STATUSES = ["pending", "approved", "rejected"];

export async function onRequestGet(context) {
    const { request, env, data } = context;
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    if (status && !STATUSES.includes(status)) {
        throw new ApiError(400, "Unknown status filter.");
    }

    const where = [];
    const binds = [];

    /* A member sees only their own, whatever they ask for. */
    if (!data.isAdmin) {
        where.push("member_email = ?");
        binds.push(data.identity.email);
    }
    if (status) {
        where.push("status = ?");
        binds.push(status);
    }

    const sql =
        "SELECT * FROM submissions" +
        (where.length ? " WHERE " + where.join(" AND ") : "") +
        " ORDER BY created_at DESC LIMIT 200";

    const result = await env.DB.prepare(sql).bind(...binds).all();
    const rows = (result.results || []).map(r => rowToJSON(r, data.isAdmin));

    return json({ submissions: rows, isAdmin: data.isAdmin, email: data.identity.email });
}

export async function onRequestPost(context) {
    const { request, env, data } = context;
    const email = data.identity.email;
    const member = requireMember(await lookupMember(env, request, email), email);

    let body;
    try {
        body = await request.json();
    } catch (e) {
        throw new ApiError(400, "Expected a JSON body.");
    }

    const title = String(body.title || "").trim();
    const key = String(body.key || "").trim();
    const id = String(body.id || "").trim();

    if (!title) throw new ApiError(400, "A title is required.");
    if (title.length > 140) throw new ApiError(400, "That title is too long.");
    if (!id || !key) throw new ApiError(400, "Upload the file first.");

    /* The key must be the one this upload produced. Without this a
       caller could point a row at somebody else's object. */
    if (!key.startsWith("pending/" + id + "/")) {
        throw new ApiError(400, "That file key does not match the upload.");
    }

    const object = await env.MEDIA.head(key);
    if (!object) throw new ApiError(404, "That upload is no longer there — try again.");
    if ((object.customMetadata || {}).uploadedBy !== email) {
        throw new ApiError(403, "That upload belongs to someone else.");
    }

    const existing = await env.DB.prepare("SELECT id FROM submissions WHERE id = ?").bind(id).first();
    if (existing) throw new ApiError(409, "That upload has already been submitted.");

    const now = new Date().toISOString();

    await env.DB.prepare(
        "INSERT INTO submissions (id, member_email, member_name, title, note, event," +
        " object_key, content_type, size_bytes, status, created_at)" +
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)"
    ).bind(
        id,
        email,
        member.name || null,
        title,
        String(body.note || "").trim().slice(0, 2000) || null,
        String(body.event || "").trim().slice(0, 140) || null,
        key,
        object.httpMetadata && object.httpMetadata.contentType || "application/octet-stream",
        object.size,
        now
    ).run();

    return json({
        submission: {
            id: id, title: title, status: "pending", createdAt: now,
            filename: safeName(key), sizeBytes: object.size
        }
    }, 201);
}
