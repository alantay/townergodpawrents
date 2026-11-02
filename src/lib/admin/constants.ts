// Shared admin constraints and copy, safe to import in the browser or Node.
export const MAX_VIDEO_BYTES = 300 * 1024 * 1024;
export const VIDEO_CONTENT_TYPES = ["video/mp4", "video/quicktime"];
export const POST_KEY_RE = /^[A-Za-z0-9-]{8,100}$/;
export const BAD_VIDEO = "Video didn't send. Nothing was posted. Try again.";
