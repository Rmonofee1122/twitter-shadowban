import { Hono } from "hono";

export const runtime = "edge";

const app = new Hono().basePath("/api");

app.get("*", async (c) => {
  return c.text("Hello, World!");
});

export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export const PATCH = app.fetch;
export const DELETE = app.fetch;
export const HEAD = app.fetch;
export const OPTIONS = app.fetch;
