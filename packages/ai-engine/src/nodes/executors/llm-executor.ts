import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatOllama } from '@langchain/ollama'

import type { ExecutionContext, ExecutionLogger, LLMNodeConfig, NodeExecutionResult, OutputVariableSchema } from '../../types/index.ts'
import { BaseExecutor } from '../base-executor.ts'

export class LLMExecutor extends BaseExecutor<LLMNodeConfig> {
  readonly type = 'llm' as const

  protected async doExecute(
    nodeId: string,
    config: LLMNodeConfig,
    context: ExecutionContext,
    logger: ExecutionLogger
  ): Promise<NodeExecutionResult> {
    const resolvedConfig = this.resolveConfigVariables(config, context, logger)
    const messages: Array<SystemMessage | HumanMessage | AIMessage> = []

    if (resolvedConfig.systemPrompt) {
      messages.push(new SystemMessage(resolvedConfig.systemPrompt))
    }

    if (resolvedConfig.userPrompt) {
      messages.push(new HumanMessage(resolvedConfig.userPrompt))
    }

    if (resolvedConfig.assistantPrompt) {
      messages.push(new AIMessage(resolvedConfig.assistantPrompt))
    }

    logger.llmRequest(nodeId, {
      model: resolvedConfig.model,
      messages: messages.map(message => ({ role: message.type as string, content: message.content as string })),
      temperature: resolvedConfig.temperature,
      maxTokens: resolvedConfig.maxTokens,
    })

    const startTime = Date.now()

    const llm = new ChatOllama(resolvedConfig.model, {
      temperature: resolvedConfig.temperature,
      numPredict: resolvedConfig.maxTokens,
    })

    const response = await llm.invoke(messages)

    const duration = Date.now() - startTime
    const content = response.content as string

    const tokens = response.response_metadata.totalTokens as number

    logger.llmResponse(nodeId, {
      content,
      duration,
      tokens,
    })

    return {
      ok: true,
      outputs: {
        output: content,
        tokens,
      },
      duration,
    }
  }

  override validate(config: LLMNodeConfig): { valid: boolean; errors?: string[] } {
    const errors: string[] = []
    if (!config.model) {
      errors.push('Model is required')
    }

    if (!config.userPrompt || !config.systemPrompt) {
      errors.push('At least one of user prompt or system prompt is required')
    }

    return errors.length === 0 ? { valid: true } : { valid: false, errors }
  }

  override getOutputSchema(): OutputVariableSchema[] {
    return [
      { name: 'output', type: 'string', description: 'LLM 生成的文本内容' },
      { name: 'tokens', type: 'number', description: '消耗的 token 数量' },
    ]
  }
}
