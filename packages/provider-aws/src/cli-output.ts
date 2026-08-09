function writeKeyValue(key: string, value: unknown): void {
  console.log(`  ${key}: ${value === null || value === undefined ? '(none)' : String(value)}`);
}

export const providerOutput = Object.freeze({
  banner(title = 'Unisane'): void {
    console.log(`\n${title}\n`);
  },
  error(message: string): void {
    console.error(message);
  },
  info(message: string): void {
    console.log(message);
  },
  kv: writeKeyValue,
  section(title: string): void {
    console.log(`\n${title}`);
  },
  success(message: string): void {
    console.log(message);
  },
  warn(message: string): void {
    console.warn(message);
  },
});
