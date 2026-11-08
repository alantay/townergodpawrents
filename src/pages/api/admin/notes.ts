import type { APIRoute } from "astro";
import { notes } from "../../../lib/admin/server";

export const prerender = false;

export const POST: APIRoute = ({ request }) => notes().post(request);
