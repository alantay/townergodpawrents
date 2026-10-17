import type { APIRoute } from "astro";
import { login } from "../../../lib/admin/server";

export const prerender = false;

export const POST: APIRoute = ({ request }) => login().logout(request);
