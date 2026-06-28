import type { NodeExecutionResult, NodeKind, VariableStore, WorkflowDefinition } from './nodes.ts'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogPhase =
  | 'workflow:start'
  | 'workflow:end'
  | 'node:start'
  | 'node:end'
  | 'variable:resolve'
  | 'http:request'
  | 'http:response'
  | 'llm:request'
  | 'llm:response'
  | 'condition:evaluate'

export interface ExecutionContext {
  // 执行器ID
  executorId: string

  // 工作流定义
  workflow: WorkflowDefinition

  // 变量存储
  variables: VariableStore

  // 输入参数
  inputs: Record<string, unknown>

  // 开始时间
  startTime: Date

  // 解析变量表达式
  resolveVariable(expression: string): unknown

  // 解析文本表达式
  resolveText(text: string): string

  // 获取上游节点ID列表
  getUpstreamNodes(nodeId: string): string[]

  // 检查节点是否已完成
  isNodeCompleted(nodeId: string): boolean

  // 标记节点为已完成
  markNodeCompleted(nodeId: string): void
}

export interface ExecutionLogEntry {
  timestamp: Date
  level: LogLevel
  nodeId?: string
  phase: LogPhase
  message: string
  data?: Record<string, unknown>
  duration?: number
}

/**
 * LLM 请求日志
 */
export interface LLMRequestLog {
  model: string
  messages: Array<{ role: string; content: string }>
  temperature?: number
  maxTokens?: number
}

/**
 * LLM 响应日志
 */
export interface LLMResponseLog {
  content: string
  tokens: number
  duration: number
}

/**
 * HTTP 请求日志
 */
export interface HTTPRequestLog {
  method: string
  url: string
  headers: Record<string, string>
  body?: unknown
}

/**
 * HTTP 响应日志
 */
export interface HTTPResponseLog {
  status: number
  headers: Record<string, string>
  data: unknown
  duration: number
}

export interface ExecutionLogger {
  // 调试日志
  // @param message 调试消息
  // @param data 附加数据
  debug(message: string, data?: Record<string, unknown>): void

  // 信息日志
  // @param message 信息消息
  // @param data 附加数据
  info(message: string, data?: Record<string, unknown>): void

  // 错误日志
  // @param message 错误消息
  // @param data 附加数据
  error(message: string, data?: Record<string, unknown>): void

  // 警告日志
  // @param message 警告消息
  // @param data 附加数据
  warn(message: string, data?: Record<string, unknown>): void

  // 节点开始
  // @param nodeId 节点ID
  // @param nodeType 节点类型
  // @param config 节点配置
  nodeStart(nodeId: string, nodeType: NodeKind, config: Record<string, any>): void

  // 节点结束
  // @param nodeId 节点ID
  // @param result 执行结果
  nodeEnd(nodeId: string, result: NodeExecutionResult): void

  // 变量解析
  // @param expression 变量表达式
  // @param originalValue 原始值
  // @param resolvedValue 解析后的值
  variableResolve(expression: string, originalValue?: string, resolvedValue?: unknown): void

  // 获取LLM请求
  llmRequest(nodeId: string, request: LLMRequestLog): void

  // 获取LLM响应
  llmResponse(nodeId: string, response: LLMResponseLog): void

  // 获取HTTP请求
  httpRequest(nodeId: string, request: HTTPRequestLog): void

  // 获取HTTP响应
  httpResponse(nodeId: string, response: HTTPResponseLog): void

  // 获取所有执行日志条目
  // @returns 执行日志条目列表
  getEntries(): ExecutionLogEntry[]

  // 设置当前节点
  setCurrentNode(nodeId: string | null): void
}
