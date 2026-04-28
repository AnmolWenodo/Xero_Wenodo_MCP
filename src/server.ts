#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-explicit-any */

import express from "express";
import cors from "cors";
import { XeroMcpServer } from "./server/xero-mcp-server.js";
import { ToolFactory } from "./tools/tool-factory.js";
import { connectDB } from "./clients/db-client.js";

const app = express();
app.use(cors());
app.use(express.json());

async function init() {
  await connectDB();

  const server = XeroMcpServer.GetServer();
  ToolFactory(server);

  return server;
}

let mcpServer: any;

app.post("/mcp", async (req, res) => {
  try {
    const response = await mcpServer.handleRequest(req.body);
    res.json(response);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("MCP Server Running 🚀");
});

const PORT = process.env.PORT || 3000;

init().then((server) => {
  mcpServer = server;

  app.listen(PORT, () => {
    console.log(`🚀 MCP HTTP Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error("Startup error:", err);
  process.exit(1);
});