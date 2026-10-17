import type { APIRoute } from "astro";
import { post } from "../../../lib/admin/server";

export const prerender = false;

export const POST: APIRoute = ({ request }) => post().post(request);
