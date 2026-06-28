import type {
  ExecutionContext,
  ExecutionLogger,
  NodeExecutionResult,
  NodeExecutor,
  NodeKind,
  OutputVariableSchema,
} from '../types/index.ts'

export abstract class BaseExecutor<TConfig extends Record<string, any>> implements NodeExecutor<TConfig> {
  abstract type: NodeKind

  protected abstract doExecute(
    nodeId: string,
    config: TConfig,
    context: ExecutionContext,
    logger: ExecutionLogger
  ): Promise<NodeExecutionResult>

  async execute(nodeId: string, config: TConfig, context: ExecutionContext, logger: ExecutionLogger): Promise<NodeExecutionResult> {
    const startTime = Date.now()

    try {
      logger.nodeStart(nodeId, this.type, config)

      const result = await this.doExecute(nodeId, config, context, logger)

      if (result.ok) {
        context.variables.setOutputs(nodeId, result.outputs)
      }

      const finalResult = {
        ...result,
        duration: Date.now() - startTime,
      }
      logger.nodeEnd(nodeId, finalResult)

      return finalResult
    } catch (error) {
      const result: NodeExecutionResult = {
        ok: false,
        outputs: {},
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime,
      }
      logger.nodeEnd(nodeId, result)

      return result
    }
  }

  validate(_config: TConfig): { valid: boolean; errors?: string[] } {
    return { valid: true }
  }

  getOutputSchema(_config: TConfig): OutputVariableSchema[] {
    return []
  }

  protected resolveConfigVariables(config: TConfig, context: ExecutionContext, logger: ExecutionLogger): TConfig {
    return this.deepResolve(config, context, logger)
  }

  protected deepResolve(obj: unknown, context: ExecutionContext, logger: ExecutionLogger): any {
    if (typeof obj === 'string') {
      const resolved = context.resolveText(obj)
      if (resolved !== obj) {
        logger.variableResolve(obj, obj, resolved)
      }
      return resolved
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepResolve(item, context, logger))
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.deepResolve(value, context, logger)
      }
      return result
    }

    return obj
  }
}
