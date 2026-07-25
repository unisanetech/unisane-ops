import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import type { MarketingConsoleServeResult } from '../../contracts/marketing-console-app.js';
import { buildMarketingConsoleApp } from '../build-console-app/build-console-app.service.js';
import type {
  MarketingGoogleAuthProfileStatus,
  MarketingMetaAuthProfileStatus,
} from '@unisane/growth/marketing';

export type ServeMarketingConsoleAppOptions = {
  cwd?: string;
  configPath?: string;
  outputDirectory?: string;
  host?: string;
  port?: number;
  maxAgeDays?: number;
  limitsPath?: string;
  googleAuth?: MarketingGoogleAuthProfileStatus;
  metaAuth?: MarketingMetaAuthProfileStatus;
  createHttpServer?: typeof createServer;
};

export async function serveMarketingConsoleApp(
  options: ServeMarketingConsoleAppOptions = {},
): Promise<MarketingConsoleServeResult> {
  const host = options.host ?? '127.0.0.1';
  const port = options.port ?? 4174;
  const buildResult = await buildMarketingConsoleApp({
    cwd: options.cwd,
    configPath: options.configPath,
    outputDirectory: options.outputDirectory,
    maxAgeDays: options.maxAgeDays,
    limitsPath: options.limitsPath,
    googleAuth: options.googleAuth,
    metaAuth: options.metaAuth,
  });
  const serverFactory = options.createHttpServer ?? createServer;
  const server = serverFactory(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', `http://${host}:${port}`);
      const requestedPath = decodeURIComponent(requestUrl.pathname);
      const candidate = resolveFilePath(buildResult.outputDirectory, requestedPath);
      const filePath = (await readableFile(candidate)) ? candidate : buildResult.entryHtmlPath;
      const fileStat = await stat(filePath);
      response.statusCode = 200;
      response.setHeader('Content-Type', contentTypeFor(filePath));
      response.setHeader('Content-Length', String(fileStat.size));
      response.setHeader('Cache-Control', 'no-cache');
      createReadStream(filePath).pipe(response);
    } catch (error) {
      response.statusCode = 500;
      response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response.end(
        `Marketing Console serve failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  });
  const listenedPort = await new Promise<number>((resolvePort, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Marketing Console server did not expose a TCP address.'));
        return;
      }
      resolvePort(address.port);
    });
  });
  return {
    ...buildResult,
    host,
    port: listenedPort,
    url: `http://${host}:${listenedPort}`,
    server,
  };
}

function resolveFilePath(rootDirectory: string, requestedPath: string): string {
  const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.slice(1);
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  return path.join(rootDirectory, normalized);
}

async function readableFile(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    const fileStat = await stat(filePath);
    return fileStat.isFile();
  } catch {
    return false;
  }
}

function contentTypeFor(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}
