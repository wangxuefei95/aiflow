import type { NodeExecutor, NodeKind } from '../types/index.ts'

export class NodeRegistry {
  private executors: Map<NodeKind, NodeExecutor> = new Map()

  register(kind: NodeKind, executor: NodeExecutor) {
    this.executors.set(kind, executor)
  }

  get(kind: NodeKind) {
    const executor = this.executors.get(kind)
    if (!executor) {
      throw new Error(`Node executor not found for kind: ${kind}`)
    }
    return executor
  }

  unregister(kind: NodeKind) {
    this.executors.delete(kind)
  }

  has(kind: NodeKind) {
    return this.executors.has(kind)
  }

  getRegisteredTypes(): NodeKind[] {
    return Array.from(this.executors.keys())
  }

  clear() {
    this.executors.clear()
  }
}

export function createNodeRegistry(): NodeRegistry {
  return new NodeRegistry()
}
