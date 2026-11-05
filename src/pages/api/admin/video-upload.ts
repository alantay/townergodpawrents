import type { APIRoute } from "astro";
import { videoUpload } from "../../../lib/admin/server";

export const prerender = false;

export const POST: APIRoute = ({ request }) => videoUpload(request);
