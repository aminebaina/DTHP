import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ZodError } from 'zod';
import {
  createGutBarrierMcpServer,
  executeCalibrateFromBiomarkers,
  executeDoseResponseSweep,
  executeListScenarios,
  executeSimulateGutBarrier,
} from './src/mcp/tools.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'dthp-gut-barrier',
      capabilities: ['rest-api', 'mcp-streamable-http', 'rk4-ode-solver'],
      tools: [
        'simulate_gut_barrier',
        'sweep_butyrate_dose_response',
        'calibrate_from_biomarkers',
        'list_reference_scenarios',
      ],
    });
  });

  app.get('/api/scenarios', (_req, res) => {
    res.json(executeListScenarios());
  });

  app.post('/api/simulate', (req, res) => {
    try {
      const output = executeSimulateGutBarrier(req.body ?? {});
      res.json(output);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ error: 'Invalid input parameters', issues: err.issues });
        return;
      }
      res.status(500).json({ error: 'Simulation execution failed' });
    }
  });

  app.post('/api/dose-response', (req, res) => {
    try {
      const output = executeDoseResponseSweep(req.body ?? {});
      res.json(output);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ error: 'Invalid input parameters', issues: err.issues });
        return;
      }
      res.status(500).json({ error: 'Dose-response sweep failed' });
    }
  });

  app.post('/api/calibrate', (req, res) => {
    try {
      const output = executeCalibrateFromBiomarkers(req.body ?? {});
      res.json(output);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ error: 'Invalid input parameters', issues: err.issues });
        return;
      }
      res.status(500).json({ error: 'Biomarker calibration failed' });
    }
  });

  // Stateless Streamable HTTP MCP endpoint for remote AI agents
  app.post('/mcp', async (req, res) => {
    const server = createGutBarrierMcpServer();
    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      res.on('close', () => {
        transport.close();
        server.close();
      });
    } catch (err) {
      console.error('MCP HTTP request error:', err);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal MCP server error' },
          id: null,
        });
      }
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`DTHP Gut Barrier Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
