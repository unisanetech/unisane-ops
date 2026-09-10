import { handleGtmSetupRequest } from './gtm-setup-action.js';
import { handleGtmReleaseRequest, type ConsoleGtmRelease } from './gtm-release-action.js';
import { handleGtmWorkspaceRequest, type ConsoleGtmWorkspace } from './gtm-workspace-action.js';
import { handleGtmDiagnosisRequest } from './gtm-action.js';
import {
  handleMetaDiagnosticRequest,
  type ConsoleMetaDiagnostics,
} from './meta-diagnostic-action.js';
import type { ConsoleMetaReportHistoryReader } from './meta-report-action.js';
import { handleMetaReportRequest, type ConsoleMetaReportReader } from './meta-report-action.js';
import type { GrowthCapabilityReviewer } from '@unisane/growth/console';
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
import { handleTemporalStateRequest } from './temporal-state.js';

export type ServeMarketingConsoleAppOptions = {
  environmentId?: string;
  reviewCapabilities?: GrowthCapabilityReviewer;
  gtmWorkspace?: ConsoleGtmWorkspace;
  gtmRelease?: ConsoleGtmRelease;
  readReport?: ConsoleMetaReportReader;
  metaDiagnostics?: ConsoleMetaDiagnostics;
  collectReport?: ConsoleMetaReportReader;
  readReportHistory?: ConsoleMetaReportHistoryReader;
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
    (options.gtmRelease || options.gtmWorkspace ||
      options.metaDiagnostics ||
      options.approveCampaignPause ||
      options.readReport ||
      options.collectReport ||
      options.readReportHistory) &&
    host !== '127.0.0.1' &&
    host !== 'localhost' &&
    host !== '::1'
  ) {
    throw new Error(
      '[OPS_CONSOLE_APPROVAL_HOST_INVALID] Console actions are available only from a loopback console host.',
    );
  }
  const port = options.port ?? 4174;
  const buildResult = await buildMarketingConsoleApp({
    cwd: options.cwd,
    environmentId: options.environmentId,
    outputDirectory: options.outputDirectory,
    maxAgeDays: options.maxAgeDays,
    googleAuth: options.googleAuth,
    metaAuth: options.metaAuth,
    reviewCapabilities: options.reviewCapabilities,
    metaDiagnosticsAvailable: Boolean(options.metaDiagnostics),
    reportReadAvailable: Boolean(options.readReport),
    reportEvidenceAvailable: Boolean(options.collectReport && options.readReportHistory),
    campaignPauseApprovalAvailable: options.campaignPauseApprovalAvailable,
    campaignPauseReviews: options.campaignPauseReviews,
  });
  const serverFactory = options.createHttpServer ?? createServer;
  const server = serverFactory(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', `http://${host}:${port}`);
      if (
        await handleCampaignPauseApprovalRequest(request, response, options.approveCampaignPause)
      ) {
        return;
      }
      if (
        await handleMetaReportRequest(
          request,
          response,
          options.readReport,
          {
            projectId: buildResult.state.platformId,
            environmentId: buildResult.state.environment,
          },
          { collect: options.collectReport, history: options.readReportHistory },
        )
      )
        return;
      if (
        await handleMetaDiagnosticRequest(request, response, options.metaDiagnostics, {
          projectId: buildResult.state.platformId,
          environmentId: buildResult.state.environment,
        })
      )
        return;
      if(await handleGtmSetupRequest(request,response,{projectId:buildResult.state.platformId,environmentId:buildResult.state.environment}))return;
      if (
        await handleGtmDiagnosisRequest(request, response, {
          projectId: buildResult.state.platformId,
          environmentId: buildResult.state.environment,
        })
      )
        return;
      if (await handleGtmReleaseRequest(request,response,options.gtmRelease,{projectId:buildResult.state.platformId,environmentId:buildResult.state.environment})) return;
      if (
        await handleGtmWorkspaceRequest(request, response, options.gtmWorkspace, {
          projectId: buildResult.state.platformId,
          environmentId: buildResult.state.environment,
        })
      )
        return;
      if (await handleTemporalStateRequest(request, response, requestUrl, options)) return;
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.statusCode = 405;
        response.setHeader('Allow', 'GET, HEAD');
        response.end();
        return;
      }
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
