import type { ExecutionContext, ExecutionLogger } from '../../types/logger.ts'
import type { NodeExecutionResult, OutputVariableSchema, StartNodeConfig } from '../../types/nodes.ts'
import { BaseExecutor } from '../base-executor.ts'

export class StartExecutor extends BaseExecutor<StartNodeConfig> {
  readonly type = 'start' as const

  protected async doExecute(
    _nodeId: string,
    config: StartNodeConfig,
    context: ExecutionContext,
    logger: ExecutionLogger
  ): Promise<NodeExecutionResult> {
    const outputs: Record<string, unknown> = {}

    for (const input of config.inputs || []) {
      let value = context.inputs[input.name]

      // 处理默认值
      if (value === undefined && input.defaultValue !== undefined) {
        value = this.parseDefaultValue(input.defaultValue, input.type)
        logger.debug(`Using default value for input: ${input.name}`, {
          name: input.name,
          defaultValue: input.defaultValue,
          parsedValue: value,
        })
      }

      // 检查必填项
      if (value === undefined && input.required) {
        throw new Error(`Required input parameter missing: ${input.name}`)
      }

      outputs[input.name] = value

      logger.debug(`Input parameter resolved: ${input.name}`, {
        name: input.name,
        type: input.type,
        value,
      })
    }

    return {
      ok: true,
      outputs,
      duration: 0,
    }
  }

  private parseDefaultValue(value: string, type: string): unknown {
    switch (type) {
      case 'string':
        return value
      case 'number':
        return parseFloat(value)
      case 'boolean':
        return value.toLowerCase() === 'true'
      case 'object':
      case 'array':
        try {
          return JSON.parse(value)
        } catch (error) {
          return value
        }
      default:
        return value
    }
  }

  override validate(_config: Record<string, any>): { valid: boolean; errors?: string[] } {
    const errors: string[] = []
    if (!_config.inputs || Array.isArray(_config.inputs)) {
      errors.push('Inputs must be an array')
    } else {
      for (const input of _config.inputs) {
        if (!input.name) {
          errors.push(`Each input must have a name: ${input.name}`)
        }
      }
    }

    return errors.length > 0 ? { valid: false, errors } : { valid: true }
  }

  override getOutputSchema(config: StartNodeConfig): OutputVariableSchema[] {
    return (config.inputs || []).map(input => {
      return {
        name: input.name,
        type: input.type || 'string',
        description: input.description || '',
      }
    })
  }
}
