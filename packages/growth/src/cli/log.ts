export interface GrowthCliLogger {
  banner(title?: string): void;
  success(message: string): void;
  error(message: string): void;
  warn(message: string): void;
  info(message: string): void;
  dim(message: string): void;
  section(title: string): void;
  kv(key: string, value: unknown): void;
  newline(): void;
}

function banner(title = 'Unisane Growth'): void {
  console.log(`\n🛠  ${title}\n`);
}

function success(message: string): void {
  console.log(`✔ ${message}`);
}

function error(message: string): void {
  console.error(`✖ ${message}`);
}

function warn(message: string): void {
  console.warn(`⚠ ${message}`);
}

function info(message: string): void {
  console.log(`ℹ ${message}`);
}

function dim(message: string): void {
  console.log(message);
}

function section(title: string): void {
  console.log(`\n${title}`);
}

function kv(key: string, value: unknown): void {
  console.log(`  ${key}: ${value === null || value === undefined ? '(none)' : String(value)}`);
}

function newline(): void {
  console.log();
}

export const log: GrowthCliLogger = {
  banner,
  success,
  error,
  warn,
  info,
  dim,
  section,
  kv,
  newline,
};
