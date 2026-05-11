import express from "express";
import { env } from "./src/configs/env.js";
import { sendError } from "./src/common/response.js";
import { modules } from "./src/modules/index.js";
import dns from "dns";

const defaultOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const allowedOrigins = new Set([...defaultOrigins, ...env.corsOrigins]);

if (env.appUrl) {
  allowedOrigins.add(env.appUrl);
}

dns.setServers([
  '1.1.1.1',
  '8.8.8.8'
])

const app = express();

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());

for (const module of modules) {
  app.use(module.routePath, module.router);
}

app.get("/", (req, res) => {
  res.json({
    message: "Pullman booking backend is running",
    modules: modules.map((module) => module.moduleName),
  });
});

app.use((error, req, res, next) => {
  return sendError(res, error);
});

export default app;
