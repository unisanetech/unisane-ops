export interface ParsedArguments {
  positionals: string[];
  flags: Set<string>;
  options: Map<string, string[]>;
}

export function parseArguments(
  argv: readonly string[],
  contract: {
    flags: readonly string[];
    options: readonly string[];
  },
): ParsedArguments {
  const flags = new Set<string>();
  const options = new Map<string, string[]>();
  const positionals: string[] = [];
  const allowedFlags = new Set(contract.flags);
  const allowedOptions = new Set(contract.options);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith('--')) {
      positionals.push(argument);
      continue;
    }
    if (allowedFlags.has(argument)) {
      flags.add(argument);
      continue;
    }
    if (!allowedOptions.has(argument)) {
      throw new Error(`[OPS_CLI_ARGUMENT_UNKNOWN] Unknown argument '${argument}'.`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`[OPS_CLI_ARGUMENT_VALUE_REQUIRED] ${argument} requires a value.`);
    }
    const values = options.get(argument) ?? [];
    values.push(value);
    options.set(argument, values);
    index += 1;
  }
  return { positionals, flags, options };
}

export function oneOption(parsed: ParsedArguments, name: string): string | undefined {
  const values = parsed.options.get(name);
  if (!values || values.length === 0) return undefined;
  if (values.length !== 1) {
    throw new Error(`[OPS_CLI_ARGUMENT_DUPLICATE] ${name} may be passed only once.`);
  }
  return values[0];
}
