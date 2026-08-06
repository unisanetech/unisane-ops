import { OpsActionExecutionError } from '@unisane/ops-engine/actions';
import {
  admitHostedReadAction,
  type HostedReadAdmissionRequest,
  type HostedReadJob,
  type HostedReadJobStore,
} from '@unisane/ops-engine/hosted';
import type { HostedGatewayAuthentication, HostedWorkloadIdentityAuthorizer } from './identity.js';

export interface HostedGatewayJobStore extends HostedReadJobStore {
  getAuthorized?(input: {
    jobId: string;
    principalId: string;
    allowedScopeIds: readonly string[];
    allowedProjectIds: readonly string[];
  }): Promise<HostedReadJob | null>;
}

export interface HostedGatewayRole {
  admit(input: {
    request: HostedReadAdmissionRequest;
    authentication: HostedGatewayAuthentication;
  }): Promise<HostedReadJob>;
  get(input: {
    jobId: string;
    authentication: HostedGatewayAuthentication;
  }): Promise<HostedReadJob | null>;
}

export function createHostedGatewayRole(input: {
  store: HostedGatewayJobStore;
  identity: HostedWorkloadIdentityAuthorizer;
  now?: () => Date;
}): HostedGatewayRole {
  return {
    async admit(admission) {
      const authorization = await input.identity.authorize(admission.authentication);
      if (!authorization.allowedProjectIds.includes(admission.request.action.context.projectId)) {
        throw new OpsActionExecutionError(
          'project-forbidden',
          'The requested project is not allowed.',
        );
      }
      return admitHostedReadAction({
        request: admission.request,
        authorization,
        store: input.store,
        now: input.now?.(),
      });
    },
    async get(query) {
      const authorization = await input.identity.authorize(query.authentication);
      if (input.store.getAuthorized) {
        return input.store.getAuthorized({
          jobId: query.jobId,
          principalId: authorization.principalId,
          allowedScopeIds: authorization.allowedScopeIds,
          allowedProjectIds: authorization.allowedProjectIds,
        });
      }
      const job = await input.store.get(query.jobId);
      if (!job) return null;
      if (
        authorization.principalId !== job.request.action.context.principal.id ||
        !authorization.allowedScopeIds.includes(job.request.action.context.scopeId) ||
        !authorization.allowedProjectIds.includes(job.request.action.context.projectId)
      ) {
        throw new OpsActionExecutionError('job-forbidden', 'The read job is not allowed.');
      }
      return job;
    },
  };
}
