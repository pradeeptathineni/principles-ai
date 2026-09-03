import { lookup as dnsLookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'
import http from 'node:http'
import https from 'node:https'
import { createHash } from 'node:crypto'
import { LIMITS } from './constants.js'

const blocked = new BlockList()
for (const [network, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
  ['224.0.0.0', 4], ['240.0.0.0', 4]
]) blocked.addSubnet(network, prefix, 'ipv4')
for (const [network, prefix] of [
  ['::', 128], ['::1', 128], ['100::', 64], ['2001:db8::', 32], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8]
]) blocked.addSubnet(network, prefix, 'ipv6')

export function isBlockedAddress(address) {
  const family = isIP(address)
  if (family === 4) return blocked.check(address, 'ipv4')
  if (family === 6) {
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address)?.[1]
    return mapped ? blocked.check(mapped, 'ipv4') : blocked.check(address, 'ipv6')
  }
  return true
}

async function resolvePublic(hostname) {
  if (hostname.toLowerCase() === 'localhost' || hostname.endsWith('.localhost')) throw new Error('blocked hostname')
  const literalFamily = isIP(hostname)
  const records = literalFamily ? [{ address: hostname, family: literalFamily }] : await dnsLookup(hostname, { all: true, verbatim: true })
  if (records.length === 0) throw new Error('no DNS addresses')
  for (const record of records) if (isBlockedAddress(record.address)) throw new Error(`blocked destination ${record.address}`)
  return records
}

export function requestOnce(url, address, family, method, timeoutMs, responseLimit) {
  return new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http
    let bytes = 0
    const hash = createHash('sha256')
    let completed = false
    const finish = (callback, value) => {
      if (completed) return
      completed = true
      clearTimeout(deadline)
      callback(value)
    }
    const request = client.request(url, {
      method,
      agent: false,
      maxHeaderSize: 32 * 1024,
      headers: {
        accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1',
        'user-agent': 'principles-link-checker/0.1'
      },
      lookup(_hostname, lookupOptions, callback) {
        if (lookupOptions?.all) callback(null, [{ address, family }])
        else callback(null, address, family)
      }
    }, (response) => {
      response.on('data', (chunk) => {
        bytes += chunk.length
        hash.update(chunk)
        if (bytes > responseLimit) request.destroy(new Error(`response exceeds ${responseLimit} bytes`))
      })
      response.on('end', () => finish(resolve, { status: response.statusCode, headers: response.headers, bytes, contentSha256: method === 'GET' ? hash.digest('hex') : null }))
      response.on('aborted', () => finish(reject, new Error('response aborted')))
      if (method === 'HEAD') response.resume()
    })
    const deadline = setTimeout(() => request.destroy(new Error('absolute request deadline exceeded')), timeoutMs)
    request.on('error', (error) => finish(reject, error))
    request.end()
  })
}

function classify(status) {
  if (status === 404 || status === 410) return 'broken'
  if (status >= 200 && status < 400) return 'reachable'
  if ([401, 403, 407, 408, 425, 429].includes(status) || status >= 500) return 'indeterminate'
  return status >= 400 ? 'broken' : 'indeterminate'
}

export async function checkExternalUrl(input, options = {}) {
  const resolveHost = options.resolveHost ?? resolvePublic
  const request = options.request ?? requestOnce
  const timeoutMs = options.timeoutMs ?? LIMITS.externalTimeoutMs
  const responseLimit = options.responseLimit ?? LIMITS.externalResponseBytes
  const maxRedirects = options.maxRedirects ?? LIMITS.externalRedirects
  const visited = []
  let current
  try {
    current = new URL(input)
  } catch {
    return { url: input, result: 'broken', reason: 'invalid URL', redirects: visited }
  }
  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    if (!['http:', 'https:'].includes(current.protocol) || current.username || current.password) return { url: input, result: 'blocked', reason: 'forbidden scheme or user information', redirects: visited }
    let records
    try {
      records = await resolveHost(current.hostname)
    } catch (error) {
      const reason = error.message.startsWith('blocked') ? error.message : `DNS: ${error.message}`
      return { url: input, result: reason.startsWith('blocked') ? 'blocked' : 'indeterminate', reason, redirects: visited }
    }
    if (records.some((record) => isBlockedAddress(record.address))) return { url: input, result: 'blocked', reason: 'private, reserved, or non-public destination', redirects: visited }
    const record = records[0]
    let response
    let lastError
    for (let attempt = 0; attempt <= (options.retries ?? LIMITS.externalRetries); attempt += 1) {
      try {
        response = await request(current, record.address, record.family, 'HEAD', timeoutMs, responseLimit)
        const headClass = classify(response.status)
        if (options.captureContent || [405, 501].includes(response.status) || headClass !== 'reachable') {
          response = await request(current, record.address, record.family, 'GET', timeoutMs, responseLimit)
        }
        break
      } catch (error) {
        lastError = error
      }
    }
    if (!response) return { url: input, result: 'indeterminate', reason: lastError?.message ?? 'request failed', redirects: visited }
    if (response.status >= 300 && response.status < 400 && response.headers?.location) {
      if (redirects === maxRedirects) return { url: input, result: 'indeterminate', reason: 'redirect limit exceeded', redirects: visited }
      let next
      try {
        next = new URL(response.headers.location, current)
      } catch {
        return { url: input, result: 'broken', reason: 'invalid redirect location', redirects: visited }
      }
      visited.push(next.href)
      current = next
      continue
    }
    return { url: input, finalUrl: current.href, status: response.status, result: classify(response.status), redirects: visited, ...(response.contentSha256 ? { contentSha256: response.contentSha256 } : {}) }
  }
  return { url: input, result: 'indeterminate', reason: 'redirect limit exceeded', redirects: visited }
}

export async function checkExternalUrls(urls, bag, options = {}) {
  const concurrency = Math.max(1, Math.min(options.concurrency ?? LIMITS.externalConcurrency, 16))
  const results = new Array(urls.length)
  let cursor = 0
  async function worker() {
    while (true) {
      const index = cursor++
      if (index >= urls.length) return
      results[index] = await checkExternalUrl(urls[index], options)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length || 1) }, () => worker()))
  for (const result of results) {
    if (result.url.startsWith('http://')) bag.warning('EXTERNAL_LINK_HTTP', `Insecure HTTP URL: ${result.url}`, '<external-links>')
    if (result.result === 'broken' || result.result === 'blocked') bag.error('EXTERNAL_LINK_FAILURE', `${result.result}: ${result.url}${result.status ? ` (${result.status})` : ''}${result.reason ? ` — ${result.reason}` : ''}`, '<external-links>')
    else if (result.result === 'indeterminate') bag.info('EXTERNAL_LINK_INDETERMINATE', `indeterminate: ${result.url}${result.status ? ` (${result.status})` : ''}${result.reason ? ` — ${result.reason}` : ''}`, '<external-links>')
  }
  return results
}
