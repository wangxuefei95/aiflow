import type { ExecutionContext, ExecutionLogger } from './logger.ts'

export type NodeKind = 'start' | 'end' | 'llm' | 'condition' | 'knowledge' | 'http'
export type NodeData = Record<string, any>

export interface NodePosition {
  x: number
  y: number
}

export interface NodeDefinition {
  id: string
  kind: NodeKind
  data: NodeData
  position: NodePosition
}

export interface EdgeDefinition {
  id: string
  source: string
  target: string
  sourceHandle?: string
}

export interface WorkflowDefinition {
  id: string
  name: string
  nodes: NodeDefinition[]
  edges: EdgeDefinition[]
}

export interface OutputVariableSchema {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description?: string
}

export interface VariableStore {
  get(nodeId: string, variableName: string): unknown

  set(nodeId: string, variableName: string, value: unknown): void

  setOutputs(nodeId: string, outputs: Record<string, unknown>): void

  getOutputs(nodeId: string): Record<string, unknown>

  getAll(nodeId: string): Map<string, unknown>
}

export interface NodeExecutionResult {
  // 是否成功
  ok: boolean
  // 输出参数
  outputs: Record<string, unknown>
  // 执行错误
  error?: Error
  // 执行耗时（毫秒）
  duration: number
  // 输入参数
  inputs?: Record<string, unknown>
  // 意图识别-匹配的分支
  matchedBranch?: string
}

export interface NodeExecutor<TConfig = Record<string, any>> {
  // 节点类型
  readonly type: NodeKind

  // 执行节点
  // @param nodeId 节点ID
  // @param config 节点配置
  // @param context 执行上下文
  // @param logger 执行日志记录器
  // @returns 执行结果
  execute(nodeId: string, config: TConfig, context: ExecutionContext, logger: ExecutionLogger): Promise<NodeExecutionResult>

  // 验证节点配置
  // @param config 节点配置
  // @returns 验证结果
  validate?(config: TConfig): { valid: boolean; errors?: string[] }

  // 获取节点输出变量模式
  // @returns 输出变量模式列表
  getOutputSchema?(config: TConfig): OutputVariableSchema[]
}

// ================ 节点配置类型定义 ================

export type ParamType = 'string' | 'number' | 'boolean' | 'array' | 'object'

/**
 * 输入参数定义
 */
export interface InputParameter {
  name: string
  type: ParamType
  required?: boolean
  defaultValue?: string
  description?: string
}

/**
 * Start节点配置
 */
export interface StartNodeConfig {
  inputs?: InputParameter[]
}

export interface LLMNodeConfig {
  model: string
  systemPrompt?: string
  userPrompt: string
  assistantPrompt?: string
  temperature?: number
  maxTokens?: number
}
