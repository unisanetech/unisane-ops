import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { buildMarketingConsoleApp } from './build.js';
import type { MarketingConsoleServeResult } from './contracts.js';
import {
  handleCampaignPauseApprovalRequest,
  type CampaignPauseApprovalHandler,
} from './campaign-pause-approval-action.js';
import type {
  MarketingGoogleConnectionStatus,
  MarketingMetaConnectionStatus,
} from '@unisane/growth/marketing';
import type { MarketingConsoleCampaignPauseReview } from '@unisane/growth/console';

export type ServeMarketingConsoleAppOptions = {
  cwd?: string;
  configPath?: string;
  outputDirectory?: string;
  host?: string;
  port?: number;
  maxAgeDays?: number;
  googleAuth?: MarketingGoogleConnectionStatus;
  metaAuth?: MarketingMetaConnectionStatus;
  campaignPauseApprovalAvailable?: boolean;
  campaignPauseReviews?: readonly MarketingConsoleCampaignPauseReview[];
  approveCampaignPause?: CampaignPauseApprovalHandler;
  createHttpServer?: typeof createServer;
};

export async function serveMarketingConsoleApp(
  options: ServeMarketingConsoleAppOptions = {},
): Promise<MarketingConsoleServeResult> {
  const host = options.host ?? '127.0.0.1';
  if (
    options.approveCampaignPause &&
    host !== '127.0.0.1' &&
    host !== 'localhost' &&
    host !== '::1'
  ) {
    throw new Error(
      '[OPS_CONSOLE_APPROVAL_HOST_INVALID] Campaign approval is available only from a loopback console host.',
    );
  }
  const port = options.port ?? 4174;
  const buildResult = await buildMarketingConsoleApp({
    cwd: options.cwd,
    outputDirectory: options.outputDirectory,
    maxAgeDays: options.maxAgeDays,
    googleAuth: options.googleAuth,
    metaAuth: options.metaAuth,
    campaignPauseApprovalAvailable: options.campaignPauseApprovalAvailable,
    campaignPauseReviews: options.campaignPauseReviews,
  });
  const serverFactory = options.createHttpServer ?? createServer;
  const server = serverFactory(async (request, response) => {
    try {
      if (
        await handleCampaignPauseApprovalRequest(request, response, options.approveCampaignPause)
      ) {
        return;
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.statusCode = 405;
        response.setHeader('Allow', 'GET, HEAD');
        response.end();
        return;
      }
      const requestUrl = new URL(request.url ?? '/', `http://${host}:${port}`);
      const requestedPath = decodeURIComponent(requestUrl.pathname);
      const candidate = resolveFilePath(buildResult.outputDirectory, requestedPath);
      const filePath = (await readableFile(candidate)) ? candidate : buildResult.entryHtmlPath;
      const fileStat = await stat(filePath);
      response.statusCode = 200;
      response.setHeader('Content-Type', contentTypeFor(filePath));
      response.setHeader('Content-Length', String(fileStat.size));
      response.setHeader('Cache-Control', 'no-cache');
      if (request.method === 'HEAD') response.end();
      else createReadStream(filePath).pipe(response);
    } catch (error) {
      response.statusCode = 500;
      response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response.end(
        `Unisane Ops Console serve failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  });
  const listenedPort = await new Promise<number>((resolvePort, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Unisane Ops Console server did not expose a TCP address.'));
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
