import cors from "cors";
import "dotenv/config";
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ToolFactory } from "./tools/tool-factory.js";
import { connectDB } from "./clients/db-client.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

let mcpServer: McpServer;

// 🔥 Initialize once (important)
async function init() {
  await connectDB();

  mcpServer = new McpServer({
    name: "wenodo-mcp",
    version: "1.0.0",
  });

  ToolFactory(mcpServer);
}

//////////////////////////////////////////////////////
// ✅ 1. SSE (FOR UI CONNECTION - MOST IMPORTANT)
//////////////////////////////////////////////////////

const sseTransports = new Map<string, SSEServerTransport>();

app.get("/mcp/sse", async (_req, res) => {
  const transport = new SSEServerTransport("/mcp/messages", res);
  sseTransports.set(transport.sessionId, transport);

  res.on("close", () => {
    sseTransports.delete(transport.sessionId);
  });

  await mcpServer.connect(transport);
});

app.post("/mcp/messages", async (req, res) => {
  const sessionId = req.query.sessionId as string;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  const transport = sseTransports.get(sessionId);

  if (!transport) {
    return res.status(404).json({ error: "Invalid session" });
  }

  await transport.handlePostMessage(req, res);
});

//////////////////////////////////////////////////////
// ✅ 2. HTTP (FOR API CALLS / TESTING)
//////////////////////////////////////////////////////

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP error:", err);
    res.status(500).json({ error: "Internal error" });
  } finally {
    await transport.close();
  }
});

//////////////////////////////////////////////////////
// ✅ HEALTH CHECK
//////////////////////////////////////////////////////

app.get("/", (_req, res) => {
  res.send("MCP Server Running 🚀");
});

//////////////////////////////////////////////////////
// 🚀 START SERVER
//////////////////////////////////////////////////////

init().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 MCP running on port ${PORT}`);
    console.log(`👉 SSE: http://localhost:${PORT}/mcp/sse`);
    console.log(`👉 HTTP: http://localhost:${PORT}/mcp`);
  });
});