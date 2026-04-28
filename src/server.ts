import cors from "cors";
import "dotenv/config";
import dotenv from "dotenv";
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ToolFactory } from "./tools/tool-factory.js";
import { connectDB } from "./clients/db-client.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

let mcpServer: McpServer;

async function init() {
  await connectDB();

  mcpServer = new McpServer({
    name: "wenodo-mcp",
    version: "1.0.0",
  });
  mcpServer.tool("test", async () => {
    return {
      content: [{ type: "text", text: "working" }],
    };
  });

  ToolFactory(mcpServer);
}

//////////////////////////////////////////////////////
// ✅ 2. HTTP (FOR API CALLS / TESTING)
//////////////////////////////////////////////////////

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await mcpServer.connect(transport);

    // 🔥 IMPORTANT: DO NOT pass res manually logic after this
    await transport.handleRequest(req, res, req.body);

    // ❌ REMOVE ANY res.send / res.end / logs after this
    // transport handles response itself

  } catch (err) {
    console.error("MCP error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal error" });
    }
  }
});

app.get("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await mcpServer.connect(transport);

    await transport.handleRequest(req, res, {
      method: "tools/list",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
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
