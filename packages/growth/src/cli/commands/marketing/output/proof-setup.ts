import type { MarketingProofSetupResult } from '@unisane/growth/marketing';

export function renderMarketingProofSetupMarkdown(result: MarketingProofSetupResult): string {
  const lines = [
    '# Marketing Real-Account Proof Setup',
    '',
    `Limits/scopes file: ${result.path}`,
    `Providers included: ${result.providerCount}`,
    '',
    '## Providers',
  ];

  for (const provider of result.providers) {
    lines.push(
      `- ${provider.provider}: state=${provider.state} accountRefEnv=${provider.accountRefEnv ?? '-'}`,
    );
  }

  lines.push('', '## Next Commands');
  for (const command of result.nextCommands) {
    lines.push(`- ${command.command}`);
    lines.push(`  ${command.purpose}`);
  }

  lines.push(
    '',
    'Fill scopes and rate limits only after read-only provider access is confirmed. Do not store tokens, account ids, client secrets, or private keys in this file.',
    '',
  );
  return lines.join('\n');
}

export function printMarketingProofSetup(
  result: MarketingProofSetupResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(renderMarketingProofSetupMarkdown(result));
}
