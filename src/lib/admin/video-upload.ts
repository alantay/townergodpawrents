// POST /api/admin/video-upload: authenticate token requests; verify Blob callbacks.
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAuth } from "./auth.ts";
import { BAD_VIDEO, MAX_VIDEO_BYTES, POST_KEY_RE, VIDEO_CONTENT_TYPES } from "./constants.ts";
import { json } from "./http.ts";

export async function videoUploadApi(request: Request, deps: { secret: string | undefined; token: string | undefined }): Promise<Response> {
  try {
    const body: HandleUploadBody = await request.json();
    if (body?.type === "blob.generate-client-token") {
      const denied = requireAuth(request, deps.secret);
      if (denied) return denied;
    }
    const result = await handleUpload({
      request,
      body,
      token: deps.token,
      onBeforeGenerateToken: async (pathname) => {
        const match = /^admin-video\/([^/]+)\.(mp4|mov)$/.exec(pathname);
        if (!match || !POST_KEY_RE.test(match[1])) throw new Error("Bad video path");
        return {
          allowedContentTypes: VIDEO_CONTENT_TYPES,
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return json(result);
  } catch (error) {
    console.error("[admin] video upload failed", error);
    return json({ error: BAD_VIDEO }, 400);
  }
}
