import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createGutBarrierMcpServer } from './src/mcp/tools.ts';

async function main() {
  const server = createGutBarrierMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('MCP server startup error:', error);
  process.exit(1);
});
