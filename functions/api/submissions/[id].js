/* ============================================================
   PATCH  /api/submissions/:id  — approve or reject (admin only)
   DELETE /api/submissions/:id  — withdraw (owner) or remove (admin)
   ============================================================ */
import { ApiError } from "../_access.js";
import { json } from "../_middleware.js";
import { rowToJSON } from "../_store.js";

const DECISIONS = ["approved", "rejected", "pending"];

async function load(env, id) {
    const row = await env.DB.prepare("SELECT * FROM submissions WHERE id = ?").bind(id).first();
    if (!row) throw new ApiError(404, "No submission with that id.");
    return row;
}

export async function onRequestPatch(context) {
    const { request, env, params, data } = context;

    if (!data.isAdmin) throw new ApiError(403, "Only an admin can review submissions.");

    const row = await load(env, params.id);

    let body;
    try {
        body = await request.json();
    } catch (e) {
        throw new ApiError(400, "Expected a JSON body.");
    }

    const status = String(body.status || "").trim();
    if (!DECISIONS.includes(status)) throw new ApiError(400, "Status must be approved, rejected or pending.");

    const now = new Date().toISOString();

    await env.DB.prepare(
        "UPDATE submissions SET status = ?, review_note = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?"
    ).bind(
        status,
        String(body.reviewNote || "").trim().slice(0, 1000) || null,
        data.identity.email,
        now,
        row.id
    ).run();

    const updated = await load(env, params.id);
    return json({ submission: rowToJSON(updated, true) });
}

export async function onRequestDelete(context) {
    const { env, params, data } = context;
    const row = await load(env, params.id);

    const owns = row.member_email === data.identity.email;
    if (!owns && !data.isAdmin) throw new ApiError(403, "That is not yours to delete.");

    /* A member can withdraw while it is still pending; once it has
       been approved and published, taking it down is an admin call. */
    if (owns && !data.isAdmin && row.status !== "pending") {
        throw new ApiError(409, "That one has already been reviewed — ask an admin to remove it.");
    }

    await env.MEDIA.delete(row.object_key);
    await env.DB.prepare("DELETE FROM submissions WHERE id = ?").bind(row.id).run();

    return json({ deleted: row.id });
}
