import { Elysia } from "elysia";
import { greet, VERSION } from "@elysia-on-vercel/shared";

const app = new Elysia()
  .get("/", () => ({ message: greet("World"), version: VERSION }))
  .get("/health", () => ({ status: "ok" }));

export default app;
