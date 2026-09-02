function sequence(id) {
  return Number(id.slice(4))
}

function isSortedNumeric(ids) {
  return ids.every((id, index) => index === 0 || sequence(ids[index - 1]) < sequence(id))
}

function setDifference(left, right) {
  const rightSet = new Set(right)
  return left.filter((item) => !rightSet.has(item))
}

function relationKey(relation) {
  return `${relation.type}:${relation.from}:${relation.to}`
}

function detectCycles(edges, bag, path, code) {
  const adjacency = new Map()
  for (const { from, to } of edges) {
    if (!adjacency.has(from)) adjacency.set(from, [])
    adjacency.get(from).push(to)
  }
  const visiting = new Set()
  const visited = new Set()
  function walk(node) {
    if (visiting.has(node)) return true
    if (visited.has(node)) return false
    visiting.add(node)
    for (const next of adjacency.get(node) ?? []) if (walk(next)) return true
    visiting.delete(node)
    visited.add(node)
    return false
  }
  for (const node of adjacency.keys()) {
    if (walk(node)) {
      bag.error(code, `Directed relationship graph contains a cycle involving ${node}.`, path)
      return
    }
  }
}

export function validateIdentityLedger(ledger, bag, path = 'config/identity-ledger.yaml') {
  for (const [kind, prefix] of [['principles', 'PRN-'], ['sources', 'SRC-']]) {
    const group = ledger?.[kind]
    if (!group) continue
    const allocated = group.allocated ?? []
    const retired = group.retired ?? []
    if (!isSortedNumeric(allocated)) bag.error('LEDGER_ORDER', `${kind}.allocated must use ascending numeric sequence order.`, path)
    if (!isSortedNumeric(retired)) bag.error('LEDGER_ORDER', `${kind}.retired must use ascending numeric sequence order.`, path)
    const allocatedSet = new Set(allocated)
    for (const id of retired) if (!allocatedSet.has(id)) bag.error('LEDGER_RETIREMENT', `${id} is retired but not allocated.`, path)
    const expected = Array.from({ length: Math.max(0, group.next_sequence - 1) }, (_, index) => `${prefix}${String(index + 1).padStart(6, '0')}`)
    if (allocated.length !== expected.length || allocated.some((id, index) => id !== expected[index])) {
      bag.error('LEDGER_CONTIGUITY', `${kind}.allocated must contain exactly the contiguous issued range below next_sequence.`, path)
    }
  }

  const relations = ledger?.principle_relationships ?? []
  const allocated = new Set(ledger?.principles?.allocated ?? [])
  const retired = new Set(ledger?.principles?.retired ?? [])
  const keys = new Set()
  const derivedGroups = new Map()
  const expectedOrder = [...relations].sort((a, b) => sequence(a.from) - sequence(b.from) || a.type.localeCompare(b.type) || sequence(a.to) - sequence(b.to))
  if (relations.some((relation, index) => relation !== expectedOrder[index])) bag.error('RELATIONSHIP_ORDER', 'Principle relationships are not in canonical order.', path)
  for (const relation of relations) {
    const key = relationKey(relation)
    if (keys.has(key)) bag.error('RELATIONSHIP_DUPLICATE', `Duplicate relationship ${key}.`, path)
    keys.add(key)
    if (relation.from === relation.to) bag.error('RELATIONSHIP_SELF', `Self relationship ${key} is forbidden.`, path)
    if (!allocated.has(relation.from) || !allocated.has(relation.to)) bag.error('RELATIONSHIP_ENDPOINT', `Relationship ${key} uses an unallocated endpoint.`, path)
    if (relation.type === 'derived_from') {
      if (!retired.has(relation.to)) bag.error('SPLIT_ORIGINAL_ACTIVE', `Split original ${relation.to} must be retired.`, path)
      if (!derivedGroups.has(relation.to)) derivedGroups.set(relation.to, new Set())
      derivedGroups.get(relation.to).add(relation.from)
    } else if (relation.type === 'replaced_by' && !retired.has(relation.from)) {
      bag.error('MERGE_REPLACED_ACTIVE', `Replaced identity ${relation.from} must be retired.`, path)
    }
  }
  for (const [original, children] of derivedGroups) {
    if (children.size < 2) bag.error('SPLIT_CHILDREN', `Split original ${original} must have at least two distinct derived children.`, path)
  }
  detectCycles(relations, bag, path, 'RELATIONSHIP_CYCLE')
}

export function validateIdentityTransition(baseline, proposed, bag, path = 'config/identity-ledger.yaml') {
  for (const kind of ['principles', 'sources']) {
    const before = baseline[kind]
    const after = proposed[kind]
    for (const id of before.allocated) if (!after.allocated.includes(id)) bag.error('IDENTITY_ALLOCATION_REMOVED', `${id} was removed from the all-time allocation set.`, path)
    for (const id of before.retired) if (!after.retired.includes(id)) bag.error('IDENTITY_RETIREMENT_REMOVED', `${id} was removed from the retirement set.`, path)
    if (after.next_sequence < before.next_sequence) bag.error('IDENTITY_SEQUENCE_DECREASED', `${kind}.next_sequence decreased.`, path)
    const newlyAllocated = setDifference(after.allocated, before.allocated)
    const prefix = kind === 'principles' ? 'PRN-' : 'SRC-'
    const expected = Array.from({ length: after.next_sequence - before.next_sequence }, (_, index) => `${prefix}${String(before.next_sequence + index).padStart(6, '0')}`)
    if (newlyAllocated.length !== expected.length || newlyAllocated.some((id, index) => id !== expected[index])) {
      bag.error('IDENTITY_TRANSITION_SUFFIX', `New ${kind} allocations must be the exact contiguous suffix from the baseline next_sequence.`, path)
    }
  }
  const beforeRelations = new Set(baseline.principle_relationships.map(relationKey))
  const afterRelations = new Set(proposed.principle_relationships.map(relationKey))
  for (const key of beforeRelations) if (!afterRelations.has(key)) bag.error('RELATIONSHIP_HISTORY_REMOVED', `Existing relationship ${key} was deleted or rewritten.`, path)
  const baselineAllocated = new Set(baseline.principles.allocated)
  const baselineRetired = new Set(baseline.principles.retired)
  const proposedRetired = new Set(proposed.principles.retired)
  for (const relation of proposed.principle_relationships) {
    if (beforeRelations.has(relationKey(relation))) continue
    if (relation.type === 'derived_from') {
      if (baselineAllocated.has(relation.from)) bag.error('SPLIT_CHILD_NOT_NEW', `Split child ${relation.from} was not allocated in this transition.`, path)
      if (!baselineAllocated.has(relation.to) || baselineRetired.has(relation.to)) bag.error('SPLIT_ORIGINAL_BASELINE', `Split original ${relation.to} was not active in the trusted baseline.`, path)
    } else {
      if (!baselineAllocated.has(relation.from) || baselineRetired.has(relation.from)) bag.error('MERGE_REPLACED_BASELINE', `Merged identity ${relation.from} was not active in the trusted baseline.`, path)
      if (!baselineAllocated.has(relation.to) || baselineRetired.has(relation.to) || proposedRetired.has(relation.to)) bag.error('MERGE_SURVIVOR_BASELINE', `Merge survivor ${relation.to} must exist and remain active across the transition.`, path)
    }
  }
}

export { detectCycles }
