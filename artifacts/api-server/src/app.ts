declare module "express" {
  const express: any;
  export default express;
}

import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger";

const app = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Avoid importing DB-backed routes when `SKIP_DB` is set to "true".
// This allows starting the server for frontend development without a DB driver installed.
if (process.env.SKIP_DB === "true") {
  // Mount only a minimal health endpoint when DB is skipped so the server can start for frontend dev.
  (async () => {
    try {
      const { default: healthRouter } = await import("./routes/health");
      app.use("/api", healthRouter);
    } catch (err) {
      logger.warn({ err }, "Failed to load health route; mounting basic health responder");
      app.use("/api", (_req, res) => res.status(200).json({ status: "ok" }));
    }
  })();
} else {
  // Import routes lazily to prevent top-level DB imports when skipped.
  // Use top-level await so the module is loaded before handling requests.
  (async () => {
    const { default: router } = await import("./routes");
    app.use("/api", router);
  })().catch((err) => {
    // If routes fail to load, log and mount a 500 responder so server still runs.
    logger.error({ err }, "Failed to load routes");
    app.use("/api", (_req, res) => res.status(500).json({ error: "Failed to initialize routes" }));
  });
}

export default app;
