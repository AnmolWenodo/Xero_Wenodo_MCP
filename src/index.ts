#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { XeroMcpServer } from "./server/xero-mcp-server.js";
import { ToolFactory } from "./tools/tool-factory.js";
import { connectDB } from "./clients/db-client.js";

async function start() {
  await connectDB();
}

const main = async () => {
  // Create an MCP server
  const server = XeroMcpServer.GetServer();

  ToolFactory(server);

  // Start receiving messages on stdin and sending messages on stdout
  const transport = new StdioServerTransport();
  await server.connect(transport);
};

start().then(() => {
  // console.error("🚀 Server is running...");
  main(); // start the main function after the server is running
}).catch((error) => {
  console.error("Error during startup:", error);
  process.exit(1);
} );

// main().catch((error) => {
//   console.error("Error:", error);
//   process.exit(1);
// });


