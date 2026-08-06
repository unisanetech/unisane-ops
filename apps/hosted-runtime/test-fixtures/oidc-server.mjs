import { createServer } from 'node:http';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';

const issuer = process.env.OPS_HOSTED_TEST_OIDC_ISSUER ?? 'http://oidc:8090';
const { privateKey, publicKey } = await generateKeyPair('ES256');
const key = await exportJWK(publicKey);
key.kid = 'integration-key';

createServer(async (request, response) => {
  if (request.url === '/jwks.json') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ keys: [key] }));
    return;
  }
  if (request.url === '/token') {
    const token = await new SignJWT({
      scope_ids: ['workspace.integration'],
      project_ids: ['project.integration'],
    })
      .setProtectedHeader({ alg: 'ES256', kid: key.kid })
      .setIssuer(issuer)
      .setAudience('unisane.ops')
      .setSubject('service.integration')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
    response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    response.end(JSON.stringify({ token }));
    return;
  }
  if (request.url === '/token-other-project') {
    const token = await new SignJWT({
      scope_ids: ['workspace.integration'],
      project_ids: ['project.other'],
    })
      .setProtectedHeader({ alg: 'ES256', kid: key.kid })
      .setIssuer(issuer)
      .setAudience('unisane.ops')
      .setSubject('service.integration')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
    response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    response.end(JSON.stringify({ token }));
    return;
  }
  response.writeHead(request.url === '/live' ? 200 : 404);
  response.end();
}).listen(8090, '0.0.0.0');
