import {
  admitHostedReadAction,
  type HostedReadAdmissionRequest,
  type HostedReadAuthorization,
  type HostedReadJob,
  type HostedReadJobStore,
} from '@unisane/ops-engine/hosted';

export interface HostedGatewayRole {
  admit(request: HostedReadAdmissionRequest): Promise<HostedReadJob>;
}

export function createHostedGatewayRole(input: {
  store: HostedReadJobStore;
  authorize(request: HostedReadAdmissionRequest): Promise<HostedReadAuthorization>;
  now?: () => Date;
}): HostedGatewayRole {
  return {
    async admit(request: HostedReadAdmissionRequest) {
      const authorization = await input.authorize(request);
      return admitHostedReadAction({
        request,
        authorization,
        store: input.store,
        now: input.now?.(),
      });
    },
  };
}
