import { readFile, writeFile } from 'node:fs/promises';

const [destination, ...entries] = process.argv.slice(2);
if (!destination || entries.length === 0 || entries.length % 2 !== 0) process.exit(2);

function quote(value) {
  if (/[\r\n]/.test(value)) process.exit(2);
  return value;
}

const services = [];
for (let index = 0; index < entries.length; index += 2) {
  const name = entries[index];
  const source = entries[index + 1];
  if (!/^[a-z][a-z0-9-]*$/.test(name)) process.exit(2);
  const connection = new URL((await readFile(source, 'utf8')).trim());
  if (connection.protocol !== 'postgres:' && connection.protocol !== 'postgresql:') process.exit(2);
  const values = {
    host: connection.hostname,
    port: connection.port || '5432',
    user: decodeURIComponent(connection.username),
    password: decodeURIComponent(connection.password),
    dbname: decodeURIComponent(connection.pathname.replace(/^\//, '')),
  };
  if (!values.host || !values.user || !values.dbname) process.exit(2);
  const lines = [
    `[${name}]`,
    ...Object.entries(values).map(([key, value]) => `${key}=${quote(value)}`),
  ];
  const sslmode = connection.searchParams.get('sslmode');
  if (sslmode) lines.push(`sslmode=${quote(sslmode)}`);
  services.push(lines.join('\n'));
}
await writeFile(destination, `${services.join('\n\n')}\n`, { mode: 0o600 });
