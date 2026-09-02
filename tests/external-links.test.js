import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { checkExternalUrl, isBlockedAddress, requestOnce } from '../src/external-links.js'

test('network safety blocks private, loopback, link-local, metadata, and reserved addresses', () => {
  for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '192.168.1.1', '::1', 'fe80::1', 'fc00::1', '2001:db8::1']) assert.equal(isBlockedAddress(address), true, address)
  assert.equal(isBlockedAddress('93.184.216.34'), false)
})

test('external checker validates every redirect target and blocks metadata redirects', async () => {
  const resolveHost = async (hostname) => hostname === '169.254.169.254'
    ? [{ address: '169.254.169.254', family: 4 }]
    : [{ address: '93.184.216.34', family: 4 }]
  const request = async () => ({ status: 302, headers: { location: 'http://169.254.169.254/latest/meta-data/' }, bytes: 0 })
  const result = await checkExternalUrl('https://example.com/', { resolveHost, request })
  assert.equal(result.result, 'blocked')
})

test('external checker distinguishes definitive and indeterminate failures', async () => {
  const resolveHost = async () => [{ address: '93.184.216.34', family: 4 }]
  const missing = await checkExternalUrl('https://example.com/missing', { resolveHost, request: async () => ({ status: 404, headers: {}, bytes: 0 }) })
  const blocked = await checkExternalUrl('https://example.com/rate', { resolveHost, request: async () => ({ status: 429, headers: {}, bytes: 0 }) })
  assert.equal(missing.result, 'broken')
  assert.equal(blocked.result, 'indeterminate')
})

test('malformed redirect locations produce a result instead of crashing', async () => {
  const result = await checkExternalUrl('https://example.com/', {
    resolveHost: async () => [{ address: '93.184.216.34', family: 4 }],
    request: async () => ({ status: 302, headers: { location: 'http://[' }, bytes: 0 })
  })
  assert.equal(result.result, 'broken')
  assert.equal(result.reason, 'invalid redirect location')
})

test('request deadline is absolute even when a peer continuously drips bytes', async () => {
  const server = createServer((_request, response) => {
    response.writeHead(200)
    const interval = setInterval(() => response.write('x'), 10)
    response.on('close', () => clearInterval(interval))
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const port = server.address().port
    const started = Date.now()
    await assert.rejects(requestOnce(new URL(`http://example.test:${port}/`), '127.0.0.1', 4, 'GET', 60, 1024), /absolute request deadline/)
    assert.ok(Date.now() - started < 500)
  } finally {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
})
