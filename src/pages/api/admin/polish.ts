import type { APIRoute } from "astro";
import { polish } from "../../../lib/admin/server";

export const prerender = false;

export const POST: APIRoute = ({ request }) => polish().polish(request);
