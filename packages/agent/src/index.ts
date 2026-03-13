// Tools
export { webSearchTool } from './tools/web-search'

// Agents
export { createSourceAgent } from './agents/source'
export type { SourceAgentOptions } from './agents/source'
export { createAdminAgent } from './agents/admin'
export type { AdminAgentOptions } from './agents/admin'
export { createAgent } from './agents/base'
export { createDomainAgent } from './agents/domain-agent'
export type { DomainAgentOptions } from './agents/domain-agent'

// Router
export { routeQuestion } from './router/route-question'
export {
  agentConfigSchema,
  getDefaultConfig,
  getModelFallbackOptions,
  DEFAULT_MODEL,
  ROUTER_MODEL,
  CUSTOM_MODELS,
} from './router/schema'

// Domain Router
export { routeToExpert, getExpertPrompt, getExpertModel, getDomainMetadata } from './router/domain-router'
export { expertSchema, type ExpertRoute } from './router/domain-schema'
export { EXPERT_MODELS, getModelByDomain, type ExpertDomain } from './router/expert-models'
export { EXPERT_SYSTEM_PROMPTS } from './prompts/expert-prompts'

// Custom Models
export { createCustomProviders, getModel } from './core/custom-models'

// Prompts
export { ROUTER_SYSTEM_PROMPT } from './prompts/router'
export { buildBotSystemPrompt, buildBotUserMessage } from './prompts/bot'
export { buildAdminSystemPrompt, ADMIN_SYSTEM_PROMPT, buildChatSystemPrompt } from './prompts/chat'

// Types
export type {
  AgentConfigData,
  ThreadContext,
  RoutingResult,
  AgentExecutionContext,
  CreateAgentOptions,
  AgentCallOptions,
} from './types'
export type { AgentConfig } from './router/schema'
export type { CustomProviderConfig } from './core/custom-models'
