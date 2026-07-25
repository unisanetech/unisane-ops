import {
  controlPlaneSafeArtifactStamp,
  resolveControlPlaneArtifactPath,
} from '@unisane/ops-engine';
import { writeControlPlaneJsonArtifact } from '@unisane/ops-engine/local';
import type { AwsJsonArtifact } from './types.js';

export function resolveAwsArtifactPath(args: {
  cwd: string;
  outputPath?: string;
  defaultRelativePath: string;
}): AwsJsonArtifact {
  return resolveControlPlaneArtifactPath({
    cwd: args.cwd,
    outputPath: args.outputPath,
    defaultRelativePath: args.defaultRelativePath,
    errorCode: 'AWS_ARTIFACT_PATH_OUTSIDE_CWD',
    label: 'AWS artifact output',
  });
}

export function writeAwsJsonArtifact(args: {
  cwd: string;
  outputPath?: string;
  defaultRelativePath: string;
  value: unknown;
}): AwsJsonArtifact {
  return writeControlPlaneJsonArtifact({
    cwd: args.cwd,
    outputPath: args.outputPath,
    defaultRelativePath: args.defaultRelativePath,
    value: args.value,
    errorCode: 'AWS_ARTIFACT_PATH_OUTSIDE_CWD',
    label: 'AWS artifact output',
  });
}

export function awsSafeArtifactStamp(date: Date = new Date()): string {
  return controlPlaneSafeArtifactStamp(date);
}
