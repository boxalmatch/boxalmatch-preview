/* ============================================================
   GET /api/library/<folder>/<subfolder>/...
   ------------------------------------------------------------
   Browses the shared archive in R2. Every signed-in member may
   read all of it; _middleware.js has already verified the
   Cloudflare Access identity by the time this runs, so there is
   no per-file rule to apply here beyond staying inside ROOT.

   R2 has no folders. Keys are flat strings that happen to contain
   slashes, and `delimiter` is what turns them back into a tree:
   `delimitedPrefixes` are the subfolders of this level and
   `objects` are the files sitting directly in it. Without the
   delimiter a list of the whole bucket comes back flat.

   Why not serve the bucket publicly instead: R2's public access is
   all-or-nothing. There is no per-member rule, so a public bucket
   would hand every pending upload to anyone who guessed a key.
   ============================================================ */
import { ApiError } from "../_access.js";
import { json } from "../_middleware.js";

/* The archive lives under one prefix and this route can never look
   outside it — authorisation here is a property of the key rather
   than of a database row, which is what lets files that were never
   submitted through the upload form (anything dropped straight into
   the bucket) be readable without inventing rows for them. */
const ROOT = "library/";
const PAGE = 200;

export async function onRequestGet(context) {
    const { env, params, request } = context;

    const rest = Array.isArray(params.path)
        ? params.path.join("/")
        : String(params.path || "");

    /* R2 would treat "library/../pending/x" as that literal key and
       simply not find it, so this is belt and braces — but a request
       shaped like an escape attempt should be refused, not 404'd. */
    if (rest.split("/").some(seg => seg === "..") || rest.startsWith("/")) {
        throw new ApiError(400, "Bad path.");
    }

    const prefix = rest ? ROOT + rest.replace(/\/+$/, "") + "/" : ROOT;

    const url = new URL(request.url);
    const listed = await env.MEDIA.list({
        prefix: prefix,
        delimiter: "/",
        limit: PAGE,
        cursor: url.searchParams.get("cursor") || undefined
    });

    const folders = (listed.delimitedPrefixes || []).map(p => ({
        name: p.slice(prefix.length).replace(/\/$/, ""),
        path: p.slice(ROOT.length).replace(/\/$/, "")
    }));

    const files = listed.objects
        /* The placeholder object that gives an empty folder something to
           exist as: R2 cannot store a directory, so a zero-byte key
           ending in a slash is the usual way to make one. Not a file. */
        .filter(o => !o.key.endsWith("/"))
        .map(o => ({
            name: o.key.slice(prefix.length),
            key: o.key,
            size: o.size,
            uploaded: o.uploaded,
            /* Each segment encoded separately: the slashes are the path,
               everything else may be a space or an accent. */
            href: "/api/media/" + o.key.split("/").map(encodeURIComponent).join("/")
        }));

    return json({
        path: rest,
        folders: folders,
        files: files,
        truncated: !!listed.truncated,
        cursor: listed.truncated ? listed.cursor : null
    });
}
