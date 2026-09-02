const severityOrder = Object.freeze({ error: 0, warning: 1, informational: 2 })

export class DiagnosticBag {
  constructor() {
    this.items = []
  }

  add({ severity = 'error', code, message, path, line = 1, column = 1, endLine, endColumn, details }) {
    this.items.push({
      severity,
      code,
      message,
      path: path ?? '<repository>',
      line,
      column,
      ...(endLine ? { endLine } : {}),
      ...(endColumn ? { endColumn } : {}),
      ...(details === undefined ? {} : { details })
    })
  }

  error(code, message, path, location = {}) {
    this.add({ severity: 'error', code, message, path, ...location })
  }

  warning(code, message, path, location = {}) {
    this.add({ severity: 'warning', code, message, path, ...location })
  }

  info(code, message, path, location = {}) {
    this.add({ severity: 'informational', code, message, path, ...location })
  }

  merge(other) {
    this.items.push(...other.items)
  }

  sorted() {
    return [...this.items].sort((a, b) =>
      a.path.localeCompare(b.path) ||
      a.line - b.line ||
      a.column - b.column ||
      severityOrder[a.severity] - severityOrder[b.severity] ||
      a.code.localeCompare(b.code) ||
      a.message.localeCompare(b.message))
  }

  get errorCount() {
    return this.items.filter((item) => item.severity === 'error').length
  }

  get warningCount() {
    return this.items.filter((item) => item.severity === 'warning').length
  }
}

export function formatHuman(bag) {
  const lines = bag.sorted().map((item) => {
    const range = item.endLine
      ? `${item.line}:${item.column}-${item.endLine}:${item.endColumn ?? 1}`
      : `${item.line}:${item.column}`
    return `${item.path}:${range} ${item.severity} ${item.code} ${item.message}`
  })
  lines.push(`${bag.errorCount} error(s), ${bag.warningCount} warning(s)`)
  return `${lines.join('\n')}\n`
}

export function formatJson(bag, metadata = {}) {
  return `${JSON.stringify({
    version: 1,
    valid: bag.errorCount === 0,
    summary: { errors: bag.errorCount, warnings: bag.warningCount },
    ...metadata,
    diagnostics: bag.sorted()
  }, null, 2)}\n`
}

export function nodeLocation(node, lineOffset = 0) {
  if (!node?.position) return {}
  return {
    line: node.position.start.line + lineOffset,
    column: node.position.start.column,
    endLine: node.position.end.line + lineOffset,
    endColumn: node.position.end.column
  }
}
