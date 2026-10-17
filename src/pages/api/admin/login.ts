import type { APIRoute } from "astro";
import { clientIp, login } from "../../../lib/admin/server";

export const prerender = false;

export const POST: APIRoute = (context) => login().login(context.request, clientIp(context.request, () => context.clientAddress));
